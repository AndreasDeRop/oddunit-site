# ODD UNIT — Implementation Guide

## 🎯 What Changed

### Visual Identity
- **Brand**: ODD UNIT (industrial/technical/minimal futurism aesthetic)
- **Logo**: Three variations (clean wordmark, technical detail, badge system)
- **Typography**: Monospace display + system sans body (optional Google Fonts upgrade)
- **Color**: Deep blacks, crisp whites, neon green accent (#00ff88)
- **Design Language**: Lab labels, batch IDs, serial numbers, microtypography

### UI Components Added
1. **Drop Metadata Grid**: BATCH / EDITION fields with technical labels
2. **Status Bar**: Live indicator with pulse animation ("CASTING COMPLETE")
3. **Drop Progress Indicator**: Animated bars showing current toy (1/2)
4. **Enhanced CTA**: Hover animation with accent color slide
5. **Grain Texture**: Subtle scanline effect overlay

### Preserved
✅ All Three.js scroll animation logic (rotation, swap, parallax)  
✅ GSAP ScrollTrigger setup (no changes to triggers)  
✅ Element IDs (`three-canvas`, `badge`, `title`, `desc`, `buy`, `copy`, `copyParallax`)  
✅ Mobile bottom sheet behavior  
✅ Cinematic cut effect on toy swap  

---

## 📦 Files

### Core Files (Required)
- `index.html` — Updated structure with metadata, status bar, drop indicator
- `style.css` — Complete redesign with design tokens, new components
- `main.js` — Your original logic + drop indicator toggle on swap
- `ui.js` — Minimal helper for drop indicator state (can be inlined if preferred)

### Reference Files
- `LOGO_SYSTEM.md` — Logo variations and usage guide
- `README.md` — This file

---

## 🚀 Quick Start

### 1. Replace Files
```bash
# Backup your current files
cp index.html index.html.backup
cp style.css style.css.backup
cp main.js main.js.backup

# Copy new files
# (index.html, style.css, main.js, ui.js)
```

### 2. Verify Dependencies
Your existing setup should work. No new dependencies added.

### 3. Test Scroll Behavior
- Scroll down to trigger toy rotation ✅
- Watch for toy swap at ~48% scroll ✅
- Verify text parallax drift resets on swap ✅
- Check drop indicator toggles (bar 1 → bar 2) ✅

---

## 🎨 Design System

### CSS Variables (Design Tokens)
All in `:root` — easy to customize:

```css
/* Typography */
--font-display: monospace;
--font-body: system-ui;
--text-xs to --text-3xl: size scale
--tracking-tight to --tracking-widest: letter-spacing
--leading-tight/base/relaxed: line-height

/* Colors */
--bg-primary: #0a0a0a (almost black)
--accent-primary: #00ff88 (neon green)
--border-primary: rgba(255,255,255,0.12)

/* Layout */
--panel-width: clamp(320px, 36vw, 560px)
--topbar-height: 72px

/* Animation */
--duration-fast/base/slow
--ease-out, --ease-in-out
```

### Typography Upgrade (Optional)
Uncomment in `style.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
```

Then update tokens:
```css
:root {
  --font-display: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;
}
```

---

## 🔧 Customization

### Change Accent Color
```css
:root {
  --accent-primary: #ff0088; /* hot pink */
  --accent-secondary: #0088ff; /* electric blue */
}
```

### Adjust Panel Width
```css
:root {
  --panel-width: clamp(280px, 30vw, 480px); /* narrower */
}
```

### Modify Status Text
In `index.html`:
```html
<span class="status-text">SHIPPING SOON</span>
```

### Update Drop Data
In `main.js`:
```js
const TOYS = [
  { 
    badge:"DROP 01", 
    title:"ProtoBoy V3", 
    desc:"Next evolution toy...", 
    link:"#"
  },
  { 
    badge:"DROP 02", 
    title:"ProtoBoy V4", 
    desc:"Second form...", 
    link:"#"
  }
];
```

And in `index.html` (metadata):
```html
<div class="meta-item">
  <span class="meta-label">EDITION</span>
  <span class="meta-value">01/200</span> <!-- Change here -->
</div>
```

---

## 📱 Mobile Behavior

- **Desktop (>900px)**: Right-side panel, left-shifted toy
- **Mobile (≤900px)**: Bottom sheet, centered toy
- **Breakpoints**: 900px (layout), 600px (micro-adjustments)

All handled automatically via CSS media queries.

---

## ⚠️ Potential Issues & Fixes

### Drop Indicator Not Updating
**Cause**: `ui.js` not imported  
**Fix**: Verify `import { updateDropIndicator } from './ui.js'` in `main.js`

### Text Parallax Jitter
**Cause**: GSAP tween conflict  
**Fix**: Already handled with `gsap.killTweensOf()` + `quickSetter`

### Panel Alignment Off
**Cause**: `--panel-width` mismatch with `updateLayout()` calculation  
**Fix**: In `main.js`, ensure `panelW` calculation matches CSS token:
```js
const panelW = Math.min(Math.max(window.innerWidth * 0.36, 320), 560);
```

### Grain Texture Too Heavy
**Fix**: Reduce opacity in `style.css`:
```css
body::before {
  opacity: 0.15; /* was 0.3 */
}
```

---

## 🎯 Design Philosophy

**Industrial Toy Lab**  
Think: Apple product launch meets limited-edition sneaker drop meets sci-fi prop department.

**Key Principles**:
- **Functional Typography**: Labels, codes, batch IDs (like production stickers)
- **Restrained Color**: Black/white base + single accent (green = "ready to ship")
- **Micro-Details**: Small caps, tracking, thin borders, subtle animations
- **Premium Feel**: Even with system fonts, spacing + hierarchy = luxury

**NOT**:
- Playful/bubbly (no rounded corners, no emoji)
- Streetwear template (no purple gradients, no Supreme-style logos)
- Over-animated (one good cinematic cut > constant motion)

---

## 📊 Performance

- **No external dependencies added** (ui.js is <1KB)
- **CSS animations only** (no JS-driven UI animations)
- **System fonts default** (0KB font load, instant render)
- **Grain texture**: Pure CSS gradient (no image)
- **Drop indicator**: 2 DOM elements, CSS transform only

---

## 🔄 Reverting Changes

If you need to go back:
```bash
mv index.html.backup index.html
mv style.css.backup style.css
mv main.js.backup main.js
rm ui.js
```

---

## 📞 Support

**Three.js Animation Issues**: Your original `main.js` logic is intact except:
- Background color updated to `#0a0a0a` (was `#0b0b0b`)
- Panel width calculation adjusted for new token
- `updateDropIndicator(idx)` call added on toy swap

**Styling Issues**: All new styles are scoped to new classes. If conflicts occur, check for conflicting global styles in your project.

**Logo Variations**: See `LOGO_SYSTEM.md` for all three variations + usage guidelines.

---

## ✨ Next Steps

1. **Test with real GLB files**: Drop in `toy1.glb` and `toy2.glb`
2. **Add more drops**: Extend `TOYS` array in `main.js`
3. **Custom metadata**: Update BATCH, EDITION, STATUS in HTML
4. **Font upgrade**: Uncomment Google Fonts import if desired
5. **Color tweaks**: Adjust `--accent-primary` to match brand

---

**Designed for ODD UNIT**  
Minimal futurism meets industrial design.
