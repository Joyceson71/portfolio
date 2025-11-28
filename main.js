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
});
