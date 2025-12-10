/* main.js - interactions, lazy model loading, carousel, skills animation, modal */
document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const preloader = document.getElementById('preloader');
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.querySelector('.nav');
  const themeBtn = document.getElementById('themeBtn');

  // hide preloader after load
  window.addEventListener('load', () => setTimeout(()=>preloader.classList.add('hidden'), 300));

  // mobile menu toggle
  if (menuBtn && nav) menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  // theme toggle (persist)
  const stored = localStorage.getItem('jd-theme');
  if (stored === 'light') document.documentElement.classList.add('light-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-theme');
      localStorage.setItem('jd-theme', document.documentElement.classList.contains('light-theme') ? 'light' : 'dark');
      themeBtn.innerHTML = document.documentElement.classList.contains('light-theme') ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });
  }

  // simple reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ================= Skill animation + filters/sort ================= */
  const skillCards = Array.from(document.querySelectorAll('.skill-card'));
  const skillBtns = Array.from(document.querySelectorAll('.skill-btn'));
  const skillSort = document.getElementById('skillSort');
  const grid = document.getElementById('skillGrid');

  // initialize visuals
  skillCards.forEach(card => {
    const circle = card.querySelector('.circle');
    const pct = card.querySelector('.percentage');
    if (circle) circle.setAttribute('stroke-dasharray', '0,100');
    if (pct) pct.textContent = '0%';
    card.dataset.animated = 'false';
  });

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }
  function animateSkill(card){
    const circle = card.querySelector('.circle');
    const pct = card.querySelector('.percentage');
    const target = Math.max(0, Math.min(100, Number(card.dataset.proficiency || 0)));
    if (!circle || !pct) return;
    circle.setAttribute('stroke-dasharray', '0,100');
    pct.textContent = '0%';
    let start = null;
    const dur = 900;
    function step(ts){
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = easeOutCubic(p);
      const current = Math.round(target * eased);
      circle.setAttribute('stroke-dasharray', current + ',100');
      pct.textContent = current + '%';
      if (p < 1) requestAnimationFrame(step);
      else card.dataset.animated = 'true';
    }
    delete card.dataset.animated;
    requestAnimationFrame(step);
  }

  // animate when card becomes visible
  const skillObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        if (e.target.classList.contains('skill-card')) animateSkill(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.skill-card').forEach(c => skillObserver.observe(c));

  // filter skills
  function applySkillFilter(filter){
    skillCards.forEach(c => {
      const cats = (c.dataset.category || '').split(/\s+/);
      if (filter === 'all' || cats.includes(filter)) {
        c.style.display = 'flex';
        c.dataset.animated = 'false';
        const rect = c.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) animateSkill(c);
      } else {
        c.style.display = 'none';
        c.dataset.animated = 'false';
        const circ = c.querySelector('.circle'); const pct = c.querySelector('.percentage');
        if (circ) circ.setAttribute('stroke-dasharray', '0,100'); if (pct) pct.textContent = '0%';
      }
    });
  }
  skillBtns.forEach(btn => btn.addEventListener('click', () => {
    skillBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applySkillFilter(btn.dataset.filter || 'all');
    setTimeout(()=> skillCards.filter(c => c.style.display !== 'none').forEach(c => { if (c.dataset.animated !== 'true') animateSkill(c); }), 120);
  }));

  // sort skills
  skillSort?.addEventListener('change', e => {
    const cards = Array.from(grid.children);
    let sorted = cards;
    if (e.target.value === 'alpha') sorted = cards.sort((a,b) => a.dataset.name.localeCompare(b.dataset.name));
    else sorted = cards.sort((a,b) => Number(b.dataset.proficiency || 0) - Number(a.dataset.proficiency || 0));
    sorted.forEach(c => grid.appendChild(c));
    setTimeout(()=> sorted.filter(c => c.style.display !== 'none').forEach(c => { c.dataset.animated = 'false'; const circ = c.querySelector('.circle'); const pct = c.querySelector('.percentage'); if (circ) circ.setAttribute('stroke-dasharray', '0,100'); if (pct) pct.textContent = '0%'; animateSkill(c); }), 120);
  });

  /* ================= Project carousel & filtering ================= */
  const projList = document.getElementById('projList');
  const prevBtn = document.getElementById('projPrev');
  const nextBtn = document.getElementById('projNext');

  function scrollAmount(){
    if (!projList) return 600;
    const w = projList.clientWidth;
    if (window.innerWidth <= 520) return Math.round(w * 0.92);
    if (window.innerWidth <= 900) return Math.round(w * 0.5);
    return Math.round(w / 3);
  }

  prevBtn?.addEventListener('click', () => projList.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => projList.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));

  // project filters
  document.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      Array.from(projList.children).forEach(card => {
        const cats = (card.dataset.category || '').split(/\s+/);
        if (f === 'all' || cats.includes(f)) card.style.display = 'flex'; else card.style.display = 'none';
      });
    });
  });

  /* ================= Project modal ================= */
  const modal = document.getElementById('modal');
  const mTitle = document.getElementById('mTitle');
  const mDesc = document.getElementById('mDesc');
  const mImg = document.getElementById('mImg');
  const mPrev = document.getElementById('mPrev');
  const mNext = document.getElementById('mNext');
  const mClose = document.getElementById('modalClose');
  const mLive = document.getElementById('mLive');
  const mCode = document.getElementById('mCode');

  let imgs = [], idx = 0;
  document.querySelectorAll('.view').forEach(v => {
    v.addEventListener('click', (ev) => {
      ev.preventDefault();
      const card = v.closest('.proj-card'); if (!card) return;
      imgs = JSON.parse(card.dataset.images || '[]') || [];
      idx = 0;
      mTitle.textContent = card.dataset.title || '';
      mDesc.textContent = card.dataset.desc || '';
      mImg.src = imgs[0] || '';
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  mPrev?.addEventListener('click', () => { if (!imgs.length) return; idx = (idx - 1 + imgs.length) % imgs.length; mImg.src = imgs[idx]; });
  mNext?.addEventListener('click', () => { if (!imgs.length) return; idx = (idx + 1) % imgs.length; mImg.src = imgs[idx]; });
  mClose?.addEventListener('click', () => modal.setAttribute('aria-hidden', 'true'));
  window.addEventListener('click', e => { if (e.target === modal) modal.setAttribute('aria-hidden', 'true'); });
  window.addEventListener('keydown', e => { if (e.key === 'Escape') modal.setAttribute('aria-hidden','true'); });

  /* ================= Lazy-load model-viewer when hero is near (performance-minded) ================= */
  const phs = Array.from(document.querySelectorAll('.bg-ph'));
  const hero = document.getElementById('home');
  let modelViewerLoaded = false;

  async function createModelFromPlaceholder(ph){
    const src = ph.dataset.src;
    if (!src) return;
    const mv = document.createElement('model-viewer');
    mv.setAttribute('src', src);
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('auto-rotate', '');
    mv.setAttribute('rotation-per-second', '0.02');
    mv.setAttribute('camera-controls', 'false');
    mv.setAttribute('interaction-prompt', 'none');
    mv.style.position = 'fixed';
    // copy inline position and size from placeholder style
    const rectStyles = ph.style;
    mv.style.left = rectStyles.left || '';
    mv.style.top = rectStyles.top || '';
    mv.style.right = rectStyles.right || '';
    mv.style.bottom = rectStyles.bottom || '';
    mv.style.width = rectStyles.width || '';
    mv.style.height = rectStyles.height || '';
    mv.style.opacity = getComputedStyle(ph).opacity || '0.06';
    mv.style.pointerEvents = 'none';
    mv.style.zIndex = '-5';
    document.body.appendChild(mv);
    // allow browser to load progressively
    return mv;
  }

  if (phs.length && hero) {
    const handler = async (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (!modelViewerLoaded) {
            modelViewerLoaded = true;
            // import model-viewer module (polyfill)
            try { await import('https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'); }
            catch (err) { console.warn('model-viewer import failed', err); }
          }
          for (const ph of phs) {
            if (ph.dataset.replaced === '1') continue;
            await createModelFromPlaceholder(ph);
            ph.dataset.replaced = '1';
            ph.remove();
          }
          obs.disconnect();
          break;
        }
      }
    };
    const io = new IntersectionObserver(handler, { root: null, rootMargin: '400px 0px', threshold: 0.01 });
    io.observe(hero);

    // pause model animation when tab not visible
    document.addEventListener('visibilitychange', () => {
      document.querySelectorAll('model-viewer').forEach(m => {
        try { if (document.hidden) m.pause(); else m.play(); } catch(e) {}
      });
    });
  }

  /* ================= contact form basic UX (placeholder behavior) ================= */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');
      const old = btn.innerHTML;
      btn.textContent = 'Sending...';
      setTimeout(() => {
        alert('Message simulated as sent. Replace with email service when ready.');
        btn.innerHTML = old;
        contactForm.reset();
      }, 900);
    });
  }

  // End of DOMContentLoaded
});