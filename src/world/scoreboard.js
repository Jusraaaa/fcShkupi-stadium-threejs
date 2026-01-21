// src/world/scoreboard.js
import * as THREE from "three";

export function createScoreboard(pitchW, pitchD) {
  const group = new THREE.Group();
  group.name = "Scoreboard";

  // ---- Canvas (LED screen) ----
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const screenMat = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 1.6,
    roughness: 0.35,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  // Screen + frame
  const screenGeo = new THREE.PlaneGeometry(14, 3.6);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = "ScoreboardScreen";
  screen.castShadow = true;
  screen.receiveShadow = true;

  const frameGeo = new THREE.BoxGeometry(15.2, 4.6, 0.7);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.name = "ScoreboardFrame";
  frame.position.z = -0.35;
  frame.castShadow = true;
  frame.receiveShadow = true;

  // make sure it shows nicely
  screen.renderOrder = 10;
  screen.material.depthWrite = false;

  group.add(screen, frame);

  // small glow like a real LED panel
  const glow = new THREE.PointLight(0xffffff, 0.6, 25);
  glow.position.set(0, 0, 1.5);
  group.add(glow);

  // Poles
  const poleGeo = new THREE.CylinderGeometry(0.22, 0.22, 7, 16);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

  const poleL = new THREE.Mesh(poleGeo, poleMat);
  poleL.position.set(-6, -5.5, -0.1);
  const poleR = poleL.clone();
  poleR.position.x = 6;

  poleL.castShadow = poleL.receiveShadow = true;
  poleR.castShadow = poleR.receiveShadow = true;

  group.add(poleL, poleR);

  // Position behind north goal, facing pitch
  group.position.set(0, 10.2, -(pitchD / 2 + 7));
  group.lookAt(0, 10, 0);

  // ---- Data / Modes ----
  const state = {
    mode: 3, // 0 logo, 1 score/time, 2 GOAL, 3 STATIC
    home: "FC SHKUPI",
    away: "GUEST",
    homeScore: 1,
    awayScore: 0,
    seconds: 0,
    blink: 0,
    logoImg: null,
  };

  // Load logo
  const img = new Image();
  img.src = "/fcshkupi.png";
  img.onload = () => {
    state.logoImg = img;
    draw();
  };

  function drawBackground() {
    // LED-like dark background
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#0b1220";
    for (let x = 0; x < canvas.width; x += 10) ctx.fillRect(x, 0, 1, canvas.height);
    for (let y = 0; y < canvas.height; y += 10) ctx.fillRect(0, y, canvas.width, 1);
    ctx.globalAlpha = 1;
  }

  function drawStatic() {
    // TV noise
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const v = Math.random() * 255;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);

    // scanlines (VHS-ish)
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#000000";
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    ctx.globalAlpha = 1;

    // overlay text
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 64px Arial";
    ctx.fillText("NO SIGNAL", 330, 140);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial";
    ctx.fillText("Click to change mode", 360, 195);

    // little random "glitch bar"
    const barY = 40 + Math.floor(Math.random() * 160);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = "#0ea5e9";
    ctx.fillRect(0, barY, canvas.width, 6);
    ctx.globalAlpha = 1;
  }

  function drawLogo() {
    drawBackground();

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 46px Arial";
    ctx.fillText("FC SHKUPI STADIUM", 40, 70);

    if (state.logoImg) {
      ctx.drawImage(state.logoImg, canvas.width - 260, 30, 220, 220);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial";
    ctx.fillText("Click to toggle modes", 40, 140);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "22px Arial";
    ctx.fillText("Press G for GOAL", 40, 175);
  }

  function formatTime(totalSeconds) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = Math.floor(totalSeconds % 60);
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function drawScore() {
    drawBackground();

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 40px Arial";
    ctx.fillText(state.home, 40, 80);
    ctx.fillText(state.away, 40, 160);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 90px Arial";
    ctx.fillText(`${state.homeScore}`, 650, 110);

    ctx.fillStyle = "#f97316";
    ctx.fillText(`${state.awayScore}`, 820, 110);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 70px Arial";
    ctx.fillText("-", 750, 110);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 50px Arial";
    ctx.fillText(formatTime(state.seconds), 750, 210);
  }

  function drawGoal() {
    drawBackground();

    const pulse = 0.5 + 0.5 * Math.sin(state.blink);
    ctx.globalAlpha = 0.6 + pulse * 0.4;

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 120px Arial";
    ctx.fillText("GOAL!", 280, 150);

    ctx.globalAlpha = 1;

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 44px Arial";
    ctx.fillText(
      `${state.home} ${state.homeScore} - ${state.awayScore} ${state.away}`,
      160,
      230
    );
  }

  function draw() {
    if (state.mode === 0) drawLogo();
    else if (state.mode === 1) drawScore();
    else if (state.mode === 2) drawGoal();
    else drawStatic();

    tex.needsUpdate = true;
  }

  // initial draw
  draw();

  // API for outside
  group.userData = {
    clickable: [screen, frame],
    toggleMode: () => {
      state.mode = (state.mode + 1) % 4; // ✅ tani 4 modes
      draw();
    },
    goalFlash: () => {
      state.mode = 2;
      state.blink = 0;
      draw();
    },
    setMode: (m) => {
      state.mode = m;
      draw();
    },
    setScore: (h, a) => {
      state.homeScore = h;
      state.awayScore = a;
      draw();
    },
    update: (dt) => {
      state.seconds += dt;
      state.blink += dt * 10.0;

      // LED flicker
      screenMat.emissiveIntensity = 1.45 + 0.25 * Math.sin(state.blink * 0.8);

      // animate GOAL + STATIC
      if (state.mode === 2 || state.mode === 3) draw();
    },
  };

  return group;
}
