/* main.js - includes skills re-trigger-on-filter feature + earlier features assumed present */
document.addEventListener("DOMContentLoaded", () => {
  /* ---------- basic UI hooks ---------- */
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".center-section");
  const navLinks = nav?.querySelectorAll("a") || [];
  const preloader = document.getElementById("preloader");

  // Preloader hide
  window.addEventListener("load", () => setTimeout(() => preloader.classList.add("hidden"), 350));

  // Theme
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
  });

  // Mobile menu
  menuToggle?.addEventListener("click", () => nav.classList.toggle("open"));
  navLinks.forEach(l => l.addEventListener("click", () => nav.classList.remove("open")));

  /* ---------- Reveal & Skill animation ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const skillCards = Array.from(document.querySelectorAll('.skill-card'));
  const skillFilterBtns = Array.from(document.querySelectorAll('.skill-filter-btn'));
  const skillSortSelect = document.getElementById('skill-sort-select');

  // easing
  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  // animate a single skill card's circular progress from 0 to its data-proficiency
  function animateSkillCard(card) {
    const circle = card.querySelector('.circle');
    const text = card.querySelector('.percentage');
    const target = Math.max(0, Math.min(100, Number(card.dataset.proficiency || 0)));
    if (!circle || !text) return;
    // reset first (important for re-trigger)
    circle.setAttribute('stroke-dasharray', '0,100');
    text.textContent = '0%';
    let start = null;
    const duration = 900;
    function step(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      const eased = easeOutCubic(p);
      const current = Math.round(target * eased);
      circle.setAttribute('stroke-dasharray', `${current},100`);
      text.textContent = `${current}%`;
      if (p < 1) requestAnimationFrame(step);
      else {
        // mark as animated
        card.dataset.animated = "true";
      }
    }
    // clear animated flag while animating
    delete card.dataset.animated;
    requestAnimationFrame(step);
  }

  // IntersectionObserver - animate when element appears first time (but filtering will force re-anim)
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('skill-card')) animateSkillCard(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.28 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // set initial circle dash to 0 for all skill cards
  skillCards.forEach(c => {
    const circle = c.querySelector('.circle');
    const text = c.querySelector('.percentage');
    if (circle) circle.setAttribute('stroke-dasharray', '0,100');
    if (text) text.textContent = '0%';
    c.dataset.animated = "false";
  });

  /* ---------- Filtering with re-trigger behavior (third option implemented) ---------- */
  function applyFilter(filter) {
    skillCards.forEach(card => {
      const cats = (card.dataset.category || '').split(/\s+/);
      if (filter === 'all' || cats.includes(filter)) {
        // show
        card.style.display = 'flex';
        // reset animated flag so animation re-runs
        card.dataset.animated = "false";
        // small delay to allow layout to settle then animate (avoids janky rendering)
        requestAnimationFrame(() => {
          // ensure element is visible in viewport—if so animate immediately, otherwise rely on IntersectionObserver
          const rect = card.getBoundingClientRect();
          const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
          if (inViewport) animateSkillCard(card);
        });
      } else {
        // hide and reset state
        card.style.display = 'none';
        card.dataset.animated = "false";
        // immediately reset visuals so when re-shown it starts from 0
        const circle = card.querySelector('.circle');
        const text = card.querySelector('.percentage');
        if (circle) circle.setAttribute('stroke-dasharray', '0,100');
        if (text) text.textContent = '0%';
      }
    });
  }

  skillFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      skillFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      applyFilter(f);
      // after filtering, also re-layout and re-run animations for visible ones:
      // slight delay ensures CSS layout updated
      setTimeout(() => {
        skillCards.filter(c => c.style.display !== 'none').forEach(c => {
          const already = c.dataset.animated === "true";
          if (!already) animateSkillCard(c);
        });
      }, 120);
    });
  });

  /* ---------- Sorting also retriggers animation for visible cards ---------- */
  function sortSkills(mode) {
    const grid = document.getElementById('skill-grid');
    const cards = Array.from(grid.querySelectorAll('.skill-card'));
    let sorted;
    if (mode === 'alpha') {
      sorted = cards.sort((a,b) => a.dataset.name.localeCompare(b.dataset.name));
    } else {
      sorted = cards.sort((a,b) => Number(b.dataset.proficiency || 0) - Number(a.dataset.proficiency || 0));
    }
    sorted.forEach(c => grid.appendChild(c));
    // reset animated flag for visible ones and replay
    setTimeout(() => {
      const visible = sorted.filter(c => c.style.display !== 'none');
      visible.forEach(c => { c.dataset.animated = "false"; const circle = c.querySelector('.circle'); if (circle) circle.setAttribute('stroke-dasharray','0,100'); const text = c.querySelector('.percentage'); if (text) text.textContent='0%'; });
      visible.forEach(c => animateSkillCard(c));
    }, 120);
  }
  skillSortSelect?.addEventListener('change', (e) => sortSkills(e.target.value));
  // default
  sortSkills('proficiency');

  /* tooltip follow pointer */
  skillCards.forEach(card => {
    const tip = card.querySelector('.skill-tooltip');
    card.addEventListener('mousemove', (ev) => {
      if (!tip) return;
      const rect = card.getBoundingClientRect();
      const winW = window.innerWidth;
      let left = ev.clientX + 12;
      if (left + 200 > winW) left = ev.clientX - 220;
      tip.style.left = `${left - rect.left}px`;
      tip.style.top = `${ev.clientY - rect.top - 8}px`;
    });
    card.addEventListener('mouseleave', () => {
      const tip = card.querySelector('.skill-tooltip');
      if (tip) { tip.style.left = ''; tip.style.top = ''; }
    });
  });

  /* ---------- Projects, particles, FPS, modal, etc. ----------
     The rest of your previously-installed code (optimized particles, project carousel,
     modal behavior, FPS meter with auto low-perf) should run as before. If you replaced
     the entire previous main.js with the long optimized version earlier, that logic
     remains intact. This file focuses on the Skills feature and integrates with the
     existing systems. If you'd like, I can paste the full combined file (skills + the
     full particles+projects+fps engine) so you have a single monolithic main.js. */
});