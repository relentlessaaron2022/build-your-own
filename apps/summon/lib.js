// Summon core logic: fuzzy matching, a safe calculator, and snippet expansion.
// Works in the page (window.SummonLib) and in Node tests (module.exports).
(function (root) {
  // ---- fuzzy score: higher is better, 0 means no match ----
  function score(query, text) {
    if (!query) return 1;
    const q = query.toLowerCase().trim();
    const t = String(text).toLowerCase();
    if (!q) return 1;
    if (t === q) return 1000;
    if (t.startsWith(q)) return 800 - t.length;
    // word-initial match: "vsc" -> "Visual Studio Code"
    const initials = t.split(/[\s\-_.]+/).map((w) => w[0] || '').join('');
    if (initials.startsWith(q)) return 700 - t.length;
    const idx = t.indexOf(q);
    if (idx >= 0) return 600 - idx - t.length / 10;
    // subsequence with gap penalty
    let ti = 0, gaps = 0, last = -1;
    for (const ch of q) {
      const found = t.indexOf(ch, ti);
      if (found < 0) return 0;
      if (last >= 0) gaps += found - last - 1;
      last = found; ti = found + 1;
    }
    return Math.max(1, 300 - gaps * 8 - t.length / 5);
  }

  // ---- calculator: recursive descent, no eval ----
  const FUNCS = {
    sqrt: Math.sqrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
    sin: Math.sin, cos: Math.cos, tan: Math.tan, log: Math.log10, ln: Math.log,
  };
  const CONSTS = { pi: Math.PI, e: Math.E };

  function calc(input) {
    let src = String(input).trim().toLowerCase().replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/');
    if (!src || !/[\d)]/.test(src)) return null;
    // "15% of 80"
    const pct = src.match(/^([\d.]+)\s*%\s*of\s*([\d.]+)$/);
    if (pct) return round(parseFloat(pct[1]) / 100 * parseFloat(pct[2]));
    if (!/[+\-*/^%()]|sqrt|abs|round|floor|ceil|sin|cos|tan|log|ln|pi/.test(src)) return null;
    let i = 0;
    const peek = () => src[i];
    const skip = () => { while (src[i] === ' ') i++; };
    function num() {
      skip();
      const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
      if (m) { i += m[0].length; return parseFloat(m[0]); }
      const w = src.slice(i).match(/^[a-z]+/);
      if (w) {
        i += w[0].length;
        if (w[0] in CONSTS) return CONSTS[w[0]];
        if (w[0] in FUNCS) { skip(); if (peek() !== '(') throw new Error('expected ('); i++; const v = expr(); skip(); if (peek() !== ')') throw new Error('expected )'); i++; return FUNCS[w[0]](v); }
        throw new Error('unknown ' + w[0]);
      }
      if (peek() === '(') { i++; const v = expr(); skip(); if (peek() !== ')') throw new Error('expected )'); i++; return v; }
      if (peek() === '-') { i++; return -factor(); }
      if (peek() === '+') { i++; return factor(); }
      throw new Error('unexpected ' + peek());
    }
    function factor() {
      let base = num(); skip();
      if (peek() === '%') { i++; base = base / 100; skip(); }
      if (peek() === '^') { i++; return Math.pow(base, factor()); }
      return base;
    }
    function term() {
      let v = factor();
      for (;;) {
        skip();
        const op = peek();
        if (op === '*') { i++; v *= factor(); }
        else if (op === '/') { i++; v /= factor(); }
        else return v;
      }
    }
    function expr() {
      let v = term();
      for (;;) {
        skip();
        const op = peek();
        if (op === '+') { i++; v += term(); }
        else if (op === '-') { i++; v -= term(); }
        else return v;
      }
    }
    try {
      const v = expr(); skip();
      if (i !== src.length || !isFinite(v)) return null;
      return round(v);
    } catch (_) { return null; }
  }
  const round = (v) => Math.round(v * 1e10) / 1e10;

  // ---- snippet placeholders ----
  function expand(text, { clipboard = '', now = new Date(), query = '' } = {}) {
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return String(text)
      .replace(/\{date\}/g, date)
      .replace(/\{time\}/g, time)
      .replace(/\{clipboard\}/g, clipboard)
      .replace(/\{query\}/g, encodeURIComponent(query))
      .replace(/\{rawquery\}/g, query);
  }

  const api = { score, calc, expand };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SummonLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
