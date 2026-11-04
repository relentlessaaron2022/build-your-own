// Cutroom main process: finds ffmpeg, probes media, makes thumbnails, renders.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile, spawn } = require('child_process');
const L = require('./lib.js');

const CANDIDATES = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin'];
function findTool(name, store) {
  const custom = store.get(`${name}Path`);
  if (custom && fs.existsSync(custom)) return custom;
  try {
    const pkg = require(`${name}-static`);
    const p = (typeof pkg === 'string' ? pkg : pkg.path || '').replace('app.asar', 'app.asar.unpacked');
    if (p && fs.existsSync(p)) return p;
  } catch (_) { /* optional dependency */ }
  for (const dir of CANDIDATES) { const p = path.join(dir, name); if (fs.existsSync(p)) return p; }
  return null;
}

const run = (bin, args, opts = {}) => new Promise((resolve, reject) => {
  execFile(bin, args, { maxBuffer: 64 * 1024 * 1024, ...opts }, (err, stdout, stderr) => {
    if (err) reject(new Error(String(stderr || err.message).trim().split('\n').slice(-4).join('\n')));
    else resolve(stdout);
  });
});

module.exports = function cutroom({ handle, send, store }) {
  const tools = () => ({ ffmpeg: findTool('ffmpeg', store), ffprobe: findTool('ffprobe', store) });
  handle('cutroom:tools', () => tools());
  handle('cutroom:setTool', (name, p) => { store.set(`${name}Path`, p); return tools(); });

  handle('cutroom:probe', async (file) => {
    const { ffprobe } = tools();
    if (!ffprobe) throw new Error('ffprobe not found');
    const out = JSON.parse(await run(ffprobe, ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]));
    const v = out.streams.find((s) => s.codec_type === 'video');
    const a = out.streams.find((s) => s.codec_type === 'audio');
    const isStill = !!v && (/^(png|mjpeg|jpeg|webp|bmp|tiff|gif)$/.test(v.codec_name) && !(parseFloat(out.format.duration) > 0.5));
    return {
      duration: parseFloat(out.format.duration) || 0,
      width: v ? v.width : 0, height: v ? v.height : 0,
      hasVideo: !!v, hasAudio: !!a, isStill,
      kind: !v ? 'audio' : isStill ? 'image' : 'video',
    };
  });

  const thumbDir = path.join(os.tmpdir(), 'cutroom-thumbs');
  fs.mkdirSync(thumbDir, { recursive: true });
  handle('cutroom:thumb', async (file, at = 0) => {
    const { ffmpeg } = tools();
    if (!ffmpeg) return null;
    const out = path.join(thumbDir, Buffer.from(file + at).toString('base64url').slice(-40) + '.jpg');
    if (!fs.existsSync(out)) {
      await run(ffmpeg, ['-y', '-loglevel', 'error', '-ss', String(at), '-i', file, '-frames:v', '1', '-vf', 'scale=320:-2', '-q:v', '5', out]).catch(() => null);
    }
    return fs.existsSync(out) ? 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64') : null;
  });

  let job = null;
  handle('cutroom:cancel', () => { if (job) { job.cancelled = true; job.proc && job.proc.kill('SIGKILL'); } return true; });

  // project: { clips, settings, music }, titlePngs: { clipId: base64 }
  handle('cutroom:render', async (project, outFile, titlePngs = {}) => {
    const { ffmpeg } = tools();
    if (!ffmpeg) throw new Error('ffmpeg is not installed. Install it with: brew install ffmpeg');
    if (job) throw new Error('A render is already running');
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cutroom-'));
    job = { cancelled: false, proc: null };
    const progress = (stage, pct, note) => send('cutroom:progress', { stage, pct: Math.max(0, Math.min(100, pct)), note });
    try {
      const clips = project.clips;
      const segs = [];
      for (let i = 0; i < clips.length; i++) {
        if (job.cancelled) throw new Error('Render cancelled');
        const c = clips[i];
        let input = c.path;
        if (c.kind === 'title') {
          input = path.join(work, `title-${i}.png`);
          fs.writeFileSync(input, Buffer.from(titlePngs[c.id] || '', 'base64'));
        }
        const out = path.join(work, `seg-${String(i).padStart(3, '0')}.mp4`);
        progress('Preparing clips', (i / clips.length) * 40, `${i + 1} of ${clips.length}: ${c.name || c.kind}`);
        await run(ffmpeg, L.segmentArgs(c, project.settings, { input, hasAudio: !!c.hasAudio, out }));
        segs.push(out);
      }
      const { args, total } = L.joinArgs(segs, clips, project.settings, { out: outFile, music: project.music });
      await new Promise((resolve, reject) => {
        const p = spawn(ffmpeg, args);
        job.proc = p;
        let err = '';
        p.stderr.on('data', (d) => {
          const s = String(d); err = (err + s).slice(-4000);
          const m = s.match(/time=(\d+):(\d+):([\d.]+)/);
          if (m) { const t = +m[1] * 3600 + +m[2] * 60 + +m[3]; progress('Rendering', 40 + (t / total) * 60, `${t.toFixed(1)}s of ${total.toFixed(1)}s`); }
        });
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(job.cancelled ? 'Render cancelled' : err.trim().split('\n').slice(-4).join('\n')))));
      });
      progress('Done', 100, outFile);
      return { ok: true, file: outFile, duration: total };
    } finally {
      job = null;
      fs.rm(work, { recursive: true, force: true }, () => {});
    }
  });
};
