// Run with: npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const Summon = require('../apps/summon/lib.js');
const M = require('../apps/manuscript/lib.js');
const Cut = require('../apps/cutroom/lib.js');
const Relay = require('../apps/relay/engine.js');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bama-test-'));
const touch = (dir, ...names) => names.forEach((n) => fs.writeFileSync(path.join(dir, n), n));

// ---------------- Summon ----------------
test('summon calculator handles precedence, powers, percent, functions', () => {
  assert.equal(Summon.calc('2+3*4'), 14);
  assert.equal(Summon.calc('(2+3)*4'), 20);
  assert.equal(Summon.calc('2^10'), 1024);
  assert.equal(Summon.calc('15% of 80'), 12);
  assert.equal(Summon.calc('sqrt(144) + 1'), 13);
  assert.equal(Summon.calc('1,250 * 2'), 2500);
  assert.equal(Summon.calc('-4 + 10'), 6);
  assert.equal(Summon.calc('10 / 4'), 2.5);
});
test('summon calculator ignores plain words and bad input', () => {
  assert.equal(Summon.calc('safari'), null);
  assert.equal(Summon.calc('2024'), null); // a bare number is a search, not a sum
  assert.equal(Summon.calc('2 +'), null);
  assert.equal(Summon.calc('alert(1)'), null);
});
test('summon fuzzy score ranks prefix and initials above scattered matches', () => {
  const s = (q, t) => Summon.score(q, t);
  assert.ok(s('saf', 'Safari') > s('saf', 'Stuff And Files'));
  assert.ok(s('vsc', 'Visual Studio Code') > 0);
  assert.equal(s('xyz', 'Safari'), 0);
});
test('summon snippet placeholders expand', () => {
  const out = Summon.expand('{date} {clipboard} {query}', { clipboard: 'hi', now: new Date(2026, 0, 5), query: 'a b' });
  assert.equal(out, '2026-01-05 hi a%20b');
});

// ---------------- Manuscript ----------------
test('manuscript project templates build a draft tree', () => {
  const p = M.createProject('Book', 'nonfiction');
  const draft = p.nodes[p.roots.draft];
  assert.equal(draft.children.length, 3);
  assert.equal(p.target, 50000);
});
test('manuscript move refuses to put a folder inside itself', () => {
  const p = M.createProject('Book', 'novel');
  const partOne = p.nodes[p.nodes[p.roots.draft].children[0]];
  const chapter = p.nodes[partOne.children[0]];
  assert.equal(M.move(p, partOne.id, chapter.id), false);
  assert.equal(M.move(p, chapter.id, p.roots.research), true);
  assert.ok(p.nodes[p.roots.research].children.includes(chapter.id));
});
test('manuscript reorders within the same folder correctly', () => {
  const p = M.createProject('Book', 'blank');
  const root = p.roots.draft;
  const b = M.insert(p, root, 'doc', 'B');
  const c = M.insert(p, root, 'doc', 'C');
  const first = p.nodes[root].children[0];
  M.move(p, c.id, root, 0);
  assert.deepEqual(p.nodes[root].children, [c.id, first, b.id]);
});
test('manuscript compile skips excluded docs and counts words', () => {
  const p = M.createProject('My Book', 'blank');
  const doc = p.nodes[p.nodes[p.roots.draft].children[0]];
  doc.title = 'Opening'; doc.body = 'The city never sleeps. Neither did I.';
  const cut = M.insert(p, p.roots.draft, 'doc', 'Cut scene'); cut.body = 'secret'; cut.status = 'Exclude';
  const md = M.compile(p, 'md');
  assert.match(md, /^# My Book/);
  assert.match(md, /## Opening/);
  assert.ok(!md.includes('secret'));
  assert.equal(M.countWords(p, p.roots.draft), 7 + 1);
  assert.match(M.compile(p, 'html'), /<h2>Opening<\/h2>/);
});
test('manuscript snapshots keep history', () => {
  const n = { body: 'one two', snapshots: [] };
  M.snapshot(n, 'v1'); n.body = 'changed';
  assert.equal(n.snapshots[0].body, 'one two');
  assert.equal(n.snapshots[0].words, 2);
});

// ---------------- Cutroom ----------------
const clips = [
  { kind: 'video', in: 1, out: 4, duration: 10 },
  { kind: 'image', duration: 3, transition: { type: 'fade', duration: 1 } },
  { kind: 'title', duration: 2, transition: { type: 'cut' } },
  { kind: 'image', duration: 0.5, transition: { type: 'fadeblack', duration: 5 } }, // too long, gets clamped
];
test('cutroom timeline overlaps clips by the transition length', () => {
  const tl = Cut.timeline(clips);
  assert.deepEqual(tl.slice(0, 3).map((t) => [t.start, t.len]), [[0, 3], [2, 3], [5, 2]]);
  assert.ok(tl[3].transition.duration <= 0.45, 'transition clamped to the shorter clip');
  assert.equal(Cut.totalDuration(clips), Math.round((tl[3].start + 0.5) * 1000) / 1000);
});
test('cutroom join graph uses xfade for transitions and concat for cuts', () => {
  const { args, total } = Cut.joinArgs(['a', 'b', 'c', 'd'], clips, { preset: '1080p', fps: 30 }, { out: 'o.mp4', music: { path: 'm.mp3', volume: 0.5 } });
  const graph = args[args.indexOf('-filter_complex') + 1];
  assert.match(graph, /xfade=transition=fade:duration=1:offset=2/);
  assert.match(graph, /concat=n=2:v=1:a=1/);
  assert.match(graph, /amix=inputs=2:duration=first:normalize=0/);
  assert.ok(total > 0);
});

const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (_) { return false; } })();
test('cutroom renders a real film with ffmpeg', { skip: !hasFfmpeg && 'ffmpeg not installed' }, () => {
  const dir = tmp();
  const q = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  q(['-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=24', '-f', 'lavfi', '-i', 'sine=f=440', '-t', '2', path.join(dir, 'a.mp4')]);
  q(['-f', 'lavfi', '-i', 'color=c=blue:size=400x600', '-frames:v', '1', path.join(dir, 's.png')]);
  q(['-f', 'lavfi', '-i', 'sine=f=220', '-t', '2', path.join(dir, 'm.mp3')]);
  const cl = [
    { kind: 'video', in: 0, out: 2, duration: 2, look: 'punch' },
    { kind: 'image', duration: 1.5, motion: 'in', transition: { type: 'dissolve', duration: 0.5 } },
  ];
  const settings = { preset: '720p', fps: 24, draft: true, fadeOut: 0.5 };
  const segs = cl.map((c, i) => {
    const out = path.join(dir, `seg${i}.mp4`);
    execFileSync('ffmpeg', Cut.segmentArgs(c, settings, { input: path.join(dir, i ? 's.png' : 'a.mp4'), hasAudio: !i, out }));
    return out;
  });
  const out = path.join(dir, 'final.mp4');
  const { args, total } = Cut.joinArgs(segs, cl, settings, { out, music: { path: path.join(dir, 'm.mp3'), volume: 0.4, fadeOut: 0.5, duck: true } });
  execFileSync('ffmpeg', args, { stdio: 'ignore' });
  const probe = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', out]).toString();
  const info = JSON.parse(probe);
  assert.equal(info.streams[0].width, 1280);
  assert.ok(Math.abs(parseFloat(info.format.duration) - total) < 0.1, `duration ${info.format.duration} vs ${total}`);
});

// ---------------- Relay ----------------
test('relay fills tokens with padding', () => {
  assert.equal(Relay.fill('{project}_{n:3}{ext}', { project: 'Film', n: 7, ext: '.png' }), 'Film_007.png');
  assert.equal(Relay.fill('{missing}', {}), '{missing}');
});
test('relay rename plans, detects collisions, and swaps safely', () => {
  const dir = tmp();
  touch(dir, 'b.png', 'a.png', 'notes.txt');
  const names = Relay.listFiles(dir, ['png']);
  assert.deepEqual(names, ['a.png', 'b.png']);
  const plan = Relay.renamePlan(dir, names, { pattern: 'shot_{n:2}' });
  assert.deepEqual(plan.map((p) => p.to), ['shot_01.png', 'shot_02.png']);
  assert.equal(Relay.applyRename(dir, plan), 2);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['notes.txt', 'shot_01.png', 'shot_02.png']);
  // swap names: shot_01 <-> shot_02 by renaming in reverse order
  const swap = [{ from: 'shot_01.png', to: 'shot_02.png' }, { from: 'shot_02.png', to: 'shot_01.png' }];
  Relay.applyRename(dir, swap);
  assert.equal(fs.readFileSync(path.join(dir, 'shot_02.png'), 'utf8'), 'a.png');
  // collision: everything named the same
  const bad = Relay.renamePlan(dir, ['shot_01.png', 'shot_02.png'], { pattern: 'same' });
  assert.ok(bad.some((p) => p.conflict));
  assert.throws(() => Relay.applyRename(dir, bad), /same name/);
});
test('relay rename find/replace and case modes', () => {
  const dir = tmp(); touch(dir, 'My Final Cut v2.mov');
  const plan = Relay.renamePlan(dir, ['My Final Cut v2.mov'], { find: ' v2', replace: '', case: 'kebab' });
  assert.equal(plan[0].to, 'my-final-cut.mov');
});
test('relay sorts files by rules with a catch-all', () => {
  const dir = tmp(); touch(dir, 'a.JPG', 'b.mp4', 'c.zip', 'd.xyz');
  const plan = Relay.sortPlan(dir, Relay.listFiles(dir), 'jpg -> Images\nmp4 -> Video\n* -> Other');
  Relay.applyMoves(plan);
  assert.ok(fs.existsSync(path.join(dir, 'Images', 'a.JPG')));
  assert.ok(fs.existsSync(path.join(dir, 'Video', 'b.mp4')));
  assert.ok(fs.existsSync(path.join(dir, 'Other', 'd.xyz')));
  assert.throws(() => Relay.parseRules('jpg Images'), /arrow/);
});
test('relay keystroke scripts', () => {
  assert.equal(Relay.keystrokeScript('cmd+shift+4'), 'tell application "System Events" to keystroke "4" using {command down, shift down}');
  assert.equal(Relay.keystrokeScript('return'), 'tell application "System Events" to key code 36');
});
test('relay runs a macro end to end with fake I/O', async () => {
  const dir = tmp(); touch(dir, 'x.png', 'y.png');
  const calls = []; const logs = [];
  const io = {
    home: dir, log: (l) => logs.push(l), exec: async (...a) => calls.push(['exec', ...a]), openUrl: async (u) => calls.push(['url', u]),
    openPath: async () => {}, shell: async () => 'ok', notify: async (t, b) => calls.push(['notify', t, b]),
    clipboard: async (t) => calls.push(['clip', t]), readClipboard: async () => '',
  };
  const macro = { name: 'Test', steps: [
    { type: 'set_var', name: 'project', value: 'Reel' },
    { type: 'rename', folder: '~', filter: 'png', pattern: '{project}-{n}' },
    { type: 'open_app', app: 'Cutroom' },
    { type: 'notify', title: '{project}', body: 'done' },
    { type: 'shell', command: 'false' , disabled: true },
  ] };
  const r = await Relay.runMacro(macro, io);
  assert.equal(r.ok, true);
  assert.deepEqual(fs.readdirSync(dir).sort(), ['Reel-1.png', 'Reel-2.png']);
  assert.deepEqual(calls.find((c) => c[0] === 'exec'), ['exec', 'open', ['-a', 'Cutroom']]);
  assert.deepEqual(calls.find((c) => c[0] === 'notify'), ['notify', 'Reel', 'done']);
  assert.equal(logs.at(-1).kind, 'ok');
});
test('relay stops on a failing step unless told to continue', async () => {
  const io = { log: () => {}, exec: async () => { throw new Error('nope'); }, notify: async () => {} };
  const r = await Relay.runMacro({ name: 'F', steps: [{ type: 'open_app', app: 'X' }, { type: 'notify', title: 'a', body: 'b' }] }, io);
  assert.equal(r.ok, false);
  const r2 = await Relay.runMacro({ name: 'F', steps: [{ type: 'open_app', app: 'X', continueOnError: true }, { type: 'notify', title: 'a', body: 'b' }] }, io);
  assert.equal(r2.ok, true);
});
