// Parser CSV común: detecta separador (, o ;), respeta comillas, BOM y \r\n
function parseCSV(text) {
  text = text.replace(/^\uFEFF/, '');
  const first = text.split(/\r?\n/)[0];
  const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ',';

  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// "weyi|url,deividg|url,guille,molni|url|fle" -> [{nombre, video}, ...]
function parseJugadores(str) {
  const res = [];
  let actual = null;
  (str || '').split(',').forEach(tok => {
    tok.split('|').map(s => s.trim()).filter(Boolean).forEach(p => {
      if (/^https?:\/\//i.test(p)) {
        if (actual && !actual.video) actual.video = p;
      } else {
        actual = { nombre: p, video: '' };
        res.push(actual);
      }
    });
  });
  return res;
}

function parseNiveles(csv) {
  const rows = parseCSV(csv);
  rows.shift(); // cabecera
  return rows
    .filter(c => c.length > 3 && c.some(x => x.trim() !== ''))
    .map((c, index) => ({
      id: index, // mismo id en lista, payolist y nivel
      url: (c[0] || '').trim(),
      titulo: (c[3] || '').trim(),
      stats: {
        Verificador: (c[4] || '').trim(),
        Ranchopoints: (c[5] || '').trim()
      },
      jugadores: parseJugadores(c[6])
    }));
}

// Devuelve el id de vídeo de YouTube de una URL (o '')
function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) {
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      const m = u.pathname.match(/^\/(live|embed|shorts)\/([^/?]+)/);
      if (m) return m[2];
    }
  } catch (e) {}
  return '';
}