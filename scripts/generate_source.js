import fs from 'fs';
import path from 'path';

const files = [
  { name: 'package.json', path: 'package.json' },
  { name: 'index.html', path: 'index.html' },
  { name: 'tailwind.config.js', path: 'tailwind.config.js' },
  { name: 'src/main.jsx', path: 'src/main.jsx' },
  { name: 'src/styles/globals.css', path: 'src/styles/globals.css' },
  { name: 'src/model/predict.js', path: 'src/model/predict.js' },
  { name: 'src/model/dataset.js', path: 'src/model/dataset.js' },
  { name: 'src/model/audio.js', path: 'src/model/audio.js' },
  { name: 'src/components/FilmGrain.jsx', path: 'src/components/FilmGrain.jsx' },
  { name: 'src/components/MorphingOrbs.jsx', path: 'src/components/MorphingOrbs.jsx' },
  { name: 'src/components/Odometer.jsx', path: 'src/components/Odometer.jsx' },
  { name: 'src/components/PremiumButton.jsx', path: 'src/components/PremiumButton.jsx' },
  { name: 'src/components/Navbar.jsx', path: 'src/components/Navbar.jsx' },
  { name: 'src/components/MetricSlider.jsx', path: 'src/components/MetricSlider.jsx' },
  { name: 'src/components/DataIntegrationSuite.jsx', path: 'src/components/DataIntegrationSuite.jsx' },
  { name: 'src/components/RiskGauge.jsx', path: 'src/components/RiskGauge.jsx' },
  { name: 'src/components/FeatureChart.jsx', path: 'src/components/FeatureChart.jsx' },
  { name: 'src/components/InsightCard.jsx', path: 'src/components/InsightCard.jsx' },
  { name: 'src/components/Loader.jsx', path: 'src/components/Loader.jsx' },
  { name: 'src/components/Scene3D.jsx', path: 'src/components/Scene3D.jsx' },
  { name: 'src/pages/Landing.jsx', path: 'src/pages/Landing.jsx' },
  { name: 'src/pages/Diagnosis.jsx', path: 'src/pages/Diagnosis.jsx' },
  { name: 'src/App.jsx', path: 'src/App.jsx' }
];

let output = `========================================================================
GLYCOS — AI METABOLIC INTELLIGENCE (UPGRADED SOTD TECHNICAL FILE)
========================================================================

This file contains the complete source code and architectural details for GLYCOS, a diabetes risk prediction platform designed with React 18, Tailwind CSS v3, GSAP ScrollTrigger, Lenis smooth scrolling, Framer Motion, and WebGL Three.js DNA Helix rendering.

------------------------------------------------------------------------
Table of Contents
------------------------------------------------------------------------
1. PROJECT DESCRIPTION & ARCHITECTURE
`;

files.forEach((f, idx) => {
  output += `${idx + 2}. FILE: ${f.name}\n`;
});

output += `\n========================================================================
1. PROJECT DESCRIPTION & ARCHITECTURE
========================================================================
GLYCOS is built around a lightweight, client-side Logistic Regression mathematical model calibrated on the historical Pima Indians Diabetes Dataset. 

Features of the creative engineering upgrades:
- WebGL Scene: A background WebGL Canvas rendering a rotating 3D DNA helix and particle swarm that reacts dynamically to mouse coordinate parallax and page scroll depth.
- Postprocessing Shaders: Applied Bloom glow filters, Chromatic Aberration lens distortion, and Vignette shading to establish cinema-grade atmospheric weight.
- Cinematic Intro Loader: A 5-second branded loading sequence that sweeps line masks, staggers title typography, and rolls numeric percentages prior to unmounting.
- Interactive custom cursor: Desktop fine-pointer coordinates mapping to 4 distinct states: 6px default dot, 28px exclusion circle (buttons), 2:1 horizontal stretch pill (sliders), and 24px circular target crosshairs (3D WebGL space).
- Slider Warning Tiers: Concentric slider gauges that transition to danger states over 300ms, driving debounced live risk probability calculations in real-time.
- SVG Probability Curve: Plots patient outcomes on a normal distribution bell curve with shaded trailing risk tails.
- Trailing Comet Gauge: Risk gauges rendered with three overlapping concentric stroke layers to create a glowing trailing comet effect.
- Data Integration Suite: Features a clinical document parser for autofilling biomarkers, and a client-side Logistic Regression gradient descent solver to retrain parameters in-browser.
- Audio Engine: Procedural synthesis engine driving atmospheric background hums and interface clicks via the Web Audio API.
`;

files.forEach((f, idx) => {
  const filePath = path.resolve(f.path);
  const content = fs.readFileSync(filePath, 'utf8');
  output += `\n========================================================================
${idx + 2}. FILE: ${f.name}
========================================================================
${content}
`;
});

fs.writeFileSync('glycos_project_source.txt', output);
console.log('Project source successfully generated!');
