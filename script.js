/* =================================================================
   TECHFEST // INTO THE FUTURE
   Three.js scene, GSAP ScrollTrigger camera path, raycaster
   interactions, particle systems, and UI wiring.
   ================================================================= */

(() => {
  'use strict';

  /* ---------------------------------------------------------------
     0. ENVIRONMENT FLAGS
     --------------------------------------------------------------- */

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1. THREE.JS CORE SETUP
     --------------------------------------------------------------- */

  const canvas = document.getElementById('webgl');

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030712, 0.012);

  const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setClearColor(0x030712, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  /* ---------------------------------------------------------------
     2. LIGHTING
     --------------------------------------------------------------- */

  const ambientLight = new THREE.AmbientLight(0x33406b, 0.6);
  scene.add(ambientLight);

  const cyanLight = new THREE.PointLight(0x4df3ff, 4, 60, 2);
  cyanLight.position.set(6, 4, 6);
  scene.add(cyanLight);

  const violetLight = new THREE.PointLight(0x9b6bff, 4, 60, 2);
  violetLight.position.set(-6, -3, -6);
  scene.add(violetLight);

  const coreLight = new THREE.PointLight(0x9b6bff, 0, 90, 2);
  coreLight.position.set(0, 0, -95);
  scene.add(coreLight);

  const futureLight = new THREE.PointLight(0x4df3ff, 3, 160, 2);
  futureLight.position.set(0, 0, -320);
  scene.add(futureLight);

  /* ---------------------------------------------------------------
     3. MATERIAL HELPERS
     --------------------------------------------------------------- */

  const CYAN = 0x4df3ff;
  const VIOLET = 0x9b6bff;
  const WHITE = 0xeaf2ff;

  function wireMat(color, emissiveIntensity = 1.2) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
      roughness: 0.4,
      metalness: 0.2
    });
  }

  function solidMat(color, emissiveIntensity = 0.5) {
    return new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity,
      roughness: 0.35,
      metalness: 0.6
    });
  }

  function glowPointsMaterial(color, size) {
    return new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
  }

  /* ---------------------------------------------------------------
     4. AMBIENT PARTICLE FIELD (spans the whole journey, gives depth)
     --------------------------------------------------------------- */

  const AMBIENT_COUNT = isMobile ? 500 : 1400;
  const ambientGeo = new THREE.BufferGeometry();
  const ambientPos = new Float32Array(AMBIENT_COUNT * 3);

  for (let i = 0; i < AMBIENT_COUNT; i++) {
    ambientPos[i * 3] = (Math.random() - 0.5) * 140;
    ambientPos[i * 3 + 1] = (Math.random() - 0.5) * 90;
    ambientPos[i * 3 + 2] = (Math.random() - 0.5) * 400 - 40;
  }
  ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambientPos, 3));
  const ambientPoints = new THREE.Points(ambientGeo, glowPointsMaterial(0x7fb8ff, 0.14));
  scene.add(ambientPoints);

  /* ---------------------------------------------------------------
     5. SCENE 2 — THE FUTURE PORTAL  (z ≈ 0)
     --------------------------------------------------------------- */

  const portalGroup = new THREE.Group();
  portalGroup.position.set(0, 0, 0);
  scene.add(portalGroup);

  const portalRings = [];
  const ringDefs = [
    { r: 5.2, tube: 0.05, color: CYAN, axis: 'z' },
    { r: 6.4, tube: 0.03, color: VIOLET, axis: 'x' },
    { r: 7.6, tube: 0.025, color: CYAN, axis: 'y' }
  ];
  ringDefs.forEach((def) => {
    const geo = new THREE.TorusGeometry(def.r, def.tube, 16, 96);
    const mat = wireMat(def.color, 1.4);
    const ring = new THREE.Mesh(geo, mat);
    ring.userData.axis = def.axis;
    ring.userData.speed = 0.08 + Math.random() * 0.08;
    portalRings.push(ring);
    portalGroup.add(ring);
  });

  // floating geometry drifting around the portal
  const portalShards = [];
  for (let i = 0; i < 10; i++) {
    const geo = new THREE.IcosahedronGeometry(0.18 + Math.random() * 0.22, 0);
    const mat = wireMat(i % 2 === 0 ? CYAN : VIOLET, 1.1);
    const shard = new THREE.Mesh(geo, mat);
    const angle = (i / 10) * Math.PI * 2;
    const radius = 9 + Math.random() * 3;
    shard.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 5, Math.sin(angle) * radius * 0.4 - 3);
    shard.userData.baseY = shard.position.y;
    shard.userData.speed = 0.5 + Math.random();
    portalShards.push(shard);
    portalGroup.add(shard);
  }

  // dense particle halo around the portal center
  const PORTAL_PARTICLES = isMobile ? 250 : 600;
  const portalGeo = new THREE.BufferGeometry();
  const portalPos = new Float32Array(PORTAL_PARTICLES * 3);
  for (let i = 0; i < PORTAL_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * 6;
    portalPos[i * 3] = Math.cos(angle) * radius;
    portalPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
    portalPos[i * 3 + 2] = Math.sin(angle) * radius * 0.5;
  }
  portalGeo.setAttribute('position', new THREE.BufferAttribute(portalPos, 3));
  const portalPoints = new THREE.Points(portalGeo, glowPointsMaterial(CYAN, 0.09));
  portalGroup.add(portalPoints);

  /* ---------------------------------------------------------------
     6. SCENE 3 — TECHNOLOGY UNIVERSE  (z ≈ -45)
     --------------------------------------------------------------- */

  const UNIVERSE_Z = -45;
  const universeGroup = new THREE.Group();
  universeGroup.position.set(0, 0, UNIVERSE_Z);
  scene.add(universeGroup);

  const TECH_DATA = [
    {
      id: 'ai',
      title: 'ARTIFICIAL INTELLIGENCE',
      desc: 'Machines that learn, adapt, and redefine the boundaries of human potential.'
    },
    {
      id: 'robotics',
      title: 'ROBOTICS',
      desc: 'Precision engineering fused with autonomy — machines that move, sense, and act on their own.'
    },
    {
      id: 'space',
      title: 'SPACE TECHNOLOGY',
      desc: 'Engineering built to leave the planet — the hardware carrying humanity beyond Earth.'
    },
    {
      id: 'biotech',
      title: 'BIOTECHNOLOGY',
      desc: 'Rewriting the code of life itself to heal, enhance, and extend what a body can do.'
    },
    {
      id: 'quantum',
      title: 'QUANTUM COMPUTING',
      desc: 'Computation built on uncertainty — solving problems classical machines never could.'
    }
  ];

  const interactiveObjects = [];
  const TECH_RADIUS = 11;

  function buildAIObject() {
    const group = new THREE.Group();
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), wireMat(CYAN, 1.3));
    group.add(core);

    const ringGeo = new THREE.BufferGeometry();
    const count = 140;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.7 + Math.random() * 0.6;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const orbit = new THREE.Points(ringGeo, glowPointsMaterial(CYAN, 0.06));
    group.add(orbit);

    group.userData.spin = { core: 0.4, orbit: 0.9 };
    group.userData.parts = { core, orbit };
    group.userData.materials = [core.material];
    return group;
  }

  function buildRoboticsObject() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.4, 1.1), solidMat(VIOLET, 0.4));
    group.add(body);

    const jointGeo = new THREE.TorusGeometry(0.85, 0.05, 8, 32);
    const joint = new THREE.Mesh(jointGeo, wireMat(VIOLET, 1.2));
    joint.rotation.x = Math.PI / 2;
    group.add(joint);

    const limbMat = wireMat(CYAN, 1.1);
    const limbPositions = [
      [1.0, 0.5, 0], [-1.0, 0.5, 0], [1.0, -0.5, 0], [-1.0, -0.5, 0]
    ];
    const limbs = [];
    limbPositions.forEach(([x, y]) => {
      const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 8), limbMat);
      limb.position.set(x, y, 0);
      limb.rotation.z = Math.PI / 2;
      group.add(limb);
      limbs.push(limb);
    });

    group.userData.spin = { core: 0.25, orbit: 0 };
    group.userData.parts = { core: body, joint, limbs };
    group.userData.materials = [body.material, joint.material, limbMat];
    return group;
  }

  function buildSpaceObject() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 1.6), solidMat(WHITE, 0.35));
    group.add(body);

    const panelMat = wireMat(CYAN, 1.1);
    const panelGeo = new THREE.PlaneGeometry(1.8, 0.7);
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = -1.9;
    panelL.rotation.y = Math.PI / 2;
    const panelR = panelL.clone();
    panelR.position.x = 1.9;
    group.add(panelL, panelR);

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.6, 16, 1, true), wireMat(VIOLET, 1.2));
    dish.position.z = 1.1;
    dish.rotation.x = Math.PI;
    group.add(dish);

    group.userData.spin = { core: 0.15, orbit: 0 };
    group.userData.parts = { core: body, panelL, panelR, dish };
    group.userData.materials = [body.material, panelMat, dish.material];
    return group;
  }

  function buildBiotechObject() {
    const group = new THREE.Group();
    const strandA = new THREE.Group();
    const strandB = new THREE.Group();
    const rungGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6);
    const sphereGeo = new THREE.SphereGeometry(0.11, 10, 10);
    const matA = solidMat(CYAN, 0.6);
    const matB = solidMat(VIOLET, 0.6);
    const rungMat = wireMat(WHITE, 0.9);

    const turns = 6;
    const height = 2.6;
    for (let i = 0; i < turns * 4; i++) {
      const t = i / (turns * 4);
      const angle = t * Math.PI * 2 * turns;
      const y = t * height - height / 2;
      const radius = 0.55;

      const posA = new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      const posB = new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius);

      const nodeA = new THREE.Mesh(sphereGeo, matA);
      nodeA.position.copy(posA);
      strandA.add(nodeA);

      const nodeB = new THREE.Mesh(sphereGeo, matB);
      nodeB.position.copy(posB);
      strandB.add(nodeB);

      if (i % 3 === 0) {
        const rung = new THREE.Mesh(rungGeo, rungMat);
        rung.position.copy(posA).lerp(posB, 0.5);
        rung.lookAt(posB);
        rung.rotateX(Math.PI / 2);
        strandA.add(rung);
      }
    }

    group.add(strandA, strandB);
    group.userData.spin = { core: 0.3, orbit: 0 };
    group.userData.parts = { core: group };
    group.userData.materials = [matA, matB, rungMat];
    return group;
  }

  function buildQuantumObject() {
    const group = new THREE.Group();
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), wireMat(VIOLET, 1.4));
    group.add(cube);

    const innerCube = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), wireMat(CYAN, 1.3));
    group.add(innerCube);

    const count = 120;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.3 + Math.random() * 0.5;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = Math.sin(a * 2) * 0.9;
      positions[i * 3 + 2] = Math.sin(a) * r;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const orbit = new THREE.Points(geo, glowPointsMaterial(CYAN, 0.07));
    group.add(orbit);

    group.userData.spin = { core: 0.35, orbit: 1.1, inner: -0.5 };
    group.userData.parts = { core: cube, inner: innerCube, orbit };
    group.userData.materials = [cube.material, innerCube.material];
    return group;
  }

  const builders = [buildAIObject, buildRoboticsObject, buildSpaceObject, buildBiotechObject, buildQuantumObject];

  TECH_DATA.forEach((data, i) => {
    const group = builders[i]();
    const angle = (i / TECH_DATA.length) * Math.PI * 2;
    group.position.set(
      Math.cos(angle) * TECH_RADIUS,
      Math.sin(i * 1.7) * 1.6,
      Math.sin(angle) * TECH_RADIUS * 0.6
    );
    group.userData.techId = data.id;
    group.userData.title = data.title;
    group.userData.desc = data.desc;
    group.userData.baseScale = 1;
    group.userData.baseY = group.position.y;
    group.scale.setScalar(1);
    universeGroup.add(group);
    interactiveObjects.push(group);
  });

  /* ---------------------------------------------------------------
     7. SCENE 4 — AI CORE  (z ≈ -95)
     --------------------------------------------------------------- */

  const CORE_Z = -95;
  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, 0, CORE_Z);
  scene.add(coreGroup);

  const coreLayers = [];
  const coreLayerDefs = [
    { r: 1.6, color: CYAN, detail: 1 },
    { r: 2.4, color: VIOLET, detail: 1 },
    { r: 3.2, color: CYAN, detail: 0 }
  ];
  coreLayerDefs.forEach((def, i) => {
    const geo = new THREE.IcosahedronGeometry(def.r, def.detail);
    const mat = wireMat(def.color, 1.0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.speed = 0.06 + i * 0.05;
    coreLayers.push(mesh);
    coreGroup.add(mesh);
  });

  const CORE_PARTICLES = isMobile ? 200 : 450;
  const coreGeo = new THREE.BufferGeometry();
  const corePos = new Float32Array(CORE_PARTICLES * 3);
  for (let i = 0; i < CORE_PARTICLES; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 4 + Math.random() * 1.6;
    const h = (Math.random() - 0.5) * 2;
    corePos[i * 3] = Math.cos(a) * r;
    corePos[i * 3 + 1] = h;
    corePos[i * 3 + 2] = Math.sin(a) * r;
  }
  coreGeo.setAttribute('position', new THREE.BufferAttribute(corePos, 3));
  const corePoints = new THREE.Points(coreGeo, glowPointsMaterial(VIOLET, 0.08));
  coreGroup.add(corePoints);

  /* ---------------------------------------------------------------
     8. SCENE 5 — DIGITAL TUNNEL  (z from -140 to -300)
     --------------------------------------------------------------- */

  const TUNNEL_START = -140;
  const TUNNEL_END = -300;
  const tunnelGroup = new THREE.Group();
  scene.add(tunnelGroup);

  const TUNNEL_RING_COUNT = isMobile ? 22 : 36;
  const tunnelRings = [];
  for (let i = 0; i < TUNNEL_RING_COUNT; i++) {
    const t = i / (TUNNEL_RING_COUNT - 1);
    const z = TUNNEL_START + t * (TUNNEL_END - TUNNEL_START);
    const geo = new THREE.TorusGeometry(4.2, 0.04, 8, 48);
    const mat = wireMat(i % 2 === 0 ? CYAN : VIOLET, 1.3);
    const ring = new THREE.Mesh(geo, mat);
    ring.position.z = z;
    ring.rotation.z = Math.random() * Math.PI;
    ring.userData.baseRadius = 4.2;
    ring.userData.phase = Math.random() * Math.PI * 2;
    tunnelRings.push(ring);
    tunnelGroup.add(ring);
  }

  const TUNNEL_PARTICLES = isMobile ? 260 : 600;
  const tunnelGeo = new THREE.BufferGeometry();
  const tunnelPos = new Float32Array(TUNNEL_PARTICLES * 3);
  for (let i = 0; i < TUNNEL_PARTICLES; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 3.6;
    tunnelPos[i * 3] = Math.cos(a) * r;
    tunnelPos[i * 3 + 1] = Math.sin(a) * r;
    tunnelPos[i * 3 + 2] = TUNNEL_START + Math.random() * (TUNNEL_END - TUNNEL_START);
  }
  tunnelGeo.setAttribute('position', new THREE.BufferAttribute(tunnelPos, 3));
  const tunnelMat = glowPointsMaterial(WHITE, 0.09);
  tunnelMat.opacity = 0;
  const tunnelPoints = new THREE.Points(tunnelGeo, tunnelMat);
  tunnelGroup.add(tunnelPoints);

  /* ---------------------------------------------------------------
     9. SCENE 6 — FUTURE UNIVERSE  (z ≈ -320)
     --------------------------------------------------------------- */

  const FUTURE_Z = -320;
  const futureGroup = new THREE.Group();
  futureGroup.position.set(0, 0, FUTURE_Z);
  scene.add(futureGroup);

  const centralSphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 32, 32),
    new THREE.MeshStandardMaterial({
      color: CYAN,
      emissive: CYAN,
      emissiveIntensity: 1.6,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    })
  );
  futureGroup.add(centralSphere);

  const futureStructures = [];
  const structureGeos = [
    () => new THREE.IcosahedronGeometry(0.7, 0),
    () => new THREE.OctahedronGeometry(0.6, 0),
    () => new THREE.BoxGeometry(0.9, 0.9, 0.9),
    () => new THREE.TorusGeometry(0.6, 0.08, 8, 24)
  ];
  const FUTURE_STRUCT_COUNT = isMobile ? 14 : 26;
  for (let i = 0; i < FUTURE_STRUCT_COUNT; i++) {
    const geoFn = structureGeos[i % structureGeos.length];
    const mat = wireMat(i % 2 === 0 ? CYAN : VIOLET, 1.0);
    const mesh = new THREE.Mesh(geoFn(), mat);
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 14;
    mesh.position.set(Math.cos(a) * r, (Math.random() - 0.5) * 10, Math.sin(a) * r);
    mesh.userData.speed = 0.1 + Math.random() * 0.3;
    futureStructures.push(mesh);
    futureGroup.add(mesh);
  }

  const FUTURE_PARTICLES = isMobile ? 300 : 700;
  const futureGeo = new THREE.BufferGeometry();
  const futurePos = new Float32Array(FUTURE_PARTICLES * 3);
  for (let i = 0; i < FUTURE_PARTICLES; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 26;
    futurePos[i * 3] = Math.cos(a) * r;
    futurePos[i * 3 + 1] = (Math.random() - 0.5) * 18;
    futurePos[i * 3 + 2] = Math.sin(a) * r;
  }
  futureGeo.setAttribute('position', new THREE.BufferAttribute(futurePos, 3));
  const futurePoints = new THREE.Points(futureGeo, glowPointsMaterial(0x9fd8ff, 0.1));
  futureGroup.add(futurePoints);

  /* ---------------------------------------------------------------
     10. RESIZE HANDLING
     --------------------------------------------------------------- */

  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  window.addEventListener('resize', handleResize);

  /* ---------------------------------------------------------------
     11. MOUSE PARALLAX
     --------------------------------------------------------------- */

  const mouseNDC = { x: 0, y: 0 };
  const parallax = { x: 0, y: 0 };
  const parallaxEnabled = !isTouch && !prefersReducedMotion;

  window.addEventListener('pointermove', (e) => {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  /* ---------------------------------------------------------------
     12. RAYCASTER — hover + click interactions (Scene 3 only)
     --------------------------------------------------------------- */

  const raycaster = new THREE.Raycaster();
  const pointerVec = new THREE.Vector2();
  let currentScene = 'portal';
  let hoveredObject = null;

  const infoPanel = document.getElementById('infoPanel');
  const infoBackdrop = document.getElementById('infoBackdrop');
  const infoTitle = document.getElementById('infoTitle');
  const infoDesc = document.getElementById('infoDesc');
  const infoEyebrow = document.getElementById('infoEyebrow');
  const infoClose = document.getElementById('infoClose');

  function getInteractiveRoot(obj) {
    let cur = obj;
    while (cur) {
      if (cur.userData && cur.userData.techId) return cur;
      cur = cur.parent;
    }
    return null;
  }

  function setHover(obj) {
    if (hoveredObject === obj) return;

    if (hoveredObject) {
      const prev = hoveredObject;
      gsap.to(prev.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out' });
      prev.userData.materials.forEach((m) => {
        gsap.to(m, { emissiveIntensity: m.userData?.baseIntensity ?? 1.1, duration: 0.5 });
      });
    }

    hoveredObject = obj;
    document.body.classList.toggle('cursor-interactive', !!obj);

    if (obj) {
      gsap.to(obj.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 0.5, ease: 'power2.out' });
      obj.userData.materials.forEach((m) => {
        m.userData = m.userData || {};
        if (m.userData.baseIntensity === undefined) m.userData.baseIntensity = m.emissiveIntensity;
        gsap.to(m, { emissiveIntensity: m.userData.baseIntensity * 1.9, duration: 0.5 });
      });
    }
  }

  function openInfoPanel(data) {
    infoEyebrow.textContent = 'TECHNOLOGY // 0' + (TECH_DATA.findIndex((d) => d.id === data.id) + 1);
    infoTitle.textContent = data.title;
    infoDesc.textContent = data.desc;
    infoPanel.classList.add('visible');
    infoPanel.setAttribute('aria-hidden', 'false');
    infoBackdrop.classList.add('visible');
  }

  function closeInfoPanel() {
    infoPanel.classList.remove('visible');
    infoPanel.setAttribute('aria-hidden', 'true');
    infoBackdrop.classList.remove('visible');
  }

  infoClose.addEventListener('click', closeInfoPanel);
  infoBackdrop.addEventListener('click', closeInfoPanel);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeInfoPanel();
  });

  function updateRaycaster() {
    if (currentScene !== 'universe') {
      if (hoveredObject) setHover(null);
      return;
    }
    pointerVec.set(mouseNDC.x, mouseNDC.y);
    raycaster.setFromCamera(pointerVec, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
      const root = getInteractiveRoot(intersects[0].object);
      setHover(root);
    } else {
      setHover(null);
    }
  }

  canvas.addEventListener('click', () => {
    if (currentScene !== 'universe' || !hoveredObject) return;
    openInfoPanel(hoveredObject.userData);
  });

  // Keyboard accessibility: Tab is not natural for canvas objects, so we
  // expose the same info via a lightweight keyboard shortcut per hovered object.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && hoveredObject && currentScene === 'universe') {
      openInfoPanel(hoveredObject.userData);
    }
  });

  /* ---------------------------------------------------------------
     13. CAMERA PATH — driven by GSAP ScrollTrigger (scrubbed)
     --------------------------------------------------------------- */

  gsap.registerPlugin(ScrollTrigger);

  const camProxy = {
    px: 0, py: 0, pz: 18,
    lx: 0, ly: 0, lz: 0
  };

  function buildCameraTimeline() {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#content',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1
      }
    });

    // Portal -> approach + pass through
    tl.to(camProxy, { px: 0, py: 1.2, pz: 6, lx: 0, ly: 0.4, lz: -18, duration: 1, ease: 'power1.inOut' }, 0);

    // Into the technology universe (long dwell for interaction)
    tl.to(camProxy, { px: 1.5, py: 0.6, pz: -18, lx: 0, ly: 0, lz: UNIVERSE_Z, duration: 1.4, ease: 'power1.inOut' }, 1);
    tl.to(camProxy, { px: -1.5, py: -0.4, pz: -34, lx: 0, ly: 0, lz: UNIVERSE_Z - 20, duration: 1.4, ease: 'power1.inOut' }, 2.4);

    // Approach the AI core
    tl.to(camProxy, { px: 0, py: 0.4, pz: CORE_Z + 14, lx: 0, ly: 0, lz: CORE_Z, duration: 1.5, ease: 'power1.inOut' }, 3.8);

    // Enter the tunnel and travel through
    tl.to(camProxy, { px: 0, py: 0, pz: TUNNEL_START + 12, lx: 0, ly: 0, lz: TUNNEL_START, duration: 1, ease: 'power1.inOut' }, 5.3);
    tl.to(camProxy, { px: 0, py: 0, pz: TUNNEL_END + 20, lx: 0, ly: 0, lz: TUNNEL_END, duration: 3, ease: 'none' }, 6.3);

    // Pull back and rise into the future universe
    tl.to(camProxy, { px: 0, py: 12, pz: FUTURE_Z + 46, lx: 0, ly: -2, lz: FUTURE_Z, duration: 1.5, ease: 'power2.inOut' }, 9.3);

    return tl;
  }

  buildCameraTimeline();

  /* ---------------------------------------------------------------
     14. SCENE-ACTIVE TRACKING + TEXT REVEALS
     --------------------------------------------------------------- */

  ['portal', 'universe', 'core', 'tunnel', 'future'].forEach((name) => {
    ScrollTrigger.create({
      trigger: `#scene-${name}`,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => { currentScene = name; },
      onEnterBack: () => { currentScene = name; }
    });
  });

  document.querySelectorAll('.fade-line, .reveal-up').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 82%',
      end: 'bottom 20%',
      toggleClass: { targets: el, className: 'in-view' }
    });
  });

  // Portal entrance plays once on load rather than waiting for scroll
  window.addEventListener('techfest:ready', () => {
    document.querySelectorAll('.scene-portal .fade-line').forEach((el, i) => {
      gsap.to(el, { opacity: 1, y: 0, duration: 1, delay: 0.15 * i, ease: 'power2.out' });
    });
  });

  /* ---------------------------------------------------------------
     15. TUNNEL WORD SEQUENCE
     --------------------------------------------------------------- */

  const tunnelWords = Array.from(document.querySelectorAll('.tunnel-word'));

  ScrollTrigger.create({
    trigger: '#scene-tunnel',
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate(self) {
      const idx = Math.min(tunnelWords.length - 1, Math.floor(self.progress * tunnelWords.length));
      tunnelWords.forEach((w, i) => w.classList.toggle('active', i === idx));

      const opacity = self.progress > 0.02 && self.progress < 0.98 ? 1 : 0;
      gsap.to(tunnelMat, { opacity: opacity * 0.85, duration: 0.4 });
    }
  });

  /* ---------------------------------------------------------------
     16. AI CORE LIGHT INTENSITY DURING SCROLL
     --------------------------------------------------------------- */

  ScrollTrigger.create({
    trigger: '#scene-core',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate(self) {
      coreLight.intensity = self.progress * 5;
    }
  });

  /* ---------------------------------------------------------------
     17. NAVIGATION BEHAVIOR
     --------------------------------------------------------------- */

  const nav = document.getElementById('mainNav');
  ScrollTrigger.create({
    start: 'top -60',
    end: 99999,
    onUpdate(self) {
      nav.classList.toggle('nav-scrolled', self.scroll() > 60);
    }
  });

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('nav-open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('nav-open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  const sectionIdToNav = { portal: 0, universe: 1, core: 1, tunnel: 1, future: 2 };
  const navLinkEls = Array.from(navLinks.querySelectorAll('a'));
  ['portal', 'universe', 'core', 'tunnel', 'future'].forEach((name) => {
    ScrollTrigger.create({
      trigger: `#scene-${name}`,
      start: 'top center',
      end: 'bottom center',
      onToggle(self) {
        if (!self.isActive) return;
        navLinkEls.forEach((a, i) => a.classList.toggle('nav-active', i === sectionIdToNav[name]));
      }
    });
  });

  /* ---------------------------------------------------------------
     18. CTA BUTTON — smooth scroll back to the portal
     --------------------------------------------------------------- */

  document.getElementById('ctaButton').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ---------------------------------------------------------------
     19. ANIMATION LOOP
     --------------------------------------------------------------- */

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();

    // --- Portal ---
    portalRings.forEach((ring) => {
      ring.rotation[ring.userData.axis] += ring.userData.speed * delta;
    });
    portalShards.forEach((shard) => {
      shard.rotation.x += delta * 0.3;
      shard.rotation.y += delta * 0.4;
      shard.position.y = shard.userData.baseY + Math.sin(elapsed * shard.userData.speed) * 0.4;
    });
    portalPoints.rotation.y += delta * 0.02;

    // --- Technology universe ---
    universeGroup.rotation.y += delta * 0.015;
    interactiveObjects.forEach((group) => {
      const { core, orbit, inner } = group.userData.parts || {};
      const spin = group.userData.spin || {};
      if (core) core.rotation.y += delta * (spin.core || 0.2);
      if (orbit) orbit.rotation.y -= delta * (spin.orbit || 0.4);
      if (inner) inner.rotation.x += delta * (spin.inner || -0.3);
      group.position.y = group.userData.baseY + Math.sin(elapsed * 0.6 + group.userData.baseY) * 0.25;
    });

    // --- AI core ---
    coreLayers.forEach((layer, i) => {
      layer.rotation.y += delta * layer.userData.speed * (i % 2 === 0 ? 1 : -1);
      layer.rotation.x += delta * layer.userData.speed * 0.5;
    });
    corePoints.rotation.y += delta * (0.05 + coreLight.intensity * 0.02);

    // --- Tunnel ---
    tunnelRings.forEach((ring) => {
      const pulse = 1 + Math.sin(elapsed * 1.5 + ring.userData.phase) * 0.06;
      ring.scale.setScalar(pulse);
      ring.rotation.z += delta * 0.15;
    });
    if (tunnelMat.opacity > 0.01) {
      const positions = tunnelGeo.attributes.position.array;
      for (let i = 0; i < TUNNEL_PARTICLES; i++) {
        positions[i * 3 + 2] += delta * 26;
        if (positions[i * 3 + 2] > TUNNEL_END + 30) {
          positions[i * 3 + 2] = TUNNEL_START;
        }
      }
      tunnelGeo.attributes.position.needsUpdate = true;
    }

    // --- Future universe ---
    futureStructures.forEach((mesh) => {
      mesh.rotation.x += delta * mesh.userData.speed * 0.4;
      mesh.rotation.y += delta * mesh.userData.speed;
    });
    centralSphere.rotation.y += delta * 0.1;
    futurePoints.rotation.y += delta * 0.01;

    // --- Ambient field ---
    ambientPoints.rotation.y += delta * 0.004;

    // --- Mouse parallax (lerped, disabled on touch / reduced motion) ---
    if (parallaxEnabled) {
      parallax.x += (mouseNDC.x * 0.6 - parallax.x) * 0.04;
      parallax.y += (mouseNDC.y * 0.35 - parallax.y) * 0.04;
    }

    // --- Camera transform from GSAP-driven proxy + parallax ---
    camera.position.set(
      camProxy.px + parallax.x,
      camProxy.py + parallax.y,
      camProxy.pz
    );
    camera.lookAt(camProxy.lx, camProxy.ly, camProxy.lz);

    updateRaycaster();
    renderer.render(scene, camera);
  }

  animate();

  /* ---------------------------------------------------------------
     20. LOADING SEQUENCE
     --------------------------------------------------------------- */

  const loader = document.getElementById('loader');
  const loaderBarFill = document.getElementById('loaderBarFill');
  const loaderPercent = document.getElementById('loaderPercent');
  const loaderMessagesEl = document.getElementById('loaderMessages');

  const SYSTEM_MESSAGES = [
    '[ SYSTEM ONLINE ]',
    '[ INITIALIZING NEURAL NETWORK ]',
    '[ CONNECTING TO FUTURE ]',
    '[ EXPERIENCE READY ]'
  ];

  SYSTEM_MESSAGES.forEach((msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    loaderMessagesEl.appendChild(li);
  });
  const messageEls = Array.from(loaderMessagesEl.children);

  const loadState = { progress: 0 };
  const loadDuration = prefersReducedMotion ? 1.1 : 2.4;

  gsap.to(loadState, {
    progress: 100,
    duration: loadDuration,
    ease: 'power1.inOut',
    onUpdate() {
      const pct = Math.round(loadState.progress);
      loaderBarFill.style.width = pct + '%';
      loaderPercent.textContent = pct + '%';

      messageEls.forEach((el, i) => {
        const threshold = ((i + 1) / messageEls.length) * 100;
        if (pct >= threshold) el.classList.add('visible');
      });
    },
    onComplete() {
      gsap.delayedCall(0.4, () => {
        loader.classList.add('loader-hidden');
        document.body.classList.remove('is-loading');
        ScrollTrigger.refresh();
        window.dispatchEvent(new CustomEvent('techfest:ready'));
      });
    }
  });

})();
