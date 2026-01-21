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
  tex.needsUpdate = true;

  // stable filtering (no shimmering blocks)
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  // Screen material (LED): not affected by lights, only visible from front
  const screenMat = new THREE.MeshBasicMaterial({
    map: tex,
    toneMapped: false,
    side: THREE.FrontSide,
  });

  // ✅ Z-fighting killer
  screenMat.polygonOffset = true;
  screenMat.polygonOffsetFactor = -2;
  screenMat.polygonOffsetUnits = -2;

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.7,
    metalness: 0.2,
    side: THREE.DoubleSide,
  });

  // ---- Geometry ----
  const screenGeo = new THREE.PlaneGeometry(14, 3.6);
  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.name = "ScoreboardScreen";
  screen.castShadow = false;
  screen.receiveShadow = false;

  // pull screen slightly forward
  screen.position.z = 0.36;

  const frameGeo = new THREE.BoxGeometry(15.2, 4.6, 0.7);
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.name = "ScoreboardFrame";

  // push frame backward
  frame.position.z = -0.6;
  frame.castShadow = true;
  frame.receiveShadow = true;

  group.add(screen, frame);

  // ---- Back cover (mbyll pjesën e pasme, e ngjitur saktë) ----
  const frameDepth = frameGeo.parameters.depth; // 0.7

  const backGeo = new THREE.PlaneGeometry(14, 3.6);
  const backMat = new THREE.MeshStandardMaterial({
    color: 0x0b0b0b,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.FrontSide,
  });

  const backCover = new THREE.Mesh(backGeo, backMat);

  // vendose fiks në faqen e pasme të frame-it
  backCover.position.z = frame.position.z - frameDepth / 2 - 0.01;
  backCover.rotation.y = Math.PI;

  backCover.castShadow = true;
  backCover.receiveShadow = true;

  group.add(backCover);

  // Optional glow (nice at night)
  const glow = new THREE.PointLight(0xffffff, 0.45, 25);
  glow.position.set(0, 0, 1.8);
  group.add(glow);

  // ---- Poles ----
  const poleGeo = new THREE.CylinderGeometry(0.22, 0.22, 7, 16);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

  const poleL = new THREE.Mesh(poleGeo, poleMat);
  poleL.position.set(-6, -5.5, -0.1);
  const poleR = poleL.clone();
  poleR.position.x = 6;

  poleL.castShadow = poleL.receiveShadow = true;
  poleR.castShadow = poleR.receiveShadow = true;

  group.add(poleL, poleR);

  // Position behind goal, facing pitch
  group.position.set(0, 10.2, -(pitchD / 2 + 7));
  group.lookAt(0, 10, 0);

  // ---- State ----
  const state = {
    mode: 0, // 0 LOGO, 1 SCORE, 2 GOAL
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

  // ---- Canvas helpers ----
  function beginFrame() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawBackground() {
    beginFrame();

    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(0,0,0,0.25)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle scanlines
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#000";
    for (let y = 0; y < canvas.height; y += 4) {
      ctx.fillRect(0, y, canvas.width, 1);
    }
    ctx.globalAlpha = 1;
  }

  function drawHeader() {
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, canvas.width, 56);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 34px Arial";
    ctx.fillText("FC SHKUPI STADIUM", 30, 40);
  }

  function drawLogo() {
    drawBackground();
    drawHeader();

    if (state.logoImg) {
      ctx.drawImage(state.logoImg, canvas.width - 240, 18, 210, 210);
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px Arial";
    ctx.fillText("Click to change mode", 30, 120);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "22px Arial";
    ctx.fillText("Press G for GOAL", 30, 155);

    tex.needsUpdate = true;
  }

  function formatTime(totalSeconds) {
    const mm = Math.floor(totalSeconds / 60);
    const ss = Math.floor(totalSeconds % 60);
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function drawScore() {
    drawBackground();
    drawHeader();

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 34px Arial";
    ctx.fillText(state.home, 40, 110);
    ctx.fillText(state.away, 40, 185);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 90px Arial";
    ctx.fillText(`${state.homeScore}`, 660, 145);

    ctx.fillStyle = "#f97316";
    ctx.fillText(`${state.awayScore}`, 840, 145);

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 70px Arial";
    ctx.fillText("-", 770, 145);

    ctx.fillStyle = "#60a5fa";
    ctx.font = "bold 46px Arial";
    ctx.fillText(formatTime(state.seconds), 740, 225);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "24px Arial";
    ctx.fillText("Click to change mode", 40, 240);

    tex.needsUpdate = true;
  }

  function drawGoal() {
    drawBackground();
    drawHeader();

    const pulse = 0.5 + 0.5 * Math.sin(state.blink);
    ctx.globalAlpha = 0.6 + pulse * 0.4;

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 120px Arial";
    ctx.fillText("GOAL!", 300, 175);

    ctx.globalAlpha = 1;

    ctx.fillStyle = "#e5e7eb";
    ctx.font = "bold 34px Arial";
    ctx.fillText(
      `${state.home} ${state.homeScore} - ${state.awayScore} ${state.away}`,
      170,
      235
    );

    tex.needsUpdate = true;
  }

  function draw() {
    if (state.mode === 0) drawLogo();
    else if (state.mode === 1) drawScore();
    else drawGoal();
  }

  // initial draw
  draw();

  // ---- API ----
  group.userData.clickable = [screen, frame];

  group.userData.toggleMode = () => {
    state.mode = (state.mode + 1) % 3;
    draw();
  };

  group.userData.goalFlash = () => {
    state.mode = 2;
    state.blink = 0;
    draw();
  };

  group.userData.setScore = (h, a) => {
    state.homeScore = h;
    state.awayScore = a;
    draw();
  };

  group.userData.update = (dt) => {
    state.seconds += dt;
    state.blink += dt * 10.0;

    // subtle glow animation
    glow.intensity = 0.4 + 0.12 * Math.sin(state.blink * 0.8);

    // only GOAL needs continuous redraw
    if (state.mode === 2) draw();
  };

  return group;
}
