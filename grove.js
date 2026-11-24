/* Cherry-grove background in a "LINES / line-weave" style.
   Technique inspired by the LINES mode of jiezi1234/character-ocean (cell grid, strokes aligned to the
   subject's direction, drifting small particles, a diffusing wake field that the pointer stirs).
   This is an original implementation: the swimming fish are replaced by a spring cherry grove in front of
   a collegiate-gothic roofline, the fish school by falling petals, and the swim motion by wind sway.
   Decorative only — the canvas is aria-hidden and never intercepts clicks. */
(function () {
  const cv = document.getElementById('grove');
  if (!cv || !cv.getContext) return;
  const ctx = cv.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (a, b, c) => { let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const rng = seed => () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  // Stroke styles. Index = bucket.
  const B_BUILD = 0, B_GROUND = 1, B_BRANCH = 2 /* +layer */, B_BLOSSOM = 4 /* +layer*4+level */, B_ACCENT = 12 /* +0..1 */, B_PETAL = 14 /* +0..2 */;
  const STYLES = [
    ['rgba(112,90,130,0.20)', 1], ['rgba(104,158,112,0.24)', 1],
    ['rgba(104,78,110,0.34)', 1.2], ['rgba(74,50,84,0.62)', 1.5],
    ['rgba(240,150,192,0.22)', 1], ['rgba(240,150,192,0.30)', 1], ['rgba(238,140,186,0.38)', 1.1], ['rgba(236,130,180,0.46)', 1.1],
    ['rgba(234,118,170,0.36)', 1.2], ['rgba(232,110,165,0.48)', 1.2], ['rgba(228,98,158,0.60)', 1.3], ['rgba(222,84,148,0.72)', 1.3],
    ['rgba(150,96,214,0.75)', 1.4], ['rgba(255,120,170,0.85)', 1.4],
    ['rgba(226,96,156,0.45)', 1.4], ['rgba(226,96,156,0.65)', 1.5], ['rgba(214,74,140,0.88)', 1.6]
  ];
  const buckets = STYLES.map(() => []);

  let W, H, dpr, cw, ch, cols, rows, n, groundRow;
  let tKind, tAng, tShade, tLayer, bDir, energy, tmp, petals, bg;
  const pointer = { x: 0, y: 0, active: false };

  function build() {
    W = window.innerWidth; H = window.innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = clamp(Math.round(W / 124), 8, 13); ch = Math.round(cw * 1.45);
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch); n = cols * rows;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    groundRow = Math.round(rows * 0.93);
    tKind = new Uint8Array(n); tAng = new Float32Array(n); tShade = new Float32Array(n); tLayer = new Uint8Array(n);
    bDir = new Int8Array(n).fill(-1); energy = new Float32Array(n); tmp = new Float32Array(n);

    // faint cell grid, painted once
    bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
    const g = bg.getContext('2d'); g.strokeStyle = 'rgba(75,46,131,0.035)'; g.lineWidth = 1; g.beginPath();
    for (let c = 0; c <= cols; c++) { const x = Math.round(c * cw * dpr) + 0.5; g.moveTo(x, 0); g.lineTo(x, cv.height); }
    for (let r = 0; r <= rows; r++) { const y = Math.round(r * ch * dpr) + 0.5; g.moveTo(0, y); g.lineTo(cv.width, y); }
    g.stroke();

    buildHall(); buildTrees();

    const R = rng(77);
    petals = Array.from({ length: clamp(Math.round(W * H / 9000), 50, 200) }, () => ({ x: R() * W, y: R() * H, vx: 20, vy: 12, ph: R() * 6.28, depth: R(), alarm: 0 }));
  }

  // Collegiate-gothic roofline behind the trees: gables, buttresses, lattice windows, one tower.
  function buildHall() {
    const roof = Math.round(rows * 0.40), P = 18, towerC = Math.round(cols * 0.63);
    const set = (c, r, d) => { if (c >= 0 && c < cols && r >= 0 && r < groundRow) bDir[r * cols + c] = d; };
    for (let c = 0; c < cols; c++) {
      const p = c % P;
      if (p < 4) set(c, roof - 1 - p, 3); else if (p < 8) set(c, roof - 1 - (7 - p), 1); else set(c, roof, 0);
      if (p < 8) set(c, roof, hash(c, 1, 5) < 0.5 ? 0 : -1);
      if (p === 0 || p === 8) for (let r = roof + 1; r < groundRow; r++) if (hash(c, r, 9) > 0.15) set(c, r, 2);
      if (p >= 2 && p <= 5) for (let r = roof + 2; r < roof + 9; r++) set(c, r, r % 3 === 0 ? 4 : (p % 2 ? 2 : -1));
      if (hash(c, 3, 2) > 0.3) set(c, roof + 10, 0);
    }
    for (let k = 0; k < 7; k++) {            // tower
      const c = towerC + k;
      for (let r = roof - 9; r <= roof; r++) set(c, r, k === 0 || k === 6 ? 2 : (r % 4 === 0 ? 0 : (k === 3 ? 4 : -1)));
      set(c, roof - 10 - (k < 3 ? k : 6 - k), k < 3 ? 3 : k === 3 ? 4 : 1);
    }
  }

  // Spreading cherry trees: recursive branches rasterised as direction-aligned strokes,
  // blossom canopy as strokes following the contour of a blob density field.
  function buildTrees() {
    const R = rng(20270311), segs = [], blobs = [];
    function branch(x, y, a, len, d, layer) {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
      segs.push({ x, y, x2, y2, a, w: Math.max(0.3, 1.05 - d * 0.24) * cw, layer });
      if (d >= 1) blobs.push({ x: x2, y: y2, r: len * (0.6 + R() * 0.35), layer });
      if (d >= 2) blobs.push({ x: (x + x2) / 2, y: (y + y2) / 2 - len * 0.2, r: len * (0.45 + R() * 0.25), layer });
      if (d < 4) {
        const kids = d === 0 ? 3 : (R() < 0.35 ? 3 : 2);
        for (let k = 0; k < kids; k++) {
          let na = a + (k / (kids - 1) - 0.5) * 1.55 + (R() - 0.5) * 0.4;
          na = clamp(na, -Math.PI + 0.12, -0.12);               // keep limbs spreading, never drooping below level
          branch(x2, y2, na, len * (0.66 + R() * 0.14), d + 1, layer);
        }
      }
    }
    const count = Math.max(2, Math.round(W / 400));
    for (let layer = 0; layer < 2; layer++) {
      const m = layer ? count : count + 1;
      for (let k = 0; k < m; k++) {
        const x = (layer ? (k + 0.5) / count : k / count) * W + (R() - 0.5) * W * 0.05;
        branch(x, (layer ? 0.945 : 0.9) * H, -Math.PI / 2 + (R() - 0.5) * 0.24, H * (layer ? 0.2 : 0.16) * (0.9 + R() * 0.25), 0, layer);
      }
    }
    const br = [new Float32Array(n).fill(NaN), new Float32Array(n).fill(NaN)];
    for (const s of segs) {
      const c0 = Math.floor((Math.min(s.x, s.x2) - s.w) / cw), c1 = Math.floor((Math.max(s.x, s.x2) + s.w) / cw);
      const r0 = Math.floor((Math.min(s.y, s.y2) - s.w) / ch), r1 = Math.floor((Math.max(s.y, s.y2) + s.w) / ch);
      const dx = s.x2 - s.x, dy = s.y2 - s.y, l2 = dx * dx + dy * dy || 1;
      for (let r = Math.max(0, r0); r <= Math.min(rows - 1, r1); r++) for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++) {
        const px = (c + 0.5) * cw, py = (r + 0.5) * ch, u = clamp(((px - s.x) * dx + (py - s.y) * dy) / l2, 0, 1);
        if (Math.hypot(px - s.x - u * dx, py - s.y - u * dy) < s.w) br[s.layer][r * cols + c] = s.a;
      }
    }
    const den = [new Float32Array(n), new Float32Array(n)], gx = [new Float32Array(n), new Float32Array(n)], gy = [new Float32Array(n), new Float32Array(n)];
    for (const b of blobs) {
      const c0 = Math.max(0, Math.floor((b.x - b.r) / cw)), c1 = Math.min(cols - 1, Math.floor((b.x + b.r) / cw));
      const r0 = Math.max(0, Math.floor((b.y - b.r) / ch)), r1 = Math.min(rows - 1, Math.floor((b.y + b.r) / ch));
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5) * cw - b.x, dy = (r + 0.5) * ch - b.y, q = 1 - (dx * dx + dy * dy) / (b.r * b.r);
        if (q <= 0) continue;
        const i = r * cols + c; den[b.layer][i] += q * q * 0.42; gx[b.layer][i] -= dx * q; gy[b.layer][i] -= dy * q;
      }
    }
    for (let i = 0; i < n; i++) {
      const edge = 0.12 + hash(i, 7, 3) * 0.3;
      for (let layer = 1; layer >= 0; layer--) {
        const d = den[layer][i], hasBranch = !isNaN(br[layer][i]);
        if (hasBranch && d < 0.8) { tKind[i] = 1; tAng[i] = br[layer][i]; tLayer[i] = layer; break; }
        if (d > edge) { tKind[i] = 2; tAng[i] = Math.atan2(gy[layer][i], gx[layer][i]) + Math.PI / 2 + (hash(i, 2, 8) - 0.5) * 0.7; tShade[i] = clamp(d * (0.55 + hash(i, 11, 6) * 0.6), 0, 1); tLayer[i] = layer; break; }
      }
    }
  }

  function stamp(x, y, radius, amount) {
    const c0 = Math.floor(x / cw), r0 = Math.floor(y / ch);
    for (let r = r0 - radius; r <= r0 + radius; r++) for (let c = c0 - radius; c <= c0 + radius; c++) {
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const d = Math.hypot(c - c0, (r - r0) * 1.4);
      if (d <= radius + 0.5) { const i = r * cols + c; energy[i] = Math.min(1.6, energy[i] + amount * (1 - d / (radius + 1))); }
    }
  }
  const quad = a => ((Math.round(a / (Math.PI / 4)) % 4) + 4) % 4;   // 0 ─  1 ╲  2 │  3 ╱   (4 = ┼)
  const gust = (c, r, t) => Math.sin(t * 0.55 + c * 0.045 - r * 0.03) * (0.6 + 0.4 * Math.sin(t * 0.21 + c * 0.02));

  function step(t, dt) {
    // petals drift on the wind, scatter from the pointer and leave a faint wake
    for (const p of petals) {
      if (p.gone) continue;
      if (!active && (p.life -= dt) <= 0) { p.gone = true; continue; }   // winding down: petals vanish one by one
      const g = gust(p.x / cw, p.y / ch, t);
      p.vx += ((24 + 24 * g) * (0.6 + p.depth * 0.7) - p.vx) * dt * 1.2;
      p.vy += ((15 + 9 * Math.sin(t * 1.3 + p.ph)) * (0.6 + p.depth * 0.7) - p.vy) * dt * 1.2;
      if (pointer.active) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy) || 1;
        if (d < 110) { const f = (1 - d / 110) * 520 * dt; p.vx += dx / d * f; p.vy += dy / d * f; p.alarm = 1; }
      }
      p.alarm *= Math.exp(-dt * 1.5); p.x += p.vx * dt; p.y += p.vy * dt;
      const out = p.x > W + 12 || p.x < -12 || p.y > H + 12;
      if (out && !active) { p.gone = true; continue; }           // winding down: let petals leave, don't respawn
      if (p.x > W + 12) { p.x = -10; p.y = Math.random() * H * 0.9; } else if (p.x < -12) p.x = W + 10;
      if (p.y > H + 12) { p.y = -10; p.x = Math.random() * W; }
      const c = Math.floor(p.x / cw), r = Math.floor(p.y / ch);
      if (c >= 0 && r >= 0 && c < cols && r < rows) energy[r * cols + c] = Math.min(1.6, energy[r * cols + c] + 0.02 + p.alarm * 0.06);
    }
    if (pointer.active) stamp(pointer.x, pointer.y, 1, 0.16);
    // blur + decay so wakes spread like ripples and fade
    const decay = Math.exp(-dt * 1.5);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, e = energy[i];
      tmp[i] = (e * 4 + (c > 0 ? energy[i - 1] : e) + (c < cols - 1 ? energy[i + 1] : e) + (r > 0 ? energy[i - cols] : e) + (r < rows - 1 ? energy[i + cols] : e)) * 0.125 * decay;
    }
    const sw = energy; energy = tmp; tmp = sw;
  }

  function render(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(bg, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const b of buckets) b.length = 0;
    const tick = Math.floor(t * 1.7);
    for (let r = 0; r < rows; r++) {
      const lift = clamp((groundRow - r) / (rows * 0.55), 0, 1);
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, g = gust(c, r, t), sc = c - Math.round(g * 1.7 * lift);   // canopy sways, trunks barely move
        const j = sc >= 0 && sc < cols ? r * cols + sc : -1, k = j < 0 ? 0 : tKind[j];
        if (k === 1) buckets[B_BRANCH + tLayer[j]].push(i * 8 + quad(tAng[j]));
        else if (k === 2) {
          const shade = Math.min(1, tShade[j] + energy[i] * 0.45);
          const b = hash(j, tick, 17) < 0.03 ? B_ACCENT + (j & 1) : B_BLOSSOM + tLayer[j] * 4 + clamp(Math.floor(shade * 4), 0, 3);
          buckets[b].push(i * 8 + (shade > 0.88 && (j % 3 === 0) ? 4 : quad(tAng[j] + g * 0.4)));
        }
        else if (bDir[i] >= 0) buckets[B_BUILD].push(i * 8 + bDir[i]);
        else if (r >= groundRow && hash(c, r, 4) < 0.3) buckets[B_GROUND].push(i * 8);
      }
    }
    for (const p of petals) {
      if (p.gone) continue;
      const c = Math.floor(p.x / cw), r = Math.floor(p.y / ch);
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      buckets[B_PETAL + (p.alarm > 0.3 ? 2 : p.depth > 0.5 ? 1 : 0)].push((r * cols + c) * 8 + quad(Math.atan2(p.vy, p.vx) + Math.sin(t * 3 + p.ph) * 0.7));
    }
    for (let b = 0; b < buckets.length; b++) {
      const list = buckets[b]; if (!list.length) continue;
      ctx.strokeStyle = STYLES[b][0]; ctx.lineWidth = STYLES[b][1]; ctx.beginPath();
      for (const v of list) {
        const i = v >> 3, d = v & 7, x = (i % cols) * cw, y = ((i / cols) | 0) * ch;
        if (d === 0 || d === 4) { ctx.moveTo(x, y + ch / 2); ctx.lineTo(x + cw, y + ch / 2); }
        if (d === 2 || d === 4) { ctx.moveTo(x + cw / 2, y); ctx.lineTo(x + cw / 2, y + ch); }
        if (d === 1) { ctx.moveTo(x, y); ctx.lineTo(x + cw, y + ch); }
        if (d === 3) { ctx.moveTo(x, y + ch); ctx.lineTo(x + cw, y); }
      }
      ctx.stroke();
    }
    // wake dots sit low-right in their cell
    const size = Math.max(2, Math.round(cw * 0.22));
    for (let i = 0; i < n; i++) {
      const e = energy[i]; if (e < 0.45) continue;
      ctx.fillStyle = `rgba(150,100,215,${(0.22 + clamp(Math.floor((e - 0.45) * 5), 0, 5) * 0.11).toFixed(2)})`;
      ctx.fillRect(Math.round((i % cols) * cw + cw * 0.66 - size / 2), Math.round(((i / cols) | 0) * ch + ch * 0.64 - size / 2), size, size);
    }
  }

  /* Falling petals only appear on the opening screen: assistant view shown and no message sent yet.
     Once the student sends a message or switches to another page, the petals fade out within ~2 s.
     The trees keep swaying and the pointer ripples keep working.
     "New conversation" (empty thread on the assistant view) brings the petals back. */
  let last = 0, time = 0, running = false, active = !reduce;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 32) return;                    // ~30 fps is plenty for a background
    const dt = Math.min(0.1, (now - last) / 1000); last = now; time += dt;
    step(time, dt); render(time);
  }
  function start() { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function setActive(on) {
    on = on && !reduce;
    if (on === active) return;
    active = on;
    const R = rng(Math.floor(time * 1000) + 1);
    if (on) {                                         // fresh petals float in from above
      for (const p of petals) if (p.gone) { p.gone = false; p.x = R() * W; p.y = -10 - R() * H * 0.5; p.alarm = 0; }
      start();
    } else {
      for (const p of petals) p.life = 0.3 + R() * 1.7;   // all petals gone within ~2 s
    }
  }
  function shouldRun() {
    const conv = document.querySelector('.conversation'), thread = document.getElementById('thread');
    if (!conv || !thread) return true;
    return !conv.classList.contains('hidden') && thread.children.length === 0;
  }
  build(); render(0);
  active = !reduce && shouldRun(); start();
  const sync = () => setActive(shouldRun());
  const watch = new MutationObserver(sync);
  if (document.getElementById('thread')) watch.observe(document.getElementById('thread'), { childList: true });
  if (document.querySelector('.conversation')) watch.observe(document.querySelector('.conversation'), { attributes: true, attributeFilter: ['class'] });
  window.HuskyGrove = { setActive, isRunning: () => running, petalsFalling: () => petals.some(p => !p.gone) };

  let rz; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { build(); if (!active) for (const p of petals) p.gone = true; render(time); }, 150); });
  window.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; });
  document.addEventListener('pointerleave', () => { pointer.active = false; });
  window.addEventListener('pointerdown', e => { if (!reduce) stamp(e.clientX, e.clientY, 6, 1.4); });
})();
