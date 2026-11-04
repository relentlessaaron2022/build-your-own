// Relay engine: plans and runs macros. Pure logic plus an injected `io`
// object for anything that touches the Mac, so it can be tested anywhere.
const fs = require('fs');
const path = require('path');

const pad = (n, w) => String(n).padStart(w, '0');
function stamp(now = new Date()) {
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1, 2)}-${pad(now.getDate(), 2)}`,
    time: `${pad(now.getHours(), 2)}-${pad(now.getMinutes(), 2)}`,
  };
}

// {file} {name} {ext} {dir} {date} {time} {n} {n:3} {clipboard} {var}
function fill(template, vars = {}) {
  return String(template ?? '').replace(/\{(\w+)(?::(\d+))?\}/g, (m, key, width) => {
    if (key === 'n' && vars.n != null) return width ? pad(vars.n, +width) : String(vars.n);
    if (key in vars && vars[key] != null) return String(vars[key]);
    return m;
  });
}
const expandHome = (p, home) => String(p || '').replace(/^~(?=$|\/)/, home || process.env.HOME || '');

function caseOf(s, mode) {
  if (mode === 'lower') return s.toLowerCase();
  if (mode === 'upper') return s.toUpperCase();
  if (mode === 'title') return s.toLowerCase().replace(/(^|[\s_-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  if (mode === 'kebab') return s.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  if (mode === 'snake') return s.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/_+/g, '_');
  return s;
}
const extList = (s) => String(s || '').split(/[\s,]+/).map((e) => e.replace(/^\./, '').toLowerCase()).filter(Boolean);
const matchesExt = (file, list) => !list.length || list.includes(path.extname(file).slice(1).toLowerCase());

function listFiles(folder, exts = []) {
  return fs.readdirSync(folder, { withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.startsWith('.') && matchesExt(d.name, exts))
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

// ---------- rename ----------
function renamePlan(folder, names, opt = {}, extraVars = {}) {
  const start = Number.isFinite(+opt.start) ? +opt.start : 1;
  const plan = [];
  names.forEach((file, i) => {
    const ext = path.extname(file);
    let name = path.basename(file, ext);
    if (opt.find) {
      try {
        const re = opt.regex ? new RegExp(opt.find, 'g') : new RegExp(opt.find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        name = name.replace(re, opt.replace || '');
      } catch (e) { throw new Error(`Find pattern is not valid: ${e.message}`); }
    }
    const vars = { ...stamp(), ...extraVars, name, ext, n: start + i, file, dir: path.basename(folder) };
    let base = opt.pattern ? fill(opt.pattern, vars) : name;
    base = caseOf(base, opt.case);
    // case applies to the name, never the extension, unless the pattern places {ext} itself
    const hasExt = !!opt.pattern && opt.pattern.includes('{ext}');
    const to = (hasExt ? base : base + ext).replace(/[/:]/g, '-');
    plan.push({ from: file, to });
  });
  // flag collisions, both inside the plan and with files that are not being renamed
  const seen = new Map();
  const untouched = new Set(fs.existsSync(folder) ? fs.readdirSync(folder) : []);
  names.forEach((n) => untouched.delete(n));
  for (const p of plan) {
    const key = p.to.toLowerCase();
    if (seen.has(key) || [...untouched].some((u) => u.toLowerCase() === key)) p.conflict = true;
    seen.set(key, p);
  }
  return plan;
}
function applyRename(folder, plan) {
  if (plan.some((p) => p.conflict)) throw new Error('Two files would end up with the same name. Nothing was renamed.');
  const moves = plan.filter((p) => p.from !== p.to);
  // two-phase so a -> b, b -> a style swaps are safe
  const temp = moves.map((p, i) => {
    const t = `.relay-tmp-${process.pid}-${i}-${p.from}`;
    fs.renameSync(path.join(folder, p.from), path.join(folder, t));
    return { ...p, t };
  });
  for (const p of temp) fs.renameSync(path.join(folder, p.t), path.join(folder, p.to));
  return moves.length;
}

// ---------- sort by type ----------
// rules text: "jpg, png, heic -> Images" one per line; "* -> Other" catches the rest
function parseRules(text) {
  return String(text || '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [left, right] = l.split(/\s*->\s*/);
    if (!right) throw new Error(`Rule needs an arrow: "${l}"`);
    return { exts: left.trim() === '*' ? '*' : extList(left), to: right.trim() };
  });
}
function sortPlan(folder, names, rulesText) {
  const rules = parseRules(rulesText);
  const plan = [];
  for (const file of names) {
    const ext = path.extname(file).slice(1).toLowerCase();
    const rule = rules.find((r) => r.exts !== '*' && r.exts.includes(ext)) || rules.find((r) => r.exts === '*');
    if (!rule) continue;
    const destDir = path.isAbsolute(rule.to) ? rule.to : path.join(folder, rule.to);
    plan.push({ from: path.join(folder, file), to: uniquePath(path.join(destDir, file)) });
  }
  return plan;
}
function uniquePath(p) {
  if (!fs.existsSync(p)) return p;
  const ext = path.extname(p), base = p.slice(0, -ext.length || undefined);
  for (let i = 2; ; i++) { const c = `${base} ${i}${ext}`; if (!fs.existsSync(c)) return c; }
}
function applyMoves(plan) {
  for (const m of plan) { fs.mkdirSync(path.dirname(m.to), { recursive: true }); moveFile(m.from, m.to); }
  return plan.length;
}
function moveFile(from, to) {
  try { fs.renameSync(from, to); } catch (e) {
    if (e.code !== 'EXDEV') throw e;
    fs.copyFileSync(from, to); fs.unlinkSync(from); // across disks
  }
}

const { STEPS, TEMPLATES } = require('./catalog.js');

const KEYCODES = { return: 36, enter: 36, tab: 48, space: 49, delete: 51, escape: 53, esc: 53, left: 123, right: 124, down: 125, up: 126, f1: 122, f2: 120, f3: 99, f4: 118, f5: 96 };
function keystrokeScript(keys) {
  const parts = String(keys).toLowerCase().split('+').map((s) => s.trim()).filter(Boolean);
  const key = parts.pop();
  const mods = parts.map((m) => ({ cmd: 'command down', command: 'command down', shift: 'shift down', opt: 'option down', option: 'option down', alt: 'option down', ctrl: 'control down', control: 'control down' }[m])).filter(Boolean);
  const using = mods.length ? ` using {${mods.join(', ')}}` : '';
  const body = key in KEYCODES ? `key code ${KEYCODES[key]}${using}` : `keystroke ${JSON.stringify(key)}${using}`;
  return `tell application "System Events" to ${body}`;
}

// ---------- runner ----------
async function runMacro(macro, io, initialVars = {}) {
  const vars = { ...stamp(), ...initialVars };
  const log = (msg, kind = 'info') => io.log({ at: Date.now(), macro: macro.name, msg, kind });
  log(`▶ ${macro.name}${initialVars.file ? ` (${path.basename(initialVars.file)})` : ''}`);
  const v = (s) => expandHome(fill(s, vars), io.home);
  for (const [i, step] of (macro.steps || []).entries()) {
    if (step.disabled) continue;
    const label = `${i + 1}. ${(STEPS[step.type] || {}).label || step.type}`;
    if (io.cancelled && io.cancelled()) { log('Stopped', 'warn'); return { ok: false, vars }; }
    try {
      switch (step.type) {
        case 'open_app': await io.exec('open', ['-a', v(step.app)]); break;
        case 'open_url': await io.openUrl(v(step.url)); break;
        case 'open_path': await io.openPath(v(step.path)); break;
        case 'shell': {
          const out = await io.shell(v(step.command), step.cwd ? v(step.cwd) : undefined);
          vars.output = String(out || '').trim();
          if (vars.output) log(vars.output.slice(0, 2000));
          break;
        }
        case 'applescript': { const out = await io.exec('osascript', ['-e', fill(step.script, vars)]); vars.output = String(out || '').trim(); break; }
        case 'rename': {
          const folder = v(step.folder);
          const names = listFiles(folder, extList(step.filter));
          const plan = renamePlan(folder, names, { pattern: step.pattern, find: step.find, replace: step.replace, regex: !!step.regex, case: step.case, start: step.start }, vars);
          const n = applyRename(folder, plan);
          log(`${label}: renamed ${n} file${n === 1 ? '' : 's'}`);
          continue;
        }
        case 'sort_files': {
          const folder = v(step.folder);
          const n = applyMoves(sortPlan(folder, listFiles(folder), step.rules));
          log(`${label}: moved ${n} file${n === 1 ? '' : 's'}`);
          continue;
        }
        case 'move_trigger_file': {
          if (!vars.file) throw new Error('This step needs a folder trigger');
          const to = uniquePath(path.join(v(step.to), path.basename(vars.file)));
          fs.mkdirSync(path.dirname(to), { recursive: true });
          moveFile(vars.file, to);
          vars.file = to;
          break;
        }
        case 'resize_images': {
          const folder = v(step.folder);
          const names = listFiles(folder, ['jpg', 'jpeg', 'png', 'heic', 'tif', 'tiff', 'webp', 'gif', 'bmp']);
          const outDir = step.output ? path.join(folder, step.output) : folder;
          fs.mkdirSync(outDir, { recursive: true });
          for (const name of names) {
            const ext = step.format && step.format !== 'keep' ? '.' + (step.format === 'jpeg' ? 'jpg' : step.format) : path.extname(name);
            const out = path.join(outDir, path.basename(name, path.extname(name)) + ext);
            const args = ['-Z', String(parseInt(step.max, 10) || 2048)];
            if (step.format && step.format !== 'keep') args.push('-s', 'format', step.format);
            await io.exec('sips', [...args, path.join(folder, name), '--out', out]);
          }
          log(`${label}: ${names.length} image${names.length === 1 ? '' : 's'}`);
          continue;
        }
        case 'copy_text': await io.clipboard(fill(step.text, { ...vars, clipboard: await io.readClipboard() })); break;
        case 'type_text': await io.exec('osascript', ['-e', `tell application "System Events" to keystroke ${JSON.stringify(fill(step.text, vars))}`]); break;
        case 'keystroke': await io.exec('osascript', ['-e', keystrokeScript(step.keys)]); break;
        case 'notify': await io.notify(fill(step.title, vars), fill(step.body, vars)); break;
        case 'wait': await new Promise((r) => setTimeout(r, Math.max(0, +step.seconds || 0) * 1000)); break;
        case 'set_var': vars[step.name] = fill(step.value, vars); break;
        default: throw new Error(`Unknown step type "${step.type}"`);
      }
      log(label);
    } catch (e) {
      log(`${label} failed: ${e.message}`, 'error');
      if (!step.continueOnError) return { ok: false, vars, error: e.message };
    }
  }
  log(`✓ ${macro.name} finished`, 'ok');
  return { ok: true, vars };
}

module.exports = { fill, expandHome, caseOf, extList, listFiles, renamePlan, applyRename, parseRules, sortPlan, applyMoves, uniquePath, keystrokeScript, runMacro, STEPS, TEMPLATES, stamp };
