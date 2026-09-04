(function () {
  var SRC = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
  function isPut(v) {
    var blob = String((v && (v.category || '')) + ' ' + (v && (v.embed || v.embedUrl || v.direct || ''))).toLowerCase();
    return blob.indexOf('putarin') !== -1 || blob.indexOf('puterin') !== -1;
  }
  fetch(SRC + '?t=' + Date.now())
    .then(function (r) { return r.text(); })
    .then(function (code) {
      code = code.replace(
        'return (u.includes(\'indoav\') || u.includes(\'userbokep\')) && !isHiddenHome(v);',
        'return ((u.includes(\'indoav\') || u.includes(\'userbokep\') || u.includes(\'putarin\') || u.includes(\'puterin\')) && !isHiddenHome(v));'
      );
      code = code.replace(
        'if (videyCount > 0) {',
        'const putarinCount = allVideos.filter(isPutarinItem).length;\n    if (putarinCount > 0) { cats.unshift({ name: \'Putarin\', count: putarinCount }); }\n    if (videyCount > 0) {'
      );
      code = code.replace(
        'function isVideyCat(name) {',
        'function isPutarinItem(v) {\n    const blob = String((v.category || \'\') + \' \' + (v.embed || v.embedUrl || v.direct || \'\')).toLowerCase();\n    return blob.includes(\'putarin\') || blob.includes(\'puterin\');\n  }\n  function isVideyCat(name) {'
      );
      code = code.replace(
        '    } else if (isVideyCat(currentCategory)) {',
        '    } else if (String(currentCategory).toLowerCase() === \'putarin\') {\n      filtered = allVideos.filter(isPutarinItem);\n    } else if (isVideyCat(currentCategory)) {'
      );
      var s = document.createElement('script');
      s.textContent = code;
      document.body.appendChild(s);
    })
    .catch(function () {
      var s = document.createElement('script');
      s.src = SRC;
      document.body.appendChild(s);
    });
})();
