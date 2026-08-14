/**
 * BCA 3 Hub — Ultra HD Manim Mathematical & CS Visuals Engine
 * Integrated Telemetry Deck (No Canvas Obstructions), HiDPI Retina Precision,
 * Synchronous 16-Bit CPU Bus Animation, Particle Traversal, and Anthropic Design Tokens.
 */

(function () {
  'use strict';

  const VisualEngines = {};

  // Utility: Setup HiDPI Retina Ready Canvas
  function setupHiDPICanvas(canvas, logicalWidth, logicalHeight) {
    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    canvas.style.width = '100%';
    canvas.style.maxWidth = logicalWidth + 'px';
    canvas.style.height = 'auto';
    canvas.style.aspectRatio = `${logicalWidth} / ${logicalHeight}`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: logicalWidth, height: logicalHeight, dpr };
  }

  /* -------------------------------------------------------------------------- */
  /* 1. NUMERICAL METHODS: BISECTION METHOD ROOT FINDER                         */
  /* -------------------------------------------------------------------------- */
  VisualEngines['numerical-bisection'] = {
    title: 'Bisection Method: Root Convergence Engine',
    init: function (container) {
      const f = x => x * x - 2;
      const trueRoot = Math.SQRT2;

      let a = 1.0;
      let b = 2.0;
      let iterations = [];
      let currentStep = 0;
      let isPlaying = false;
      let playTimer = null;
      let hoveredX = null;

      function computeIterations() {
        iterations = [];
        let currA = a;
        let currB = b;
        for (let i = 1; i <= 8; i++) {
          const m = (currA + currB) / 2;
          const fa = f(currA);
          const fb = f(currB);
          const fm = f(m);
          const error = Math.abs(currB - currA) / 2;
          iterations.push({
            step: i,
            a: currA,
            b: currB,
            m: m,
            fa: fa,
            fb: fb,
            fm: fm,
            error: error,
            nextAction: Math.abs(fm) < 0.00001 ? 'Root reached convergence!' : (fa * fm < 0 ? 'Root in [a, m] ➔ b = m' : 'Root in [m, b] ➔ a = m')
          });

          if (Math.abs(fm) < 0.00001) break;
          if (fa * fm < 0) {
            currB = m;
          } else {
            currA = m;
          }
        }
      }
      computeIterations();

      const stepPillsHtml = iterations.map((it, idx) => `
        <button class="manim-step-pill ${idx === 0 ? 'active' : ''}" data-step="${idx}" type="button">
          <span>Iter ${it.step}</span>
        </button>
      `).join('');

      container.innerHTML = `
        <div class="manim-visual-card manim-card-pro">
          <div class="manim-card-topbar">
            <div class="manim-badge-group">
              <span class="manim-pill-tag tag-cyan">⚡ 3Blue1Brown Mathematical Studio</span>
              <span class="manim-pill-sub">Numerical Methods • Unit II</span>
            </div>
            <div class="manim-right-actions">
              <span class="manim-fps-badge">60 FPS HiDPI</span>
            </div>
          </div>

          <div class="manim-header-body">
            <h3 class="manim-pro-title">Bisection Method: Root Finding for f(x) = x² − 2 = 0</h3>
            <p class="manim-pro-sub">Watch the search interval [a, b] halve at each iteration and converge to √2 ≈ 1.41421356. Hover over the grid to inspect coordinates.</p>
          </div>

          <!-- INTEGRATED TELEMETRY STATUS RIBBON -->
          <div class="manim-telemetry-ribbon">
            <div class="ribbon-item">
              <span class="ribbon-lbl">Iteration</span>
              <span class="ribbon-val text-cyan" id="bis-hud-step">Step 1 of ${iterations.length}</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Estimated Root (m)</span>
              <span class="ribbon-val text-gold" id="bis-hud-m">1.500000</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Error Bound (ε)</span>
              <span class="ribbon-val" id="bis-hud-err">±0.500000</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Residual |f(m)|</span>
              <span class="ribbon-val text-green" id="bis-hud-res">0.250000</span>
            </div>
          </div>

          <!-- TIMELINE SCRUBBER -->
          <div class="manim-step-scrubber-bar">
            <span class="manim-scrubber-label">Timeline:</span>
            <div class="manim-scrubber-pills" id="bis-pills-wrap">
              ${stepPillsHtml}
            </div>
          </div>

          <!-- UNOBSTRUCTED FULL CANVAS VIEWPORT -->
          <div class="manim-canvas-viewport">
            <canvas class="manim-retina-canvas"></canvas>
          </div>

          <!-- CONTROLS & DECISION RULE -->
          <div class="manim-bottom-deck">
            <div class="manim-action-group">
              <button class="manim-btn manim-btn-glass" id="bis-btn-prev" type="button" title="Previous Iteration">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                <span>Prev</span>
              </button>
              <button class="manim-btn manim-btn-play" id="bis-btn-play" type="button">
                <span id="bis-play-icon">▶</span>
                <span id="bis-play-text">Auto Play</span>
              </button>
              <button class="manim-btn manim-btn-glass" id="bis-btn-next" type="button" title="Next Iteration">
                <span>Next</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <button class="manim-btn manim-btn-ghost" id="bis-btn-reset" type="button" title="Reset to Step 1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset</span>
              </button>
            </div>

            <div class="manim-formula-card">
              <span class="manim-formula-lead">Decision Rule:</span>
              <span class="manim-formula-math" id="bis-math-rule">f(a)·f(m) = (-1.000)·(+0.250) &lt; 0 ➔ Next is [1.000, 1.500]</span>
            </div>
          </div>

          <!-- DETAILED METRIC STRIP -->
          <div class="manim-telemetry-strip">
            <div class="telemetry-cell">
              <div class="telemetry-tag text-cyan">Bound a (Lower)</div>
              <div class="telemetry-num" id="tele-a">1.0000</div>
              <div class="telemetry-sub" id="tele-fa">f(a) = -1.0000</div>
            </div>
            <div class="telemetry-cell">
              <div class="telemetry-tag text-gold">Midpoint m (Root)</div>
              <div class="telemetry-num" id="tele-m">1.5000</div>
              <div class="telemetry-sub" id="tele-fm">f(m) = +0.2500</div>
            </div>
            <div class="telemetry-cell">
              <div class="telemetry-tag text-coral">Bound b (Upper)</div>
              <div class="telemetry-num" id="tele-b">2.0000</div>
              <div class="telemetry-sub" id="tele-fb">f(b) = +2.0000</div>
            </div>
            <div class="telemetry-cell">
              <div class="telemetry-tag text-green">Theoretical True Root</div>
              <div class="telemetry-num text-green">√2 ≈ 1.41421</div>
              <div class="telemetry-sub">Convergence: 1 bit/step</div>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('.manim-retina-canvas');
      const { ctx, width, height } = setupHiDPICanvas(canvas, 760, 360);

      const btnPrev = container.querySelector('#bis-btn-prev');
      const btnNext = container.querySelector('#bis-btn-next');
      const btnPlay = container.querySelector('#bis-btn-play');
      const btnReset = container.querySelector('#bis-btn-reset');
      const pillsWrap = container.querySelector('#bis-pills-wrap');

      // Coordinate System
      const xMin = 0.6, xMax = 2.4, yMin = -2.2, yMax = 4.2;
      function toX(x) { return ((x - xMin) / (xMax - xMin)) * width; }
      function toY(y) { return height - ((y - yMin) / (yMax - yMin)) * height; }
      function toMathX(px) { return xMin + (px / width) * (xMax - xMin); }

      let rippleRadius = 0;

      function renderFrame() {
        ctx.clearRect(0, 0, width, height);

        // Background
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.75);
        bgGrad.addColorStop(0, '#0e121c');
        bgGrad.addColorStop(1, '#06080e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Dot Grid
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let gx = Math.ceil(xMin * 4) / 4; gx <= xMax; gx += 0.25) {
          for (let gy = Math.ceil(yMin * 2) / 2; gy <= yMax; gy += 0.5) {
            const cx = toX(gx);
            const cy = toY(gy);
            ctx.beginPath();
            ctx.arc(cx, cy, 1, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Axes
        const y0 = toY(0);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(width, y0);
        ctx.stroke();

        // X Ticks & Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '500 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        for (let x = 0.8; x <= 2.2; x += 0.2) {
          const cx = toX(x);
          ctx.beginPath();
          ctx.moveTo(cx, y0 - 3);
          ctx.lineTo(cx, y0 + 3);
          ctx.stroke();
          ctx.fillText(x.toFixed(1), cx, y0 + 16);
        }

        // Curve f(x) = x^2 - 2
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.8;
        let started = false;
        for (let px = 0; px <= width; px += 2) {
          const mx = toMathX(px);
          const my = f(mx);
          const py = toY(my);
          if (!started) { ctx.moveTo(px, py); started = true; }
          else { ctx.lineTo(px, py); }
        }
        ctx.stroke();
        ctx.restore();

        const it = iterations[currentStep];
        if (!it) return;

        const ca = toX(it.a);
        const cb = toX(it.b);
        const cm = toX(it.m);

        // Interval Shading [a, b]
        const zoneGrad = ctx.createLinearGradient(ca, 0, cb, 0);
        zoneGrad.addColorStop(0, 'rgba(56, 189, 248, 0.14)');
        zoneGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.16)');
        zoneGrad.addColorStop(1, 'rgba(251, 113, 133, 0.14)');
        ctx.fillStyle = zoneGrad;
        ctx.fillRect(ca, 0, cb - ca, height);

        // Guide lines
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(ca, 0); ctx.lineTo(ca, height); ctx.stroke();

        ctx.strokeStyle = '#fb7185';
        ctx.beginPath(); ctx.moveTo(cb, 0); ctx.lineTo(cb, height); ctx.stroke();

        ctx.setLineDash([]);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.moveTo(cm, 0); ctx.lineTo(cm, height); ctx.stroke();
        ctx.shadowBlur = 0;

        // True Root Marker
        rippleRadius = (rippleRadius + 0.15) % 18;
        const cTrueRoot = toX(trueRoot);
        ctx.strokeStyle = `rgba(52, 211, 153, ${1 - rippleRadius / 18})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cTrueRoot, y0, 6 + rippleRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#34d399';
        ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.arc(cTrueRoot, y0, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillText('Target √2', cTrueRoot, y0 - 14);

        // Curve Points
        const ya = toY(it.fa);
        const yb = toY(it.fb);
        const ym = toY(it.fm);

        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(ca, ya, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(`a (${it.a.toFixed(3)})`, ca, ya > y0 ? ya + 18 : ya - 12);

        ctx.fillStyle = '#fb7185';
        ctx.beginPath(); ctx.arc(cb, yb, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillText(`b (${it.b.toFixed(3)})`, cb, yb > y0 ? yb + 18 : yb - 12);

        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(cm, ym, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath(); ctx.arc(cm, ym, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(`m (${it.m.toFixed(4)})`, cm, ym > y0 ? ym + 22 : ym - 14);

        // Hover Probe
        if (hoveredX !== null) {
          const hmx = toMathX(hoveredX);
          const hmy = f(hmx);
          const hpy = toY(hmy);

          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(hoveredX, 0); ctx.lineTo(hoveredX, height);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(hoveredX, hpy, 4, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath();
          ctx.roundRect(hoveredX - 55, hpy - 38, 110, 26, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '10px JetBrains Mono, monospace';
          ctx.fillText(`x:${hmx.toFixed(3)} y:${hmy.toFixed(3)}`, hoveredX, hpy - 21);
        }

        // Update Ribbon Telemetry
        container.querySelector('#bis-hud-step').textContent = `Step ${it.step} of ${iterations.length}`;
        container.querySelector('#bis-hud-m').textContent = it.m.toFixed(6);
        container.querySelector('#bis-hud-err').textContent = `±${it.error.toFixed(6)}`;
        container.querySelector('#bis-hud-res').textContent = `${Math.abs(it.fm).toFixed(6)}`;

        container.querySelector('#tele-a').textContent = it.a.toFixed(4);
        container.querySelector('#tele-fa').textContent = `f(a) = ${it.fa >= 0 ? '+' : ''}${it.fa.toFixed(4)}`;
        container.querySelector('#tele-m').textContent = it.m.toFixed(4);
        container.querySelector('#tele-fm').textContent = `f(m) = ${it.fm >= 0 ? '+' : ''}${it.fm.toFixed(4)}`;
        container.querySelector('#tele-b').textContent = it.b.toFixed(4);
        container.querySelector('#tele-fb').textContent = `f(b) = ${it.fb >= 0 ? '+' : ''}${it.fb.toFixed(4)}`;

        container.querySelector('#bis-math-rule').textContent = `f(a)·f(m) = (${it.fa >= 0 ? '+' : ''}${it.fa.toFixed(3)})·(${it.fm >= 0 ? '+' : ''}${it.fm.toFixed(3)}) ${it.fa * it.fm < 0 ? '< 0 ➔ Next is [a, m]' : '> 0 ➔ Next is [m, b]'}`;

        container.querySelectorAll('.manim-step-pill').forEach((pill, idx) => {
          if (idx === currentStep) pill.classList.add('active');
          else pill.classList.remove('active');
        });
      }

      function loop() {
        if (!canvas.isConnected || !container.isConnected) return;
        renderFrame();
        requestAnimationFrame(loop);
      }
      requestAnimationFrame(loop);

      function setStep(idx) {
        currentStep = Math.max(0, Math.min(iterations.length - 1, idx));
      }

      function startAuto() {
        isPlaying = true;
        container.querySelector('#bis-play-icon').textContent = '⏸';
        container.querySelector('#bis-play-text').textContent = 'Pause';
        btnPlay.classList.add('playing');
        playTimer = setInterval(() => {
          if (currentStep < iterations.length - 1) {
            setStep(currentStep + 1);
          } else {
            setStep(0);
          }
        }, 1200);
      }

      function stopAuto() {
        isPlaying = false;
        if (playTimer) clearInterval(playTimer);
        container.querySelector('#bis-play-icon').textContent = '▶';
        container.querySelector('#bis-play-text').textContent = 'Auto Play';
        btnPlay.classList.remove('playing');
      }

      btnNext.addEventListener('click', () => { stopAuto(); setStep(currentStep + 1); });
      btnPrev.addEventListener('click', () => { stopAuto(); setStep(currentStep - 1); });
      btnReset.addEventListener('click', () => { stopAuto(); setStep(0); });
      btnPlay.addEventListener('click', () => {
        if (isPlaying) stopAuto();
        else startAuto();
      });

      pillsWrap.addEventListener('click', (e) => {
        const pill = e.target.closest('.manim-step-pill');
        if (pill) {
          stopAuto();
          const s = parseInt(pill.getAttribute('data-step'), 10);
          setStep(s);
        }
      });

      canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        hoveredX = (e.clientX - rect.left) * (width / rect.width);
      });
      canvas.addEventListener('mouseleave', () => { hoveredX = null; });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 2. DATA STRUCTURES: BINARY SEARCH TREE & TRAVERSALS                        */
  /* -------------------------------------------------------------------------- */
  VisualEngines['ds-bst'] = {
    title: 'Binary Search Tree & Traversal Engine',
    init: function (container) {
      let initialKeys = [50, 30, 70, 20, 40, 60, 80];

      class BSTNode {
        constructor(val) {
          this.val = val;
          this.left = null;
          this.right = null;
          this.x = 0;
          this.y = 0;
          this.radius = 20;
          this.visited = false;
          this.active = false;
        }
      }

      let root = null;
      let traversalSeq = [];
      let currentTravIdx = -1;
      let travTimer = null;

      function insert(node, val) {
        if (!node) return new BSTNode(val);
        if (val < node.val) node.left = insert(node.left, val);
        else if (val > node.val) node.right = insert(node.right, val);
        return node;
      }

      function buildTree(keys) {
        root = null;
        keys.forEach(k => { root = insert(root, k); });
        computeLayout();
      }

      function computeLayout() {
        function layout(node, depth, minX, maxX) {
          if (!node) return;
          node.x = (minX + maxX) / 2;
          node.y = 50 + depth * 75;
          layout(node.left, depth + 1, minX, node.x);
          layout(node.right, depth + 1, node.x, maxX);
        }
        layout(root, 0, 40, 720);
      }

      function getInOrder(node, arr) {
        if (!node) return;
        getInOrder(node.left, arr);
        arr.push(node);
        getInOrder(node.right, arr);
      }

      function getPreOrder(node, arr) {
        if (!node) return;
        arr.push(node);
        getPreOrder(node.left, arr);
        getPreOrder(node.right, arr);
      }

      function getPostOrder(node, arr) {
        if (!node) return;
        getPostOrder(node.left, arr);
        getPostOrder(node.right, arr);
        arr.push(node);
      }

      container.innerHTML = `
        <div class="manim-visual-card manim-card-pro">
          <div class="manim-card-topbar">
            <div class="manim-badge-group">
              <span class="manim-pill-tag tag-purple">🌲 Laser Tree & Stack Execution</span>
              <span class="manim-pill-sub">Data Structures • Unit III</span>
            </div>
            <span class="manim-fps-badge">HiDPI Vector</span>
          </div>

          <div class="manim-header-body">
            <h3 class="manim-pro-title">Binary Search Tree: In-Order, Pre-Order & Post-Order Traversals</h3>
            <p class="manim-pro-sub">Click any traversal algorithm to watch recursive laser pointers trace across branches in O(N) linear time.</p>
          </div>

          <!-- INTEGRATED TELEMETRY STATUS RIBBON -->
          <div class="manim-telemetry-ribbon">
            <div class="ribbon-item">
              <span class="ribbon-lbl">Traversal Mode</span>
              <span class="ribbon-val text-gold" id="bst-hud-mode">Ready (Idle)</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Active Node</span>
              <span class="ribbon-val text-cyan" id="bst-hud-active">Root (50)</span>
            </div>
            <div class="ribbon-item" style="flex: 2;">
              <span class="ribbon-lbl">Output Stream</span>
              <span class="ribbon-val text-green" id="bst-hud-stream">[ ]</span>
            </div>
          </div>

          <!-- UNOBSTRUCTED FULL CANVAS VIEWPORT -->
          <div class="manim-canvas-viewport">
            <canvas class="manim-retina-canvas"></canvas>
          </div>

          <div class="manim-bottom-deck">
            <div class="manim-action-group">
              <button class="manim-btn manim-btn-play" id="bst-btn-inorder" type="button">
                <span>▶ In-Order (Sorted)</span>
              </button>
              <button class="manim-btn manim-btn-glass" id="bst-btn-preorder" type="button">
                <span>Pre-Order</span>
              </button>
              <button class="manim-btn manim-btn-glass" id="bst-btn-postorder" type="button">
                <span>Post-Order</span>
              </button>
              <button class="manim-btn manim-btn-ghost" id="bst-btn-reset" type="button" title="Reset Tree">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset</span>
              </button>
            </div>

            <div style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="number" id="bst-insert-val" class="manim-pro-input" placeholder="Node val" />
              <button class="manim-btn manim-btn-glass" id="bst-btn-insert" type="button">+ Insert</button>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('.manim-retina-canvas');
      const { ctx, width, height } = setupHiDPICanvas(canvas, 760, 360);

      function clearMarks(node) {
        if (!node) return;
        node.active = false;
        node.visited = false;
        clearMarks(node.left);
        clearMarks(node.right);
      }

      function drawEdgeBézier(from, to, isActive) {
        ctx.beginPath();
        ctx.strokeStyle = isActive ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isActive ? 3 : 1.8;
        if (isActive) {
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 12;
        }

        const midY = (from.y + to.y) / 2;
        ctx.moveTo(from.x, from.y + from.radius);
        ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y - to.radius);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      function render() {
        ctx.clearRect(0, 0, width, height);

        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.75);
        bgGrad.addColorStop(0, '#100f20');
        bgGrad.addColorStop(1, '#07060e');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        function traverseEdges(node) {
          if (!node) return;
          if (node.left) {
            drawEdgeBézier(node, node.left, node.left.active || (node.active && node.left.visited));
            traverseEdges(node.left);
          }
          if (node.right) {
            drawEdgeBézier(node, node.right, node.right.active || (node.active && node.right.visited));
            traverseEdges(node.right);
          }
        }
        traverseEdges(root);

        function traverseNodes(node) {
          if (!node) return;

          ctx.save();
          if (node.active) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 24;
            const grad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, node.radius);
            grad.addColorStop(0, '#fef08a');
            grad.addColorStop(1, '#eab308');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(node.x, node.y, node.radius + 2, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (node.visited) {
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 10;
            const grad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, node.radius);
            grad.addColorStop(0, '#6ee7b7');
            grad.addColorStop(1, '#059669');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            const grad = ctx.createRadialGradient(node.x - 4, node.y - 4, 3, node.x, node.y, node.radius);
            grad.addColorStop(0, '#334155');
            grad.addColorStop(1, '#1e293b');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2); ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.restore();

          ctx.fillStyle = node.active ? '#000000' : '#ffffff';
          ctx.font = 'bold 12px JetBrains Mono, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(node.val, node.x, node.y);

          traverseNodes(node.left);
          traverseNodes(node.right);
        }
        traverseNodes(root);

        if (!canvas.isConnected || !container.isConnected) return;
        requestAnimationFrame(render);
      }

      buildTree(initialKeys);
      requestAnimationFrame(render);

      function runTraversal(type) {
        if (travTimer) clearInterval(travTimer);
        clearMarks(root);
        traversalSeq = [];
        if (type === 'inorder') getInOrder(root, traversalSeq);
        else if (type === 'preorder') getPreOrder(root, traversalSeq);
        else if (type === 'postorder') getPostOrder(root, traversalSeq);

        currentTravIdx = 0;
        const visitedList = [];
        container.querySelector('#bst-hud-mode').textContent = `${type.toUpperCase()} Running`;

        travTimer = setInterval(() => {
          if (currentTravIdx >= traversalSeq.length) {
            clearInterval(travTimer);
            container.querySelector('#bst-hud-mode').textContent = `✓ ${type.toUpperCase()} Complete`;
            if (traversalSeq.length) traversalSeq[traversalSeq.length - 1].active = false;
            return;
          }

          if (currentTravIdx > 0) {
            traversalSeq[currentTravIdx - 1].active = false;
            traversalSeq[currentTravIdx - 1].visited = true;
          }

          const curr = traversalSeq[currentTravIdx];
          curr.active = true;
          visitedList.push(curr.val);

          container.querySelector('#bst-hud-active').textContent = `Node (${curr.val})`;
          container.querySelector('#bst-hud-stream').textContent = `[ ${visitedList.join(' → ')} ]`;

          currentTravIdx++;
        }, 750);
      }

      container.querySelector('#bst-btn-inorder').addEventListener('click', () => runTraversal('inorder'));
      container.querySelector('#bst-btn-preorder').addEventListener('click', () => runTraversal('preorder'));
      container.querySelector('#bst-btn-postorder').addEventListener('click', () => runTraversal('postorder'));
      container.querySelector('#bst-btn-reset').addEventListener('click', () => {
        if (travTimer) clearInterval(travTimer);
        buildTree(initialKeys);
        container.querySelector('#bst-hud-mode').textContent = 'Tree Reset';
        container.querySelector('#bst-hud-active').textContent = 'Root (50)';
        container.querySelector('#bst-hud-stream').textContent = '[ ]';
      });

      container.querySelector('#bst-btn-insert').addEventListener('click', () => {
        const inp = container.querySelector('#bst-insert-val');
        const v = parseInt(inp.value, 10);
        if (!isNaN(v)) {
          root = insert(root, v);
          computeLayout();
          clearMarks(root);
          inp.value = '';
          container.querySelector('#bst-hud-mode').textContent = `Inserted ${v}`;
        }
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 3. MACHINE LEARNING: GRADIENT DESCENT OPTIMIZATION                         */
  /* -------------------------------------------------------------------------- */
  VisualEngines['ml-gradient-descent'] = {
    title: 'Gradient Descent Optimization Simulator',
    init: function (container) {
      const loss = w => 0.45 * Math.pow(w - 2, 2) + 0.35 * Math.sin(2.6 * (w - 2)) + 0.6;
      const grad = w => 0.9 * (w - 2) + 0.91 * Math.cos(2.6 * (w - 2));

      let currentW = 4.3;
      let lr = 0.16;
      let history = [{ w: currentW, loss: loss(currentW), step: 0 }];
      let isRunning = false;
      let runTimer = null;

      container.innerHTML = `
        <div class="manim-visual-card manim-card-pro">
          <div class="manim-card-topbar">
            <div class="manim-badge-group">
              <span class="manim-pill-tag tag-coral">📉 Loss Valley & Gradient Flow</span>
              <span class="manim-pill-sub">Machine Learning • Unit I</span>
            </div>
            <span class="manim-fps-badge">Adaptive Rate</span>
          </div>

          <div class="manim-header-body">
            <h3 class="manim-pro-title">Gradient Descent: Cost Function Optimization & Loss Landscape</h3>
            <p class="manim-pro-sub">Adjust the learning rate (η) to watch parameter weights update along the negative gradient vector w := w − η∇L(w).</p>
          </div>

          <!-- INTEGRATED TELEMETRY STATUS RIBBON -->
          <div class="manim-telemetry-ribbon">
            <div class="ribbon-item">
              <span class="ribbon-lbl">Iteration</span>
              <span class="ribbon-val text-gold" id="gd-hud-step">Step 0</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Parameter Weight (w)</span>
              <span class="ribbon-val text-cyan" id="gd-hud-w">4.3000</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Cost Loss L(w)</span>
              <span class="ribbon-val" id="gd-hud-loss">3.2451</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Gradient Slope ∇L(w)</span>
              <span class="ribbon-val text-coral" id="gd-hud-grad">+2.512</span>
            </div>
          </div>

          <!-- UNOBSTRUCTED FULL CANVAS VIEWPORT -->
          <div class="manim-canvas-viewport">
            <canvas class="manim-retina-canvas"></canvas>
          </div>

          <div class="manim-bottom-deck">
            <div class="manim-action-group">
              <button class="manim-btn manim-btn-play" id="gd-btn-step" type="button">
                <span>Step Gradient ∇</span>
              </button>
              <button class="manim-btn manim-btn-glass" id="gd-btn-auto" type="button">
                <span id="gd-auto-icon">▶</span>
                <span id="gd-auto-text">Auto Run</span>
              </button>
              <button class="manim-btn manim-btn-ghost" id="gd-btn-reset" type="button" title="Reset Parameter">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset</span>
              </button>
            </div>

            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">Learning Rate (η):</span>
              <input type="range" id="gd-lr-range" min="0.04" max="0.75" step="0.02" value="0.16" style="width: 120px; accent-color: var(--color-coral);" />
              <span id="gd-lr-num" style="font-family: var(--font-mono); font-size: 0.9rem; color: #fbbf24; font-weight: 600;">0.16</span>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('.manim-retina-canvas');
      const { ctx, width, height } = setupHiDPICanvas(canvas, 760, 360);

      const wMin = -0.5, wMax = 4.8, lMin = 0, lMax = 5.2;
      function toX(w) { return ((w - wMin) / (wMax - wMin)) * width; }
      function toY(l) { return height - ((l - lMin) / (lMax - lMin)) * height; }

      function render() {
        ctx.clearRect(0, 0, width, height);

        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.75);
        bgGrad.addColorStop(0, '#150f22');
        bgGrad.addColorStop(1, '#09060f');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.beginPath();
        for (let px = 0; px <= width; px += 2) {
          const w = wMin + (px / width) * (wMax - wMin);
          const py = toY(loss(w));
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const basinGrad = ctx.createLinearGradient(0, 0, 0, height);
        basinGrad.addColorStop(0, 'rgba(192, 132, 252, 0.2)');
        basinGrad.addColorStop(1, 'rgba(192, 132, 252, 0.01)');
        ctx.fillStyle = basinGrad;
        ctx.fill();

        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 16;
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let px = 0; px <= width; px += 2) {
          const w = wMin + (px / width) * (wMax - wMin);
          const py = toY(loss(w));
          if (px === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();

        if (history.length > 1) {
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(toX(history[0].w), toY(history[0].loss));
          for (let i = 1; i < history.length; i++) {
            ctx.lineTo(toX(history[i].w), toY(history[i].loss));
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const currLoss = loss(currentW);
        const currGrad = grad(currentW);
        const bx = toX(currentW);
        const by = toY(currLoss);

        const angle = Math.atan(currGrad);
        const tanLen = 35;
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - Math.cos(angle) * tanLen, by + Math.sin(angle) * tanLen);
        ctx.lineTo(bx + Math.cos(angle) * tanLen, by - Math.sin(angle) * tanLen);
        ctx.stroke();

        ctx.save();
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        container.querySelector('#gd-hud-step').textContent = `Step ${history.length - 1}`;
        container.querySelector('#gd-hud-w').textContent = currentW.toFixed(4);
        container.querySelector('#gd-hud-loss').textContent = currLoss.toFixed(4);
        container.querySelector('#gd-hud-grad').textContent = `${currGrad >= 0 ? '+' : ''}${currGrad.toFixed(3)}`;

        if (!canvas.isConnected || !container.isConnected) return;
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

      function doStep() {
        const g = grad(currentW);
        const delta = -lr * g;
        currentW += delta;
        history.push({ w: currentW, loss: loss(currentW), step: history.length });
      }

      container.querySelector('#gd-btn-step').addEventListener('click', doStep);
      container.querySelector('#gd-btn-auto').addEventListener('click', () => {
        if (isRunning) {
          isRunning = false;
          clearInterval(runTimer);
          container.querySelector('#gd-auto-text').textContent = 'Auto Run';
          container.querySelector('#gd-auto-icon').textContent = '▶';
        } else {
          isRunning = true;
          container.querySelector('#gd-auto-text').textContent = 'Pause';
          container.querySelector('#gd-auto-icon').textContent = '⏸';
          runTimer = setInterval(() => {
            if (Math.abs(grad(currentW)) > 0.001 && history.length < 35) {
              doStep();
            } else {
              isRunning = false;
              clearInterval(runTimer);
              container.querySelector('#gd-auto-text').textContent = 'Auto Run';
              container.querySelector('#gd-auto-icon').textContent = '▶';
            }
          }, 500);
        }
      });
      container.querySelector('#gd-btn-reset').addEventListener('click', () => {
        if (runTimer) clearInterval(runTimer);
        currentW = 4.3;
        history = [{ w: currentW, loss: loss(currentW), step: 0 }];
      });
      container.querySelector('#gd-lr-range').addEventListener('input', (e) => {
        lr = parseFloat(e.target.value);
        container.querySelector('#gd-lr-num').textContent = lr.toFixed(2);
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* 4. COMPUTER ARCHITECTURE: VON NEUMANN INSTRUCTION CYCLE                    */
  /* -------------------------------------------------------------------------- */
  VisualEngines['arch-cpu-pipeline'] = {
    title: 'Von Neumann Hardware Bus Simulation',
    init: function (container) {
      const stages = [
        {
          phase: 'T0: Address Fetch',
          rtl: 'MAR ← PC (0x104)',
          desc: 'Program Counter places 0x104 onto 16-bit Address Bus to Memory Address Register.',
          activeBus: 'addr',
          from: 'pc',
          to: 'mar'
        },
        {
          phase: 'T1: Memory Read & PC Increment',
          rtl: 'MDR ← Memory[MAR], PC ← PC + 1',
          desc: 'RAM reads 16-bit opcode into Memory Data Register; Program counter advances to 0x105.',
          activeBus: 'data',
          from: 'ram',
          to: 'mdr'
        },
        {
          phase: 'T2: Instruction Register Load',
          rtl: 'IR ← MDR',
          desc: 'Instruction word transferred from MDR to Instruction Register for opcode decoding.',
          activeBus: 'data',
          from: 'mdr',
          to: 'ir'
        },
        {
          phase: 'T3: Control Unit Decode',
          rtl: 'Decode Opcode (ADD R1, R2)',
          desc: 'Control Unit decodes 16-bit word and activates ALU control lines.',
          activeBus: 'ctrl',
          from: 'ir',
          to: 'cu'
        },
        {
          phase: 'T4: ALU Execute & Writeback',
          rtl: 'ALU ← R1 + R2, AC ← Result',
          desc: '16-bit ALU executes arithmetic addition and writes final sum into Accumulator.',
          activeBus: 'alu',
          from: 'alu',
          to: 'ac'
        }
      ];

      let currentStage = 0;
      let packetProgress = 0;

      container.innerHTML = `
        <div class="manim-visual-card manim-card-pro">
          <div class="manim-card-topbar">
            <div class="manim-badge-group">
              <span class="manim-pill-tag tag-cyan">💻 16-Bit Common System Bus</span>
              <span class="manim-pill-sub">Computer Architecture • Unit II</span>
            </div>
            <span class="manim-fps-badge">Synchronous Clock</span>
          </div>

          <div class="manim-header-body">
            <h3 class="manim-pro-title">Von Neumann Instruction Cycle: Fetch → Decode → Execute</h3>
            <p class="manim-pro-sub">Step through clock micro-operations and watch 16-bit register transfer pulses navigate the common system bus.</p>
          </div>

          <!-- INTEGRATED TELEMETRY STATUS RIBBON -->
          <div class="manim-telemetry-ribbon">
            <div class="ribbon-item">
              <span class="ribbon-lbl">Clock Phase</span>
              <span class="ribbon-val text-gold" id="cpu-hud-phase">T0: Address Fetch</span>
            </div>
            <div class="ribbon-item" style="flex: 1.5;">
              <span class="ribbon-lbl">RTL Transfer</span>
              <span class="ribbon-val text-cyan" id="cpu-hud-rtl">MAR ← PC (0x104)</span>
            </div>
            <div class="ribbon-item">
              <span class="ribbon-lbl">Active Bus</span>
              <span class="ribbon-val text-green" id="cpu-hud-bus">Address Bus (16-bit)</span>
            </div>
          </div>

          <!-- UNOBSTRUCTED FULL CANVAS VIEWPORT -->
          <div class="manim-canvas-viewport">
            <canvas class="manim-retina-canvas"></canvas>
          </div>

          <div class="manim-bottom-deck">
            <div class="manim-action-group">
              <button class="manim-btn manim-btn-glass" id="cpu-btn-prev" type="button" title="Previous Phase">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
                <span>Prev</span>
              </button>
              <button class="manim-btn manim-btn-play" id="cpu-btn-cycle" type="button">
                <span>⚡ Cycle Clock</span>
              </button>
              <button class="manim-btn manim-btn-glass" id="cpu-btn-next" type="button" title="Next Phase">
                <span>Next</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <button class="manim-btn manim-btn-ghost" id="cpu-btn-reset" type="button" title="Reset Clock">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                <span>Reset</span>
              </button>
            </div>

            <div class="manim-formula-card" style="flex: 1; max-width: 440px;">
              <span class="manim-formula-lead">Hardware Action:</span>
              <span class="manim-formula-math" id="cpu-hud-desc">Program Counter places 0x104 onto 16-bit Address Bus.</span>
            </div>
          </div>
        </div>
      `;

      const canvas = container.querySelector('.manim-retina-canvas');
      const { ctx, width, height } = setupHiDPICanvas(canvas, 760, 310);

      // Symmetrical 4x2 Chip Grid with Central Bus
      const chips = {
        pc:  { x: 45,  y: 25,  w: 130, h: 48, label: 'PC', sub: 'Program Counter (0x104)', row: 'top' },
        mar: { x: 220, y: 25,  w: 130, h: 48, label: 'MAR', sub: 'Memory Addr Reg', row: 'top' },
        ram: { x: 395, y: 25,  w: 150, h: 48, label: 'RAM / Cache', sub: 'Main Memory', row: 'top' },
        mdr: { x: 585, y: 25,  w: 130, h: 48, label: 'MDR', sub: 'Data Buffer (MBR)', row: 'top' },

        ir:  { x: 45,  y: 235, w: 130, h: 48, label: 'IR', sub: 'Instruction Register', row: 'bottom' },
        cu:  { x: 220, y: 235, w: 130, h: 48, label: 'Control Unit', sub: 'Micro-Sequencer', row: 'bottom' },
        alu: { x: 395, y: 235, w: 150, h: 48, label: '16-bit ALU', sub: 'Arithmetic & Logic', row: 'bottom' },
        ac:  { x: 585, y: 235, w: 130, h: 48, label: 'Accumulator', sub: 'AC Working Reg', row: 'bottom' }
      };

      const busY = 145;

      function render() {
        ctx.clearRect(0, 0, width, height);

        // Deep Space Background
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.75);
        bgGrad.addColorStop(0, '#0d1322');
        bgGrad.addColorStop(1, '#050810');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const st = stages[currentStage];
        const busColor = st.activeBus === 'addr' ? '#38bdf8' : (st.activeBus === 'data' ? '#fbbf24' : (st.activeBus === 'ctrl' ? '#c084fc' : '#34d399'));

        // 1. Draw Feeder Lines connecting each chip to the Central Bus
        Object.keys(chips).forEach(k => {
          const c = chips[k];
          const cx = c.x + c.w / 2;
          const isConnected = (k === st.from || k === st.to);

          ctx.beginPath();
          ctx.strokeStyle = isConnected ? busColor : 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = isConnected ? 2.5 : 1.2;

          if (c.row === 'top') {
            ctx.moveTo(cx, c.y + c.h);
            ctx.lineTo(cx, busY);
          } else {
            ctx.moveTo(cx, c.y);
            ctx.lineTo(cx, busY);
          }
          ctx.stroke();

          // Bus tap connection dot
          ctx.fillStyle = isConnected ? busColor : 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(cx, busY, isConnected ? 4.5 : 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // 2. Central 16-Bit Common System Bus Highway
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(35, busY);
        ctx.lineTo(725, busY);
        ctx.stroke();

        // Active Glowing Bus Line
        ctx.save();
        ctx.strokeStyle = busColor;
        ctx.shadowColor = busColor;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(40, busY);
        ctx.lineTo(720, busY);
        ctx.stroke();
        ctx.restore();

        // Bus Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`16-BIT COMMON SYSTEM BUS  [ ${st.activeBus.toUpperCase()} BUS ACTIVE ]`, width / 2, busY - 10);

        // 3. Animated Data Packet Pulse
        packetProgress = (packetProgress + 0.02) % 1;
        const fromChip = chips[st.from];
        const toChip = chips[st.to];
        if (fromChip && toChip) {
          const fromX = fromChip.x + fromChip.w / 2;
          const toX = toChip.x + toChip.w / 2;
          const packetX = fromX + (toX - fromX) * packetProgress;

          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = busColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(packetX, busY, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = busColor;
          ctx.beginPath();
          ctx.arc(packetX, busY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 4. Render Register & Chip Blocks
        Object.keys(chips).forEach(k => {
          const c = chips[k];
          const isSource = (k === st.from);
          const isDest = (k === st.to);
          const isActive = isSource || isDest;

          ctx.save();
          if (isSource) {
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.2;
          } else if (isDest) {
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(251, 191, 36, 0.18)';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.2;
          } else {
            ctx.fillStyle = '#101524';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 1.2;
          }

          ctx.beginPath();
          ctx.roundRect(c.x, c.y, c.w, c.h, 8);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Text Labels
          ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(c.label, c.x + c.w / 2, c.y + 20);

          ctx.fillStyle = isActive ? (isSource ? '#38bdf8' : '#fbbf24') : 'rgba(255, 255, 255, 0.45)';
          ctx.font = '9.5px JetBrains Mono, monospace';
          ctx.fillText(c.sub, c.x + c.w / 2, c.y + 36);
        });

        // Update Ribbon Telemetry
        container.querySelector('#cpu-hud-phase').textContent = st.phase;
        container.querySelector('#cpu-hud-rtl').textContent = st.rtl;
        container.querySelector('#cpu-hud-bus').textContent = `${st.activeBus.toUpperCase()} Bus (16-bit)`;
        container.querySelector('#cpu-hud-desc').textContent = st.desc;

        if (!canvas.isConnected || !container.isConnected) return;
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

      container.querySelector('#cpu-btn-next').addEventListener('click', () => {
        currentStage = (currentStage + 1) % stages.length;
        packetProgress = 0;
      });
      container.querySelector('#cpu-btn-prev').addEventListener('click', () => {
        currentStage = (currentStage - 1 + stages.length) % stages.length;
        packetProgress = 0;
      });
      container.querySelector('#cpu-btn-reset').addEventListener('click', () => {
        currentStage = 0;
        packetProgress = 0;
      });
      container.querySelector('#cpu-btn-cycle').addEventListener('click', () => {
        currentStage = (currentStage + 1) % stages.length;
        packetProgress = 0;
      });
    }
  };

  /* -------------------------------------------------------------------------- */
  /* GLOBAL MOUNT & SCANNER HELPER                                              */
  /* -------------------------------------------------------------------------- */
  window.ManimVisuals = {
    engines: VisualEngines,
    
    mount: function (elementOrId, type) {
      const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
      if (!el) return;
      const engine = VisualEngines[type];
      if (engine && typeof engine.init === 'function') {
        engine.init(el);
      }
    },

    mountAll: function (rootElement) {
      const root = rootElement || document;
      const visualContainers = root.querySelectorAll('[data-manim-visual]');
      visualContainers.forEach(container => {
        const type = container.getAttribute('data-manim-visual');
        if (type && !container.hasAttribute('data-mounted')) {
          container.setAttribute('data-mounted', 'true');
          this.mount(container, type);
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.ManimVisuals.mountAll());
  } else {
    window.ManimVisuals.mountAll();
  }

})();
