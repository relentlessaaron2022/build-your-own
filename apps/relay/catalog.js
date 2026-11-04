// Relay step catalog and starter macros. Shared by the engine (Node) and the page.
(function (root) {
  // ---------- step catalog ----------
  const STEPS = {
    open_app: { label: 'Open app', fields: [['app', 'App name', 'Cutroom']] },
    open_url: { label: 'Open website', fields: [['url', 'URL', 'https://']] },
    open_path: { label: 'Open file or folder', fields: [['path', 'Path', '~/Desktop']] },
    shell: { label: 'Run shell command', fields: [['command', 'Command', 'echo hello'], ['cwd', 'In folder (optional)', '']] },
    applescript: { label: 'Run AppleScript', fields: [['script', 'Script', 'display dialog "Hi"', 'textarea']] },
    rename: { label: 'Rename files in folder', fields: [['folder', 'Folder', '~/Desktop/Renders'], ['filter', 'Only these types (blank = all)', 'png, mp4'], ['pattern', 'New name — {name} {n} {n:3} {date} {ext}', '{name}'], ['find', 'Find (optional)', ''], ['replace', 'Replace with', ''], ['case', 'Case', 'keep', ['keep', 'lower', 'upper', 'title', 'kebab', 'snake']], ['start', 'Start numbering at', '1']] },
    sort_files: { label: 'Sort files by type', fields: [['folder', 'Folder', '~/Downloads'], ['rules', 'Rules (ext, ext -> Folder)', 'jpg, jpeg, png, heic, gif, webp -> Images\nmp4, mov, m4v -> Video\nmp3, wav, m4a, aiff -> Audio\npdf, docx, pages, txt, md -> Documents\nzip, dmg, pkg -> Installers', 'textarea']] },
    move_trigger_file: { label: 'Move the triggering file', fields: [['to', 'Destination folder', '~/Desktop/Inbox']] },
    resize_images: { label: 'Resize images (sips)', fields: [['folder', 'Folder', '~/Desktop/Upload'], ['max', 'Longest side (px)', '2048'], ['format', 'Convert to', 'jpeg', ['keep', 'jpeg', 'png', 'heic']], ['output', 'Save into subfolder (blank = overwrite)', 'web']] },
    copy_text: { label: 'Copy text to clipboard', fields: [['text', 'Text', '{date}']] },
    type_text: { label: 'Type text', fields: [['text', 'Text', '']] },
    keystroke: { label: 'Press keys', fields: [['keys', 'Keys, like cmd+shift+4', 'cmd+shift+4']] },
    notify: { label: 'Show notification', fields: [['title', 'Title', 'Relay'], ['body', 'Message', 'Done']] },
    wait: { label: 'Wait', fields: [['seconds', 'Seconds', '1']] },
    set_var: { label: 'Set variable', fields: [['name', 'Name', 'project'], ['value', 'Value', 'MyFilm']] },
  };

  const TEMPLATES = [
    { name: 'Organize Downloads', trigger: { type: 'folder', path: '~/Downloads', filter: '' }, steps: [{ type: 'sort_files', folder: '~/Downloads', rules: STEPS.sort_files.fields[1][2] }] },
    { name: 'Number my renders', trigger: { type: 'manual' }, steps: [{ type: 'set_var', name: 'project', value: 'MyFilm' }, { type: 'rename', folder: '~/Desktop/Renders', filter: 'png, jpg, mp4, mov', pattern: '{project}_shot_{n:3}{ext}', case: 'keep', start: '1' }, { type: 'notify', title: 'Relay', body: 'Renders renamed' }] },
    { name: 'Start studio session', trigger: { type: 'hotkey', accelerator: 'Alt+Shift+S' }, steps: [{ type: 'open_app', app: 'Cutroom' }, { type: 'open_app', app: 'Manuscript' }, { type: 'open_app', app: 'Music' }, { type: 'notify', title: 'Studio is open', body: 'Go make something.' }] },
    { name: 'Web-ready images', trigger: { type: 'manual' }, steps: [{ type: 'resize_images', folder: '~/Desktop/Upload', max: '2048', format: 'jpeg', output: 'web' }, { type: 'open_path', path: '~/Desktop/Upload/web' }] },
    { name: 'Daily journal stamp', trigger: { type: 'schedule', mode: 'daily', time: '08:30' }, steps: [{ type: 'copy_text', text: '## {date}\n\n' }, { type: 'notify', title: 'Journal', body: "Today's heading is on your clipboard" }] },
  ];

  const api = { STEPS, TEMPLATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RelayCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis);
