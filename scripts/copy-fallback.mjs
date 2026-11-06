import fs from 'node:fs';
// GitHub Pages serves this for query-first clean URLs; app.js switches the static views.
fs.copyFileSync('dist/index.html', 'dist/404.html');
