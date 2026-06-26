const state = {
  raw: [],
  rows: [],
  filtered: [],
  activeTab: 'resumen',
};

const COLS = {
  item: ['Nº artículo', 'No artículo', 'Número de artículo', 'ItemCode'],
  desc: ['Descripción artículo', 'Descripcion articulo', 'Descripción de artículo', 'ItemName'],
  group: ['Grupo artículo', 'Grupo articulo', 'Grupo de artículos', 'Grupo de articulo'],
  type: ['Tipo artículo', 'Tipo articulo'],
  cold: ['Artículo frío', 'Articulo frio', 'Frío', 'Frio'],
  lot: ['Lote', 'BatchNum', 'Número de lote'],
  exp: ['Fecha caducidad', 'Caducidad', 'ExpDate'],
  daysExp: ['Días hasta caducidad', 'Dias hasta caducidad'],
  status: ['Estado caducidad'],
  warehouse: ['Almacén', 'Almacen'],
  stock: ['Stock', 'Stock lote total', 'Stock actual lote'],
  entryDate: ['Fecha entrada real'],
  entryDoc: ['Nº entrada mercancía', 'No entrada mercancía', 'Nº entrada mercancia'],
  supplier: ['Proveedor entrada'],
  entryWarehouse: ['Almacén entrada', 'Almacen entrada'],
  daysLife: ['Días vida útil al entrar', 'Dias vida util al entrar'],
  monthsLife: ['Meses vida útil al entrar', 'Meses vida util al entrar'],
  lastPurchaseDate: ['Fecha última compra artículo', 'Fecha ultima compra articulo'],
  lastPurchaseDoc: ['Nº última entrada compra', 'No última entrada compra', 'Nº ultima entrada compra'],
  lastArticleSaleDate: ['Fecha último albarán artículo', 'Fecha ultimo albaran articulo'],
  lastArticleClient: ['Último cliente que compró artículo', 'Ultimo cliente que compro articulo'],
  lastArticleSaleDoc: ['Nº último albarán artículo', 'No último albarán artículo', 'Nº ultimo albaran articulo'],
  lastLotSaleDate: ['Fecha último albarán lote', 'Fecha ultimo albaran lote'],
  lastLotClient: ['Último cliente que compró lote', 'Ultimo cliente que compro lote'],
  lastLotSaleDoc: ['Nº último albarán lote', 'No último albarán lote', 'Nº ultimo albaran lote'],
};

const el = (id) => document.getElementById(id);
const fmtNum = (n, d = 0) => Number(n || 0).toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
const norm = (v) => String(v ?? '').trim();
const normKey = (v) => norm(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function get(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') return row[key];
  }
  const normalized = Object.fromEntries(Object.keys(row).map(k => [normKey(k), k]));
  for (const key of keys) {
    const found = normalized[normKey(key)];
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') return row[found];
  }
  return '';
}

function parseNumber(v) {
  if (typeof v === 'number') return v;
  const s = norm(v).replace(/\./g, '').replace(',', '.').replace(/[^0-9.\-]/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === 'number') {
    const parsed = XLSX.SSF.parse_date_code(v);
    if (parsed) return new Date(parsed.y, parsed.m - 1, parsed.d);
  }
  const s = norm(v);
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return new Date(y, Number(m[2]) - 1, Number(m[1]));
  }
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

function fmtDate(v) {
  const d = parseDate(v);
  return d ? d.toLocaleDateString('es-ES') : '';
}

function diffDays(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return null;
  return Math.round((db.setHours(0,0,0,0) - da.setHours(0,0,0,0)) / 86400000);
}

function daysFrom(date) {
  const d = parseDate(date);
  if (!d) return null;
  const today = new Date();
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  return Math.round((today - d) / 86400000);
}

function mapRow(row) {
  const exp = get(row, COLS.exp);
  const entry = get(row, COLS.entryDate);
  const daysExpRaw = get(row, COLS.daysExp);
  const daysExp = daysExpRaw !== '' ? parseNumber(daysExpRaw) : diffDays(new Date(), exp);
  const daysInProvesa = daysFrom(entry);
  const cold = norm(get(row, COLS.cold));
  return {
    item: norm(get(row, COLS.item)),
    desc: norm(get(row, COLS.desc)),
    group: norm(get(row, COLS.group)) || 'Sin grupo',
    type: norm(get(row, COLS.type)) || 'Sin propiedad',
    cold: cold || 'No',
    lot: norm(get(row, COLS.lot)),
    exp,
    daysExp: Number.isFinite(daysExp) ? daysExp : null,
    status: norm(get(row, COLS.status)) || statusFromDays(daysExp),
    warehouse: norm(get(row, COLS.warehouse)) || norm(get(row, COLS.entryWarehouse)),
    stock: parseNumber(get(row, COLS.stock)),
    entryDate: entry,
    daysInProvesa,
    entryDoc: norm(get(row, COLS.entryDoc)),
    supplier: norm(get(row, COLS.supplier)) || 'Sin proveedor',
    entryWarehouse: norm(get(row, COLS.entryWarehouse)),
    daysLife: parseNumber(get(row, COLS.daysLife)),
    monthsLife: parseNumber(get(row, COLS.monthsLife)),
    lastPurchaseDate: get(row, COLS.lastPurchaseDate),
    lastPurchaseDoc: norm(get(row, COLS.lastPurchaseDoc)),
    lastArticleSaleDate: get(row, COLS.lastArticleSaleDate),
    lastArticleClient: norm(get(row, COLS.lastArticleClient)),
    lastArticleSaleDoc: norm(get(row, COLS.lastArticleSaleDoc)),
    lastLotSaleDate: get(row, COLS.lastLotSaleDate),
    lastLotClient: norm(get(row, COLS.lastLotClient)),
    lastLotSaleDoc: norm(get(row, COLS.lastLotSaleDoc)),
  };
}

function statusFromDays(days) {
  if (days === null || days === undefined || !Number.isFinite(Number(days))) return '';
  if (days < 0) return 'Caducado';
  if (days <= 30) return 'Caduca en 0-30 días';
  if (days <= 60) return 'Caduca en 31-60 días';
  if (days <= 90) return 'Caduca en 61-90 días';
  if (days <= 180) return 'Caduca en 91-180 días';
  if (days <= 365) return 'Caduca en 181-365 días';
  return 'Más de 365 días';
}

function badge(text, days) {
  let cls = 'blue';
  if (days < 0) cls = 'red';
  else if (days <= 30) cls = 'orange';
  else if (days <= 90) cls = 'yellow';
  else if (days > 180) cls = 'green';
  return `<span class="badge ${cls}">${text || ''}</span>`;
}

function setup() {
  el('fileInput').addEventListener('change', onFile);
  ['searchInput','expiryFilter','supplierFilter','typeFilter','coldFilter','warehouseFilter','sortFilter'].forEach(id => {
    el(id).addEventListener('input', applyFilters);
    el(id).addEventListener('change', applyFilters);
  });
  el('clearBtn').addEventListener('click', clearFilters);
  el('exportBtn').addEventListener('click', exportView);
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  render();
}

async function onFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  state.raw = rows;
  state.rows = rows.map(mapRow).filter(r => r.item || r.desc || r.lot);
  populateSuppliers();
  populateTypes();
  populateWarehouses();
  el('exportBtn').disabled = state.rows.length === 0;
  el('statusCard').innerHTML = `<strong>${state.rows.length.toLocaleString('es-ES')} líneas cargadas.</strong><span>${file.name}</span>`;
  applyFilters();
}

function populateSuppliers() {
  const select = el('supplierFilter');
  const current = select.value;
  const suppliers = [...new Set(state.rows.map(r => r.supplier).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'es'));
  select.innerHTML = '<option value="all">Todos</option>' + suppliers.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  if (suppliers.includes(current)) select.value = current;
}

function populateTypes() {
  const select = el('typeFilter');
  const current = select.value;
  const types = [...new Set(state.rows.map(r => r.type).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'es'));
  select.innerHTML = '<option value="all">Todos</option>' + types.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  if (types.includes(current)) select.value = current;
}

function populateWarehouses() {
  const select = el('warehouseFilter');
  const current = select.value;
  const warehouses = [...new Set(state.rows.map(r => r.warehouse).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'es'));
  select.innerHTML = '<option value="all">Todos</option>' + warehouses.map(w => `<option value="${escapeHtml(w)}">Almacén ${escapeHtml(w)}</option>`).join('');
  if (warehouses.includes(current)) select.value = current;
}

function clearFilters() {
  el('searchInput').value = '';
  el('expiryFilter').value = 'all';
  el('supplierFilter').value = 'all';
  el('typeFilter').value = 'all';
  el('coldFilter').value = 'all';
  el('warehouseFilter').value = 'all';
  el('sortFilter').value = 'expiry';
  applyFilters();
}

function applyFilters() {
  const q = normKey(el('searchInput').value);
  const expiry = el('expiryFilter').value;
  const supplier = el('supplierFilter').value;
  const type = el('typeFilter').value;
  const cold = el('coldFilter').value;
  const wh = el('warehouseFilter').value;
  const sort = el('sortFilter').value;

  state.filtered = state.rows.filter(r => {
    const hay = normKey([r.item, r.desc, r.group, r.type, r.lot, r.warehouse, r.supplier, r.lastArticleClient, r.lastLotClient].join(' '));
    if (q && !hay.includes(q)) return false;
    if (expiry === 'expired' && !(r.daysExp < 0)) return false;
    if (!['all','expired'].includes(expiry) && !(r.daysExp !== null && r.daysExp <= Number(expiry))) return false;
    if (supplier !== 'all' && r.supplier !== supplier) return false;
    if (type !== 'all' && r.type !== type) return false;
    if (cold !== 'all' && normKey(r.cold) !== cold) return false;
    if (wh !== 'all' && r.warehouse !== wh) return false;
    return true;
  });

  state.filtered.sort((a,b) => {
    if (sort === 'age') return (b.daysInProvesa ?? -999999) - (a.daysInProvesa ?? -999999);
    if (sort === 'stock') return b.stock - a.stock;
    if (sort === 'item') return a.item.localeCompare(b.item, 'es') || a.lot.localeCompare(b.lot, 'es');
    return (a.daysExp ?? 999999) - (b.daysExp ?? 999999);
  });
  render();
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
  render();
}

function render() {
  renderSummary();
  renderArticles();
  renderLots();
  renderNext();
  renderOld();
  renderSuppliers();
}

function renderSummary() {
  const rows = state.filtered;
  const uniqueItems = new Set(rows.map(r => r.item)).size;
  const uniqueLots = new Set(rows.map(r => `${r.item}__${r.lot}__${r.warehouse}`)).size;
  const stock = rows.reduce((s,r) => s + r.stock, 0);
  const expired = rows.filter(r => r.daysExp < 0).reduce((s,r) => s + r.stock, 0);
  const soon90 = rows.filter(r => r.daysExp >= 0 && r.daysExp <= 90).reduce((s,r) => s + r.stock, 0);
  const old180 = rows.filter(r => r.daysInProvesa >= 180).reduce((s,r) => s + r.stock, 0);
  el('cards').innerHTML = [
    card('Artículos', fmtNum(uniqueItems), 'con stock filtrado'),
    card('Lotes/almacén', fmtNum(uniqueLots), 'artículo + lote + almacén'),
    card('Stock total', fmtNum(stock, 2), 'unidades'),
    card('Caducado', fmtNum(expired, 2), 'unidades'),
    card('≤ 90 días', fmtNum(soon90, 2), 'unidades'),
    card('≥ 180 días aquí', fmtNum(old180, 2), 'unidades'),
  ].join('');
  renderBars('expiryBars', groupExpiry(rows));
  renderBars('warehouseBars', groupByWarehouse(rows));
}

function card(label, value, note) {
  return `<article class="card"><span>${label}</span><strong>${value}</strong><small>${note}</small></article>`;
}

function groupExpiry(rows) {
  const buckets = [
    ['Caducado', r => r.daysExp < 0],
    ['0-30 días', r => r.daysExp >= 0 && r.daysExp <= 30],
    ['31-60 días', r => r.daysExp > 30 && r.daysExp <= 60],
    ['61-90 días', r => r.daysExp > 60 && r.daysExp <= 90],
    ['91-180 días', r => r.daysExp > 90 && r.daysExp <= 180],
    ['181-365 días', r => r.daysExp > 180 && r.daysExp <= 365],
    ['+365 días', r => r.daysExp > 365],
  ];
  return buckets.map(([name, fn]) => [name, rows.filter(fn).reduce((s,r) => s + r.stock, 0)]);
}

function groupByWarehouse(rows) {
  const map = new Map();
  for (const r of rows) {
    const key = r.warehouse || 'Sin almacén';
    map.set(key, (map.get(key) || 0) + r.stock);
  }
  return [...map.entries()].sort((a,b) => a[0].localeCompare(b[0], 'es')).map(([w, stock]) => [`Almacén ${w}`, stock]);
}

function renderBars(id, data) {
  const max = Math.max(...data.map(x => x[1]), 1);
  el(id).innerHTML = data.map(([name, value]) => `
    <div class="bar-row">
      <span>${escapeHtml(name)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, value / max * 100)}%"></div></div>
      <strong class="num">${fmtNum(value, 0)}</strong>
    </div>
  `).join('');
}

function renderArticles() {
  const map = new Map();
  for (const r of state.filtered) {
    const key = r.item;
    const x = map.get(key) || { item: r.item, desc: r.desc, group: r.group, types: new Set(), cold: r.cold, stock: 0, lots: new Set(), minDays: null, maxAge: null, lastClient: '', lastSale: null };
    x.stock += r.stock;
    x.types.add(r.type);
    x.lots.add(`${r.lot}_${r.warehouse}`);
    x.minDays = x.minDays === null ? r.daysExp : Math.min(x.minDays, r.daysExp ?? 999999);
    x.maxAge = x.maxAge === null ? r.daysInProvesa : Math.max(x.maxAge, r.daysInProvesa ?? -1);
    if (!x.lastSale || (parseDate(r.lastArticleSaleDate) || 0) > (parseDate(x.lastSale) || 0)) {
      x.lastSale = r.lastArticleSaleDate;
      x.lastClient = r.lastArticleClient;
    }
    map.set(key, x);
  }
  const data = [...map.values()].sort((a,b) => (a.minDays ?? 999999) - (b.minDays ?? 999999));
  el('articlesCount').textContent = `${data.length.toLocaleString('es-ES')} artículos`;
  renderTable('articlesTable', data, [
    ['Nº artículo', x => x.item], ['Descripción', x => x.desc], ['Grupo', x => x.group], ['Tipo', x => [...x.types].join(' / ')], ['Frío', x => x.cold],
    ['Stock', x => fmtNum(x.stock, 2), 'num'], ['Lotes', x => fmtNum(x.lots.size), 'num'],
    ['Caducidad mínima', x => badge(statusFromDays(x.minDays), x.minDays)], ['Días', x => fmtNum(x.minDays), 'num'],
    ['Máx. días en PROVESA', x => fmtNum(x.maxAge), 'num'], ['Último cliente', x => x.lastClient || ''], ['Fecha último albarán', x => fmtDate(x.lastSale)],
  ]);
}

function renderLots() {
  const data = state.filtered;
  el('lotsCount').textContent = `${data.length.toLocaleString('es-ES')} líneas`;
  renderTable('lotsTable', data, lotColumns());
}

function renderNext() {
  const data = state.filtered.filter(r => r.daysExp !== null && r.daysExp <= 180).sort((a,b) => a.daysExp - b.daysExp);
  el('nextCount').textContent = `${data.length.toLocaleString('es-ES')} líneas`;
  renderTable('nextTable', data, lotColumns());
}

function renderOld() {
  const data = state.filtered.filter(r => r.daysInProvesa !== null && r.daysInProvesa >= 180).sort((a,b) => b.daysInProvesa - a.daysInProvesa);
  el('oldCount').textContent = `${data.length.toLocaleString('es-ES')} líneas`;
  renderTable('oldTable', data, lotColumns());
}

function renderSuppliers() {
  const map = new Map();
  for (const r of state.filtered) {
    const key = r.supplier || 'Sin proveedor';
    const x = map.get(key) || { supplier: key, items: new Set(), lots: new Set(), stock: 0, minDays: null, old: 0 };
    x.items.add(r.item); x.lots.add(`${r.item}_${r.lot}_${r.warehouse}`); x.stock += r.stock;
    x.minDays = x.minDays === null ? r.daysExp : Math.min(x.minDays, r.daysExp ?? 999999);
    if ((r.daysInProvesa ?? 0) >= 180) x.old += r.stock;
    map.set(key, x);
  }
  const data = [...map.values()].sort((a,b) => b.stock - a.stock);
  el('suppliersCount').textContent = `${data.length.toLocaleString('es-ES')} proveedores`;
  renderTable('suppliersTable', data, [
    ['Proveedor entrada', x => x.supplier], ['Artículos', x => fmtNum(x.items.size), 'num'], ['Lotes', x => fmtNum(x.lots.size), 'num'],
    ['Stock', x => fmtNum(x.stock, 2), 'num'], ['Stock ≥ 180 días', x => fmtNum(x.old, 2), 'num'],
    ['Caducidad mínima', x => badge(statusFromDays(x.minDays), x.minDays)], ['Días', x => fmtNum(x.minDays), 'num'],
  ]);
}

function lotColumns() {
  return [
    ['Nº artículo', r => r.item], ['Descripción', r => r.desc], ['Grupo', r => r.group], ['Tipo', r => r.type], ['Frío', r => r.cold],
    ['Lote', r => r.lot], ['Almacén', r => r.warehouse], ['Stock', r => fmtNum(r.stock, 2), 'num'],
    ['Caducidad', r => fmtDate(r.exp)], ['Estado', r => badge(r.status, r.daysExp)], ['Días cad.', r => fmtNum(r.daysExp), 'num'],
    ['Entrada real', r => fmtDate(r.entryDate)], ['Días en PROVESA', r => fmtNum(r.daysInProvesa), 'num'],
    ['Última compra', r => fmtDate(r.lastPurchaseDate)], ['Último cliente artículo', r => r.lastArticleClient], ['Último cliente lote', r => r.lastLotClient],
    ['Proveedor entrada', r => r.supplier], ['Nº entrada', r => r.entryDoc]
  ];
}

function renderTable(id, data, cols) {
  const table = el(id);
  if (!data.length) {
    table.innerHTML = `<tbody><tr><td>${document.getElementById('emptyTemplate').innerHTML}</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `
    <thead><tr>${cols.map(([h]) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row => `<tr>${cols.map(([h, fn, cls]) => `<td class="${cls || ''}">${fn(row) ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
  `;
}

function exportView() {
  const title = makeExportTitle();
  const data = state.filtered.map(r => ({
    'Nº artículo': r.item,
    'Descripción artículo': r.desc,
    'Lote': r.lot,
    'Fecha caducidad': fmtDate(r.exp),
    'Estado caducidad': r.status,
    'Stock': r.stock,
    'Fecha entrada real': fmtDate(r.entryDate),
    'Último cliente que compró artículo': r.lastArticleClient,
    'Proveedor entrada': r.supplier,
    'Nº entrada mercancía': r.entryDoc,
  }));

  const ws = XLSX.utils.aoa_to_sheet([[title], []]);
  XLSX.utils.sheet_add_json(ws, data, { origin: 'A3' });
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }];
  ws['A1'].s = {
    font: { bold: true, sz: 16 },
    alignment: { horizontal: 'left', vertical: 'center' }
  };
  // Optimización de impresión: A4 horizontal, una página de ancho y columnas compactas.
  ws['!rows'] = [{ hpt: 24 }, { hpt: 6 }, { hpt: 22 }];
  ws['!cols'] = [
    { wch: 11 }, // Nº artículo
    { wch: 32 }, // Descripción artículo
    { wch: 13 }, // Lote
    { wch: 12 }, // Fecha caducidad
    { wch: 18 }, // Estado caducidad
    { wch: 9 },  // Stock
    { wch: 12 }, // Fecha entrada real
    { wch: 24 }, // Último cliente
    { wch: 24 }, // Proveedor entrada
    { wch: 12 }  // Nº entrada mercancía
  ];
  ws['!margins'] = {
    left: 0.25,
    right: 0.25,
    top: 0.35,
    bottom: 0.35,
    header: 0.15,
    footer: 0.15
  };
  ws['!pageSetup'] = {
    paperSize: 9,          // A4
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true
  };
  ws['!autofilter'] = { ref: `A3:J${Math.max(3, data.length + 3)}` };
  ws['!freeze'] = { xSplit: 0, ySplit: 3 };

  const wb = XLSX.utils.book_new();
  const sheetName = makeSheetNameFromFilters();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${makeFileNameFromFilters()}.xlsx`);
}

function makeExportTitle() {
  const parts = activeFilterParts();
  return parts.length ? `Caducados PROVESA - ${parts.join(' - ')}` : 'Caducados PROVESA - Todos';
}

function activeFilterParts() {
  const parts = [];
  const q = norm(el('searchInput').value);
  const expiry = el('expiryFilter').value;
  const supplier = el('supplierFilter').value;
  const type = el('typeFilter').value;
  const cold = el('coldFilter').value;
  const wh = el('warehouseFilter').value;

  if (q) parts.push(`busqueda ${q}`);
  if (expiry === 'expired') parts.push('caducados');
  else if (expiry !== 'all') parts.push(`caduca ${expiry} dias`);
  if (supplier !== 'all') parts.push(supplier);
  if (type !== 'all') parts.push(type);
  if (cold !== 'all') parts.push(normKey(cold) === 'si' ? 'frio' : 'no frio');
  if (wh !== 'all') parts.push(`almacen ${wh}`);

  return parts;
}

function makeFileNameFromFilters() {
  const parts = activeFilterParts();
  const suffix = parts.length ? parts.join('_') : 'todos';
  return sanitizeFileName(`caducados_provesa_${suffix}`);
}

function makeSheetNameFromFilters() {
  const parts = activeFilterParts();
  const name = parts.length ? parts.join(' - ') : 'Todos';
  return sanitizeSheetName(name) || 'Caducados';
}

function sanitizeFileName(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9ñÑ_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120) || 'caducados_provesa';
}

function sanitizeSheetName(value) {
  return String(value || '')
    .replace(/[\/\?\*\[\]:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

setup();
