window.DooleySOM = {
    inject: () => {
        // Remove any existing SoM badges
        document.querySelectorAll('.dooley-som-badge').forEach(el => el.remove());
        
        // Find all interactive elements
        // Expanded list for better coverage
        const interactiveSelectors = [
            'a[href]', 'button', 'input', 'select', 'textarea',
            '[role="button"]', '[role="link"]', '[role="menuitem"]', '[role="checkbox"]', '[role="switch"]',
            '[onclick]', '[tabindex]:not([tabindex="-1"])',
            'label[for]' // Clickable labels
        ];
        
        const elements = document.querySelectorAll(interactiveSelectors.join(','));
        const badges = [];
        
        let badgeId = 1;
        
        // Viewport dimensions for region calculation
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate screen region based on position
        function getRegion(x, y, w, h) {
            const centerX = x + w/2;
            const centerY = y + h/2;
            
            // Vertical zones
            let vZone = 'middle';
            if (centerY < vh * 0.15) vZone = 'top';
            else if (centerY > vh * 0.85) vZone = 'bottom';
            
            // Horizontal zones
            let hZone = 'center';
            if (centerX < vw * 0.2) hZone = 'left';
            else if (centerX > vw * 0.8) hZone = 'right';
            
            // Combine into region name
            if (vZone === 'top') {
                if (hZone === 'left') return 'top-left-header';
                if (hZone === 'right') return 'top-right-header';
                return 'top-header';
            }
            if (vZone === 'bottom') return 'bottom-footer';
            if (hZone === 'left') return 'left-sidebar';
            if (hZone === 'right') return 'right-sidebar';
            return 'main-content';
        }

         // Helper to generate unique selector
        function getUniqueSelector(el) {
            if (el.id) return '#' + el.id;
            if (el.name) return `[name="${el.name}"]`;
            if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
            
            let path = [];
            let current = el;
            while (current && current.nodeType === Node.ELEMENT_NODE) {
                let selector = current.tagName.toLowerCase();
                if (current.id) {
                    selector = '#' + current.id;
                    path.unshift(selector);
                    break;
                }
                
                // Add classes if available/useful
                if (current.classList && current.classList.length > 0) {
                     // Filter out common dynamic/state classes if needed, for now use all
                     const classes = Array.from(current.classList).join('.');
                     selector += '.' + classes;
                }
                
                let sibling = current;
                let nth = 1;
                while (sibling = sibling.previousElementSibling) {
                    if (sibling.tagName === current.tagName) nth++;
                }
                if (nth > 1) selector += `:nth-of-type(${nth})`;
                path.unshift(selector);
                current = current.parentNode;
            }
            return path.join(' > ');
        }

        elements.forEach((el) => {
            // Skip hidden elements or tiny ones
            const rect = el.getBoundingClientRect();
            if (rect.width < 5 || rect.height < 5) return;
            
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
            
            // Skip elements off screen (top/left only, we might scroll down)
            if (rect.top < 0 || rect.left < 0) return; 
            if (rect.top > vh || rect.left > vw) return;

            // Create badge
            const badge = document.createElement('div');
            badge.className = 'dooley-som-badge';
            badge.textContent = badgeId;
            badge.style.cssText = `
                position: absolute;
                left: ${rect.left + window.scrollX}px;
                top: ${rect.top + window.scrollY}px;
                background: #FF0080;
                color: white;
                font-size: 11px;
                font-weight: bold;
                padding: 1px 4px;
                border: 1px solid white;
                border-radius: 3px;
                z-index: 2147483647; /* Max z-index */
                pointer-events: none;
                font-family: monospace;
                box-shadow: 0 1px 2px rgba(0,0,0,0.5);
            `;
            document.body.appendChild(badge);
            
            const region = getRegion(rect.x, rect.y, rect.width, rect.height);
            
            badges.push({
                id: badgeId,
                selector: getUniqueSelector(el),
                text: el.innerText?.slice(0, 100) || el.value || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '',
                tagName: el.tagName.toLowerCase(),
                type: el.type || '',
                region: region,
                rect: { 
                    x: rect.x, 
                    y: rect.y, 
                    width: rect.width, 
                    height: rect.height 
                }
            });
            
            badgeId++;
        });
        
        return badges;
    },
    
    cleanup: () => {
        document.querySelectorAll('.dooley-som-badge').forEach(el => el.remove());
    }
}
