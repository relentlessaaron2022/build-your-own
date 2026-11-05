# BAMA · Build Any Mac App

One shell. Five studio apps. A generator for the next fifty.

BAMA is a small kit for building real Mac apps, the kind with a Dock icon, a window that remembers where you left it, menu shortcuts, and access to your files. Every app shares one engine room (`shell/`) and one look (`kit/`), so a new app starts at the part that matters: what it does.

The first five apps cover the tools a one-person studio leans on every day.

| App | What it does | Built for |
|---|---|---|
| **Summon** | Press `⌥Space` and type. Opens apps, finds files through Spotlight, does math, keeps 200 clipboard items, expands snippets, fires web quicklinks (`yt lo-fi beats`), runs system commands. | The command center. Stop hunting through folders. |
| **Cutroom** | A full editing room. Multi-track timeline with overlays, text, stickers, effect layers and audio. Animated text in 13 styles, 20 transitions, 17 filters, 20 effects (VHS, glitch, shake, light leaks, confetti…), keyframes, speed and reverse, freeze frames, voice changer, noise reduction, voiceover recording, built-in sound effects, beat detection, and auto captions with word-by-word highlighting. What you see in the preview is exactly what exports. | Turning animated clips into finished films, Reels, and Shorts. |
| **Forge** | A code editor (the same engine VS Code uses) with Claude built in. Ask about your code with `⌘L`. Select code, press `⌘K`, say what to change, review the diff, accept or reject. Run panel for `npm run dev`, with "Explain output" for errors. | Websites, apps, and automation scripts. |
| **Relay** | Automations without code. Rename a folder of renders to `MyFilm_shot_001.png`, sort Downloads by type, resize images for the web, launch your studio apps on one hotkey, type text, press keys. Triggers: a button, a hotkey, a file landing in a folder, or a schedule. Lives in the menu bar. | The repetitive multi-step stuff. |
| **Manuscript** | Write a book or screenplay in pieces. Binder of parts, chapters, characters, places, research. Corkboard of index cards you drag to reorder. Outline view. Snapshots before big rewrites. Session and book word targets with a deadline pace. Compile the whole draft to Markdown, print-ready HTML, or plain text. | Long-form books and scripts across many projects. |

Everything stays on your Mac. Nothing phones home except Forge's calls to Claude, and only when you ask.

---

## Get it running

You need [Node.js](https://nodejs.org) 20 or newer. Cutroom also needs ffmpeg for exporting:

```bash
brew install ffmpeg          # once, for Cutroom exports
npm install                  # once
npm start                    # lists the apps
npm start cutroom            # launch one
```

**Intel or Apple Silicon:** BAMA builds for whichever Mac you are on, so it runs on an Intel i9 MacBook Pro the same as on an M-series machine. Nothing here needs Apple Silicon.

### Turn an app into a real `.app`

```bash
npm run build summon                     # Summon.app inside a .dmg and .zip, in dist/summon/
npm run build cutroom -- --arch=x64      # force Intel
npm run build forge -- --arch=universal  # one app for Intel and Apple Silicon
npm run build:all                        # all five
```

Drag the `.app` from the `.dmg` into Applications. The builds aren't signed with an Apple Developer ID, so the first time you open one, **right-click it and choose Open**. To sign them for sharing, set `CSC_NAME` to your Developer ID before building.

### Make your own app

```bash
npm run new "Beat Vault" -- "Catalog every beat with BPM, key, and status"
npm start beat-vault
```

That creates `apps/beat-vault/` with four files:

```
app.json      name, window size, bundle id
index.html    the layout
renderer.js   what happens on screen
main.js       Mac-side powers: files, shell commands, system
```

The page talks to the Mac through one doorway: `invoke('channel', ...args)`. Define a handler in `main.js`:

```js
handle('beat-vault:scan', (folder) => fs.readdirSync(folder).filter((f) => f.endsWith('.wav')));
```

Call it from `renderer.js`:

```js
const beats = await invoke('beat-vault:scan', '/Users/me/Beats');
```

Every app gets these for free, with no setup:

| From the page | Does |
|---|---|
| `store.get(key)` / `store.set(key, value)` | Saves data in the app's own JSON file in `~/Library/Application Support` |
| `invoke('dialog:open', { directory, multiple, filters })` | Native file and folder pickers |
| `invoke('dialog:save', ...)` / `invoke('dialog:confirm', msg)` | Save panel, yes/no sheet |
| `invoke('fs:readText', p)` / `invoke('fs:writeText', p, text)` | Read and write files |
| `invoke('shell:openPath', p)` / `invoke('shell:showItem', p)` | Open in the default app, reveal in Finder |
| `invoke('clipboard:read')` / `invoke('clipboard:write', t)` | Clipboard |
| `invoke('notify', title, body)` | Notification Center |
| `h(tag, attrs, ...children)` | Build interface elements without a framework |
| `toast(msg)`, `form(title, fields)`, `ask(title, label)` | Messages and dialogs that match the suite |

The look lives in `kit/bama.css`: light and dark mode, sidebar, toolbar, inspector, lists, cards, buttons, inputs, and a status bar. Use the classes and every app feels like part of the same family.

### Design in the browser

```bash
npm run preview        # http://localhost:4747
```

Opens every app in a regular browser with stand-in Mac features. Fast for layout work. Real file access, hotkeys, and ffmpeg need `npm start`.

---

## App notes

**Summon:** `⌥Space` opens it from anywhere. `Tab` switches between All, Clipboard, Snippets, and Quicklinks. `⌘↵` reveals a file in Finder or copies a result. In Clipboard mode, `⌘P` pins an item and `⌘⌫` deletes it. Snippets fill in `{date}`, `{time}`, and `{clipboard}`. Pasting into another app needs Accessibility permission: System Settings → Privacy & Security → Accessibility → turn on Summon.

**Cutroom:** Everything you see in the preview is what lands in the exported file, because both are drawn by the same engine.
- **Getting media in:** drop files anywhere on the window, or use **Import media**. Click a clip to add it to the main track at the playhead. The ▣ button on a clip puts it in an overlay track (picture in picture). Formats the preview can't play, such as ProRes, MKV, and AVI, get converted automatically.
- **Timeline:** drag items to move them, and drag their edges to trim. Main-track clips reorder by dragging. Drag one up onto an overlay track to float it over the main video. The **✚** between clips adds a transition. 🧲 snaps edges to each other, to the playhead, and to music beats. Drag the timeline's top edge to make it taller.
- **On the preview:** click anything to select it, drag to move it, use the corner dot to resize, and the top dot to rotate.
- **Keyframes:** press **K** or click ◆ next to a property. Move the playhead, change the value, and Cutroom animates between the two. **Camera move** in the Basic tab adds ready-made zooms and pans.
- **Shortcuts:** `Space` play · `S` split · `⌫` delete · `⌘D` duplicate · `⌘C`/`⌘V` copy and paste · `⌘Z`/`⇧⌘Z` undo and redo · `←`/`→` step one frame (`⇧` for one second) · `⌘E` export.
- **Auto captions** use whisper.cpp, which is free and runs entirely on your Mac. Install it once with `brew install whisper-cpp`. Cutroom then downloads a speech model the first time (148 MB for English). Captions listen to your clips and voiceovers and skip music. Click any caption line to fix a word. Captions also import and export as `.srt`.
- **Beats:** select a music track and press **♪ Beats**. The hits show up as yellow marks on the ruler. **Cut main clips to the beat** re-times every clip to land on them.
- **Voiceover** records from the microphone while the video plays. macOS will ask for microphone permission the first time.
- **Export** offers 720p to 4K at 24 to 60 fps, as MP4 or MOV, with optional loudness leveling for social apps. **Faster (Mac hardware)** uses Apple's video encoder. **Project ▾ → Save this frame** makes a full-resolution PNG for thumbnails.

**Forge:** Add your Anthropic API key with ⚙︎ (get one at [console.anthropic.com](https://console.anthropic.com)). It's encrypted with your macOS keychain. Forge uses Claude Opus 5.5 with adaptive thinking. The menu next to the chat sets how hard it thinks, from Quick to Deep. If Claude's safety system declines a request, the API automatically retries on a recommended model. `⌘P` jumps to any file, `⌘J` opens the run panel, and `⇧⌘F` searches the project.

**Relay:** New macros start switched off. Check the folder paths, then tick **Enabled** to arm the trigger. Use **Preview** on rename and sort steps to see every change before anything moves. Rename refuses to run if two files would end up with the same name. Steps that press keys or type text need Accessibility permission for Relay. Tokens work in any field: `{date}` `{time}` `{n}` `{n:3}` `{name}` `{ext}` `{file}` `{clipboard}` `{output}`, plus any variable you set.

**Manuscript:** `⌘1`–`⌘4` switch between Write, Corkboard, Outline, and Flow (the whole folder as one scroll). `⌘N` adds a document, `⌘S` takes a snapshot, `⇧⌘F` enters focus mode, and `⇧⌘T` toggles typewriter scrolling. Set a document's status to *Exclude from compile* to keep it out of the final file.

---

## Under the hood

```
shell/        main process + preload, shared by every app
kit/          bama.css design tokens and components, bama.js helpers
apps/<id>/    one folder per app: app.json, index.html, renderer.js, main.js, icon.png
templates/    the starter that `npm run new` copies
scripts/      start, preview, new, build, icons
tests/        engine tests (npm test)
```

Each app is an Electron app with context isolation and a sandboxed page. The page never touches Node directly; it goes through `invoke()`. The core logic of each app (Summon's calculator and ranking, Manuscript's tree and compiler, Cutroom's render engine, Relay's rename/sort/runner) sits in plain modules that `npm test` runs on their own. That includes a real ffmpeg render and real file renames in a temp folder.

Built by Relentless.
