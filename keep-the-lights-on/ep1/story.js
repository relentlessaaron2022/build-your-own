// story.js — single source of truth: 90 BPM, 4/4 (one beat = 16 frames = 0.6667 s, one bar = 2.6667 s), 30 s = 45 beats
export const BPM = 90, BEAT = 60 / BPM, DUR = 30;
export const b = n => n * BEAT;                       // beat n (0-based) → seconds

export const T = {
  pings: [b(2), b(6), b(10)],                         // 1.333 / 4.0 / 6.667
  push: [b(10), b(14)],                               // push in on the third ping
  lock: b(15), slide: [b(16), b(17)], pomf: b(17),    // 10.0 / 10.667–11.333
  handsOut: [b(17.5), b(18.5)],
  rise: [b(19), b(20)],                               // 12.667 anticipation → 13.333 first step
  steps: Array.from({ length: 8 }, (_, i) => b(20 + i)),   // 13.333 … 18.0
  bath: b(28),                                        // 18.667
  arrive: b(29.5),                                    // she reaches the curtain
  grab: b(30), pull: [b(30.6), b(31.4)],              // 20.0 band stops / arms stretch, 20.4–20.93 pulled in
  steam: [b(31), b(37.6)],                            // 20.667 → 25.067 frame fills
  bandBack: b(35),                                    // 23.333 low trombone
  pillow: b(38),                                      // 25.333
  peek: b(41),                                        // 27.333
  blink: b(43), irisEnd: b(43.5),                     // 28.667 → 29.0
};

// shot list [start, end, name]
export const SHOTS = [
  [0, b(15), 'bed'],
  [b(15), b(19), 'hands'],
  [b(19), b(28), 'tiptoe'],
  [b(28), b(38), 'shower'],
  [b(38), DUR, 'pillow'],
];
export const shotAt = t => { for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i][0]) return SHOTS[i]; return SHOTS[0]; };

// period title cards (in the picture, not subtitles): [t0, t1, text]
export const CARDS = [
  [T.pings[0], T.pings[0] + 2.33, '+ $1,200.00'],
  [T.pings[1], T.pings[1] + 2.33, '+ $400.00'],
  [T.pings[2], b(14.75), 'TIP:  “don’t stop talking”'],
];
