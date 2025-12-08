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
    setTimeout(() => {
      preloader.classList.add("hidden");
    }, 400);
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
    themeToggle.innerHTML = isLight
      ? '<i class="fas fa-moon"></i>'
      : '<i class="fas fa-sun"></i>';
    localStorage.setItem("jd-theme", isLight ? "light" : "dark");
  });

  /* ============ MOBILE MENU ============ */
  menuToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });

  /* ============ SCROLL REVEAL + SKILL BARS ============ */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");

          // animate skill bars when skill-box visible
          if (entry.target.classList.contains("skill-box")) {
            const bars = entry.target.querySelectorAll(".skill-progress-fill");
            bars.forEach((bar) => {
              const value = bar.getAttribute("data-skill") || 0;
              bar.style.width = value + "%";
            });
          }

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );

  revealEls.forEach((el) => observer.observe(el));

  /* ============ PROJECT FILTERING ============ */
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      projectCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(" ");
        if (filter === "all" || categories.includes(filter)) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  /* ============ 3D PARTICLES BACKGROUND ============ */
  const canvas = document.getElementById("particles");
  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles = [];
    const PARTICLE_COUNT = 90;
    const MAX_DISTANCE = 130;

    const mouse = {
      x: null,
      y: null,
      radius: 180,
    };

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    function getParticleColor() {
      // darker / neon teal in dark mode, brighter blue in light mode
      return body.classList.contains("light-theme")
        ? "rgba(14,165,233,0.9)"
        : "rgba(34,211,238,0.95)";
    }

    function getLineColor(opacity) {
      return body.classList.contains("light-theme")
        ? `rgba(14,165,233,${opacity})`
        : `rgba(34,211,238,${opacity})`;
    }

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        // When initial, spawn anywhere. Later respawns can come from edges.
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2.8 + 0.8;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        if (!initial && Math.random() > 0.5) {
          // Re-enter from random edge for a more "3D field" feel
          const edge = Math.floor(Math.random() * 4);
          if (edge === 0) this.y = 0;
          if (edge === 1) this.y = canvas.height;
          if (edge === 2) this.x = 0;
          if (edge === 3) this.x = canvas.width;
        }
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // bounce on edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        // mouse repulsion for pseudo-3D parallax
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouse.radius) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const maxForce = 4;
            const force = (mouse.radius - distance) / mouse.radius;
            const directionX = forceDirectionX * force * maxForce;
            const directionY = forceDirectionY * force * maxForce;
            this.x -= directionX;
            this.y -= directionY;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = getParticleColor();
        ctx.shadowColor = getParticleColor();
        ctx.shadowBlur = 18;
        ctx.fill();
      }
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < MAX_DISTANCE) {
            const opacity = 1 - distance / MAX_DISTANCE;
            ctx.strokeStyle = getLineColor(opacity * 0.9);
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      connectParticles();
      requestAnimationFrame(animate);
    }

    initParticles();
    animate();
  }
});
