---
name: OddUnit responsive rules
alwaysApply: true
---

# OddUnit responsive rules

- Mobile is even belangrijk als desktop. De hoofdgrens in dit project is `900px`; respecteer de bestaande `BREAKPOINT = 900` in `main.js` en de bijhorende `@media (max-width: 900px)` CSS.
- Gebruik de bestaande viewport- en frame-variabelen (`--vh`, `--frameW`, `--frameH`, `--x0`, `--x1`, `--y0`, `--y1`) in plaats van losse magic numbers wanneer je grid- of framegebonden layout bouwt.
- Houd rekening met `svh`, mobiele browser-chrome, orientation changes en de vaste topbar/mobile-menu structuur.
- Tekst, knoppen, labels en cards mogen niet overlappen of buiten hun container vallen op 390px breedte. Gebruik `clamp()`, `minmax()`, `overflow-wrap` en vaste verhoudingen waar nodig.
- Raak mobiele swipe-, snap- en menu-interacties in `main.js` voorzichtig aan. Interactieve elementen zoals FAQ's, formulieren, iframes en projectbeschrijvingen moeten scrollbaar en klikbaar blijven.
- Behoud accessibility state bij menu's en toggles: `aria-expanded`, `aria-hidden`, focusbare knoppen en duidelijke linkteksten.
- Controleer wijzigingen minimaal op een smal mobiel viewport, een tabletbreedte en desktop. Let vooral op gridlijnen, plus-markers, sticky sections, video/canvas fallback en CTA's.
