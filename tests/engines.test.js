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
const vid = (dur, extra = {}) => ({ id: Cut.uid(), name: 'v', kind: 'video', duration: dur, hasAudio: true, path: '/x.mp4', ...extra });
function project(...clips) {
  const P = Cut.newProject();
  for (const [m, extra] of clips) { P.media.push(m); Cut.mainTrack(P).items.push(Cut.newClip(m, extra)); }
  return P;
}
test('cutroom main track overlaps clips by their transition', () => {
  const P = project([vid(4), { in: 1, out: 4 }], [vid(3), { transition: { type: 'fade', duration: 1 } }], [{ ...vid(0), kind: 'image' }, { duration: 2 }]);
  const lay = Cut.layoutMain(Cut.mainTrack(P).items);
  assert.deepEqual(lay.map((l) => [l.start, l.len]), [[0, 3], [2, 3], [5, 2]]);
  assert.equal(Cut.duration(P), 7);
});
test('cutroom clamps long transitions so neighbours keep room', () => {
  const P = project([vid(1)], [vid(1), { transition: { type: 'spin', duration: 5 } }]);
  assert.ok(Cut.layoutMain(Cut.mainTrack(P).items)[1].transition.duration <= 0.45);
});
test('cutroom speed changes length and source time', () => {
  const c = Cut.newClip(vid(10), { in: 2, out: 6, speed: 2 });
  assert.equal(Cut.itemLength(c), 2);
  assert.equal(Cut.sourceTime(c, 1), 4);
});
test('cutroom keyframes interpolate and presets build moves', () => {
  const it = { tf: Cut.TF(), kf: {} };
  Cut.setKeyframe(it, 'scale', 0, 1); Cut.setKeyframe(it, 'scale', 2, 2);
  assert.equal(Cut.transformAt(it, 0).scale, 1);
  assert.equal(Cut.transformAt(it, 1).scale, 1.5); // inout ease is symmetric at the midpoint
  assert.equal(Cut.transformAt(it, 5).scale, 2);
  Cut.removeKeyframe(it, 'scale', 2);
  assert.equal(it.kf.scale.length, 1);
  Cut.applyMotion(it, 'panLeft', 4);
  assert.ok(Cut.transformAt(it, 0).x > 0 && Cut.transformAt(it, 4).x < 0);
});
test('cutroom animations fade and pop in, then settle', () => {
  const a = { in: { type: 'fade', dur: 1 }, out: { type: 'slideUp', dur: 1 }, loop: { type: 'none' } };
  assert.equal(Cut.animState(a, 0.5, 5).alpha, 0.5);
  assert.equal(Cut.animState(a, 2.5, 5).alpha, 1);
  assert.ok(Cut.animState(a, 4.9, 5).dy < 0);
  assert.equal(Cut.animState({ in: { type: 'typewriter', dur: 1 } }, 0.5, 5).letters.type, 'typewriter');
});
test('cutroom splits clips, keeping keyframes continuous', () => {
  const P = project([vid(10), { in: 0, out: 8 }]);
  const c = Cut.mainTrack(P).items[0];
  Cut.setKeyframe(c, 'x', 0, 0); Cut.setKeyframe(c, 'x', 8, 0.8);
  const right = Cut.splitAt(P, c.id, 2);
  assert.equal(c.out, 2); assert.equal(right.in, 2);
  assert.equal(Cut.mainTrack(P).items.length, 2);
  assert.ok(Math.abs(Cut.transformAt(c, 2).x - Cut.transformAt(right, 0).x) < 1e-9);
  assert.equal(Cut.splitAt(P, c.id, 0.01), null, 'refuses a split at the very edge');
});
test('cutroom places free items on a track with room, adding tracks as needed', () => {
  const P = Cut.newProject();
  Cut.placeItem(P, 'text', Cut.newText('a', { start: 0 }));
  Cut.placeItem(P, 'text', Cut.newText('b', { start: 1 }));
  assert.equal(P.tracks.filter((t) => t.type === 'text').length, 2);
  Cut.placeItem(P, 'effect', Cut.newEffect('vhs', { start: 0 }));
  const types = P.tracks.map((t) => t.type);
  assert.ok(types.indexOf('effect') < types.indexOf('main'), 'effects sit above main');
});
test('cutroom captions: whisper words, grouping, SRT round trip', () => {
  const json = { transcription: [
    { text: ' We', offsets: { from: 0, to: 300 } }, { text: ' don', offsets: { from: 300, to: 500 } }, { text: "'t", offsets: { from: 500, to: 600 } },
    { text: ' stop.', offsets: { from: 600, to: 1000 } }, { text: ' [BLANK_AUDIO]', offsets: { from: 1000, to: 2000 } }, { text: ' Ever', offsets: { from: 2500, to: 2900 } } ] };
  const words = Cut.parseWhisperJSON(json);
  assert.deepEqual(words.map((w) => w.w), ['We', "don't", 'stop.', 'Ever']);
  const caps = Cut.groupCaptions(words, { maxWords: 3 });
  assert.deepEqual(caps.map((c) => c.text), ["We don't stop.", 'Ever']);
  const back = Cut.parseSRT(Cut.toSRT(caps));
  assert.deepEqual(back.map((c) => [c.text, c.start, c.end]), caps.map((c) => [c.text, c.start, c.end]));
  assert.equal(Cut.wordsFor({ text: 'a b', start: 0, end: 2 })[1].t0, 1);
});
test('cutroom beat detection finds clicks', () => {
  const sr = 8000, s = new Float32Array(sr * 4);
  const hits = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
  for (const t of hits) for (let i = 0; i < 400; i++) s[Math.round(t * sr) + i] = Math.sin(i / 3) * Math.exp(-i / 80);
  const beats = Cut.detectBeats(s, sr);
  assert.equal(beats.length, hits.length);
  beats.forEach((b, i) => assert.ok(Math.abs(b - hits[i]) < 0.05, `${b} vs ${hits[i]}`));
});
test('cutroom syncs main clips to beats', () => {
  const img = { id: 'i', kind: 'image', duration: 0 };
  const P = project([img, { duration: 3 }], [img, { duration: 3 }]);
  P.media = [img];
  assert.equal(Cut.syncToBeats(P, [0.5, 1.25, 2]), 2);
  assert.deepEqual(Cut.layoutMain(Cut.mainTrack(P).items).map((l) => l.end), [0.5, 1.25]);
});

const hasFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch (_) { return false; } })();
test('cutroom audio mix renders with speed, voice, fades and silence padding', { skip: !hasFfmpeg && 'ffmpeg not installed' }, () => {
  const dir = tmp();
  const q = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
  const clipPath = path.join(dir, 'a.mp4'), songPath = path.join(dir, 'm.mp3');
  q(['-f', 'lavfi', '-i', 'testsrc=size=320x240:rate=24', '-f', 'lavfi', '-i', 'sine=f=440', '-t', '3', '-shortest', clipPath]);
  q(['-f', 'lavfi', '-i', 'sine=f=220', '-t', '6', songPath]);
  const P = Cut.newProject();
  const v = { id: 'v', kind: 'video', duration: 3, hasAudio: true, path: clipPath }, m = { id: 'm', kind: 'audio', duration: 6, hasAudio: true, path: songPath };
  P.media.push(v, m);
  Cut.mainTrack(P).items.push(Cut.newClip(v, { speed: 1.5, voice: 'deep', denoise: true, fadeOut: 0.5 }));
  Cut.mainTrack(P).items.push(Cut.newClip(v, { transition: { type: 'fade', duration: 0.5 }, voice: 'robot' }));
  Cut.placeItem(P, 'audio', Cut.newAudio(m, { start: 0.5, volume: 0.4, fadeIn: 1, voice: 'none' }));
  Cut.placeItem(P, 'text', Cut.newText('x', { start: 0, duration: 6 })); // visual length 6s sets the total
  const mix = Cut.buildAudioMix(P, { loudness: true });
  assert.equal(mix.count, 3); assert.equal(mix.total, 6);
  const out = path.join(dir, 'mix.wav');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...mix.inputs, '-filter_complex', mix.filter, '-map', mix.out, out]);
  const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).toString());
  assert.ok(Math.abs(dur - 6) < 0.05, `mix is ${dur}s`);
  const voiceOnly = Cut.buildAudioMix(P, { include: 'voice' });
  assert.equal(voiceOnly.count, 2, 'captions skip music');
  const silent = Cut.buildAudioMix(Cut.newProject(), { total: 2 });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-filter_complex', silent.filter, '-map', silent.out, path.join(dir, 's.wav')]);
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
