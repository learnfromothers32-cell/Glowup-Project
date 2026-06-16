var deps = ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'react-helmet-async', 'html-parse-stringify'];
deps.forEach(function(d) {
  try { require(d); console.log(d + ': OK'); }
  catch(e) { console.log(d + ': ' + e.message); }
});
