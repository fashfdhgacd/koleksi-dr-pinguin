(async function () {
  try {
    var va = '20260904a';
    var [a, b] = await Promise.all([
      fetch('/js/app.a.js?v=' + va).then(function (r) { return r.text(); }),
      fetch('/js/app.b.js?v=' + va).then(function (r) { return r.text(); })
    ]);
    var s = document.createElement('script');
    s.textContent = a + b;
    document.body.appendChild(s);
  } catch (e) {
    console.error('app load fail', e);
  }
})();
