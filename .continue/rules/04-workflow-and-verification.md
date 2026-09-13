---
name: OddUnit workflow and verification
alwaysApply: true
---

# OddUnit workflow and verification

- Check voor edits altijd de bestaande werkboom en relevante diffs. Overschrijf geen wijzigingen die al in progress zijn.
- Werk klein en projectspecifiek: pas alleen de bestanden aan die nodig zijn en volg de bestaande HTML/CSS/JS patronen.
- Als `style.css`, `main.js`, `projects/projects.js` of publieke assets wijzigen, controleer of cache-busting querystrings en `APP_ASSET_VERSION` mee moeten worden bijgewerkt.
- Laat analytics, Google Tag Manager, favicon links, canonical tags en gedeelde header/mobile-menu markup intact wanneer je pagina's kopieert of uitbreidt.
- Gebruik root-relative URLs voor site-assets en links (`/style.css`, `/main.js`, `/cases/fons/`) zodat subpagina's consistent werken.
- Voeg geen npm dependencies, build output of frameworkbestanden toe tenzij het project daar expliciet om vraagt.
- Verifieer na inhoudelijke UI-wijzigingen in de browser of via screenshots: geen console errors, geen kapotte assets, geen overlappende tekst, correcte mobile layout en werkende navigatie/CTA's.
