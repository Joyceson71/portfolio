/* =============================================
   NEON INK PORTFOLIO — main.js
   Ink particle canvas · Cursor · Reveal
   Theme toggle · Mobile optimized
   Low GPU usage — no WebGL, no 3D
============================================= */

(function () {
  "use strict";

  /* ---- DETECT TOUCH/MOBILE ---- */
  const isMobile = window.matchMedia("(hover: none)").matches || window.innerWidth < 768;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================
     CUSTOM CURSOR (desktop only)
  ============================================= */
  if (!isMobile) {
    const cur = document.getElementById("cur");
    const smear = document.getElementById("smear");

    let mx = 0, my = 0;
    let lx = 0, ly = 0;

    document.addEventListener("mousemove", (e) => {
      lx = mx; ly = my;
      mx = e.clientX; my = e.clientY;

      // Direct position update — no lag on dot
      cur.style.left = mx + "px";
      cur.style.top = my + "px";

      // Smear effect: angle + scale based on speed
      const dx = mx - lx, dy = my - ly;
      const speed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      if (speed > 2) {
        const scaleX = 1 + speed / 18;
        smear.style.left = mx + "px";
        smear.style.top = my + "px";
        smear.style.transform = `translate(-50%, -50%) rotate(${angle}deg) scaleX(${scaleX})`;
        smear.style.opacity = Math.min(speed / 40, 0.65).toString();
      } else {
        smear.style.opacity = "0";
      }
    });

    document.addEventListener("mouseleave", () => {
      smear.style.opacity = "0";
    });

    // Hover states on interactive elements
    const interactEls = document.querySelectorAll(
      "a, button, .pc, .sk-box, .d-item, .ct-item, .pill, .fb"
    );
    interactEls.forEach((el) => {
      el.addEventListener("mouseenter", () => {
        cur.classList.add("big");
        if (el.classList.contains("btn-mag") || el.classList.contains("pc-link")) {
          cur.classList.add("mag");
        }
      });
      el.addEventListener("mouseleave", () => {
        cur.classList.remove("big", "mag");
      });
    });
  }

  /* ============================================
     INK PARTICLE CANVAS
     Lightweight: 2D canvas, no WebGL
     Fewer particles on mobile
  ============================================= */
  const canvas = document.getElementById("splash");
  if (canvas) {
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    let W = 0, H = 0;
    let animFrame = null;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();

    // Debounce resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    const COUNT = isMobile ? 35 : 80;
    const particles = [];

    function makeParticle() {
      const type = Math.random() < 0.6 ? "cyan" : "mag";
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.2 + 0.4,
        life: Math.floor(Math.random() * 300),
        maxLife: Math.floor(Math.random() * 200 + 140),
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        type,
      };
    }

    for (let i = 0; i < COUNT; i++) particles.push(makeParticle());

    const isLight = () => document.body.classList.contains("light");

    function drawParticles() {
      // Use clearRect — cheaper than fillRect on transparent canvas
      ctx.clearRect(0, 0, W, H);

      const lightMode = isLight();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life = (p.life + 1) % p.maxLife;
        p.x += p.vx;
        p.y += p.vy;

        // Soft boundary bounce
        if (p.x < 0 || p.x > W) { p.vx *= -1; p.x = Math.max(0, Math.min(W, p.x)); }
        if (p.y < 0 || p.y > H) { p.vy *= -1; p.y = Math.max(0, Math.min(H, p.y)); }

        const t = p.life / p.maxLife;
        // Fade in and out
        const alpha = (t < 0.18 ? t / 0.18 : t > 0.82 ? (1 - t) / 0.18 : 1)
          * (lightMode ? 0.12 : 0.08);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        if (lightMode) {
          ctx.fillStyle = p.type === "cyan"
            ? `rgba(0,106,255,${alpha})`
            : `rgba(204,0,102,${alpha})`;
        } else {
          ctx.fillStyle = p.type === "cyan"
            ? `rgba(0,245,255,${alpha})`
            : `rgba(255,0,128,${alpha})`;
        }
        ctx.fill();
      }

      animFrame = requestAnimationFrame(drawParticles);
    }

    // Pause canvas when tab is hidden — saves battery/GPU
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAnimationFrame(animFrame);
      } else {
        animFrame = requestAnimationFrame(drawParticles);
      }
    });

    if (!prefersReducedMotion) {
      drawParticles();
    }
  }

  /* ============================================
     SCROLL REVEAL — IntersectionObserver
     Triggers ink-reveal class & skill bars
  ============================================= */
  const revealEls = document.querySelectorAll(".reveal, .rev-l, .rev-r, .s-eyebrow");

  if (prefersReducedMotion) {
    // Skip animations entirely — just show everything
    revealEls.forEach((el) => el.classList.add("v"));
    document.querySelectorAll(".bar-fill").forEach((b) => {
      b.style.width = (b.dataset.v || 0) + "%";
    });
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("v");
            // Trigger skill bar fills
            entry.target.querySelectorAll(".bar-fill").forEach((b) => {
              b.style.width = (b.dataset.v || 0) + "%";
            });
            // Unobserve after reveal to free memory
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ============================================
     SKILL BAR OBSERVER (for sk-box containers)
  ============================================= */
  if (!prefersReducedMotion) {
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".bar-fill").forEach((b) => {
              b.style.width = (b.dataset.v || 0) + "%";
            });
            barObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    document.querySelectorAll(".sk-box").forEach((el) => barObserver.observe(el));
  }

  /* ============================================
     PROJECT FILTER
  ============================================= */
  const filterBtns = document.querySelectorAll(".fb");
  const projectCards = document.querySelectorAll(".pc");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");

      const f = btn.dataset.f;
      projectCards.forEach((card) => {
        const cats = (card.dataset.cat || "").split(" ");
        const show = f === "all" || cats.includes(f);
        // Fade in/out with CSS — no JS animation library needed
        card.style.display = show ? "" : "none";
        if (show) {
          card.style.opacity = "0";
          requestAnimationFrame(() => {
            card.style.transition = "opacity 0.3s ease";
            card.style.opacity = "1";
          });
        }
      });
    });
  });

  /* ============================================
     MOBILE MENU
  ============================================= */
  const menuBtn = document.getElementById("menuBtn");
  const navEl = document.getElementById("nav");

  if (menuBtn && navEl) {
    menuBtn.addEventListener("click", () => {
      const isOpen = navEl.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", isOpen.toString());
      // Ink icon swap
      menuBtn.querySelector("i").className = isOpen ? "fas fa-times" : "fas fa-bars";
    });

    // Close on nav link click
    navEl.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navEl.classList.remove("open");
        menuBtn.querySelector("i").className = "fas fa-bars";
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    // Close on outside tap (mobile UX)
    document.addEventListener("click", (e) => {
      if (!navEl.contains(e.target) && !menuBtn.contains(e.target)) {
        navEl.classList.remove("open");
        menuBtn.querySelector("i").className = "fas fa-bars";
      }
    });
  }

  /* ============================================
     LIGHT / DARK THEME TOGGLE
     Injects a toggle button into header
  ============================================= */
  function injectThemeToggle() {
    const hdrRight = document.querySelector(".hdr-right");
    if (!hdrRight) return;

    const btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Toggle light/dark theme");
    btn.innerHTML = '<i class="fas fa-sun"></i>';

    const savedTheme = localStorage.getItem("jd-ink-theme");
    if (savedTheme === "light") {
      document.body.classList.add("light");
      btn.innerHTML = '<i class="fas fa-moon"></i>';
      updatePoolsForTheme(true);
    }

    btn.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light");
      btn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      localStorage.setItem("jd-ink-theme", isLight ? "light" : "dark");
      updatePoolsForTheme(isLight);
    });

    // Insert before menu button
    hdrRight.insertBefore(btn, hdrRight.firstChild);
  }

  function updatePoolsForTheme(isLight) {
    // Pools update via CSS variable changes — nothing needed in JS
    // Canvas particle colors auto-detect body.light class at draw time
  }

  injectThemeToggle();

  /* ============================================
     TYPING EFFECT — role line
     Cycles through roles with ink cursor
  ============================================= */
  const roleEl = document.querySelector(".role-line");
  if (roleEl && !prefersReducedMotion) {
    const roles = [
      "Frontend Developer",
      "UI Enthusiast",
      "React Engineer",
      "Web Craftsman",
    ];
    let rIdx = 0, cIdx = 0, isTyping = true;

    // Preserve the cursor blink span
    const cursorSpan = roleEl.querySelector(".cursor-blink");
    const textNode = document.createTextNode("");
    roleEl.insertBefore(textNode, cursorSpan);
    // Remove existing text nodes except our new one
    Array.from(roleEl.childNodes).forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE && n !== textNode) n.remove();
    });

    let typingTimer;
    function type() {
      const target = roles[rIdx];
      if (isTyping) {
        if (cIdx < target.length) {
          textNode.textContent = target.slice(0, ++cIdx);
          typingTimer = setTimeout(type, 75);
        } else {
          isTyping = false;
          typingTimer = setTimeout(type, 2200);
        }
      } else {
        if (cIdx > 0) {
          textNode.textContent = target.slice(0, --cIdx);
          typingTimer = setTimeout(type, 38);
        } else {
          isTyping = true;
          rIdx = (rIdx + 1) % roles.length;
          typingTimer = setTimeout(type, 300);
        }
      }
    }

    // Start after a short delay
    typingTimer = setTimeout(type, 1200);

    // Pause typing when tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearTimeout(typingTimer);
      } else {
        typingTimer = setTimeout(type, 300);
      }
    });
  }

  /* ============================================
     INK SPLASH ON CLICK — quick radial burst
     2D canvas draw — no extra libraries
  ============================================= */
  if (!isMobile && !prefersReducedMotion && canvas) {
    const splashCtx = canvas.getContext("2d");
    document.addEventListener("click", (e) => {
      const splashes = [];
      const count = 10;
      const isLight = document.body.classList.contains("light");

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const speed = Math.random() * 3 + 1.5;
        const type = Math.random() < 0.6 ? "cyan" : "mag";
        splashes.push({
          x: e.clientX, y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          r: Math.random() * 3 + 1.5,
          life: 0, maxLife: 35, type,
        });
      }

      function drawSplash() {
        let active = false;
        splashes.forEach((s) => {
          if (s.life >= s.maxLife) return;
          active = true;
          s.life++;
          s.x += s.vx; s.y += s.vy;
          s.vx *= 0.9; s.vy *= 0.9;

          const t = s.life / s.maxLife;
          const a = (1 - t) * (isLight ? 0.25 : 0.55);

          splashCtx.beginPath();
          splashCtx.arc(s.x, s.y, s.r * (1 - t * 0.5), 0, Math.PI * 2);
          splashCtx.fillStyle = s.type === "cyan"
            ? (isLight ? `rgba(0,106,255,${a})` : `rgba(0,245,255,${a})`)
            : (isLight ? `rgba(204,0,102,${a})` : `rgba(255,0,128,${a})`);
          splashCtx.fill();
        });
        if (active) requestAnimationFrame(drawSplash);
      }
      drawSplash();
    });
  }

  /* ============================================
     HEADER SCROLL EFFECT
     Adds a subtle ink-shadow on scroll
  ============================================= */
  const header = document.querySelector("header");
  let lastScroll = 0;

  window.addEventListener(
    "scroll",
    () => {
      const scrollY = window.scrollY;
      if (scrollY > 20) {
        header.style.boxShadow = "0 4px 30px rgba(0,245,255,0.06)";
      } else {
        header.style.boxShadow = "none";
      }
      // Hide header on fast scroll down, reveal on up
      if (!isMobile) {
        if (scrollY > lastScroll + 60) {
          header.style.transform = "translateY(-100%)";
          header.style.transition = "transform 0.4s ease";
        } else if (scrollY < lastScroll - 10) {
          header.style.transform = "translateY(0)";
        }
      }
      lastScroll = scrollY;
    },
    { passive: true }
  );

  /* ============================================
     CONTACT FORM — basic ink feedback
  ============================================= */
  const form = document.querySelector(".neon-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("button[type=submit]");
      const original = btn.innerHTML;
      btn.innerHTML = '<span><i class="fas fa-check"></i> Sent!</span>';
      btn.style.borderColor = "#39ff14";
      btn.style.color = "#39ff14";
      btn.style.boxShadow = "0 0 14px rgba(57,255,20,0.4)";
      setTimeout(() => {
        btn.innerHTML = original;
        btn.style.borderColor = "";
        btn.style.color = "";
        btn.style.boxShadow = "";
        form.reset();
      }, 2500);
    });
  }

  /* ============================================
     SMOOTH SCROLL for anchor links
  ============================================= */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

})();