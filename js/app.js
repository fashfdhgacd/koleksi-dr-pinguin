/**
 * Colmek Gallery - Main App
 * JSON format: { title, direct, source, category }
 * Thumbnail: lazy iframe preview (like koleksi-dr-pinguin)
 */
(function () {
  'use strict';

  const PER_PAGE = 30;
  const HERO_COUNT = 8;

  let allVideos = [];
  let filtered = [];
  let currentPage = 1;
  let currentCategory = 'All';
  let currentGenrePage = 1;
  const GENRE_PER_PAGE = 18;
  let heroIndex = 0;
  let heroTimer = null;
  let currentHeroVideo = null;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  function initAgeGate() {
    const gate = $('#ageGate');
    const entered = sessionStorage.getItem('age_ok') === '1';
    if (entered) {
      gate.classList.add('hidden');
      showMain();
      return;
    }
    $('#btnEnter').addEventListener('click', () => {
      sessionStorage.setItem('age_ok', '1');
      gate.classList.add('hidden');
      showMain();
    });
    $('#btnLeave').addEventListener('click', () => {
      window.location.href = 'https://www.google.com';
    });
  }

  function showMain() {
    const main = $('#mainContent');
    main.classList.remove('opacity-0');
    main.classList.add('opacity-100');
  }

  async function loadVideos() {
    try {
      const res = await fetch('data/videos.json?t=' + Date.now());
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      allVideos = Array.isArray(data) ? data : [];
      allVideos = allVideos.map((v, i) => ({
        id: v.id || i + 1,
        title: v.title || 'Untitled',
        thumbnail: v.thumbnail || '',
        embedUrl: v.direct || v.embed || v.embedUrl || '',
        category: v.category || 'Umum',
        date: v.date || '',
        _idx: i
      })).filter(v => v.embedUrl);

      allVideos.sort((a, b) => {
        const da = a.date || '';
        const db = b.date || '';
        if (da && db && da !== db) return db.localeCompare(da);
        if (da && !db) return -1;
        if (!da && db) return 1;
        return (b._idx || 0) - (a._idx || 0);
      });
    } catch (e) {
      console.error('Load videos error:', e);
      allVideos = [];
    }
    filtered = [...allVideos];
    renderAll();
  }

  function getHeroVideos() {
    return allVideos.slice(0, HERO_COUNT);
  }

  function renderHero() {
    const heroes = getHeroVideos();
    if (!heroes.length) return;

    const slidesEl = $('#heroSlides');
    slidesEl.innerHTML = heroes.map((v, i) => {
      return `<div class="hero-slide absolute inset-0 transition-opacity duration-700 ${i === 0 ? 'opacity-100' : 'opacity-0'}" data-idx="${i}">
        <iframe src="${i === 0 ? escapeHtml(v.embedUrl) : ''}" data-src="${escapeHtml(v.embedUrl)}" class="w-full h-full pointer-events-none" frameborder="0" allowfullscreen></iframe>
      </div>`;
    }).join('');

    updateHeroContent(heroes[0]);
    currentHeroVideo = heroes[0];

    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      heroIndex = (heroIndex + 1) % heroes.length;
      showHeroSlide(heroes);
    }, 8000);

    $('#prevSlide').onclick = () => {
      heroIndex = (heroIndex - 1 + heroes.length) % heroes.length;
      showHeroSlide(heroes);
    };
    $('#nextSlide').onclick = () => {
      heroIndex = (heroIndex + 1) % heroes.length;
      showHeroSlide(heroes);
    };
    $('#heroPlay').onclick = () => {
      if (currentHeroVideo) openModal(currentHeroVideo);
    };
  }

  function showHeroSlide(heroes) {
    $$('.hero-slide').forEach((el, i) => {
      el.classList.toggle('opacity-100', i === heroIndex);
      el.classList.toggle('opacity-0', i !== heroIndex);
      const iframe = el.querySelector('iframe');
      if (iframe && i === heroIndex && !iframe.src) {
        iframe.src = iframe.dataset.src || '';
      }
    });
    updateHeroContent(heroes[heroIndex]);
    currentHeroVideo = heroes[heroIndex];
  }

  function updateHeroContent(v) {
    $('#heroTitle').textContent = v.title;
    $('#heroMeta').textContent = `${v.category}`.trim();
  }

  function getCategories() {
    const counts = {};
    allVideos.forEach(v => {
      const c = v.category || 'Umum';
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  function renderCategoryPills() {
    const cats = getCategories();
    const el = $('#categoryPills');
    const show = cats.slice(0, 24);
    el.innerHTML = `
      <button class="cat-pill active" data-cat="All">Semua <span class="opacity-60">${allVideos.length}</span></button>
      ${show.map(c => `
        <button class="cat-pill" data-cat="${escapeHtml(c.name)}">${escapeHtml(c.name)} <span class="opacity-60">${c.count}</span></button>
      `).join('')}
    `;
    $$('.cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.cat-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        applyFilter();
      });
    });
  }

  function renderGenreGrid() {
    const cats = getCategories();
    const el = $('#genreGrid');
    if (!el) return;

    const icons = {
      Amatir: 'fa-user', Umum: 'fa-globe', STW: 'fa-heart', Jilbab: 'fa-mosque',
      ABG: 'fa-graduation-cap', Viral: 'fa-fire', Colmek: 'fa-play', Tobrut: 'fa-star',
      Live: 'fa-broadcast-tower', Chindo: 'fa-flag', Doggy: 'fa-paw', Outdoor: 'fa-tree',
      Toilet: 'fa-restroom', AI: 'fa-robot', Bumil: 'fa-baby', Lesbian: 'fa-venus-double',
      'Open BO': 'fa-handshake', Perselingkuhan: 'fa-heart-broken', Threesome: 'fa-users',
      Bule: 'fa-globe-europe', Scandal: 'fa-exclamation', Artis: 'fa-star', Guru: 'fa-chalkboard-teacher'
    };

    const totalPages = Math.max(1, Math.ceil(cats.length / GENRE_PER_PAGE));
    if (currentGenrePage > totalPages) currentGenrePage = totalPages;

    const start = (currentGenrePage - 1) * GENRE_PER_PAGE;
    const pageCats = cats.slice(start, start + GENRE_PER_PAGE);

    el.innerHTML = pageCats.map(c => `
      <button class="genre-card group text-left px-3 py-2.5 flex items-center gap-2.5" data-cat="${escapeHtml(c.name)}">
        <span class="w-8 h-8 shrink-0 rounded bg-black border border-ink-700 group-hover:border-ph group-hover:bg-ph group-hover:text-black flex items-center justify-center text-ph transition-colors">
          <i class="fas ${icons[c.name] || 'fa-film'} text-xs"></i>
        </span>
        <span class="min-w-0">
          <span class="block font-bold text-xs uppercase truncate group-hover:text-ph">${escapeHtml(c.name)}</span>
          <span class="block text-[10px] text-neutral-500">${c.count} videos</span>
        </span>
      </button>
    `).join('');

    $$('.genre-card').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.cat;
        currentPage = 1;
        $$('.cat-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === currentCategory);
        });
        applyFilter();
        document.getElementById('terbaru').scrollIntoView({ behavior: 'smooth' });
      });
    });

    renderGenrePagination(cats.length);
  }

  function renderGenrePagination(totalCats) {
    const el = $('#genrePagination');
    if (!el) return;

    const total = Math.ceil(totalCats / GENRE_PER_PAGE);
    if (total <= 1) {
      el.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn genre-page-btn" data-page="${currentGenrePage - 1}" ${currentGenrePage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    const maxShow = 5;
    let startP = Math.max(1, currentGenrePage - 2);
    let endP = Math.min(total, startP + maxShow - 1);
    if (endP - startP < maxShow - 1) startP = Math.max(1, endP - maxShow + 1);

    if (startP > 1) {
      html += `<button class="page-btn genre-page-btn" data-page="1">1</button>`;
      if (startP > 2) html += `<span class="text-neutral-600 px-1">...</span>`;
    }
    for (let i = startP; i <= endP; i++) {
      html += `<button class="page-btn genre-page-btn ${i === currentGenrePage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (endP < total) {
      if (endP < total - 1) html += `<span class="text-neutral-600 px-1">...</span>`;
      html += `<button class="page-btn genre-page-btn" data-page="${total}">${total}</button>`;
    }

    html += `<button class="page-btn genre-page-btn" data-page="${currentGenrePage + 1}" ${currentGenrePage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    el.innerHTML = html;
    el.querySelectorAll('.genre-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= total && p !== currentGenrePage) {
          currentGenrePage = p;
          renderGenreGrid();
          document.getElementById('genre').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function applyFilter() {
    if (currentCategory === 'All') {
      filtered = [...allVideos];
    } else {
      filtered = allVideos.filter(v => (v.category || '').toLowerCase() === currentCategory.toLowerCase());
    }
    renderGrid();
    renderPagination();
  }

  function renderGrid() {
    const start = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);
    const el = $('#videoGrid');

    if (!pageItems.length) {
      el.innerHTML = `<div class="col-span-full text-center py-16 text-neutral-500">Tidak ada video ditemukan.</div>`;
      return;
    }

    el.innerHTML = pageItems.map(v => cardHTML(v)).join('');
    bindCardClicks(el);
    lazyLoadIframes(el);
    $('#videoCount').textContent = `${filtered.length} video`;
  }

  function renderTrending() {
    const list = allVideos.slice(0, 10);
    const el = $('#trendingGrid');
    if (!el) return;
    el.innerHTML = list.map(v => cardHTML(v)).join('');
    bindCardClicks(el);
    lazyLoadIframes(el);
  }

  function cardHTML(v) {
    const src = v.embedUrl || '';
    return `
      <article class="video-card group cursor-pointer" data-id="${v.id}">
        <div class="relative aspect-video overflow-hidden bg-black">
          <iframe
            data-src="${escapeHtml(src)}"
            class="absolute inset-0 w-full h-full pointer-events-none"
            loading="lazy"
            allowfullscreen
            frameborder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
          ></iframe>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 pointer-events-none"></div>
          <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div class="w-10 h-10 rounded-full bg-ph text-black flex items-center justify-center shadow-lg">
              <i class="fas fa-play text-xs ml-0.5"></i>
            </div>
          </div>
          <span class="absolute bottom-1 right-1 text-[10px] font-black uppercase bg-black/80 text-ph px-1.5 py-0.5 rounded-sm">${escapeHtml(v.category || 'Umum')}</span>
        </div>
        <div class="pt-1.5 px-0.5 pb-1">
          <h3 class="card-title text-[12px] sm:text-[13px] font-semibold leading-snug line-clamp-2 group-hover:text-ph transition-colors">${escapeHtml(v.title)}</h3>
        </div>
      </article>`;
  }

  function bindCardClicks(container) {
    container.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.id, 10);
        const video = allVideos.find(v => v.id === id);
        if (video) openModal(video);
      });
    });
  }

  function renderPagination() {
    const total = Math.ceil(filtered.length / PER_PAGE);
    const el = $('#pagination');
    if (total <= 1) {
      el.innerHTML = '';
      return;
    }

    let html = '';
    html += `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= Math.min(total, 7); i++) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (total > 7) html += `<span class="text-neutral-600 px-1">...</span><button class="page-btn" data-page="${total}">${total}</button>`;
    html += `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage === total ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;

    el.innerHTML = html;
    el.querySelectorAll('.page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page, 10);
        if (p >= 1 && p <= total && p !== currentPage) {
          currentPage = p;
          renderGrid();
          renderPagination();
          document.getElementById('terbaru').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function toEmbedUrl(url) {
    if (!url) return '';
    try {
      const u = new URL(url);
      if (u.hostname.includes('indoav.app') && u.pathname.startsWith('/d/')) {
        u.pathname = u.pathname.replace(/^\/d\//, '/e/');
        return u.toString();
      }
    } catch (_) {}
    return url;
  }

  function openModal(video) {
    const modal = $('#videoModal');
    const iframe = $('#modalIframe');
    const external = $('#modalOpenExternal');
    const rawUrl = video.embedUrl || video.direct || '';
    const embedUrl = toEmbedUrl(rawUrl);
    $('#modalTitle').textContent = video.title;
    $('#modalMeta').textContent = video.category || '';
    iframe.src = embedUrl;
    if (external) external.href = rawUrl || embedUrl || '#';
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const modal = $('#videoModal');
    const iframe = $('#modalIframe');
    iframe.src = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function initSearch() {
    const overlay = $('#searchOverlay');
    $('#searchToggle').addEventListener('click', () => {
      overlay.classList.remove('hidden');
      $('#searchInput').focus();
    });
    $('#searchClose').addEventListener('click', () => {
      overlay.classList.add('hidden');
      $('#searchInput').value = '';
      $('#searchResults').innerHTML = '';
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
    let debounce;
    $('#searchInput').addEventListener('input', (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => doSearch(e.target.value.trim()), 250);
    });
  }

  function doSearch(q) {
    const el = $('#searchResults');
    if (!q) { el.innerHTML = ''; return; }
    const lower = q.toLowerCase();
    const results = allVideos.filter(v =>
      v.title.toLowerCase().includes(lower) ||
      (v.category || '').toLowerCase().includes(lower)
    ).slice(0, 20);

    if (!results.length) {
      el.innerHTML = '<p class="text-neutral-500 text-center py-6">Tidak ditemukan.</p>';
      return;
    }
    el.innerHTML = results.map(v => `
      <button class="search-item w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-800 transition-colors" data-id="${v.id}">
        <div class="w-16 h-10 rounded-lg bg-surface-800 flex items-center justify-center shrink-0">
          <i class="fas fa-play text-xs text-neutral-600"></i>
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">${escapeHtml(v.title)}</div>
          <div class="text-xs text-neutral-500">${escapeHtml(v.category)}</div>
        </div>
      </button>
    `).join('');
    el.querySelectorAll('.search-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const video = allVideos.find(v => v.id === parseInt(btn.dataset.id, 10));
        if (video) {
          $('#searchOverlay').classList.add('hidden');
          openModal(video);
        }
      });
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function renderAll() {
    renderHero();
    renderCategoryPills();
    renderGenreGrid();
    applyFilter();
    renderTrending();
  }

  function init() {
    initAgeGate();
    initSearch();

    $('#modalClose').addEventListener('click', closeModal);
    $('#modalBackdrop').addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    $('#mobileMenuBtn').addEventListener('click', () => {
      $('#mobileMenu').classList.toggle('hidden');
    });

    $$('#mobileMenu a').forEach(a => {
      a.addEventListener('click', () => $('#mobileMenu').classList.add('hidden'));
    });

    loadVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
