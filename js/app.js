(function () {
  var SRC = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';

  function patch(code) {
    code = code.replace(
      /function isHiddenHome\(v\) \{[\s\S]*?\n  \}/,
      'function isHiddenHome(v) { return false; }'
    );
    code = code.replace(
      /function isBlockedItem\(v\) \{[\s\S]*?\n  \}/,
      'function isBlockedItem(v) { return false; }'
    );
    code = code.replace(
      /function indoPool\(\) \{[\s\S]*?\n  \}/,
      'function indoPool() { return allVideos.slice(); }'
    );
    code = code.replace(
      'filtered = newestFirst(indoPool(), 40);',
      'filtered = newestFirst(mainPool(), 40);'
    );
    code = code.replace(
      'if (isVideyLink(v)) return false;\n        return matchCategory(v, currentCategory);',
      'return matchCategory(v, currentCategory);'
    );
    return code;
  }

  fetch(SRC + '?t=' + Date.now())
    .then(function (r) { return r.text(); })
    .then(function (code) {
      var s = document.createElement('script');
      s.textContent = patch(code);
      document.body.appendChild(s);
    })
    .catch(function () {
      var s = document.createElement('script');
      s.src = SRC;
      document.body.appendChild(s);
    });
})();
