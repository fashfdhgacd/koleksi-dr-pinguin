(function () {
  var SRC = 'https://cdn.jsdelivr.net/gh/fashfdhgacd/koleksi-dr-pinguin@64ee4c14c60cca54f5f1cdd6f7b6892c43a2b0a1/js/app.js';
  fetch(SRC + '?t=' + Date.now())
    .then(function (r) { return r.text(); })
    .then(function (code) {
      code = code.replace(
        "return (u.includes('indoav') || u.includes('userbokep')) && !isHiddenHome(v);",
        "return ((u.includes('indoav') || u.includes('userbokep') || u.includes('putarin') || u.includes('puterin')) && !isHiddenHome(v));"
      );
      code = code.replace(
        "function isVideyCat(name) {",
        "function isPutarinItem(v) {\n    const blob = String((v.category || '') + ' ' + (v.embed || v.embedUrl || v.direct || '')).toLowerCase();\n    return blob.includes('putarin') || blob.includes('puterin');\n  }\n  function isJavItem(v) {\n    const blob = String((v.category || '') + ' ' + (v.title || '') + ' ' + (Array.isArray(v.tags) ? v.tags.join(' ') : '')).toLowerCase();\n    return /\\bjav\\b|jepang|japan|tokyo[- ]?hot|caribbean|1pondo|heyzo|s-cute|prestige/.test(blob);\n  }\n  function isVideyCat(name) {"
      );
      code = code.replace(
        "    if (newCount > 0) {\n      cats.unshift({ name: 'Upload Terbaru', count: newCount });\n    }\n    return cats;",
        "    cats = cats.filter(c => String(c.name).toLowerCase() !== 'putarin' && String(c.name).toLowerCase() !== 'jav');\n    if (newCount > 0) {\n      cats.unshift({ name: 'Upload Terbaru', count: newCount });\n    }\n    const putarinCount = allVideos.filter(isPutarinItem).length;\n    const javCount = allVideos.filter(isJavItem).length;\n    const terbaruAt = cats.findIndex(c => c.name === 'Upload Terbaru');\n    const insertAt = terbaruAt >= 0 ? terbaruAt + 1 : 0;\n    if (javCount > 0) cats.splice(insertAt, 0, { name: 'JAV', count: javCount });\n    if (putarinCount > 0) cats.splice(insertAt, 0, { name: 'Putarin', count: putarinCount });\n    return cats;"
      );
      code = code.replace(
        "    } else if (isVideyCat(currentCategory)) {",
        "    } else if (String(currentCategory).toLowerCase() === 'putarin') {\n      filtered = allVideos.filter(isPutarinItem);\n    } else if (String(currentCategory).toLowerCase() === 'jav') {\n      filtered = allVideos.filter(isJavItem);\n    } else if (isVideyCat(currentCategory)) {"
      );
      code = code.replace(
        "'Upload Terbaru': 'fa-clock', ExaStream: 'fa-play-circle', Videy: 'fa-video',",
        "'Upload Terbaru': 'fa-clock', Putarin: 'fa-play', JAV: 'fa-film', ExaStream: 'fa-play-circle', Videy: 'fa-video',"
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
