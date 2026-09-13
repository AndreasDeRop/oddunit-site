---
name: OddUnit project overview
alwaysApply: true
---

# OddUnit project overview

- Dit is een statische HTML/CSS/JS website voor OddUnit Studio. Het is geen React-, Next.js- of bundler-project.
- De kernbestanden zijn `index.html`, `style.css` en `main.js`. Publieke subpagina's staan in `services/`, `cases/` en `newsletter/`.
- De site draait rond branding, webdesign, grafisch ontwerp, 3D design, 3D printing, prototyping en eigen studio-projecten.
- De tone of voice is Nederlands, direct, creatief en professioneel. Gebruik `nl-BE` conventies en schrijf natuurlijk voor Belgische/lokale bezoekers.
- Interactieve onderdelen gebruiken bestaande vanilla JS, GSAP via `esm.sh` en Three.js in `projects/projects.js`. Voeg geen framework, build step of package manager toe zonder expliciete reden.
- Behoud bestaande IDs en hooks zoals `logoMount`, `mobileMenu`, `projectsCanvas`, `projectsVideo`, `projectsScrollSpace` en de `.projects-*`, `.service-*`, `.faq-*` patronen.
- Inspecteer altijd eerst de bestaande pagina of component waar je op verder bouwt en volg de lokale structuur, naming en copy-conventies.
