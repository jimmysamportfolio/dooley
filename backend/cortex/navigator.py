"""
Navigator - Executes ActionPlan steps using Playwright + Gemini Flash.

This module controls the browser automation using a hybrid approach:
1. Fast-path: Try text-based selectors first
2. Vision-path: Use Set-of-Mark (SoM) injection + Gemini Flash for visual grounding
"""
import asyncio
import base64
import json
import re
from pathlib import Path
from typing import Optional

from google import genai
from google.genai import types
from playwright.async_api import async_playwright, Page, Browser

from cortex.schemas import ActionStep, ExecutionPlan
from config import get_settings


# Configure settings
settings = get_settings()


# Load Set-of-Mark injection script
def load_som_script():
    try:
        with open(Path(__file__).parent / "som_injector.js", "r") as f:
            return f.read()
    except FileNotFoundError:
        return """
        window.DooleySOM = {
            inject: () => { return []; },
            cleanup: () => {}
        }
        """

SOM_SCRIPT_LOADER = load_som_script()


class NavigatorCallback:
    """Callbacks for navigator events (for SSE streaming)."""
    
    async def on_step_start(self, step: ActionStep) -> None:
        """Called when a step starts."""
        pass
    
    async def on_step_complete(self, step: ActionStep, screenshot_b64: str) -> None:
        """Called when a step completes."""
        pass
    
    async def on_step_error(self, step: ActionStep, error: str) -> None:
        """Called when a step fails."""
        pass
    
    async def on_log(self, message: str, level: str = "info") -> None:
        """Called for log messages."""
        pass


class Navigator:
    """Executes ActionPlan steps using Playwright + Gemini Flash."""
    
    def __init__(
        self,
        callback: Optional[NavigatorCallback] = None,
        headless: bool = False,
        screenshot_dir: Optional[Path] = None,
        persist_session: bool = True  # NEW: Save cookies/session
    ):
        self.callback = callback or NavigatorCallback()
        self.headless = headless
        self.screenshot_dir = screenshot_dir or Path("./temp/screenshots")
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        self.persist_session = persist_session
        
        # Persistent profile directory
        self.user_data_dir = Path("./temp/browser_profile")
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        
        self.browser: Optional[Browser] = None
        self.context = None
        self.page: Optional[Page] = None
        self.som_cache: dict = {}  # Cache element data from SoM
        
        # Initialize Gemini Client
        self.client = genai.Client(api_key=settings.gemini_api_key)
    
    async def start(self) -> None:
        """Start the browser."""
        await self.callback.on_log("Starting browser...")
        
        self.playwright = await async_playwright().start()
        
        if self.persist_session:
            # Use persistent context (saves cookies, localStorage, etc.)
            self.context = await self.playwright.chromium.launch_persistent_context(
                user_data_dir=str(self.user_data_dir),
                headless=self.headless,
                viewport={"width": 1920, "height": 1080},
                args=[
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled'  # Reduces bot detection
                ]
            )
            self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
            
            # Set up dialog handler for browser popups
            self.page.on("dialog", self._handle_dialog)
            
            await self.callback.on_log("Browser started (persistent session)", "success")
        else:
            # Regular non-persistent browser
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                args=['--start-maximized']
            )
            self.page = await self.browser.new_page()
            await self.page.set_viewport_size({"width": 1920, "height": 1080})
            
            # Set up dialog handler for browser popups
            self.page.on("dialog", self._handle_dialog)
            
            await self.callback.on_log("Browser started", "success")
    
    def _handle_dialog(self, dialog):
        """Handle browser dialogs (alerts, confirms, prompts)."""
        asyncio.create_task(self._accept_dialog(dialog))
    
    async def _accept_dialog(self, dialog):
        """Accept a dialog and log it."""
        await self.callback.on_log(f"Dialog detected: {dialog.type} - {dialog.message}", "info")
        await dialog.accept()
        await self.callback.on_log("Dialog accepted", "success")
    
    async def stop(self) -> None:
        """Stop the browser."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        await self.callback.on_log("Browser stopped")
    
    async def execute_plan(self, plan: ExecutionPlan) -> None:
        """Execute all steps in the plan."""
        await self.callback.on_log(f"Executing {len(plan.steps)} steps...")
        
        for step in plan.steps:
            await self.execute_step(step)
            await asyncio.sleep(0.5)  # Small delay between steps
        
        await self.callback.on_log("Execution complete!", "success")
    
    async def execute_step(self, step: ActionStep) -> None:
        """Execute a single step."""
        await self.callback.on_step_start(step)
        await self.callback.on_log(f"Step {step.id}: {step.action_type} - {step.description}")
        
        try:
            if step.action_type == "NAVIGATE":
                await self._execute_navigate(step)
            elif step.action_type == "CLICK":
                await self._execute_click(step)
            elif step.action_type == "TYPE":
                await self._execute_type(step)
            elif step.action_type == "SCROLL":
                await self._execute_scroll(step)
            elif step.action_type == "WAIT":
                await self._execute_wait(step)
            else:
                raise ValueError(f"Unknown action type: {step.action_type}")
            
            # Capture screenshot after action
            screenshot_b64 = await self._capture_screenshot(step.id)
            await self.callback.on_step_complete(step, screenshot_b64)
            
        except Exception as e:
            await self.callback.on_step_error(step, str(e))
            raise
    
    async def _execute_navigate(self, step: ActionStep) -> None:
        """Navigate to a URL."""
        url = step.value
        if not url:
            raise ValueError("NAVIGATE requires a URL in value")
        
        # Add https if missing
        if not url.startswith("http"):
            url = f"https://{url}"
        
        await self.page.goto(url, wait_until="domcontentloaded")
        await self.callback.on_log(f"Navigated to: {url}")
    
    async def _execute_click(self, step: ActionStep) -> None:
        """Click on an element using fast-path or SoM vision."""
        # Try cached selector first
        if step.cached_selector:
            try:
                await self.page.click(step.cached_selector, timeout=3000)
                await self.callback.on_log(f"Clicked (cached): {step.cached_selector}")
                return
            except Exception:
                pass
        
        # Try text-based fast-path
        if step.value:
            try:
                await self.page.get_by_text(step.value, exact=False).click(timeout=3000)
                await self.callback.on_log(f"Clicked (text): {step.value}")
                return
            except Exception:
                pass
        
        # Fall back to SoM + Gemini Flash
        await self._click_with_som(step)
    
    async def _click_with_som(self, step: ActionStep) -> None:
        """Use Set-of-Mark + Gemini Flash to find and click element."""
        await self.callback.on_log("Using SoM vision to find element...")
        
        # Ensure global script is loaded
        await self.page.evaluate(SOM_SCRIPT_LOADER)
        
        # Inject badges
        badges = await self.page.evaluate("window.DooleySOM.inject()")
        
        if not badges:
            raise ValueError("No interactive elements found on page")
        
        await self.callback.on_log(f"Found {len(badges)} interactive elements")
        
        # Capture screenshot with badges
        screenshot_bytes = await self.page.screenshot()
        screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
        
        # Save debug screenshot for user inspection
        debug_dir = Path("debug_screenshots")
        debug_dir.mkdir(exist_ok=True)
        debug_path = debug_dir / f"step_{step.id}_som.png"
        with open(debug_path, "wb") as f:
            f.write(screenshot_bytes)
        await self.callback.on_log(f"Saved debug screenshot to {debug_path}")
        
        # Clean up badges
        await self.page.evaluate("window.DooleySOM.cleanup()")
        
        # Ask Gemini Flash which badge to click
        # Better prompt with context
        target_hint = ""
        if step.value:
            target_hint = f"\nLOOK FOR TEXT: '{step.value}'"
        
        # Add excluded badges from previous failed attempts
        excluded_hint = ""
        if hasattr(self, '_excluded_badges') and step.id in self._excluded_badges:
            excluded = self._excluded_badges[step.id]
            excluded_hint = f"\n\n⚠️ PREVIOUSLY CLICKED (WRONG - DO NOT SELECT AGAIN): Badges {excluded}"
            
        prompt = f"""Look at the following images:
1. The SCREENSHOT of the current page with numbered pink badges.
{ "2. A REFERENCE FRAME showing the element to click (from a video)." if step.visual_context else "" }

Task: {step.description}
{target_hint}{excluded_hint}
Semantic Intent: {step.semantic_intent or 'Click the correct element'}

ANALYSIS REQUIRED:
1. Identify the element that matches the Task and Semantic Intent.
{ "2. Look at the REFERENCE FRAME. Find the MOUSE CURSOR. The target is what the mouse is clicking." if step.visual_context else "" }
3. Find the matching element in the CURRENT SCREENSHOT.
4. Verify if the element is covered by a pink badge.

IMPORTANT PRIORITIES:
- If the intent is to Navigate/Click a link, prefer the MAIN HEADING/LINK over valid small icons or "three dots" menus next to it.
- AVOID clicking "About this result", "Cached", "Similar", "Translate", or three-dot menu icons. These are usually TRAPS.
- If looking for a search result: Click the LARGE BLUE TITLE text. Do NOT click the small URL text or the dots next to it.
- Select the badge that covers the TEXT of the link, not the whitespace or icons around it.
- If description says "+" or "plus", look for a "+" symbol. Do NOT click a "bell" or "notification" icon.

Use the following JSON format for your response:
{{
  "reasoning": "Explain why you selected this badge. Mention if it matches the element under the mouse in the reference frame.",
  "badge_number": "42" (or "NOT_FOUND")
}}"""
        
        contents = [
            types.Part.from_bytes(
                data=base64.b64decode(screenshot_b64),
                mime_type="image/png"
            ),
            prompt
        ]
        
        # Add visual context if available
        if step.visual_context:
            contents.insert(1, types.Part.from_bytes(
                data=base64.b64decode(step.visual_context),
                mime_type="image/jpeg"
            ))

        response = self.client.models.generate_content(
            model="gemini-pro-latest",
            contents=contents,
             config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        
        response_text = response.text.strip()
        await self.callback.on_log(f"Gemini response: {response_text}")
        
        try:
            response_data = json.loads(response_text)
            badge_val = response_data.get("badge_number", "NOT_FOUND")
            reasoning = response_data.get("reasoning", "")
            await self.callback.on_log(f"Gemini reasoning: {reasoning}")
        except json.JSONDecodeError:
             # Fallback if model fails JSON (unlikely with config)
             badge_val = "NOT_FOUND"
             if "NOT_FOUND" not in response_text:
                 nums = re.findall(r'\d+', response_text)
                 if nums: badge_val = nums[0]

        # Handle NOT_FOUND case with adaptive recovery
        if str(badge_val).upper() == "NOT_FOUND":
            await self.callback.on_log("Element not found - trying adaptive recovery...", "warning")
            
            # Ask Gemini to analyze the page and suggest what to do
            recovery_action = await self._adaptive_recover(step, screenshot_b64)
            
            if recovery_action:
                return  # Recovery handled the step
            else:
                raise ValueError(f"Element not found on page: {step.description}")
        
        badge_num = int(badge_val)
        await self.callback.on_log(f"Gemini selected badge: {badge_num}")
        
        # Find the badge and get its selector
        badge = next((b for b in badges if b["id"] == badge_num), None)
        if not badge:
            raise ValueError(f"Badge {badge_num} not found in available badges (1-{len(badges)})")
        
        # Click using coordinates (more reliable than selectors)
        # Try clicking via selector first (more robust)
        try:
            await self.page.click(badge["selector"], timeout=3000)
            await self.callback.on_log(f"Clicked selector: {badge['selector']} (badge {badge_num})")
        except Exception:
            # Fallback to visual coordinates
            await self.callback.on_log(f"Selector click failed, falling back to coordinates", "warning")
            rect = badge["rect"]
            x = rect["x"] + rect["width"] / 2
            y = rect["y"] + rect["height"] / 2
            await self.page.mouse.click(x, y)
            await self.callback.on_log(f"Clicked at ({x:.0f}, {y:.0f}) - badge {badge_num}")
        
        step.cached_selector = badge["selector"]
        
        # Wait for potential navigation or UI update (dropdowns, modals, etc)
        await asyncio.sleep(2)
        
        # --- CLICK VERIFICATION ---
        # If step.value contains a URL hint, verify we navigated correctly
        expected_url_hint = step.value or ""
        if expected_url_hint.startswith("http") or ".com" in expected_url_hint or ".org" in expected_url_hint:
            current_url = self.page.url
            # Extract domain from expected (e.g., "https://github.com" -> "github.com")
            domain_match = re.search(r'(?:https?://)?([^/]+)', expected_url_hint)
            expected_domain = domain_match.group(1) if domain_match else expected_url_hint
            
            if expected_domain.lower() not in current_url.lower():
                await self.callback.on_log(f"Verification FAILED: Expected '{expected_domain}' but got '{current_url}'", "warning")
                
                # Store the failed badge to exclude on retry
                if not hasattr(self, '_excluded_badges'):
                    self._excluded_badges = {}
                if step.id not in self._excluded_badges:
                    self._excluded_badges[step.id] = []
                self._excluded_badges[step.id].append(badge_num)
                
                # Check retry limit
                if len(self._excluded_badges[step.id]) < 3:
                    await self.callback.on_log(f"Going back to retry (attempt {len(self._excluded_badges[step.id])})", "warning")
                    await self.page.go_back()
                    await asyncio.sleep(2)
                    # Recursive retry with excluded badges
                    return await self._click_with_som(step)
                else:
                    await self.callback.on_log("Max retries reached, proceeding anyway", "warning")
            else:
                await self.callback.on_log(f"Verification PASSED: Navigated to '{expected_domain}'")
                # Clear excluded badges on success
                if hasattr(self, '_excluded_badges') and step.id in self._excluded_badges:
                    del self._excluded_badges[step.id]
        
        await asyncio.sleep(1)  # Additional settle time
    
    async def _adaptive_recover(self, step: ActionStep, screenshot_b64: str) -> bool:
        """
        When an expected element isn't found, analyze the page and try to recover.
        
        Returns True if recovery was successful, False if we should fail.
        """
        prompt = f"""I was trying to perform this action but the element wasn't found:
Task: {step.description}
Expected element: {step.value or 'Not specified'}
Goal/Intent: {step.semantic_intent or 'Not specified'}
Suggested alternatives: {step.alternatives or ['None provided']}

Look at the current page screenshot. What's happening? Choose ONE action:

1. WAIT - If a popup/modal/loading indicator is visible that might reveal the element
2. CLICK_ALTERNATIVE - If there's a similar button/link that could achieve the same GOAL (see intent above)
3. SKIP - If the action seems already completed or the goal was achieved
4. FAIL - If recovery isn't possible

Consider the alternatives listed above - they may hint at what else could work.

Respond in this format:
ACTION: [WAIT/CLICK_ALTERNATIVE/SKIP/FAIL]
REASON: [Brief explanation]
TARGET: [Only for CLICK_ALTERNATIVE - describe what to click]"""

        response = self.client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Part.from_bytes(
                    data=base64.b64decode(screenshot_b64),
                    mime_type="image/png"
                ),
                prompt
            ]
        )
        
        response_text = response.text.strip()
        await self.callback.on_log(f"Recovery analysis: {response_text}")
        
        if "ACTION: WAIT" in response_text:
            await self.callback.on_log("Waiting for page to update...", "info")
            await asyncio.sleep(3)
            
            # Retry the click after waiting
            try:
                await self._click_with_som(step)
                return True
            except Exception:
                return False
        
        elif "ACTION: CLICK_ALTERNATIVE" in response_text:
            await self.callback.on_log("Looking for alternative element...", "info")
            
            # Re-inject SoM and ask for the alternative
            await self.page.evaluate(SOM_SCRIPT_LOADER)
            badges = await self.page.evaluate("window.DooleySOM.inject()")
            screenshot_bytes = await self.page.screenshot()
            new_screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
            await self.page.evaluate("window.DooleySOM.cleanup()")
            
            # Extract what to click from the response
            alt_prompt = f"""Look at this screenshot with numbered pink badges.
The user wants to: {step.description}
Based on the recovery analysis, which badge should I click?
Respond with ONLY the badge number."""
            
            alt_response = self.client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Part.from_bytes(
                        data=base64.b64decode(new_screenshot_b64),
                        mime_type="image/png"
                    ),
                    alt_prompt
                ]
            )
            
            numbers = re.findall(r'\d+', alt_response.text.strip())
            if numbers:
                badge_num = int(numbers[0])
                badge = next((b for b in badges if b["id"] == badge_num), None)
                if badge:
                    rect = badge["rect"]
                    x = rect["x"] + rect["width"] / 2
                    y = rect["y"] + rect["height"] / 2
                    await self.page.mouse.click(x, y)
                    await self.callback.on_log(f"Clicked alternative at ({x:.0f}, {y:.0f})", "success")
                    return True
            return False
        
        elif "ACTION: SKIP" in response_text:
            await self.callback.on_log("Skipping step (already completed or unnecessary)", "info")
            return True
        
        else:  # FAIL or unknown
            return False
    
    async def _execute_type(self, step: ActionStep) -> None:
        """Type text into the focused element or find input."""
        text = step.value
        if not text:
            raise ValueError("TYPE requires text in value")
        
        # If description mentions a specific field, try to find it
        if "email" in step.description.lower():
            try:
                await self.page.fill('input[type="email"]', text, timeout=3000)
                await self.callback.on_log(f"Typed into email field")
                return
            except Exception:
                pass
        
        if "password" in step.description.lower():
            try:
                await self.page.fill('input[type="password"]', text, timeout=3000)
                await self.callback.on_log(f"Typed into password field")
                return
            except Exception:
                pass
        
        if "search" in step.description.lower():
            try:
                await self.page.fill('input[type="search"]', text, timeout=3000)
                await self.callback.on_log(f"Typed into search field")
                return
            except Exception:
                pass
        
        # Type into whatever is focused
        await self.page.keyboard.type(text)
        await self.callback.on_log(f"Typed: {text}")
    
    async def _execute_scroll(self, step: ActionStep) -> None:
        """Scroll the page."""
        direction = step.value or "down"
        
        if direction.lower() == "down":
            await self.page.evaluate("window.scrollBy(0, 500)")
        else:
            await self.page.evaluate("window.scrollBy(0, -500)")
        
        await self.callback.on_log(f"Scrolled {direction}")
    
    async def _execute_wait(self, step: ActionStep) -> None:
        """Wait for an element or condition."""
        if step.value:
            try:
                await self.page.wait_for_selector(
                    f"text={step.value}",
                    timeout=10000
                )
                await self.callback.on_log(f"Found: {step.value}")
                return
            except Exception:
                pass
        
        # Default wait
        await asyncio.sleep(2)
        await self.callback.on_log("Waited 2 seconds")
    
    async def _capture_screenshot(self, step_id: int) -> str:
        """Capture and save screenshot, return base64."""
        path = self.screenshot_dir / f"step_{step_id}.png"
        await self.page.screenshot(path=path)
        
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode()


async def execute_plan(
    plan: ExecutionPlan,
    callback: Optional[NavigatorCallback] = None,
    headless: bool = False
) -> None:
    """Convenience function to execute a plan."""
    nav = Navigator(callback=callback, headless=headless)
    
    try:
        await nav.start()
        await nav.execute_plan(plan)
    finally:
        await nav.stop()
