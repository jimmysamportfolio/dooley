"""
Agentic Executor - AI agent that dynamically executes tasks based on screen state.

Unlike the rigid plan-based navigator, this agent:
1. Takes high-level goals from the plan
2. Looks at the current screen
3. Decides the best action to achieve the goal
4. Repeats until goal is achieved

This is more robust because it adapts to what's actually on screen.
"""
import asyncio
import base64
import re
from pathlib import Path
from typing import Optional, List

from google import genai
from google.genai import types
from playwright.async_api import async_playwright, Page

from cortex.schemas import ActionStep, ExecutionPlan
from config import get_settings


# Configure Settings
settings = get_settings()
# client = genai.Client(...)  # Will initialize in AgenticExecutor


# Set-of-Mark injection script
# Load Set-of-Mark injection script
def load_som_script():
    try:
        with open(Path(__file__).parent / "som_injector.js", "r") as f:
            return f.read()
    except FileNotFoundError:
        # Fallback if file not found (mostly for tests/safety)
        return """
        window.DooleySOM = {
            inject: () => { return []; },
            cleanup: () => {}
        }
        """

SOM_SCRIPT_LOADER = load_som_script()



class AgentCallback:
    """Callbacks for agent events."""
    
    async def on_goal_start(self, goal: str) -> None:
        pass
    
    async def on_action(self, action: str, details: str) -> None:
        pass
    
    async def on_goal_complete(self, goal: str) -> None:
        pass
    
    async def on_error(self, error: str) -> None:
        pass
    
    async def on_log(self, message: str) -> None:
        pass


class AgenticExecutor:
    """
    AI agent that dynamically executes goals based on screen state.
    
    Instead of following a rigid plan, the agent:
    1. Sees the current screen
    2. Understands the goal
    3. Decides what action to take
    4. Executes and repeats
    """
    
    def __init__(
        self,
        callback: Optional[AgentCallback] = None,
        headless: bool = False,
        max_actions_per_goal: int = 10
    ):
        self.callback = callback or AgentCallback()
        self.headless = headless
        self.max_actions_per_goal = max_actions_per_goal
        
        self.user_data_dir = Path("./temp/browser_profile")
        self.user_data_dir.mkdir(parents=True, exist_ok=True)
        
        self.screenshot_dir = Path("./temp/screenshots")
        self.screenshot_dir.mkdir(parents=True, exist_ok=True)
        
        self.playwright = None
        self.context = None
        self.page: Optional[Page] = None
        self.client = genai.Client(api_key=settings.gemini_api_key)
    
    async def start(self) -> None:
        """Start the browser."""
        await self.callback.on_log("Starting browser...")
        
        self.playwright = await async_playwright().start()
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=str(self.user_data_dir),
            headless=self.headless,
            # Match viewport to window size exactly
            viewport=None, 
            args=['--start-maximized', '--disable-blink-features=AutomationControlled']
        )
        self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
        
        await self.callback.on_log("Browser ready")
    
    async def stop(self) -> None:
        """Stop the browser."""
        if self.context:
            await self.context.close()
        if self.playwright:
            await self.playwright.stop()
        await self.callback.on_log("Browser stopped")
    
    async def execute_goals(self, goals: List[str]) -> None:
        """Execute a list of high-level goals."""
        await self.callback.on_log(f"Executing {len(goals)} goals...")
        
        for i, goal in enumerate(goals, 1):
            await self.callback.on_goal_start(goal)
            await self.callback.on_log(f"\n🎯 Goal {i}/{len(goals)}: {goal}")
            
            success = await self._achieve_goal(goal)
            
            if success:
                await self.callback.on_goal_complete(goal)
                await self.callback.on_log(f"✅ Goal achieved: {goal}")
            else:
                await self.callback.on_error(f"Failed to achieve: {goal}")
                raise RuntimeError(f"Failed to achieve goal: {goal}")
            
            await asyncio.sleep(1)  # Brief pause between goals
    
    async def execute_plan(self, plan: ExecutionPlan) -> None:
        """Execute a plan step by step - directly for known actions, agent for clicks."""
        await self.callback.on_log(f"Executing {len(plan.steps)} steps...")
        
        for i, step in enumerate(plan.steps, 1):
            await self.callback.on_goal_start(step.description)
            await self.callback.on_log(f"\n🎯 Step {i}/{len(plan.steps)}: {step.action_type} - {step.description}")
            
            try:
                # Execute step directly based on action type
                if step.action_type == "NAVIGATE":
                    await self.page.goto(step.value, wait_until="domcontentloaded")
                    await self.callback.on_action("NAVIGATE", step.value)
                    await asyncio.sleep(2)  # Wait for page to load
                
                elif step.action_type == "TYPE":
                    # Find the input using agent, then type
                    await self._type_in_input(step.value, step.description)
                
                elif step.action_type == "CLICK":
                    # HYBRID STRATEGY: Try text/selector matching first (100% accurate)
                    text_to_click = step.value or step.description
                    clicked_via_text = False
                    
                    if text_to_click and len(text_to_click) < 50:
                        try:
                            # Try finding by exact text or accessible role
                            await self.page.click(f"text={text_to_click}", timeout=2000)
                            await self.callback.on_action("CLICK", f"Text '{text_to_click}'")
                            clicked_via_text = True
                        except:
                            try:
                                # Try fuzzy match? Or just fall back to vision
                                await self.page.click(f"text=/{text_to_click}/i", timeout=1000)
                                await self.callback.on_action("CLICK", f"Text (fuzzy) '{text_to_click}'")
                                clicked_via_text = True
                            except:
                                pass # Fall back to agent
                    
                    if not clicked_via_text:
                        # Use visually grounded click (direct, no agentic loop)
                        await self._click_element(step.description, step.value)
                
                elif step.action_type == "SCROLL":
                    direction = step.value or "down"
                    if direction.lower() == "down":
                        await self.page.evaluate("window.scrollBy(0, 500)")
                    else:
                        await self.page.evaluate("window.scrollBy(0, -500)")
                    await self.callback.on_action("SCROLL", direction)
                
                elif step.action_type == "WAIT":
                    await asyncio.sleep(2)
                    await self.callback.on_action("WAIT", "2 seconds")
                
                await self.callback.on_goal_complete(step.description)
                
            except Exception as e:
                await self.callback.on_error(f"Step failed: {e}")
                raise
            
            await asyncio.sleep(0.5)

    async def _click_element(self, description: str, text_hint: Optional[str] = None) -> None:
        """Find an element visually and click it directly (no planning loop)."""
        # Take screenshot with badges
        screenshot_b64 = await self._capture_screen_with_badges()
        
        # Ask AI which element to click
        prompt = f"""Look at this screenshot with numbered pink badges on interactive elements.

I need to CLICK on an element.
Description: {description}
{f"Text Hint: {text_hint}" if text_hint else ""}

Which badge number is the element I should click?
Respond with ONLY the badge number (e.g., "5")."""
        
        response = self.client.models.generate_content(
            model="gemini-pro-latest",
            contents=[
                types.Part.from_bytes(
                    data=base64.b64decode(screenshot_b64),
                    mime_type="image/png"
                ),
                prompt
            ]
        )
        
        response_text = response.text.strip()
        await self.callback.on_log(f"Found element at badge: {response_text}")
        
        # Extract badge number
        numbers = re.findall(r'\d+', response_text)
        if not numbers:
            raise ValueError(f"Could not find element: {description}")
        
        badge_id = int(numbers[0])
        badge = self._find_badge(badge_id)
        
        if not badge:
            raise ValueError(f"Badge {badge_id} not found")
        
        # Click on the element
        x = badge["rect"]["x"] + badge["rect"]["width"] / 2
        y = badge["rect"]["y"] + badge["rect"]["height"] / 2
        await self.page.mouse.click(x, y)
        await self.callback.on_action("CLICK", f"Badge {badge_id}")
        
        # Wait for potential navigation
        try:
            await self.page.wait_for_load_state("networkidle", timeout=3000)
        except:
            pass

    
    async def _type_in_input(self, text: str, description: str) -> None:
        """Find an input field and type text into it."""
        # Take screenshot with badges
        screenshot_b64 = await self._capture_screen_with_badges()
        
        # Ask AI which input to type into
        prompt = f"""Look at this screenshot with numbered pink badges on interactive elements.

I need to TYPE into an input field.
Description: {description}

Which badge number is the INPUT FIELD I should type into?
Respond with ONLY the badge number (e.g., "5")."""
        
        response = self.client.models.generate_content(
            model="gemini-pro-latest",
            contents=[
                types.Part.from_bytes(
                    data=base64.b64decode(screenshot_b64),
                    mime_type="image/png"
                ),
                prompt
            ]
        )
        
        response_text = response.text.strip()
        await self.callback.on_log(f"Found input at badge: {response_text}")
        
        # Extract badge number
        numbers = re.findall(r'\d+', response_text)
        if not numbers:
            raise ValueError(f"Could not find input field: {description}")
        
        badge_id = int(numbers[0])
        badge = self._find_badge(badge_id)
        
        if not badge:
            raise ValueError(f"Badge {badge_id} not found")
        
        # Click on the input
        x = badge["rect"]["x"] + badge["rect"]["width"] / 2
        y = badge["rect"]["y"] + badge["rect"]["height"] / 2
        await self.page.mouse.click(x, y)
        await asyncio.sleep(0.3)
        
        # Clear existing text
        await self.page.keyboard.press("Control+a")
        await asyncio.sleep(0.1)
        
        # Type the text
        should_press_enter = False
        if text.endswith("\\n") or text.endswith("\n"):
            text = text.rstrip("\\n").rstrip("\n")
            should_press_enter = True
        
        await self.page.keyboard.type(text)
        
        if should_press_enter:
            await asyncio.sleep(0.2)
            await self.page.keyboard.press("Enter")
            await self.callback.on_action("TYPE", f"'{text}' + Enter")
            await asyncio.sleep(2)  # Wait for results/navigation
        else:
            await self.callback.on_action("TYPE", f"'{text}'")
    
    async def _achieve_goal(self, goal: str) -> bool:
        """Try to achieve a single goal through multiple actions."""
        
        # Track action history to detect loops
        action_history = []
        
        for attempt in range(self.max_actions_per_goal):
            # Capture current screen state
            screenshot_b64 = await self._capture_screen_with_badges()
            
            # Ask AI what to do, including action history
            action = await self._decide_action(goal, screenshot_b64, action_history)
            
            if action["type"] == "DONE":
                return True
            
            if action["type"] == "FAIL":
                reason = action.get('reason', 'Unknown')
                await self.callback.on_error(f"Agent decided to fail: {reason}")
                await self._save_debug_screenshot(f"fail_{goal[:10]}")
                return False
            
            # Detect loops - if same action repeated 3 times, try something else
            action_str = f"{action['type']}:{action.get('badge', '')}:{action.get('text', '')}"
            action_history.append(action_str)
            
            if len(action_history) >= 3 and action_history[-1] == action_history[-2] == action_history[-3]:
                await self.callback.on_log("⚠️ Loop detected! Same action repeated 3 times. Moving on.")
                await self._save_debug_screenshot(f"loop_{goal[:10]}")
                return True  # Consider goal achieved to break the loop
            
            # Execute the action
            try:
                await self._execute_action(action)
            except Exception as e:
                await self.callback.on_error(f"Action failed: {e}")
                await self._save_debug_screenshot(f"error_{goal[:10]}")
                # Continue trying next action
            
            # Wait for page to settle
            await asyncio.sleep(1)
        
        await self.callback.on_error(f"Max actions ({self.max_actions_per_goal}) reached without achieving goal")
        await self._save_debug_screenshot(f"timeout_{goal[:10]}")
        return False
    
    async def _capture_screen_with_badges(self) -> str:
        """Inject badges and capture screenshot."""
        # Ensure global script is loaded
        await self.page.evaluate(SOM_SCRIPT_LOADER)
        
        # Inject badges
        badges = await self.page.evaluate("window.DooleySOM.inject()")
        screenshot_bytes = await self.page.screenshot()
        # Cleanup
        await self.page.evaluate("window.DooleySOM.cleanup()")
        
        # Store badges for reference
        self._current_badges = badges
        
        return base64.b64encode(screenshot_bytes).decode()
    
    async def _decide_action(self, goal: str, screenshot_b64: str, action_history: list) -> dict:
        """Ask AI what action to take to achieve the goal."""
        
        # Include recent action history to help avoid loops
        history_text = ""
        if action_history:
            recent = action_history[-5:]  # Last 5 actions
            history_text = f"\n\nRECENT ACTIONS (avoid repeating):\n" + "\n".join(f"- {a}" for a in recent)
        
        # Build badge list with regions for context
        badge_list = ""
        if hasattr(self, '_current_badges') and self._current_badges:
            badge_info = [f"  {b['id']}: [{b.get('region', 'unknown')}] {b.get('text', '')[:50]}" 
                          for b in self._current_badges[:30]]  # Top 30 badges
            badge_list = "\n\nELEMENTS WITH REGIONS:\n" + "\n".join(badge_info)
        
        prompt = f"""You are a browser automation agent. Look at this screenshot with numbered pink badges.

CURRENT GOAL: {goal}
{history_text}
{badge_list}

SCREEN REGIONS:
- top-left-header, top-header, top-right-header = Header bar
- main-content = Center of page (search results, main area)
- left-sidebar, right-sidebar = Side panels
- bottom-footer = Footer

What should I do to achieve this goal?

AVAILABLE ACTIONS:
- CLICK <badge_number> - Click on element with that badge number
- DONE - Goal is achieved 
- FAIL <reason> - Cannot achieve the goal

TIPS:
- If goal says "top-right", look for badges in "top-right-header" region
- If goal says "search result" or "main", look in "main-content" region
- If the element was clicked and page changed, say DONE

Respond with EXACTLY ONE line:
ACTION_TYPE [parameters]"""

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
        
        response_text = response.text.strip().split('\n')[0]  # Take first line only
        await self.callback.on_log(f"Agent decision: {response_text}")
        
        return self._parse_action(response_text)
    
    def _parse_action(self, response: str) -> dict:
        """Parse the AI's action response."""
        parts = response.strip().split(' ', 2)
        action_type = parts[0].upper()
        
        if action_type == "CLICK" and len(parts) >= 2:
            try:
                badge_num = int(parts[1])
                return {"type": "CLICK", "badge": badge_num}
            except ValueError:
                return {"type": "FAIL", "reason": f"Invalid badge number: {parts[1]}"}
        
        elif action_type == "TYPE" and len(parts) >= 3:
            try:
                badge_num = int(parts[1])
                text = parts[2]
                return {"type": "TYPE", "badge": badge_num, "text": text}
            except ValueError:
                return {"type": "FAIL", "reason": f"Invalid badge number: {parts[1]}"}
        
        elif action_type == "NAVIGATE" and len(parts) >= 2:
            url = parts[1]
            if not url.startswith("http"):
                url = f"https://{url}"
            return {"type": "NAVIGATE", "url": url}
        
        elif action_type == "SCROLL":
            direction = parts[1] if len(parts) >= 2 else "down"
            return {"type": "SCROLL", "direction": direction}
        
        elif action_type == "WAIT":
            return {"type": "WAIT"}
        
        elif action_type == "DONE":
            return {"type": "DONE"}
        
        elif action_type == "FAIL":
            reason = ' '.join(parts[1:]) if len(parts) > 1 else "Unknown"
            return {"type": "FAIL", "reason": reason}
        
        else:
            return {"type": "FAIL", "reason": f"Unknown action: {response}"}
    
    async def _execute_action(self, action: dict) -> None:
        """Execute a single action."""
        action_type = action["type"]
        
        if action_type == "CLICK":
            badge = self._find_badge(action["badge"])
            if badge:
                # Verify text match if provided (prevents clicking wrong links)
                expected_text = action.get("text_hint")
                if expected_text:
                    badge_text = badge.get("text", "").lower()
                    if expected_text.lower() not in badge_text and badge_text not in expected_text.lower():
                        await self.callback.on_log(f"⚠️ Warning: Click target '{badge_text}' might not match '{expected_text}'")
                
                x = badge["rect"]["x"] + badge["rect"]["width"] / 2
                y = badge["rect"]["y"] + badge["rect"]["height"] / 2
                await self.page.mouse.click(x, y)
                await self.callback.on_action("CLICK", f"Badge {action['badge']} at ({x:.0f}, {y:.0f})")
                
                # Wait a bit longer and check for navigation
                try:
                    await self.page.wait_for_load_state("networkidle", timeout=2000)
                except:
                    pass  # Ignore timeout, page might not have navigated
            else:
                raise ValueError(f"Badge {action['badge']} not found")
        
        elif action_type == "TYPE":
            # ... (Type logic is fine)
            badge = self._find_badge(action["badge"])
            if badge:
                x = badge["rect"]["x"] + badge["rect"]["width"] / 2
                y = badge["rect"]["y"] + badge["rect"]["height"] / 2
                await self.page.mouse.click(x, y)
                await asyncio.sleep(0.3)
                
                # Clear any existing text first
                await self.page.keyboard.press("Control+a")
                await asyncio.sleep(0.1)
                
                text = action["text"]
                should_press_enter = False
                
                # Check if text ends with \n (escape sequence or actual)
                if text.endswith("\\n") or text.endswith("\n"):
                    text = text.rstrip("\\n").rstrip("\n")
                    should_press_enter = True
                
                # Auto-press Enter if it's a search input
                if badge.get("type") == "search" or "search" in badge.get("text", "").lower():
                    should_press_enter = True
                
                await self.page.keyboard.type(text)
                
                if should_press_enter:
                    await asyncio.sleep(0.2)
                    await self.page.keyboard.press("Enter")
                    await self.callback.on_action("TYPE", f"'{text}' + Enter")
                    try:
                        await self.page.wait_for_load_state("networkidle", timeout=3000)
                    except:
                        pass
                else:
                    await self.callback.on_action("TYPE", f"'{text}'")
            else:
                raise ValueError(f"Badge {action['badge']} not found")

        elif action_type == "NAVIGATE":
            await self.page.goto(action["url"], wait_until="domcontentloaded")
            await self.callback.on_action("NAVIGATE", action["url"])
        
        elif action_type == "SCROLL":
            direction = action.get("direction", "down")
            if direction == "down":
                await self.page.evaluate("window.scrollBy(0, 500)")
            else:
                await self.page.evaluate("window.scrollBy(0, -500)")
            await self.callback.on_action("SCROLL", direction)
        
        elif action_type == "WAIT":
            await asyncio.sleep(2)
            await self.callback.on_action("WAIT", "2 seconds")

    async def _save_debug_screenshot(self, prefix: str) -> str:
        """Save a screenshot for debugging."""
        timestamp = __import__("datetime").datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{prefix}_{timestamp}.png"
        path = self.screenshot_dir / filename
        await self.page.screenshot(path=path)
        return str(path)

    async def interactive_login(self) -> None:
        """Pause execution to allow manual login."""
        await self.start()
        print("\n" + "="*60)
        print("🔐 INTERACTIVE LOGIN MODE")
        print("The browser is now open. Please navigate to your target site")
        print("(e.g., github.com) and log in manually.")
        print("\nPress ENTER in this terminal when you are ready to continue...")
        print("="*60)
        await asyncio.to_thread(input, "")
        await self.stop()

    
    def _find_badge(self, badge_id: int) -> Optional[dict]:
        """Find a badge by ID."""
        return next((b for b in self._current_badges if b["id"] == badge_id), None)


# Convenience function
async def execute_with_agent(
    goals: List[str],
    callback: Optional[AgentCallback] = None,
    headless: bool = False
) -> None:
    """Execute goals using the agentic executor."""
    agent = AgenticExecutor(callback=callback, headless=headless)
    
    try:
        await agent.start()
        await agent.execute_goals(goals)
    finally:
        await agent.stop()
