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
  window.addEventListener("load", () => {
    setTimeout(() => preloader.classList.add("hidden"), 400);
  });

  /* ============ THEME TOGGLE ============ */
  const savedTheme = localStorage.getItem("jd-theme");
  if (savedTheme === "light") {
    body.classList.add("light-theme");
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light-theme");
    const isLight = body.classList.contains("light-theme");
    themeToggle.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    localStorage.setItem("jd-theme", isLight ? "light" : "dark");
    // update particle color live
    if (particlesSystem) particlesSystem.updateColors();
    if (starsSystem) starsSystem.updateColors();
  });

  /* ============ MOBILE MENU ============ */
  menuToggle.addEventListener("click", () => nav.classList.toggle("open"));
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

  /* ============ PARTICLES + STARS SYSTEM ============ */
  const canvas = document.getElementById("particles");
  const starsCanvas = document.getElementById("stars");

  // Particles system object to allow control
  let particlesSystem = null;
  let starsSystem = null;

  // safe guard for old browsers
  if (canvas && canvas.getContext && starsCanvas && starsCanvas.getContext) {
    // --- Stars (subtle twinkle) ---
    starsSystem = (function initStars() {
      const ctx = starsCanvas.getContext("2d");
      let w = 0, h = 0, stars = [];
      const STAR_COUNT = 120;
      function resize() {
        w = starsCanvas.width = window.innerWidth;
        h = starsCanvas.height = window.innerHeight;
        // regenerate stars for new size
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.8 + 0.1,
            drift: Math.random() * 0.02 + 0.005
          });
        }
      }
      function updateColors() { /* nothing color-specific for stars but kept for API parity */ }
      function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach((s, i) => {
          // twinkle
          s.alpha += (Math.random() - 0.5) * s.drift;
          if (s.alpha < 0.05) s.alpha = 0.05;
          if (s.alpha > 1) s.alpha = 1;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      window.addEventListener("resize", resize);
      resize();
      draw();
      return { updateColors };
    })();

    // --- Particles network system ---
    particlesSystem = (function initParticles() {
      const ctx = canvas.getContext("2d");
      let w = 0, h = 0;
      let particles = [];
      let rafId = null;
      let paused = false;
      let lowPerf = false;

      // controls & defaults (in sync with HTML controls)
      let COUNT = 90;
      let MAX_DISTANCE = 130;
      let BASE_SPEED = 0.8;

      const mouse = { x: null, y: null, radius: 180 };

      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      }
      window.addEventListener("resize", resize);
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
          this.z = Math.random() * 1; // 3D parallax layer factor 0..1
          this.size = Math.random() * 2.8 + 0.8;
          this.speedX = (Math.random() - 0.5) * BASE_SPEED * (0.6 + this.z);
          this.speedY = (Math.random() - 0.5) * BASE_SPEED * (0.6 + this.z);
          if (!initial && Math.random() > 0.6) {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) this.y = 0;
            if (edge === 1) this.y = h;
            if (edge === 2) this.x = 0;
            if (edge === 3) this.x = w;
          }
        }
        update() {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.x < -30 || this.x > w + 30 || this.y < -30 || this.y > h + 30) this.reset();
          // mouse repulsion
          if (mouse.x !== null && mouse.y !== null) {
            const dx = mouse.x - this.x;
            const dy = mouse.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
              const force = (mouse.radius - dist) / mouse.radius;
              this.x -= (dx / dist) * force * 4 * (1 + this.z);
              this.y -= (dy / dist) * force * 4 * (1 + this.z);
            }
          }
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * (1 + this.z * 0.6), 0, Math.PI * 2);
          ctx.fillStyle = getParticleColor();
          ctx.shadowColor = getParticleColor();
          ctx.shadowBlur = 16 * (1 + this.z);
          ctx.fill();
        }
      }

      function initParticles() {
        particles.length = 0;
        const count = lowPerf ? Math.max(20, Math.floor(COUNT / 3)) : COUNT;
        for (let i = 0; i < count; i++) particles.push(new Particle());
      }

      // connection lines
      function connect() {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i], b = particles[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAX_DISTANCE) {
              const opacity = 1 - dist / MAX_DISTANCE;
              ctx.strokeStyle = getLineColor(opacity * 0.9);
              ctx.lineWidth = 0.8 * (1 + (a.z + b.z) / 4);
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      }

      function loop() {
        if (paused) { rafId = requestAnimationFrame(loop); return; }
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => { p.update(); p.draw(); });
        connect();
        rafId = requestAnimationFrame(loop);
      }

      // mouse interactions
      window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
      window.addEventListener("mouseleave", () => { mouse.x = null; mouse.y = null; });
      // click burst
      window.addEventListener("click", (e) => {
        for (let i = 0; i < 14; i++) {
          const p = new Particle();
          p.x = e.clientX + (Math.random() - 0.5) * 12;
          p.y = e.clientY + (Math.random() - 0.5) * 12;
          p.speedX = (Math.random() - 0.5) * 6;
          p.speedY = (Math.random() - 0.5) * 6;
          particles.push(p);
        }
        // trim
        if (particles.length > 700) particles.splice(0, particles.length - 700);
      });

      // Public API for controls
      function setCount(v) { COUNT = Math.max(10, Math.min(400, Math.floor(v))); initParticles(); }
      function setDistance(v) { MAX_DISTANCE = Math.max(20, Math.min(500, Number(v))); }
      function setSpeed(v) { BASE_SPEED = Math.max(0.05, Number(v)); initParticles(); }
      function togglePause() { paused = !paused; return paused; }
      function regenerate() { initParticles(); }
      function setLowPerf(on) { lowPerf = !!on; initParticles(); }
      function updateColors() { /* nothing extra to do, color functions read theme */ }

      // initialize
      initParticles();
      loop();

      return { setCount, setDistance, setSpeed, togglePause, regenerate, setLowPerf, updateColors };
    })();
  }

  /* ============ PARTICLES UI HOOKS ============ */
  const pcCount = document.getElementById("pc-count");
  const pcDist = document.getElementById("pc-dist");
  const pcSpeed = document.getElementById("pc-speed");
  const pcCountLabel = document.getElementById("pc-count-label");
  const pcDistLabel = document.getElementById("pc-dist-label");
  const pcSpeedLabel = document.getElementById("pc-speed-label");
  const pcToggle = document.getElementById("pc-toggle");
  const pcRegenerate = document.getElementById("pc-regenerate");
  const pcLowPerf = document.getElementById("pc-lowperf");

  // wire controls if systems exist
  if (particlesSystem) {
    pcCount.addEventListener("input", (e) => {
      const v = e.target.value; pcCountLabel.textContent = v;
      particlesSystem.setCount(Number(v));
    });
    pcDist.addEventListener("input", (e) => {
      const v = e.target.value; pcDistLabel.textContent = v;
      particlesSystem.setDistance(Number(v));
    });
    pcSpeed.addEventListener("input", (e) => {
      const v = e.target.value; pcSpeedLabel.textContent = v;
      particlesSystem.setSpeed(Number(v));
    });
    pcToggle.addEventListener("click", () => {
      const paused = particlesSystem.togglePause();
      pcToggle.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    });
    pcRegenerate.addEventListener("click", () => particlesSystem.regenerate());
    let low = false;
    pcLowPerf.addEventListener("click", () => {
      low = !low;
      particlesSystem.setLowPerf(low);
      pcLowPerf.textContent = low ? "Low Perf ✓" : "Low Perf";
    });
  }

  /* ============ Small perf guard: auto low-perf on small screens ============ */
  function autoLowPerf() {
    if (!particlesSystem) return;
    if (window.innerWidth < 720) {
      particlesSystem.setLowPerf(true);
    } else {
      particlesSystem.setLowPerf(false);
    }
  }
  autoLowPerf();
  window.addEventListener("resize", autoLowPerf);

  /* ============ Accessibility: keyboard toggle for particles ============ */
  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (particlesSystem) {
        const p = particlesSystem.togglePause();
        pcToggle.innerHTML = p ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
      }
    }
  });

});