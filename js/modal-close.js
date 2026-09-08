(function () {
  if (window.__modalCloseFix) return;
  window.__modalCloseFix = true;
  function closeModal() {
    var modal = document.getElementById('videoModal');
    if (!modal) return;
    modal.classList.add('hidden');
    var iframe = document.getElementById('modalIframe');
    if (iframe) iframe.src = 'about:blank';
    var native = document.getElementById('modalNativeVideo');
    if (native) {
      try { native.pause(); } catch (e) {}
      native.removeAttribute('src');
    }
    document.body.style.overflow = '';
  }
  function hook() {
    var btn = document.getElementById('modalClose');
    var backdrop = document.getElementById('modalBackdrop');
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
  }
  hook();
  setTimeout(hook, 400);
  setTimeout(hook, 1500);
})();
