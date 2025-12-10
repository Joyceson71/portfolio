/* main.js - Optimized particle engine (replace your previous main.js) */
document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".center-section");
  const navLinks = nav.querySelectorAll("a");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectCards = document.querySelectorAll(".projects-card");
  const preloader = document.getElementById("preloader");
  const revealEls = document.querySelectorAll(".reveal");

  /* ============ PRELOADER ============ */
  window.addEventListener("load", () => setTimeout(() => preloader.classList.add("hidden"), 400));

  /* ============ THEME TOGGLE ============ */
  const savedTheme = localStorage.getItem("jd-theme");
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
  themeToggle?.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    const isLight = body.classList.contains("light-theme");
    themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem("jd-theme", isLight ? "light" : "dark");
    particlesSystem?.updateColors();
    starsSystem?.updateColors?.();
  });

  /* ============ MOBILE MENU ============ */
  menuToggle?.addEventListener("click", () => nav.classList.toggle("open"));
  navLinks.forEach((link) => link.addEventListener("click", () => nav.classList.remove("open")));

  /* ============ SCROLL REVEAL + SKILL BARS ============ */
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("skill-box")) {
          const bars = entry.target.querySelectorAll(".skill-progress-fill");
          bars.forEach((bar) => {
            const value = bar.getAttribute("data-skill") || 0;
            bar.style.width = value + "%";
          });
        }
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.25 });
  revealEls.forEach((el) => observer.observe(el));

  /* ============ PROJECT FILTERING ============ */
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      projectCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(" ");
        card.style.display = (filter === "all" || categories.includes(filter)) ? "flex" : "none";
      });
    });
  });

  /* ============ PARTICLES + STARS SYSTEM (Optimized) ============ */
  const canvas = document.getElementById("particles");
  const starsCanvas = document.getElementById("stars");

  let particlesSystem = null;
  let starsSystem = null;

  // feature-detect and guard
  if (canvas?.getContext && starsCanvas?.getContext) {
    /* ---------- STARS (light and cheap) ---------- */
    starsSystem = (function initStars() {
      const ctx = starsCanvas.getContext("2d");
      let w = 0, h = 0;
      let stars = [];
      const STAR_COUNT_BASE = 80;

      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        w = starsCanvas.width = Math.floor(window.innerWidth * dpr);
        h = starsCanvas.height = Math.floor(window.innerHeight * dpr);
        starsCanvas.style.width = window.innerWidth + "px";
        starsCanvas.style.height = window.innerHeight + "px";
        // regenerate stars (scale with viewport area)
        const areaFactor = Math.max(0.5, Math.min(2.4, (window.innerWidth * window.innerHeight) / (1366 * 768)));
        const count = Math.floor(STAR_COUNT_BASE * areaFactor);
        stars = new Array(count).fill(0).map(() => ({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.2 + 0.3) * dpr,
          alpha: Math.random() * 0.7 + 0.1,
          twinkle: Math.random() * 0.02 + 0.002
        }));
      }

      function updateColors() { /* no color updates needed */ }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < stars.length; i++) {
          const s = stars[i];
          s.alpha += (Math.random() - 0.5) * s.twinkle;
          if (s.alpha < 0.05) s.alpha = 0.05;
          if (s.alpha > 1) s.alpha = 1;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
        requestAnimationFrame(draw);
      }

      window.addEventListener("resize", debounce(resize, 150));
      resize(); draw();
      return { updateColors };
    })();

    /* ---------- PARTICLES (optimized with spatial hashing) ---------- */
    particlesSystem = (function initParticles() {
      const ctx = canvas.getContext("2d");
      let w = 0, h = 0;
      let rafId = 0;
      let paused = false;
      let lowPerf = false;

      // defaults (connected to UI)
      let COUNT = Math.max(40, Math.round((window.innerWidth / 1366) * 90)); // scale a bit with width
      let MAX_DISTANCE = 130;
      let BASE_SPEED = 0.8;

      // performance caps
      const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
      const SAFE_MAX = 220; // hard cap
      COUNT = Math.min(COUNT, SAFE_MAX);

      // spatial hash parameters
      let gridSize = MAX_DISTANCE; // cell size
      let grid = new Map();

      // particles pool
      let particles = [];

      // mouse (throttled)
      const mouse = { x: null, y: null, radius: 180 };
      let _mouseX = null, _mouseY = null, mouseDirty = false;
      window.addEventListener("mousemove", (e) => { _mouseX = e.clientX; _mouseY = e.clientY; mouseDirty = true; });
      window.addEventListener("mouseleave", () => { _mouseX = null; _mouseY = null; mouseDirty = true; });

      // pause when tab hidden
      document.addEventListener("visibilitychange", () => {
        paused = document.hidden;
      });

      function resize() {
        // limit canvas resolution by DPR to avoid huge pixels
        const capDpr = Math.min(window.devicePixelRatio || 1, 1.5);
        w = canvas.width = Math.floor(window.innerWidth * capDpr);
        h = canvas.height = Math.floor(window.innerHeight * capDpr);
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        // reinit grid cell size
        gridSize = Math.max(60, Math.min(300, MAX_DISTANCE));
        buildGrid(); // rebuild grid map placeholder
        regenerateParticles();
      }
      window.addEventListener("resize", debounce(resize, 150));
      resize();

      function getParticleColor() {
        return body.classList.contains("light-theme") ? "rgba(14,165,233,0.9)" : "rgba(34,211,238,0.95)";
      }
      function getLineColor(opacity) {
        return body.classList.contains("light-theme") ? `rgba(14,165,233,${opacity})` : `rgba(34,211,238,${opacity})`;
      }

      class Particle {
        constructor() { this.reset(true); }
        reset(initial = false) {
          this.x = Math.random() * w;
          this.y = Math.random() * h;
          this.z = Math.random(); // pseudo-depth
          this.size = (Math.random() * 2.5 + 0.6) * (DPR);
          this.speedX = (Math.random() - 0.5) * BASE_SPEED * (0.6 + this.z);
          this.speedY = (Math.random() - 0.5) * BASE_SPEED * (0.6 + this.z);
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          // wrap around to keep count stable and smooth (rather than bounce)
          if (this.x < -20) this.x = w + 20;
          if (this.x > w + 20) this.x = -20;
          if (this.y < -20) this.y = h + 20;
          if (this.y > h + 20) this.y = -20;

          // mouse repulsion (use throttled mouse)
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist < mouse.radius) {
              const force = (mouse.radius - dist) / mouse.radius;
              this.x -= (dx / dist) * force * 3 * (1 + this.z);
              this.y -= (dy / dist) * force * 3 * (1 + this.z);
            }
          }
        }
        draw(useShadow) {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * (1 + this.z * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = getParticleColor();
          if (useShadow) {
            ctx.shadowColor = getParticleColor();
            ctx.shadowBlur = 10 * (1 + this.z);
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }

      function buildGrid() {
        grid = new Map();
      }

      function gridKey(cx, cy) { return (cx << 16) ^ cy; } // cheap key
      function insertToGrid(p, idx) {
        const cx = Math.floor(p.x / gridSize);
        const cy = Math.floor(p.y / gridSize);
        const k = gridKey(cx, cy);
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(idx);
      }

      function getNearbyIndexes(p) {
        const cx = Math.floor(p.x / gridSize);
        const cy = Math.floor(p.y / gridSize);
        const res = [];
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const k = gridKey(cx + dx, cy + dy);
            const arr = grid.get(k);
            if (arr) res.push(...arr);
          }
        }
        return res;
      }

      function regenerateParticles() {
        particles = [];
        // if lowPerf, reduce number aggressively
        const effectiveCount = lowPerf ? Math.max(18, Math.floor(COUNT / 3)) : COUNT;
        // also scale down if very small viewport
        const widthFactor = Math.max(0.5, Math.min(1.6, window.innerWidth / 1366));
        const finalCount = Math.min(effectiveCount, Math.floor(effectiveCount * widthFactor));
        for (let i = 0; i < finalCount; i++) particles.push(new Particle());
      }

      function connectAndDraw() {
        // spatial hash rebuild
        buildGrid();
        for (let i = 0; i < particles.length; i++) {
          insertToGrid(particles[i], i);
        }

        // drawing
        // determine whether to use shadows (skip when too many)
        const useShadow = particles.length < 140;
        // line width adapt
        ctx.lineWidth = particles.length < 180 ? 0.9 : 0.5;

        for (let i = 0; i < particles.length; i++) {
          const a = particles[i];
          // draw particle
          a.draw(useShadow);

          // find nearby candidates only
          const nearby = getNearbyIndexes(a);
          for (let k = 0; k < nearby.length; k++) {
            const j = nearby[k];
            if (j <= i) continue; // avoid double
            const b = particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAX_DISTANCE) {
              const opacity = 1 - dist / MAX_DISTANCE;
              ctx.strokeStyle = getLineColor(opacity * 0.85);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      function frame() {
        if (paused) { rafId = requestAnimationFrame(frame); return; }
        // throttle mouse update via rAF
        if (mouseDirty) {
          mouse.x = _mouseX !== null ? _mouseX * (canvas.width / window.innerWidth) : null;
          mouse.y = _mouseY !== null ? _mouseY * (canvas.height / window.innerHeight) : null;
          mouseDirty = false;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
        }
        connectAndDraw();
        rafId = requestAnimationFrame(frame);
      }

      // click burst (cheap)
      window.addEventListener("click", (e) => {
        for (let i = 0; i < 12; i++) {
          const p = new Particle();
          p.x = e.clientX * (canvas.width / window.innerWidth) + (Math.random() - 0.5) * 12;
          p.y = e.clientY * (canvas.height / window.innerHeight) + (Math.random() - 0.5) * 12;
          p.speedX = (Math.random() - 0.5) * 5;
          p.speedY = (Math.random() - 0.5) * 5;
          particles.push(p);
        }
        // keep list bounded
        if (particles.length > 1000) particles.splice(0, particles.length - 1000);
      });

      // public API
      function setCount(v) { COUNT = Math.max(8, Math.min(SAFE_MAX, Math.floor(v))); regenerateParticles(); }
      function setDistance(v) { MAX_DISTANCE = Math.max(20, Math.min(500, Number(v))); gridSize = Math.max(60, MAX_DISTANCE); }
      function setSpeed(v) { BASE_SPEED = Math.max(0.05, Number(v)); regenerateParticles(); }
      function togglePause() { paused = !paused; return paused; }
      function regenerate() { regenerateParticles(); }
      function setLowPerf(on) { lowPerf = !!on; regenerateParticles(); }
      function updateColors() { /* colors read theme each draw */ }

      // initial populate & loop
      regenerateParticles();
      frame();

      return { setCount, setDistance, setSpeed, togglePause, regenerate, setLowPerf, updateColors };
    })();
  } // end if canvases present

  /* ============ UI HOOKS (connect controls) ============ */
  const pcCount = document.getElementById("pc-count");
  const pcDist = document.getElementById("pc-dist");
  const pcSpeed = document.getElementById("pc-speed");
  const pcCountLabel = document.getElementById("pc-count-label");
  const pcDistLabel = document.getElementById("pc-dist-label");
  const pcSpeedLabel = document.getElementById("pc-speed-label");
  const pcToggle = document.getElementById("pc-toggle");
  const pcRegenerate = document.getElementById("pc-regenerate");
  const pcLowPerf = document.getElementById("pc-lowperf");

  if (particlesSystem) {
    // wire sliders with safe guards and labels
    pcCount?.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      pcCountLabel && (pcCountLabel.textContent = v);
      particlesSystem.setCount(v);
    });
    pcDist?.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      pcDistLabel && (pcDistLabel.textContent = v);
      particlesSystem.setDistance(v);
    });
    pcSpeed?.addEventListener("input", (e) => {
      const v = Number(e.target.value);
      pcSpeedLabel && (pcSpeedLabel.textContent = v);
      particlesSystem.setSpeed(v);
    });
    pcToggle?.addEventListener("click", () => {
      const paused = particlesSystem.togglePause();
      pcToggle.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    });
    pcRegenerate?.addEventListener("click", () => particlesSystem.regenerate());
    let low = false;
    pcLowPerf?.addEventListener("click", () => {
      low = !low;
      particlesSystem.setLowPerf(low);
      pcLowPerf.textContent = low ? "Low Perf ✓" : "Low Perf";
    });
  }

  /* ===== Auto low-perf for small screens ===== */
  function autoLowPerf() {
    if (!particlesSystem) return;
    if (window.innerWidth < 720 || (window.devicePixelRatio || 1) > 2) {
      particlesSystem.setLowPerf(true);
      if (pcLowPerf) pcLowPerf.textContent = "Low Perf ✓";
    } else {
      particlesSystem.setLowPerf(false);
      if (pcLowPerf) pcLowPerf.textContent = "Low Perf";
    }
  }
  autoLowPerf();
  window.addEventListener("resize", debounce(autoLowPerf, 200));

  /* ===== utilities ===== */
  function debounce(fn, wait = 100) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }
});