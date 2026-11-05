// Cutroom main process: ffmpeg/ffprobe/whisper, media analysis, export pipe.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFile, spawn } = require('child_process');
const { app } = require('electron');
const L = require('./lib.js');

const BIN_DIRS = ['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', ...(process.env.PATH || '').split(':')];
function findBin(names, store, key) {
  const custom = key && store.get(key);
  if (custom && fs.existsSync(custom)) return custom;
  for (const dir of BIN_DIRS) for (const n of names) { const p = path.join(dir, n); if (dir && fs.existsSync(p)) return p; }
  return null;
}
const run = (bin, args, opts = {}) => new Promise((resolve, reject) => {
  execFile(bin, args, { maxBuffer: 512 * 1024 * 1024, encoding: opts.encoding || 'utf8', ...opts }, (err, stdout, stderr) => {
    if (err) reject(new Error(String(stderr || err.message).trim().split('\n').slice(-4).join('\n')));
    else resolve(stdout);
  });
});
const hashOf = (...parts) => crypto.createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);

module.exports = function cutroom({ handle, send, store }) {
  const tools = () => ({
    ffmpeg: findBin(['ffmpeg'], store, 'ffmpegPath'),
    ffprobe: findBin(['ffprobe'], store, 'ffprobePath'),
    whisper: findBin(['whisper-cli', 'whisper-cpp', 'whisper'], store, 'whisperPath'),
  });
  const need = (name) => { const p = tools()[name]; if (!p) throw new Error(`${name} is not installed. In Terminal run: brew install ${name === 'whisper' ? 'whisper-cpp' : 'ffmpeg'}`); return p; };
  const cache = path.join(app.getPath('userData'), 'cutroom-cache');
  const assets = path.join(app.getPath('userData'), 'cutroom-assets');
  const models = path.join(app.getPath('userData'), 'whisper-models');
  [cache, assets, models].forEach((d) => fs.mkdirSync(d, { recursive: true }));
  const progress = (stage, pct, note) => send('cutroom:progress', { stage, pct, note });

  handle('cutroom:tools', () => tools());
  handle('cutroom:paths', () => ({ cache, assets, models }));

  handle('cutroom:probe', async (file) => {
    const out = JSON.parse(await run(need('ffprobe'), ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', file]));
    const v = out.streams.find((s) => s.codec_type === 'video' && !(s.disposition && s.disposition.attached_pic));
    const a = out.streams.find((s) => s.codec_type === 'audio');
    const dur = parseFloat(out.format.duration) || 0;
    // a still has a video stream but no real duration (animated GIFs count as video)
    const still = !!v && (!(dur > 0.5) || /\.(png|jpe?g|webp|bmp|tiff?|heic|heif)$/i.test(file));
    let w = v ? v.width : 0, h = v ? v.height : 0;
    const rot = v && ((v.side_data_list || []).find((d) => d.rotation != null) || {}).rotation;
    if (Math.abs(rot) === 90) [w, h] = [h, w];
    return { duration: dur, width: w, height: h, hasAudio: !!a, codec: v ? v.codec_name : a ? a.codec_name : '', kind: !v ? 'audio' : still ? 'image' : 'video' };
  });

  // Converted copy for formats the preview cannot decode (ProRes, some HEVC, AVI, MKV…), and for HEIC stills.
  handle('cutroom:proxy', async (file, kind) => {
    const out = path.join(cache, `${hashOf(file, fs.statSync(file).mtimeMs, 'p2')}.${kind === 'image' ? 'jpg' : kind === 'audio' ? 'm4a' : 'mp4'}`);
    if (fs.existsSync(out)) return out;
    progress('Optimizing media', 0, path.basename(file));
    const args = kind === 'image' ? ['-y', '-loglevel', 'error', '-i', file, '-frames:v', '1', '-q:v', '2', out]
      : kind === 'audio' ? ['-y', '-loglevel', 'error', '-i', file, '-vn', '-c:a', 'aac', '-b:a', '256k', out]
      : ['-y', '-loglevel', 'error', '-i', file, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', out];
    await run(need('ffmpeg'), args);
    progress('Optimizing media', 100, '');
    return out;
  });

  handle('cutroom:reverse', async (file, from, to) => {
    const out = path.join(cache, `${hashOf(file, from, to, 'rev')}.mp4`);
    if (fs.existsSync(out)) return out;
    if (to - from > 120) throw new Error('Reverse works on clips up to 2 minutes. Split the clip first.');
    progress('Reversing clip', 0, '');
    await run(need('ffmpeg'), ['-y', '-loglevel', 'error', '-ss', String(from), '-t', String(to - from), '-i', file,
      '-vf', 'reverse', '-af', 'areverse', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '256k', out])
      .catch(async () => run(need('ffmpeg'), ['-y', '-loglevel', 'error', '-ss', String(from), '-t', String(to - from), '-i', file, '-vf', 'reverse', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', out]));
    progress('Reversing clip', 100, '');
    return out;
  });

  // Filmstrip of N frames side by side, for the timeline.
  handle('cutroom:strip', async (file, dur, count = 8) => {
    const out = path.join(cache, `${hashOf(file, count, 'strip')}.jpg`);
    if (!fs.existsSync(out)) {
      const fps = Math.max(0.01, count / Math.max(0.5, dur));
      await run(need('ffmpeg'), ['-y', '-loglevel', 'error', '-i', file, '-vf', `fps=${fps.toFixed(4)},scale=-2:72,tile=${count}x1`, '-frames:v', '1', '-q:v', '6', out]).catch(() => null);
    }
    return fs.existsSync(out) ? 'data:image/jpeg;base64,' + fs.readFileSync(out).toString('base64') : null;
  });

  const pcm = async (file, sr) => {
    const buf = await run(need('ffmpeg'), ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { encoding: 'buffer' });
    const copy = new Uint8Array(buf.length - (buf.length % 4)); copy.set(buf.subarray(0, copy.length));
    return new Float32Array(copy.buffer);
  };
  // Waveform peaks, 50 per second, 0..1.
  handle('cutroom:peaks', async (file) => {
    const key = path.join(cache, `${hashOf(file, 'peaks2')}.json`);
    if (fs.existsSync(key)) return JSON.parse(fs.readFileSync(key, 'utf8'));
    const s = await pcm(file, 2000).catch(() => new Float32Array(0));
    const out = [];
    let max = 0;
    for (let i = 0; i < s.length; i += 40) { let m = 0; for (let j = i; j < i + 40 && j < s.length; j++) m = Math.max(m, Math.abs(s[j])); out.push(m); max = Math.max(max, m); }
    const norm = out.map((v) => Math.round((max ? v / max : 0) * 100) / 100);
    fs.writeFileSync(key, JSON.stringify(norm));
    return norm;
  });
  handle('cutroom:beats', async (file, sensitivity = 1.4) => L.detectBeats(await pcm(file, 8000), 8000, { sensitivity }));

  // Save something the page made (voiceover, freeze frame, sound effect).
  handle('cutroom:saveAsset', (name, bytes) => {
    const p = path.join(assets, `${Date.now()}-${name.replace(/[^\w.-]+/g, '_')}`);
    fs.writeFileSync(p, Buffer.from(bytes));
    return p;
  });

  // ---------- export: the page renders frames, ffmpeg encodes them with the audio mix ----------
  let job = null;
  handle('cutroom:export:start', async (opts) => {
    if (job) throw new Error('An export is already running');
    const ffmpeg = need('ffmpeg');
    const { out, fps, quality = 'high', encoder = 'x264', mix } = opts;
    const crf = { high: 17, standard: 21, small: 26 }[quality] || 18;
    const pixels = opts.w * opts.h;
    const mbps = Math.round((pixels / (1920 * 1080)) * ({ high: 16, standard: 9, small: 5 }[quality] || 12) * (fps > 30 ? 1.5 : 1));
    const venc = encoder === 'hardware'
      ? ['-c:v', 'h264_videotoolbox', '-b:v', `${mbps}M`, '-maxrate', `${mbps * 1.5}M`, '-bufsize', `${mbps * 2}M`, '-allow_sw', '1', '-profile:v', 'high']
      : ['-c:v', 'libx264', '-preset', opts.draft ? 'ultrafast' : 'medium', '-crf', String(crf), '-profile:v', 'high'];
    const filter = `[0:v]scale=in_range=pc:out_range=tv,format=yuv420p[vout];${mix.filter}`;
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', 'pipe:0',
      ...mix.inputs, '-filter_complex', filter, '-map', '[vout]', '-map', mix.out, ...venc,
      '-r', String(fps), '-c:a', 'aac', '-b:a', '256k', '-t', String(mix.total), '-movflags', '+faststart', out];
    const proc = spawn(ffmpeg, args);
    let err = '';
    proc.stderr.on('data', (d) => { err = (err + d).slice(-6000); });
    const done = new Promise((resolve) => proc.on('close', (code) => resolve(code)));
    proc.stdin.on('error', () => {});
    job = { proc, done, err: () => err, out, cancelled: false };
    return true;
  });
  handle('cutroom:export:frame', (bytes) => new Promise((resolve, reject) => {
    if (!job) return reject(new Error('No export running'));
    if (job.proc.exitCode != null) return reject(new Error(job.err().trim().split('\n').slice(-4).join('\n') || 'ffmpeg stopped'));
    if (job.proc.stdin.write(Buffer.from(bytes))) resolve(true);
    else job.proc.stdin.once('drain', () => resolve(true));
  }));
  handle('cutroom:export:finish', async () => {
    if (!job) throw new Error('No export running');
    const j = job;
    j.proc.stdin.end();
    const code = await j.done;
    job = null;
    if (code !== 0) throw new Error(j.cancelled ? 'Export cancelled' : j.err().trim().split('\n').slice(-5).join('\n'));
    return { ok: true, file: j.out, size: fs.statSync(j.out).size };
  });
  handle('cutroom:export:cancel', () => {
    if (job) { job.cancelled = true; job.proc.kill('SIGKILL'); fs.rm(job.out, { force: true }, () => {}); job = null; }
    return true;
  });

  // ---------- auto captions (whisper.cpp) ----------
  const MODELS = { 'base.en': 148, base: 148, 'small.en': 488, small: 488, 'medium.en': 1530 };
  const modelPath = (name) => path.join(models, `ggml-${name}.bin`);
  handle('cutroom:whisper:status', () => ({
    bin: tools().whisper,
    models: Object.fromEntries(Object.keys(MODELS).map((m) => [m, fs.existsSync(modelPath(m))])),
    sizes: MODELS,
  }));
  handle('cutroom:whisper:download', async (name) => {
    if (!MODELS[name]) throw new Error('Unknown model');
    const dest = modelPath(name), part = dest + '.part';
    const res = await fetch(`https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${name}.bin`);
    if (!res.ok || !res.body) throw new Error(`Download failed (${res.status})`);
    const total = Number(res.headers.get('content-length')) || MODELS[name] * 1e6;
    const file = fs.createWriteStream(part);
    let got = 0, lastPct = -1;
    for await (const chunk of res.body) {
      if (!file.write(chunk)) await new Promise((r) => file.once('drain', r));
      got += chunk.length;
      const pct = Math.floor((got / total) * 100);
      if (pct !== lastPct) { lastPct = pct; progress('Downloading speech model', pct, `${Math.round(got / 1e6)} of ${Math.round(total / 1e6)} MB`); }
    }
    await new Promise((r) => file.end(r));
    fs.renameSync(part, dest);
    return true;
  });
  handle('cutroom:transcribe', async (mix, model = 'base.en', lang = 'en') => {
    const bin = need('whisper');
    if (!fs.existsSync(modelPath(model))) throw new Error('Speech model is not downloaded yet');
    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'cutroom-cap-'));
    try {
      const wav = path.join(work, 'voice.wav');
      progress('Preparing audio', 5, '');
      await run(need('ffmpeg'), ['-y', '-loglevel', 'error', ...mix.inputs, '-filter_complex', mix.filter, '-map', mix.out, '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]);
      const base = path.join(work, 'out');
      const threads = String(Math.max(2, Math.min(8, os.cpus().length - 1)));
      await new Promise((resolve, reject) => {
        const p = spawn(bin, ['-m', modelPath(model), '-f', wav, '-oj', '-of', base, '-ml', '1', '-sow', '-l', lang, '-t', threads, '-pp']);
        let err = '';
        const onData = (d) => {
          const s = String(d); err = (err + s).slice(-4000);
          const m = s.match(/progress\s*=\s*(\d+)%/);
          if (m) progress('Transcribing speech', 10 + +m[1] * 0.88, `${m[1]}%`);
        };
        p.stdout.on('data', onData); p.stderr.on('data', onData);
        p.on('error', reject);
        p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err.trim().split('\n').slice(-4).join('\n')))));
      });
      const words = L.parseWhisperJSON(fs.readFileSync(base + '.json', 'utf8'));
      progress('Transcribing speech', 100, `${words.length} words`);
      return words;
    } finally {
      fs.rm(work, { recursive: true, force: true }, () => {});
    }
  });
};
