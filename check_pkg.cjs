var p = require('/app/package.json');
console.log('i18next:', !!p.dependencies.i18next);
console.log('react-i18next:', !!p.dependencies['react-i18next']);
console.log('i18next-browser-languagedetector:', !!p.dependencies['i18next-browser-languagedetector']);
console.log('react-helmet-async:', !!p.dependencies['react-helmet-async']);
