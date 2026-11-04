// Cutroom render engine: timeline math + ffmpeg argument builders.
// Two passes: (1) every clip becomes a normalized segment (same size, fps,
// pixel format, stereo 48k audio); (2) segments are chained with cuts or
// crossfade transitions, then the music bed is mixed under the result.
(function (root) {
  const PRESETS = {
    '1080p': { label: 'Widescreen 1920×1080', w: 1920, h: 1080 },
    '720p': { label: 'HD 1280×720', w: 1280, h: 720 },
    '4k': { label: '4K 3840×2160', w: 3840, h: 2160 },
    vertical: { label: 'Reels / Shorts / TikTok 1080×1920', w: 1080, h: 1920 },
    square: { label: 'Square 1080×1080', w: 1080, h: 1080 },
    portrait: { label: 'Feed portrait 1080×1350', w: 1080, h: 1350 },
  };
  const LOOKS = {
    none: { label: 'Original', vf: '' },
    warm: { label: 'Golden hour', vf: 'colorbalance=rs=.08:gs=.02:bs=-.08,eq=saturation=1.1' },
    cool: { label: 'Blue steel', vf: 'colorbalance=rs=-.06:bs=.08,eq=saturation=.95' },
    punch: { label: 'Punch', vf: 'eq=contrast=1.15:saturation=1.3' },
    noir: { label: 'Noir', vf: 'hue=s=0,eq=contrast=1.25' },
    faded: { label: 'Faded film', vf: 'eq=contrast=.88:brightness=.03:saturation=.8' },
    teal: { label: 'Teal & orange', vf: 'colorbalance=rs=.06:bs=-.06:rh=-.05:bh=.08,eq=saturation=1.15' },
  };
  const TRANSITIONS = {
    cut: 'Cut', fade: 'Crossfade', fadeblack: 'Dip to black', fadewhite: 'Dip to white',
    wipeleft: 'Wipe', slideleft: 'Slide', circleopen: 'Iris open', dissolve: 'Dissolve', smoothleft: 'Smooth push',
  };

  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  const r3 = (v) => Math.round(v * 1000) / 1000;

  function clipLength(c) {
    if (c.kind === 'video') return Math.max(0.1, num(c.out, c.duration) - num(c.in, 0));
    return Math.max(0.1, num(c.duration, 4));
  }

  // Transition into clip i, clamped so it never eats a whole clip.
  function transitionFor(clips, i) {
    if (i === 0) return { type: 'cut', duration: 0 };
    const t = clips[i].transition || { type: 'cut', duration: 0 };
    if (!t.type || t.type === 'cut') return { type: 'cut', duration: 0 };
    const max = Math.min(clipLength(clips[i - 1]), clipLength(clips[i])) * 0.9;
    return { type: t.type, duration: r3(Math.max(0.1, Math.min(num(t.duration, 0.8), max))) };
  }

  // Where each clip starts on the program timeline.
  function timeline(clips) {
    let L = 0;
    return clips.map((c, i) => {
      const t = transitionFor(clips, i);
      const start = i === 0 ? 0 : L - t.duration;
      const len = clipLength(c);
      L = start + len;
      return { start: r3(start), len: r3(len), transition: t };
    });
  }
  const totalDuration = (clips) => {
    const tl = timeline(clips);
    return tl.length ? r3(tl[tl.length - 1].start + tl[tl.length - 1].len) : 0;
  };

  // ---------- pass 1: one clip -> normalized segment ----------
  function segmentArgs(clip, settings, { input, hasAudio, out }) {
    const P = PRESETS[settings.preset] || PRESETS['1080p'];
    const fps = num(settings.fps, 30);
    const len = r3(clipLength(clip));
    const fill = (clip.fit || settings.fit) === 'fill';
    const scale = fill
      ? `scale=${P.w}:${P.h}:force_original_aspect_ratio=increase,crop=${P.w}:${P.h}`
      : `scale=${P.w}:${P.h}:force_original_aspect_ratio=decrease,pad=${P.w}:${P.h}:(ow-iw)/2:(oh-ih)/2:color=black`;
    const look = (LOOKS[clip.look] || LOOKS.none).vf;
    const args = ['-y', '-hide_banner', '-loglevel', 'error'];
    let vchain;
    if (clip.kind === 'video') {
      args.push('-ss', String(r3(num(clip.in, 0))), '-t', String(len), '-i', input);
      vchain = `[0:v]${scale},setsar=1,fps=${fps}`;
      if (num(clip.speed, 1) !== 1) vchain = `[0:v]setpts=PTS/${num(clip.speed, 1)},${scale},setsar=1,fps=${fps}`;
    } else {
      // still image or rendered title card
      args.push('-loop', '1', '-framerate', String(fps), '-t', String(len), '-i', input);
      if (clip.motion && clip.motion !== 'none') {
        const frames = Math.round(len * fps);
        // render the still larger, then zoompan for a slow push
        const big = `scale=${P.w * 2}:${P.h * 2}:force_original_aspect_ratio=${fill ? 'increase' : 'decrease'}` +
          (fill ? `,crop=${P.w * 2}:${P.h * 2}` : `,pad=${P.w * 2}:${P.h * 2}:(ow-iw)/2:(oh-ih)/2:color=black`);
        const z = clip.motion === 'out'
          ? `z='if(eq(on,0),1.25,max(1.0,zoom-${(0.25 / frames).toFixed(6)}))'`
          : `z='min(1.0+on*${(0.25 / frames).toFixed(6)},1.25)'`;
        vchain = `[0:v]${big},setsar=1,zoompan=${z}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${P.w}x${P.h}:fps=${fps}`;
      } else {
        vchain = `[0:v]${scale},setsar=1,fps=${fps}`;
      }
    }
    args.push('-f', 'lavfi', '-t', String(len), '-i', 'anullsrc=r=48000:cl=stereo');
    vchain += `${look ? ',' + look : ''},format=yuv420p,trim=duration=${len},setpts=PTS-STARTPTS[v]`;
    const vol = num(clip.volume, 1);
    let achain;
    if (clip.kind === 'video' && hasAudio && vol > 0) {
      const tempo = num(clip.speed, 1) !== 1 ? `,atempo=${Math.min(2, Math.max(0.5, num(clip.speed, 1)))}` : '';
      // pad with silence so audio always matches the video length exactly
      achain = `[0:a]aresample=48000,aformat=channel_layouts=stereo${tempo},volume=${vol}[a0];[a0][1:a]amix=inputs=2:duration=longest:normalize=0,atrim=duration=${len},asetpts=PTS-STARTPTS[a]`;
    } else {
      achain = `[1:a]atrim=duration=${len},asetpts=PTS-STARTPTS[a]`;
    }
    args.push('-filter_complex', `${vchain};${achain}`, '-map', '[v]', '-map', '[a]',
      '-c:v', 'libx264', '-preset', settings.draft ? 'ultrafast' : 'veryfast', '-crf', settings.draft ? '28' : '18',
      '-r', String(fps), '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', out);
    return args;
  }

  // ---------- pass 2: chain segments + music ----------
  function joinArgs(segments, clips, settings, { out, music }) {
    const tl = timeline(clips);
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-stats'];
    segments.forEach((s) => args.push('-i', s));
    const parts = [];
    const fps0 = num(settings.fps, 30);
    // concat and xfade disagree about timebases unless every input shares one
    segments.forEach((_, i) => {
      parts.push(`[${i}:v]fps=${fps0},settb=AVTB,setpts=PTS-STARTPTS[sv${i}]`);
      parts.push(`[${i}:a]asetpts=PTS-STARTPTS[sa${i}]`);
    });
    let v = '[sv0]', a = '[sa0]', L = tl[0] ? tl[0].len : 0;
    for (let i = 1; i < segments.length; i++) {
      const t = tl[i].transition;
      const vo = `[v${i}]`, ao = `[a${i}]`;
      if (t.type === 'cut') {
        parts.push(`${v}${a}[sv${i}][sa${i}]concat=n=2:v=1:a=1${vo}${ao}`);
        L = r3(L + tl[i].len);
      } else {
        const off = r3(L - t.duration);
        parts.push(`${v}[sv${i}]xfade=transition=${t.type}:duration=${t.duration}:offset=${off}${vo}`);
        parts.push(`${a}[sa${i}]acrossfade=d=${t.duration}${ao}`);
        L = r3(L + tl[i].len - t.duration);
      }
      v = vo; a = ao;
    }
    const total = L;
    // global fade in/out
    const fi = num(settings.fadeIn, 0), fo = num(settings.fadeOut, 0);
    const vf = [];
    const af = [];
    if (fi > 0) { vf.push(`fade=t=in:st=0:d=${fi}`); af.push(`afade=t=in:st=0:d=${fi}`); }
    if (fo > 0) { vf.push(`fade=t=out:st=${r3(Math.max(0, total - fo))}:d=${fo}`); af.push(`afade=t=out:st=${r3(Math.max(0, total - fo))}:d=${fo}`); }
    parts.push(`${v}${vf.length ? vf.join(',') : 'null'}[vout]`);
    let aFinal = '[aprog]';
    parts.push(`${a}${af.length ? af.join(',') : 'anull'}[aprog]`);
    if (music && music.path) {
      const mi = segments.length;
      args.push('-stream_loop', '-1', '-i', music.path);
      const mv = num(music.volume, 0.6), mfo = num(music.fadeOut, 2), mstart = num(music.start, 0);
      const delay = Math.round(num(music.delay, 0) * 1000);
      let m = `[${mi}:a]aresample=48000,aformat=channel_layouts=stereo,atrim=start=${mstart},asetpts=PTS-STARTPTS`;
      if (delay > 0) m += `,adelay=${delay}|${delay}`;
      m += `,volume=${mv},atrim=duration=${total}`;
      if (mfo > 0) m += `,afade=t=out:st=${r3(Math.max(0, total - mfo))}:d=${mfo}`;
      parts.push(`${m}[music]`);
      if (music.duck) {
        // lower the music automatically while the clips have sound
        parts.push(`[aprog]asplit=2[aprog1][sc]`);
        parts.push(`[music][sc]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[ducked]`);
        parts.push(`[aprog1][ducked]amix=inputs=2:duration=first:normalize=0[amixed]`);
      } else {
        parts.push(`[aprog][music]amix=inputs=2:duration=first:normalize=0[amixed]`);
      }
      aFinal = '[amixed]';
    }
    const fps = num(settings.fps, 30);
    args.push('-filter_complex', parts.join(';'), '-map', '[vout]', '-map', aFinal,
      '-c:v', 'libx264', '-preset', settings.draft ? 'ultrafast' : 'medium', '-crf', settings.draft ? '28' : String(num(settings.crf, 18)),
      '-pix_fmt', 'yuv420p', '-r', String(fps), '-c:a', 'aac', '-b:a', '256k', '-t', String(total), '-movflags', '+faststart', out);
    return { args, total };
  }

  const api = { PRESETS, LOOKS, TRANSITIONS, clipLength, transitionFor, timeline, totalDuration, segmentArgs, joinArgs };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CutroomLib = api;
})(typeof window !== 'undefined' ? window : globalThis);
