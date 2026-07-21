// Build: render $...$ / $$...$$ math in content.html with KaTeX,
// inline styles.css and KaTeX CSS (woff2 fonts as data URIs), and emit
// self-contained out/dynamical-systems-cheatsheet.html (poster) and out/a3.html.
import fs from 'node:fs';
import path from 'node:path';
import katex from 'katex';

const here = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8');

const MACROS = {
  '\\R': '\\mathbb{R}',
  '\\Z': '\\mathbb{Z}',
  '\\N': '\\mathbb{N}',
  '\\Q': '\\mathbb{Q}',
  '\\C': '\\mathbb{C}',
  '\\T': '\\mathbb{T}',
  '\\eps': '\\varepsilon',
  '\\Or': '\\operatorname{Or}',
  '\\NW': '\\operatorname{NW}',
  '\\CR': '\\operatorname{CR}',
  '\\Fix': '\\operatorname{Fix}',
  '\\Per': '\\operatorname{Per}',
  '\\intr': '\\operatorname{int}',
  '\\loc': '\\mathrm{loc}',
  '\\Id': '\\mathrm{Id}',
};

const unescape = (tex) =>
  tex.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function renderMath(html) {
  // display math first, then inline; content is authored so `$` only delimits math
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) =>
    katex.renderToString(unescape(tex.trim()), { displayMode: true, throwOnError: true, macros: MACROS, output: 'html' }));
  html = html.replace(/\$([^$]+?)\$/g, (_, tex) =>
    katex.renderToString(unescape(tex.trim()), { displayMode: false, throwOnError: true, macros: MACROS, output: 'html' }));
  return html;
}

function inlineKatexCss() {
  let css = read('node_modules/katex/dist/katex.min.css');
  // keep only the woff2 source per font-face, embedded as data URI
  css = css.replace(/src:[^;}]+/g, (srcDecl) => {
    const m = srcDecl.match(/url\((fonts\/[^)]+\.woff2)\)/);
    if (!m) return srcDecl;
    const data = fs.readFileSync(path.join(here, 'node_modules/katex/dist', m[1])).toString('base64');
    return `src:url(data:font/woff2;base64,${data}) format("woff2")`;
  });
  return css;
}

const content = renderMath(read('content.html'));
const styles = read('styles.css');
const katexCss = inlineKatexCss();

function htmlPage(bodyClass, title, body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${katexCss}</style>
<style>${styles}</style>
</head>
<body class="${bodyClass}">
${body}
</body>
</html>`;
}

// ---- A3 variant: regroup the same panels into explicit pages ----
const sections = {};
for (const m of content.matchAll(/<section class="(?:panel|hero)[^"]*" id="panel-([\w-]+)">[\s\S]*?<\/section>/g)) {
  sections[m[1]] = m[0];
}
const defs = content.match(/<svg width="0"[\s\S]*?<\/svg>/)[0];
const masthead = content.match(/<header class="masthead">[\s\S]*?<\/header>/)[0];

// each page: array of columns; a single-element page = full-width column
const A3_PAGES = [
  [['a0', 'a1'], ['a1b']],
  [['hero']], // the dynamical hierarchy, full width
  [['a2'], ['a3', 'a4']],
  [['b3']], // bifurcation zoo, full width
  [['b1', 'b2'], ['c1', 'symb']],
  [['b4', 'c3', 'c4']], // normal forms + 1D maps + renormalization, full width
  [['c5'], ['c2', 'c6']],
  [['c7'], ['c8', 'legend']],
];

const a3Body = ['<div class="sheet">', masthead.replace('</header>', '</header>')]
  .concat(A3_PAGES.map((cols, i) => {
    const inner = cols
      .map((ids) => `<div class="pcol">\n${ids.map((id) => {
        if (!sections[id]) throw new Error('unknown panel id ' + id);
        return sections[id];
      }).join('\n')}\n</div>`)
      .join('\n');
    return `<div class="page${cols.length === 1 ? ' onecol' : ''}">\n${inner}\n</div>`;
  }))
  .concat(['</div>'])
  .join('\n');

fs.mkdirSync(path.join(here, 'out'), { recursive: true });
fs.writeFileSync(path.join(here, 'out/dynamical-systems-cheatsheet.html'),
  htmlPage('poster', 'Dynamical Systems — Structural Cheatsheet', content));
fs.writeFileSync(path.join(here, 'out/a3.html'),
  htmlPage('a3', 'Dynamical Systems — Cheatsheet (A3 pages)', defs + '\n' + a3Body));
console.log('built out/dynamical-systems-cheatsheet.html and out/a3.html');
