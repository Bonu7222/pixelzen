const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = 320;
const H = 240;

const ui = {
  score: document.getElementById('score'),
  combo: document.getElementById('combo'),
  stones: document.getElementById('stones'),
  time: document.getElementById('time'),
  startScreen: document.getElementById('startScreen'),
  gameOver: document.getElementById('gameOver'),
  finalScore: document.getElementById('finalScore'),
  rank: document.getElementById('rank'),
  startBtn: document.getElementById('startBtn'),
  restartBtn: document.getElementById('restartBtn')
};

const GROUND_Y = 140;
const TREE_X = 45;
const MOON_X = 265;
const MOON_Y = 55;
const MOON_R = 18;

const state = {
  running: false,
  score: 0,
  combo: 0,
  stonesLeft: 10,
  timeLeft: 60,
  elapsed: 0,
  petals: [],
  stones: [],
  ripples: [],
  popups: [],
  spawnTimer: 0
};

const bgPetals = [];
for (let i = 0; i < 10; i++) {
  bgPetals.push({
    x: Math.random() * W,
    y: Math.random() * GROUND_Y,
    speed: 6 + Math.random() * 10,
    phase: Math.random() * Math.PI * 2,
    swayAmp: 3 + Math.random() * 5
  });
}

let audioCtx = null;
let musicTimeout = null;

const SCALE = [146.83, 155.56, 196.00, 220.00, 233.08, 293.66, 311.13, 392.00, 440.00, 466.16];

function initAudio() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  startDrone();
  scheduleNote();
}

function startDrone() {
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = 'sine';
  osc.frequency.value = 73.42;
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  gain.gain.value = 0.05;
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
}

function scheduleNote() {
  playAmbientNote();
  if (Math.random() < 0.3) {
    setTimeout(() => playAmbientNote(), 300 + Math.random() * 400);
  }
  musicTimeout = setTimeout(scheduleNote, 1400 + Math.random() * 2200);
}

function playAmbientNote() {
  if (!audioCtx) return;
  const freq = SCALE[Math.floor(Math.random() * SCALE.length)];
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 2);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 2.1);
}

function playCatch() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.35);
}

function playPlace() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
  gain.gain.setValueAtTime(0.18, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.25);
}

function playMiss() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 110;
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.4);
}

function drawPixelCircle(cx, cy, r) {
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - w, cy + y, w * 2, 1);
  }
}

function pixLine(x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  while (true) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawSky() {
  for (let y = 0; y < GROUND_Y; y++) {
    const t = y / GROUND_Y;
    let r, g, b;
    if (t < 0.55) {
      const u = t / 0.55;
      r = lerp(30, 93, u);
      g = lerp(27, 58, u);
      b = lerp(46, 94, u);
    } else {
      const u = (t - 0.55) / 0.45;
      r = lerp(93, 232, u);
      g = lerp(58, 168, u);
      b = lerp(94, 124, u);
    }
    ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
    ctx.fillRect(0, y, W, 1);
  }
}

function drawBgPetals(t) {
  bgPetals.forEach(p => {
    p.y += p.speed * 0.016;
    const x = p.x + Math.sin(t * 1.5 + p.phase) * p.swayAmp;
    if (p.y > GROUND_Y - 5) {
      p.y = -5;
      p.x = Math.random() * W;
    }
    ctx.fillStyle = 'rgba(255, 183, 197, 0.35)';
    ctx.fillRect(x | 0, p.y | 0, 1, 1);
  });
}

function drawMoon(t) {
  const pulse = Math.sin(t * 0.6) * 1;
  for (let i = 3; i >= 0; i--) {
    const r = MOON_R + 4 + i * 5 + pulse;
    ctx.fillStyle = `rgba(230, 57, 70, ${0.04 + i * 0.015})`;
    drawPixelCircle(MOON_X, MOON_Y, r);
  }
  ctx.fillStyle = '#e63946';
  drawPixelCircle(MOON_X, MOON_Y, MOON_R);
  ctx.fillStyle = 'rgba(255, 140, 150, 0.4)';
  drawPixelCircle(MOON_X - 4, MOON_Y - 4, 4);
  ctx.fillStyle = 'rgba(160, 25, 45, 0.5)';
  drawPixelCircle(MOON_X + 5, MOON_Y + 4, 3);
}

function drawMountainPeak(cx, baseY, width, height) {
  for (let i = 0; i < height; i++) {
    const w = Math.floor(width * (i / height));
    ctx.fillRect(cx - w / 2, baseY - height + i, w, 1);
  }
}

function drawMountains() {
  ctx.fillStyle = '#3d2a4a';
  drawMountainPeak(90, GROUND_Y, 170, 58);
  drawMountainPeak(230, GROUND_Y, 150, 48);
  ctx.fillStyle = '#2a1d38';
  drawMountainPeak(170, GROUND_Y, 220, 40);
}

function drawGround() {
  ctx.fillStyle = '#dbc5a3';
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
  ctx.fillStyle = 'rgba(196, 170, 130, 0.7)';
  for (let i = 0; i < 7; i++) {
    const y = GROUND_Y + 15 + i * 12;
    for (let x = 0; x < W; x += 2) {
      const wave = Math.sin(x * 0.06 + i * 0.7) * 2;
      ctx.fillRect(x, y + wave, 1, 1);
    }
  }
  ctx.fillStyle = 'rgba(184, 153, 112, 0.8)';
  ctx.fillRect(0, GROUND_Y, W, 1);
}

function drawTree(t) {
  ctx.fillStyle = '#3d2817';
  for (let i = 0; i < 60; i++) {
    const y = GROUND_Y - i;
    const offset = Math.sin(i * 0.06) * 6;
    const w = Math.max(1, Math.floor(6 - i * 0.07));
    ctx.fillRect(TREE_X + offset - w / 2, y, w, 1);
  }
  ctx.fillStyle = '#2a1a0f';
  pixLine(TREE_X + 5, GROUND_Y - 35, TREE_X + 30, GROUND_Y - 55);
  pixLine(TREE_X + 2, GROUND_Y - 45, TREE_X - 20, GROUND_Y - 60);
  pixLine(TREE_X + 8, GROUND_Y - 25, TREE_X + 35, GROUND_Y - 32);
  pixLine(TREE_X + 3, GROUND_Y - 55, TREE_X - 10, GROUND_Y - 70);

  const clusters = [
    { x: TREE_X + 30, y: GROUND_Y - 55, r: 16 },
    { x: TREE_X - 20, y: GROUND_Y - 60, r: 13 },
    { x: TREE_X + 35, y: GROUND_Y - 32, r: 11 },
    { x: TREE_X - 10, y: GROUND_Y - 70, r: 11 },
    { x: TREE_X + 5, y: GROUND_Y - 60, r: 13 }
  ];
  clusters.forEach((c, i) => {
    for (let p = 0; p < 14; p++) {
      const angle = (p / 14) * Math.PI * 2 + t * 0.4 + i;
      const dist = c.r * (0.4 + Math.random() * 0.5);
      const px = c.x + Math.cos(angle) * dist;
      const py = c.y + Math.sin(angle) * dist * 0.7;
      ctx.fillStyle = p % 3 === 0 ? '#ffd4dd' : '#ffb7c5';
      ctx.fillRect(px | 0, py | 0, 2, 2);
    }
  });
}

function drawLantern() {
  const x = 250;
  const y = GROUND_Y + 30;
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(x - 8, y + 20, 16, 4);
  ctx.fillRect(x - 6, y + 8, 12, 12);
  ctx.fillRect(x - 8, y - 2, 16, 10);
  ctx.fillRect(x - 6, y - 8, 12, 6);
  ctx.fillRect(x - 3, y - 12, 6, 4);
  ctx.fillStyle = 'rgba(255, 204, 102, 0.35)';
  drawPixelCircle(x, y + 4, 10);
  ctx.fillStyle = '#ffcc66';
  ctx.fillRect(x - 3, y + 2, 6, 4);
}

function drawRipples() {
  state.ripples.forEach(r => {
    ctx.fillStyle = `rgba(180, 148, 108, ${r.alpha})`;
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const x = Math.round(r.x + Math.cos(a) * r.radius);
      const y = Math.round(r.y + Math.sin(a) * r.radius * 0.4);
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

function drawStones() {
  state.stones.forEach(s => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 5, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a4a5a';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y + 3, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a6a7a';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a8a9a';
    ctx.beginPath();
    ctx.ellipse(s.x - 3, s.y - 2, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPetals() {
  state.petals.forEach(p => {
    const alpha = p.fading ? p.fadeAlpha : 1;
    ctx.fillStyle = `rgba(255, 183, 197, ${alpha})`;
    ctx.fillRect(p.x | 0, p.y | 0, 2, 2);
    ctx.fillStyle = `rgba(255, 138, 158, ${alpha * 0.8})`;
    ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
  });
}

function drawPopups() {
  state.popups.forEach(p => {
    ctx.fillStyle = `rgba(255, 183, 197, ${p.alpha})`;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
  });
}

function spawnPetal() {
  state.petals.push({
    x: TREE_X + (Math.random() - 0.5) * 50,
    baseX: null,
    y: GROUND_Y - 75 + Math.random() * 15,
    speed: 18 + Math.random() * 12,
    phase: Math.random() * Math.PI * 2,
    swayAmp: 6 + Math.random() * 10,
    fading: false,
    fadeAlpha: 1
  });
}

function catchPetal(p, s) {
  p.fading = 'done';
  state.combo++;
  const mult = state.combo >= 6 ? 3 : state.combo >= 3 ? 2 : 1;
  const points = 10 * mult;
  state.score += points;
  state.ripples.push({ x: s.x, y: s.y + 2, radius: 3, alpha: 0.9 });
  state.popups.push({ x: s.x, y: s.y - 10, text: `+${points}`, alpha: 1 });
  playCatch();
}

function updatePetals(dt, t) {
  for (const p of state.petals) {
    if (p.baseX === null) p.baseX = p.x;
    p.y += p.speed * dt;
    p.x = p.baseX + Math.sin(t * 2 + p.phase) * p.swayAmp;

    if (p.fading === 'done') continue;

    if (!p.fading) {
      for (const s of state.stones) {
        const dx = p.x - s.x;
        const dy = p.y - s.y;
        if (dx * dx + dy * dy < 11 * 11) {
          catchPetal(p, s);
          break;
        }
      }
      if (!p.fading && p.y > GROUND_Y + 40) {
        p.fading = true;
        state.combo = 0;
        playMiss();
      }
    } else {
      p.fadeAlpha -= dt * 2.5;
      if (p.fadeAlpha <= 0) p.fading = 'done';
    }
  }
  state.petals = state.petals.filter(p => p.fading !== 'done');
}

function updateRipples(dt) {
  state.ripples.forEach(r => {
    r.radius += dt * 35;
    r.alpha -= dt * 1.6;
  });
  state.ripples = state.ripples.filter(r => r.alpha > 0);
}

function updatePopups(dt) {
  state.popups.forEach(p => {
    p.y -= dt * 18;
    p.alpha -= dt * 1.4;
  });
  state.popups = state.popups.filter(p => p.alpha > 0);
}

function updateUI() {
  ui.score.textContent = state.score;
  ui.combo.textContent = state.combo;
  ui.stones.textContent = state.stonesLeft;
  ui.time.textContent = Math.max(0, Math.ceil(state.timeLeft));
}

function placeStone(x, y) {
  if (!state.running || state.stonesLeft <= 0) return;
  if (y < GROUND_Y + 18 || y > H - 15) return;
  if (x < 15 || x > W - 15) return;
  state.stones.push({ x, y });
  state.stonesLeft--;
  state.ripples.push({ x, y: y + 4, radius: 5, alpha: 1 });
  playPlace();
  updateUI();
}

function getRank(score) {
  if (score >= 800) return 'sage';
  if (score >= 500) return 'master';
  if (score >= 300) return 'monk';
  if (score >= 150) return 'student';
  return 'novice';
}

function endGame() {
  state.running = false;
  ui.finalScore.textContent = state.score;
  ui.rank.textContent = getRank(state.score);
  ui.gameOver.classList.remove('hidden');
}

function startGame() {
  if (!audioCtx) initAudio();
  else if (audioCtx.state === 'suspended') audioCtx.resume();
  state.running = true;
  state.score = 0;
  state.combo = 0;
  state.stonesLeft = 10;
  state.timeLeft = 60;
  state.elapsed = 0;
  state.petals = [];
  state.stones = [];
  state.ripples = [];
  state.popups = [];
  state.spawnTimer = 0;
  ui.startScreen.classList.add('hidden');
  ui.gameOver.classList.add('hidden');
  updateUI();
}

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  const t = now / 1000;

  if (state.running) {
    state.elapsed += dt;
    state.timeLeft -= dt;

    const spawnInterval = Math.max(0.16, 0.36 - state.elapsed * 0.003);
    state.spawnTimer += dt;
    if (state.spawnTimer > spawnInterval) {
      state.spawnTimer = 0;
      spawnPetal();
    }

    updatePetals(dt, t);
    updateRipples(dt);
    updatePopups(dt);
    updateUI();

    if (state.timeLeft <= 0) endGame();
  }

  drawSky();
  drawBgPetals(t);
  drawMoon(t);
  drawMountains();
  drawGround();
  drawTree(t);
  drawLantern();
  drawRipples();
  drawStones();
  drawPetals();
  drawPopups();

  requestAnimationFrame(loop);
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width * W;
  const y = (e.clientY - rect.top) / rect.height * H;
  placeStone(x, y);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = (touch.clientX - rect.left) / rect.width * W;
  const y = (touch.clientY - rect.top) / rect.height * H;
  placeStone(x, y);
}, { passive: false });

ui.startBtn.addEventListener('click', startGame);
ui.restartBtn.addEventListener('click', startGame);

requestAnimationFrame(loop);

