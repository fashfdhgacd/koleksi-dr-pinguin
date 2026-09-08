(function () {
  if (window.__modalCloseFix) return;
  window.__modalCloseFix = true;
  function closeModal() {
    var modal = document.getElementById('videoModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      modal.style.pointerEvents = 'none';
    }
    var iframe = document.getElementById('modalIframe');
    if (iframe) iframe.src = 'about:blank';
    var native = document.getElementById('modalNativeVideo');
    if (native) {
      try { native.pause(); } catch (e) {}
      native.removeAttribute('src');
      native.style.display = 'none';
    }
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.classList.remove('overflow-hidden');
  }
  function openFix(modal) {
    if (!modal) return;
    modal.style.display = '';
    modal.style.pointerEvents = '';
  }
  function hook() {
    var btn = document.getElementById('modalClose');
    var backdrop = document.getElementById('modalBackdrop');
    var modal = document.getElementById('videoModal');
    if (btn && !btn.__closeFix) {
      btn.__closeFix = true;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }, true);
    }
    if (backdrop && !backdrop.__closeFix) {
      backdrop.__closeFix = true;
      backdrop.addEventListener('click', function (e) {
        e.preventDefault();
        closeModal();
      }, true);
    }
    if (modal && !modal.__closeObs) {
      modal.__closeObs = true;
      new MutationObserver(function () {
        if (!modal.classList.contains('hidden')) openFix(modal);
      }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    }
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
