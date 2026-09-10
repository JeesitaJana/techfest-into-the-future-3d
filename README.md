# TECHFEST // INTO THE FUTURE

A cinematic 3D interactive web experience created for the Techfest "Build in 3D" challenge.

A single continuous Three.js scene carries the visitor through six connected moments — a
loading sequence, a portal, a floating universe of five technologies, a pulsing AI core, a
digital tunnel, and a final reveal — with the camera itself driven by the scrollbar.

## Features

- Interactive Three.js environment built entirely from procedural geometry (no external 3D models)
- Scroll-controlled 3D camera path through one continuous scene (GSAP ScrollTrigger, scrubbed)
- Five interactive technology objects — AI, Robotics, Space Tech, Biotech, Quantum Computing
- Hover and click interactions via Three.js Raycaster, with an animated detail panel
- Cinematic loading sequence with animated progress and system messages
- Sequential text reveals through a digital tunnel sequence
- Ambient, portal, core, tunnel, and future particle systems for depth and atmosphere
- Mouse parallax with smooth interpolation, disabled on touch devices
- Glassy, scroll-aware navigation with a mobile menu
- Fully responsive, from large desktops down to small phones
- Respects `prefers-reduced-motion`, with visible keyboard focus states throughout

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Three.js (r128, via CDN)
- GSAP (via CDN)
- GSAP ScrollTrigger (via CDN)

No build tools, package managers, or frameworks are required.

## Project Structure

```
techfest-3d/
├── index.html   → page structure and section content
├── style.css    → design system, layout, responsive rules
├── script.js    → Three.js scene, camera path, interactions
└── README.md
```

## Running the Project

1. Download the project folder.
2. Open the folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server** (requires the
   "Live Server" extension), or open `index.html` directly in a modern browser.
4. An internet connection is needed on first load, since Three.js and GSAP are
   loaded from a CDN.

## How It Works

- **One canvas, one camera path.** A single `<canvas>` sits fixed behind the page.
  As the visitor scrolls, a GSAP timeline (scrubbed to scroll position) moves the
  camera through the scene — it never resets or swaps scenes, so the journey feels
  continuous.
- **HTML sections as scroll "runway."** Each `<section>` in `index.html` is sized
  in `vh` to give the camera room to travel and to host the overlay text for that
  part of the journey. The sections themselves are transparent; the 3D world shows
  through.
- **Raycasting for interaction.** While the visitor is inside the technology
  universe section, pointer movement is projected into the 3D scene with a
  `THREE.Raycaster`. Hovering a technology scales it up and boosts its glow;
  clicking opens an info panel with its name and description.
- **Performance-conscious by default.** Particle counts, structure counts, and
  effect complexity are reduced automatically on smaller/touch screens, the
  device pixel ratio is capped, and a single `requestAnimationFrame` loop drives
  everything.

## Notes for Judges

Bloom/post-processing was intentionally left out in favor of emissive materials,
additive-blended particles, and CSS glow — this keeps the project dependency-free
and guarantees it runs the moment `index.html` is opened, with no build step and
no risk of a broken import path.
