(function () {
  function makePill() {
    var a = document.createElement('a');
    a.href = '/putarin';
    a.setAttribute('data-putarin-nav', '1');
    a.className = 'cat-pill';
    a.textContent = 'JAV 18+';
    a.style.textDecoration = 'none';
    return a;
  }
  function makeCard() {
    var a = document.createElement('a');
    a.href = '/putarin';
    a.setAttribute('data-putarin-nav', '1');
    a.className = 'genre-card group';
    a.style.textDecoration = 'none';
    a.innerHTML = '<div class="w-10 h-10 rounded bg-[#ff9000]/15 text-[#ff9000] flex items-center justify-center mb-3"><i class="fas fa-film text-sm"></i></div><div class="font-semibold text-sm truncate">JAV 18+</div><div class="text-xs text-neutral-500 mt-0.5">Halaman sendiri</div>';
    return a;
  }
  function inject() {
    var pills = document.getElementById('categoryPills');
    if (pills && !pills.querySelector('[data-putarin-nav]')) {
      var pill = makePill();
      if (pills.children.length > 1) pills.insertBefore(pill, pills.children[1]);
      else pills.appendChild(pill);
    }
    var grid = document.getElementById('genreGrid');
    if (grid && !grid.querySelector('[data-putarin-nav]')) {
      var card = makeCard();
      if (grid.firstChild) grid.insertBefore(card, grid.firstChild);
      else grid.appendChild(card);
    }
  }
  inject();
  setTimeout(inject, 400);
  setTimeout(inject, 1200);
  setTimeout(inject, 2500);
})();
