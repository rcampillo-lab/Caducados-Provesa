const DEFAULT_POLICY_DAYS = 365;
const CLAIMS_STORAGE_KEY = 'provesaCaducadosClaimsV1';

const state = {
  raw: [],
  rows: [],
  filtered: [],
  activeTab: 'resumen',
  policyRules: new Map(),
  policyFileName: '',
  policyLoaded: false,
  dataFileName: '',
  claims: {},
  selectedClaimIds: new Set(),
  expandedClaimIds: new Set(),
  manageFlow: { active: false, warehouseIndex: 0, stepIndex: 0, providers: [], providerIndex: 0 },
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


const MANAGEMENT_WAREHOUSE_TARGETS = ['01', '02'];
const MANAGEMENT_STEP_ORDER = ['expiredOutPolicy', 'expiredInPolicy', 'petOutPolicy', 'productionOutPolicy'];
const MANAGEMENT_STEPS = {
  expiredOutPolicy: {
    title: 'Caducados fuera de política',
    expiry: 'expired',
    policy: 'Fuera de política',
    supplier: 'all',
    typeKind: 'all',
    targetStatus: 'En trámite',
    note: 'Flujo Gestionar: caducado fuera de política - destrucción',
    exportLabel: 'Caducados fuera política',
    detail: 'Revisa los caducados fuera de política. Exporta su Excel y después pulsa Siguiente para marcarlos como En trámite.',
  },
  expiredInPolicy: {
    title: 'Caducados en política',
    expiry: 'expired',
    policy: 'En política',
    supplier: 'provider',
    typeKind: 'all',
    targetStatus: 'En trámite',
    note: 'Flujo Gestionar: caducado en política - tramitar devolución proveedor',
    exportLabel: 'Caducados en política por proveedor',
    detail: 'Se gestionan por proveedor. Exporta el Excel del proveedor mostrado y pulsa Siguiente para pasar al siguiente proveedor.',
  },
  petOutPolicy: {
    title: 'Próximos 6 meses · Compañía fuera de política',
    expiry: '6',
    policy: 'Fuera de política',
    supplier: 'all',
    typeKind: 'pet',
    targetStatus: 'En oferta',
    note: 'Flujo Gestionar: oferta compañía fuera de política',
    exportLabel: 'Ofertas compañía fuera política',
    detail: 'Exporta el listado de compañía fuera de política para rellenar descuentos manualmente. Después pulsa Siguiente.',
  },
  productionOutPolicy: {
    title: 'Próximos 6 meses · Producción fuera de política',
    expiry: '6',
    policy: 'Fuera de política',
    supplier: 'all',
    typeKind: 'production',
    targetStatus: 'En trámite',
    note: 'Flujo Gestionar: producción fuera de política - revisar acción',
    exportLabel: 'Producción fuera política almacenes 01+02',
    detail: 'Exporta el listado de producción fuera de política de los almacenes 01 y 02 juntos, revisa las acciones y después pasa al almacén 2 o finaliza.',
  },
};

const el = (id) => document.getElementById(id);
const fmtNum = (n, d = 0) => Number(n || 0).toLocaleString('es-ES', { maximumFractionDigits: d, minimumFractionDigits: d });
const fmtQty = (n) => {
  const value = Number(n || 0);
  if (!Number.isFinite(value)) return '';
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) < 0.000001) return rounded.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  return value.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
};
const norm = (v) => String(v ?? '').trim();
const normKey = (v) => norm(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function formatItemCode(value) {
  const s = norm(value);
  if (/^\d+$/.test(s) && s.length <= 6) return s.padStart(6, '0');
  return s;
}

function isCold(value) {
  const v = normKey(value);
  return ['si', 'sí', 's', 'y', 'yes', 'true', '1'].includes(v);
}

function cleanPolicyProvider(value) {
  return norm(value).replace(/\s+/g, ' ');
}

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
  if (!d) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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

function todayDateOnly() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}


function toIsoDate(value) {
  const d = parseDate(value);
  if (!d) return '';
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function safeIdPart(value, fallback = '') {
  const v = norm(value) || fallback;
  return v.replace(/\|/g, '/');
}

function makeClaimId(row) {
  return [
    safeIdPart(row.item, 'SIN_ARTICULO'),
    safeIdPart(row.lot, 'SIN_LOTE'),
    safeIdPart(row.warehouse, 'SIN_ALMACEN'),
    safeIdPart(toIsoDate(row.exp), 'SIN_CADUCIDAD'),
    safeIdPart(row.entryDoc, 'SIN_ENTRADA'),
    safeIdPart(row.supplier, 'SIN_PROVEEDOR'),
  ].join('|');
}

function assignClaimId(row) {
  row.claimId = makeClaimId(row);
  return row;
}

function loadClaims() {
  try {
    const saved = localStorage.getItem(CLAIMS_STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    const migrated = {};
    for (const [id, claim] of Object.entries(parsed || {})) {
      const status = normalizeGestionStatus(claim?.status);
      if (status === 'Pendiente') continue;
      migrated[id] = { ...claim, status };
    }
    state.claims = migrated;
    if (saved && JSON.stringify(parsed) !== JSON.stringify(migrated)) saveClaims();
  } catch (err) {
    state.claims = {};
  }
}

function saveClaims() {
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(state.claims));
  } catch (err) {
    alert('No se han podido guardar las reclamaciones en este navegador. Revisa si el almacenamiento local está bloqueado.');
  }
}

function applyClaimsToRows() {
  for (const row of state.rows) {
    if (!row.claimId) assignClaimId(row);
    row.claim = state.claims[row.claimId] || null;
  }
}

function hasClaim(row) {
  return Boolean(row.claim || state.claims[row.claimId]);
}

function currentClaim(row) {
  return row.claim || state.claims[row.claimId] || null;
}

function claimBadge(status) {
  const s = normalizeGestionStatus(status);
  let cls = 'blue';
  if (s === 'En trámite') cls = 'yellow';
  else if (s === 'En oferta') cls = 'orange';
  return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
}

function claimCheckbox(row) {
  const checked = state.selectedClaimIds.has(row.claimId) ? 'checked' : '';
  return `<input type="checkbox" class="claim-checkbox" data-claim-id="${escapeHtml(row.claimId)}" ${checked} aria-label="Seleccionar línea" />`;
}

function normalizeGestionStatus(status) {
  const s = norm(status);
  if (s === 'En oferta') return 'En oferta';
  if (s === 'Pendiente' || s === '') return 'Pendiente';
  // Migración suave desde v3.0: cualquier estado antiguo gestionado pasa a En trámite.
  return 'En trámite';
}

function gestionStatus(row) {
  const claim = currentClaim(row);
  return claim ? normalizeGestionStatus(claim.status) : 'Pendiente';
}

function getRowsById() {
  const map = new Map();
  for (const row of state.rows) map.set(row.claimId, row);
  return map;
}

function selectedRows() {
  const map = getRowsById();
  return [...state.selectedClaimIds].map(id => map.get(id)).filter(Boolean);
}

function visibleRowsForBulkSelection() {
  return state.filtered.filter(row => row && row.claimId);
}

function updateSelectAllState() {
  const box = document.getElementById('selectAllClaims');
  if (!box) return;
  const rows = visibleRowsForBulkSelection();
  const total = rows.length;
  const selectedVisible = rows.filter(row => state.selectedClaimIds.has(row.claimId)).length;
  box.disabled = total === 0;
  box.checked = total > 0 && selectedVisible === total;
  box.indeterminate = selectedVisible > 0 && selectedVisible < total;
  box.title = box.checked ? 'Desmarcar todas las líneas visibles' : 'Marcar todas las líneas visibles';
}

function toggleAllVisibleClaims(checked) {
  for (const row of visibleRowsForBulkSelection()) {
    if (checked) state.selectedClaimIds.add(row.claimId);
    else state.selectedClaimIds.delete(row.claimId);
  }
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = selectedRows().length;
  const selected = el('selectedCount');
  if (selected) selected.textContent = `${count.toLocaleString('es-ES')} seleccionada${count === 1 ? '' : 's'}`;
  const claimBtn = el('claimSelectedBtn');
  const unclaimBtn = el('unclaimSelectedBtn');
  if (claimBtn) claimBtn.disabled = count === 0;
  if (unclaimBtn) unclaimBtn.disabled = count === 0;
  updateSelectAllState();
}

function onDocumentChange(event) {
  const target = event.target;
  if (!target.classList) return;

  if (target.classList.contains('select-all-checkbox')) {
    toggleAllVisibleClaims(target.checked);
    return;
  }

  if (!target.classList.contains('claim-checkbox')) return;
  const id = target.dataset.claimId;
  if (!id) return;
  if (target.checked) state.selectedClaimIds.add(id);
  else state.selectedClaimIds.delete(id);
  updateSelectedCount();
}

function onDocumentClick(event) {
  if (event.target.closest('input, button, select, textarea, a, label')) return;
  const row = event.target.closest('tr[data-expand-id]');
  if (!row) return;
  const id = row.dataset.expandId;
  if (!id) return;
  if (state.expandedClaimIds.has(id)) state.expandedClaimIds.delete(id);
  else state.expandedClaimIds.add(id);
  render();
}

function markSelectedClaims() {
  const rows = selectedRows();
  if (!rows.length) {
    alert('Selecciona al menos una línea.');
    return;
  }

  const status = normalizeGestionStatus(el('claimStatusAction').value || 'En trámite');
  const note = norm(el('claimNoteInput').value);
  const now = new Date().toISOString();

  for (const row of rows) {
    if (status === 'Pendiente') {
      delete state.claims[row.claimId];
      continue;
    }
    const previous = state.claims[row.claimId] || {};
    state.claims[row.claimId] = {
      id: row.claimId,
      status,
      note: note || previous.note || '',
      updatedAt: now,
      item: row.item,
      desc: row.desc,
      lot: row.lot,
      warehouse: row.warehouse,
      exp: toIsoDate(row.exp),
      supplier: row.supplier,
      entryDoc: row.entryDoc,
      stock: row.stock,
    };
  }

  saveClaims();
  applyClaimsToRows();
  state.selectedClaimIds.clear();
  el('claimNoteInput').value = '';
  applyFilters();
}

function unclaimSelected() {
  const rows = selectedRows();
  if (!rows.length) {
    alert('Selecciona al menos una línea.');
    return;
  }

  for (const row of rows) delete state.claims[row.claimId];
  saveClaims();
  applyClaimsToRows();
  state.selectedClaimIds.clear();
  applyFilters();
}

function clearAllClaims() {
  const total = Object.keys(state.claims).length;
  if (!total) return;
  const ok = confirm(`Vas a borrar ${total.toLocaleString('es-ES')} reclamación(es) guardadas en este navegador. ¿Continuar?`);
  if (!ok) return;
  state.claims = {};
  state.selectedClaimIds.clear();
  saveClaims();
  applyClaimsToRows();
  applyFilters();
}

function exportClaims() {
  const values = Object.values(state.claims);
  if (!values.length) {
    alert('No hay reclamaciones guardadas para exportar.');
    return;
  }

  const data = values
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .map(c => ({
      'Estado gestión': normalizeGestionStatus(c.status),
      'Nota gestión': c.note || '',
      'Fecha gestión': c.updatedAt ? fmtDate(c.updatedAt) : '',
      'Nº artículo': c.item || '',
      'Descripción artículo': c.desc || '',
      'Lote': c.lot || '',
      'Almacén': c.warehouse || '',
      'Fecha caducidad': fmtDate(c.exp),
      'Stock al marcar': c.stock || 0,
      'Proveedor entrada': c.supplier || '',
      'Nº entrada mercancía': c.entryDoc || '',
      'ID caducidad': c.id || '',
    }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 11 }, { wch: 35 }, { wch: 15 },
    { wch: 10 }, { wch: 14 }, { wch: 13 }, { wch: 28 }, { wch: 14 }, { wch: 70 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reclamaciones');
  XLSX.writeFile(wb, 'reclamaciones_caducidad_provesa.xlsx');
}

function currentMonthStartDate() {
  const today = todayDateOnly();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function expiryLimitDate(months) {
  const n = Number(months);
  if (!Number.isFinite(n)) return null;
  const today = todayDateOnly();
  // Criterio PROVESA v2.10: meses naturales completos.
  // Ejemplo: si hoy es 15/01 y filtro 1 mes, se filtra desde 01/01 hasta 28/02 o 29/02.
  return new Date(today.getFullYear(), today.getMonth() + n + 1, 0);
}

function isCurrentlyExpired(row) {
  const exp = parseDate(row.exp);
  if (!exp) return false;
  exp.setHours(0, 0, 0, 0);
  return exp < todayDateOnly();
}

function expiresWithinMonths(row, months) {
  const exp = parseDate(row.exp);
  const start = currentMonthStartDate();
  const limit = expiryLimitDate(months);
  if (!exp || !start || !limit) return false;
  exp.setHours(0, 0, 0, 0);
  limit.setHours(0, 0, 0, 0);
  return exp >= start && exp <= limit;
}

function mapRow(row) {
  const exp = get(row, COLS.exp);
  const entry = get(row, COLS.entryDate);
  const daysExpRaw = get(row, COLS.daysExp);
  const daysLifeRaw = get(row, COLS.daysLife);
  const monthsLifeRaw = get(row, COLS.monthsLife);
  const calculatedDaysExp = diffDays(new Date(), exp);
  const daysExp = calculatedDaysExp !== null ? calculatedDaysExp : (daysExpRaw !== '' ? parseNumber(daysExpRaw) : null);
  const daysInProvesa = daysFrom(entry);
  const cold = norm(get(row, COLS.cold));
  return {
    item: formatItemCode(get(row, COLS.item)),
    desc: norm(get(row, COLS.desc)),
    group: norm(get(row, COLS.group)) || 'Sin grupo',
    type: norm(get(row, COLS.type)) || 'Sin propiedad',
    cold: cold || 'No',
    lot: norm(get(row, COLS.lot)),
    exp,
    daysExp: Number.isFinite(daysExp) ? daysExp : null,
    status: statusFromDays(daysExp) || norm(get(row, COLS.status)),
    warehouse: norm(get(row, COLS.warehouse)) || norm(get(row, COLS.entryWarehouse)),
    stock: parseNumber(get(row, COLS.stock)),
    entryDate: entry,
    daysInProvesa,
    entryDoc: norm(get(row, COLS.entryDoc)),
    supplier: norm(get(row, COLS.supplier)) || 'Sin proveedor',
    entryWarehouse: norm(get(row, COLS.entryWarehouse)),
    daysLife: daysLifeRaw !== '' ? parseNumber(daysLifeRaw) : null,
    monthsLife: monthsLifeRaw !== '' ? parseNumber(monthsLifeRaw) : null,
    lastPurchaseDate: get(row, COLS.lastPurchaseDate),
    lastPurchaseDoc: norm(get(row, COLS.lastPurchaseDoc)),
    lastArticleSaleDate: get(row, COLS.lastArticleSaleDate),
    lastArticleClient: norm(get(row, COLS.lastArticleClient)),
    lastArticleSaleDoc: norm(get(row, COLS.lastArticleSaleDoc)),
    lastLotSaleDate: get(row, COLS.lastLotSaleDate),
    lastLotClient: norm(get(row, COLS.lastLotClient)),
    lastLotSaleDoc: norm(get(row, COLS.lastLotSaleDoc)),
    policyStatus: '',
    policyThresholdDays: null,
    policyBasis: '',
    policyNote: '',
    policySource: '',
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

function policyBadge(status) {
  const s = status || 'Sin política definida';
  let cls = 'blue';
  if (s === 'En política') cls = 'red';
  else if (s === 'Fuera de política') cls = 'green';
  else if (s === 'No acepta devolución') cls = 'yellow';
  else if (s === 'Sin fecha entrada') cls = 'orange';
  return `<span class="badge ${cls}">${escapeHtml(s)}</span>`;
}

function setup() {
  loadClaims();
  el('fileInput').addEventListener('change', onFile);
  ['searchInput','expiryFilter','supplierFilter','policyFilter','claimFilter','typeFilter','coldFilter','warehouseFilter','sortFilter'].forEach(id => {
    el(id).addEventListener('input', applyFilters);
    el(id).addEventListener('change', applyFilters);
  });
  el('clearBtn').addEventListener('click', clearFilters);
  el('exportBtn').addEventListener('click', exportView);
  const exportExpiredOutPolicyBtn = el('exportExpiredOutPolicyBtn');
  if (exportExpiredOutPolicyBtn) exportExpiredOutPolicyBtn.addEventListener('click', exportExpiredOutPolicy);
  const exportExpiredInPolicyBtn = el('exportExpiredInPolicyBtn');
  if (exportExpiredInPolicyBtn) exportExpiredInPolicyBtn.addEventListener('click', exportExpiredInPolicyBySupplier);
  const exportPetOutPolicyBtn = el('exportPetOutPolicyBtn');
  if (exportPetOutPolicyBtn) exportPetOutPolicyBtn.addEventListener('click', exportPetOutPolicyOffers);
  const exportProductionOutPolicyBtn = el('exportProductionOutPolicyBtn');
  if (exportProductionOutPolicyBtn) exportProductionOutPolicyBtn.addEventListener('click', exportProductionOutPolicy);
  const manageFlowBtn = el('manageFlowBtn');
  if (manageFlowBtn) manageFlowBtn.addEventListener('click', startManagementFlow);
  el('claimSelectedBtn').addEventListener('click', markSelectedClaims);
  el('unclaimSelectedBtn').addEventListener('click', unclaimSelected);
  el('exportClaimsBtn').addEventListener('click', exportClaims);
  el('clearClaimsBtn').addEventListener('click', clearAllClaims);
  document.addEventListener('change', onDocumentChange);
  document.addEventListener('click', onDocumentClick);
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  render();
  autoLoadDefaultPolicies();
}


async function autoLoadDefaultPolicies() {
  try {
    const response = await fetch('assets/politicas-caducidad-proveedores.xlsx', { cache: 'no-store' });
    if (!response.ok) return;
    const buffer = await response.arrayBuffer();
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
    loadPolicyWorkbook(wb, 'Políticas incluidas');
  } catch (err) {
    // Las políticas solo se modifican sustituyendo el Excel en GitHub/assets.
  }
}

function loadPolicyWorkbook(wb, fileName) {
  state.policyRules = parsePolicyWorkbook(wb);
  state.policyLoaded = state.policyRules.size > 0;
  state.policyFileName = fileName || '';
  enrichRowsWithPolicy();
  applyClaimsToRows();
  updateStatusCard();
  if (state.rows.length) applyFilters();
}

function parsePolicyWorkbook(wb) {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rules = new Map();
  for (const row of matrix) {
    const provider = cleanPolicyProvider(row[0]);
    if (!provider) continue;
    const key = normKey(provider);
    if (!key || key.includes('proveedor entrada') || key.includes('proveedores de entrada') || key.includes('proveedores') || key.includes('54 proveedores')) continue;
    const general = parseNumber(row[1]);
    const cold = parseNumber(row[2]);
    rules.set(key, {
      provider,
      generalDays: Number.isFinite(general) ? general : DEFAULT_POLICY_DAYS,
      coldDays: Number.isFinite(cold) ? cold : 0,
    });
  }
  return rules;
}

function enrichRowsWithPolicy() {
  state.rows.forEach(row => Object.assign(row, calculatePolicy(row)));
}

function calculatePolicy(row) {
  const supplierKey = normKey(row.supplier);
  const rule = state.policyRules.get(supplierKey);
  const generalDays = rule ? rule.generalDays : DEFAULT_POLICY_DAYS;
  const coldDays = rule ? rule.coldDays : 0;
  const source = rule ? 'Política proveedor' : 'Norma general';

  if (generalDays === 0) {
    return {
      policyStatus: 'No acepta devolución',
      policyThresholdDays: 0,
      policyBasis: 'Sin devolución',
      policyNote: 'Proveedor marcado con política 0',
      policySource: source,
    };
  }

  const coldApplies = isCold(row.cold) && coldDays > 0;
  const threshold = coldApplies ? coldDays : generalDays;
  const basis = coldApplies ? `Frío: ${threshold} días` : `General: ${threshold} días`;

  if (row.daysLife === null || row.daysLife === undefined || !Number.isFinite(Number(row.daysLife))) {
    return {
      policyStatus: 'Sin fecha entrada',
      policyThresholdDays: threshold,
      policyBasis: basis,
      policyNote: 'No hay fecha de entrada real o vida útil al entrar',
      policySource: source,
    };
  }

  const status = Number(row.daysLife) < threshold ? 'En política' : 'Fuera de política';
  return {
    policyStatus: status,
    policyThresholdDays: threshold,
    policyBasis: basis,
    policyNote: `${Number(row.daysLife).toLocaleString('es-ES')} días de vida útil al entrar vs umbral ${threshold}`,
    policySource: source,
  };
}

function updateStatusCard() {
  const card = el('statusCard');
  if (!card) return;

  if (!state.rows.length) {
    card.style.display = 'flex';
    card.innerHTML = `<strong>Sin datos cargados.</strong><span>Exporta el resultado de la query desde SAP y carga aquí el Excel.</span>`;
    return;
  }

  card.style.display = 'none';
}

async function onFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  state.manageFlow.active = false;
  state.raw = rows;
  state.dataFileName = file.name;
  state.rows = rows.map(mapRow).filter(r => r.item || r.desc || r.lot).map(assignClaimId);
  enrichRowsWithPolicy();
  applyClaimsToRows();
  populateSuppliers();
  populateTypes();
  populateWarehouses();
  el('exportBtn').disabled = state.rows.length === 0;
  updateGestionExportButtons();
  updateStatusCard();
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
  state.manageFlow.active = false;
  updateManagementFlowUi();
  el('searchInput').value = '';
  el('expiryFilter').value = 'all';
  el('supplierFilter').value = 'all';
  el('policyFilter').value = 'all';
  el('claimFilter').value = 'pending';
  el('typeFilter').value = 'all';
  el('coldFilter').value = 'all';
  el('warehouseFilter').value = 'all';
  el('sortFilter').value = 'expiry';
  applyFilters();
}

function getFilterValues() {
  return {
    q: normKey(el('searchInput').value),
    expiry: el('expiryFilter').value,
    supplier: el('supplierFilter').value,
    policy: el('policyFilter').value,
    claim: el('claimFilter').value,
    type: el('typeFilter').value,
    cold: el('coldFilter').value,
    wh: el('warehouseFilter').value,
    sort: el('sortFilter').value,
  };
}

function coldFilterKey(value) {
  return isCold(value) ? 'si' : 'no';
}

function rowMatchesFilters(r, filters, exclude = '') {
  const hay = normKey([r.item, r.desc, r.group, r.type, r.lot, r.warehouse, r.supplier, r.lastArticleClient, r.lastLotClient].join(' '));

  if (exclude !== 'search' && filters.q && !hay.includes(filters.q)) return false;

  if (exclude !== 'expiry') {
    if (filters.expiry === 'expired' && !isCurrentlyExpired(r)) return false;
    if (!['all','expired'].includes(filters.expiry) && !expiresWithinMonths(r, Number(filters.expiry))) return false;
  }

  if (exclude !== 'supplier' && filters.supplier !== 'all' && r.supplier !== filters.supplier) return false;
  if (exclude !== 'policy' && filters.policy !== 'all' && r.policyStatus !== filters.policy) return false;
  if (exclude !== 'claim') {
    const gestion = gestionStatus(r);
    if (filters.claim === 'pending' && gestion !== 'Pendiente') return false;
    if (filters.claim === 'tramite' && gestion !== 'En trámite') return false;
    if (filters.claim === 'oferta' && gestion !== 'En oferta') return false;
  }
  if (exclude !== 'type' && filters.type !== 'all' && r.type !== filters.type) return false;
  if (exclude !== 'cold' && filters.cold !== 'all' && coldFilterKey(r.cold) !== filters.cold) return false;
  if (exclude !== 'warehouse' && filters.wh !== 'all' && r.warehouse !== filters.wh) return false;

  return true;
}

function optionRowsFor(exclude, filters) {
  return state.rows.filter(r => rowMatchesFilters(r, filters, exclude));
}

function resetSelectOptions(select, firstLabel, options, currentValue) {
  const optionValues = options.map(o => o.value);

  // v3.2: no reiniciar filtros al guardar una gestión.
  // Si el valor elegido deja de tener resultados, se conserva como opción activa
  // para que el usuario decida si quiere cambiarlo o limpiar filtros.
  const preserved = [];
  if (currentValue && currentValue !== 'all' && !optionValues.includes(currentValue)) {
    const currentLabel = select.options[select.selectedIndex]?.textContent || currentValue;
    preserved.push({ value: currentValue, label: `${currentLabel} · sin resultados` });
  }

  const finalOptions = [...preserved, ...options];
  select.innerHTML = `<option value="all">${escapeHtml(firstLabel)}</option>` +
    finalOptions.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');

  select.value = currentValue || 'all';
  return false;
}

function uniqueOptions(rows, getter, labelGetter = getter) {
  const map = new Map();
  for (const r of rows) {
    const value = getter(r);
    if (!value) continue;
    const label = labelGetter(r);
    if (!map.has(value)) map.set(value, { value, label, count: 0 });
    map.get(value).count += 1;
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function syncDynamicFilterOptions() {
  if (!state.rows.length) return false;

  const filters = getFilterValues();
  let changed = false;

  const supplierRows = optionRowsFor('supplier', filters);
  changed = resetSelectOptions(
    el('supplierFilter'),
    'Todos',
    uniqueOptions(supplierRows, r => r.supplier),
    filters.supplier
  ) || changed;

  const policyOrder = ['En política', 'Fuera de política', 'No acepta devolución', 'Sin fecha entrada', 'Sin política definida'];
  const policyRows = optionRowsFor('policy', filters);
  const policyCounts = new Map();
  for (const r of policyRows) {
    const value = r.policyStatus || 'Sin política definida';
    policyCounts.set(value, (policyCounts.get(value) || 0) + 1);
  }
  const policyOptions = policyOrder
    .filter(value => policyCounts.has(value))
    .map(value => ({ value, label: value, count: policyCounts.get(value) }));
  changed = resetSelectOptions(el('policyFilter'), 'Todas', policyOptions, filters.policy) || changed;

  const claimRows = optionRowsFor('claim', filters);
  const claimCounts = new Map();
  for (const r of claimRows) {
    const value = gestionStatus(r);
    claimCounts.set(value, (claimCounts.get(value) || 0) + 1);
  }
  const claimOptions = [
    { value: 'pending', label: 'Pendientes', status: 'Pendiente' },
    { value: 'tramite', label: 'En trámite', status: 'En trámite' },
    { value: 'oferta', label: 'En oferta', status: 'En oferta' },
  ]
    .filter(o => claimCounts.has(o.status))
    .map(o => ({ value: o.value, label: o.label, count: claimCounts.get(o.status) }));
  changed = resetSelectOptions(el('claimFilter'), 'Todos', claimOptions, filters.claim) || changed;

  const typeRows = optionRowsFor('type', filters);
  changed = resetSelectOptions(
    el('typeFilter'),
    'Todos',
    uniqueOptions(typeRows, r => r.type),
    filters.type
  ) || changed;

  const coldRows = optionRowsFor('cold', filters);
  const coldCounts = new Map();
  for (const r of coldRows) {
    const value = coldFilterKey(r.cold);
    coldCounts.set(value, (coldCounts.get(value) || 0) + 1);
  }
  const coldOptions = [
    { value: 'si', label: 'Sí' },
    { value: 'no', label: 'No' },
  ].filter(o => coldCounts.has(o.value)).map(o => ({ ...o, count: coldCounts.get(o.value) }));
  changed = resetSelectOptions(el('coldFilter'), 'Todos', coldOptions, filters.cold) || changed;

  const warehouseRows = optionRowsFor('warehouse', filters);
  changed = resetSelectOptions(
    el('warehouseFilter'),
    'Todos',
    uniqueOptions(warehouseRows, r => r.warehouse, r => `Almacén ${r.warehouse}`),
    filters.wh
  ) || changed;

  return changed;
}

function applyFilters() {
  let safety = 0;
  while (syncDynamicFilterOptions() && safety < 5) safety += 1;

  const filters = getFilterValues();
  state.filtered = state.rows.filter(r => rowMatchesFilters(r, filters));

  state.filtered.sort((a,b) => {
    if (filters.sort === 'age') return (b.daysInProvesa ?? -999999) - (a.daysInProvesa ?? -999999);
    if (filters.sort === 'stock') return b.stock - a.stock;
    if (filters.sort === 'item') return a.item.localeCompare(b.item, 'es') || a.lot.localeCompare(b.lot, 'es');
    return (a.daysExp ?? 999999) - (b.daysExp ?? 999999);
  });

  render();
  updateManagementFlowUi();
}

function setTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === tab));
}

function render() {
  renderSummary();
  renderArticles();
  renderLots();
  updateSelectedCount();
}

function renderSummary() {
  const rows = state.filtered;
  const cards = el('cards');
  if (cards) cards.innerHTML = '';
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
    const x = map.get(key) || { item: r.item, desc: r.desc, group: r.group, types: new Set(), policies: new Set(), cold: r.cold, stock: 0, lots: new Set(), minDays: null, maxAge: null, lastClient: '', lastSale: null };
    x.stock += r.stock;
    x.types.add(r.type);
    x.policies.add(r.policyStatus || '');
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
    ['Nº artículo', x => x.item], ['Descripción', x => x.desc], ['Grupo', x => x.group], ['Tipo', x => [...x.types].join(' / ')], ['Política', x => [...x.policies].filter(Boolean).join(' / ')], ['Frío', x => x.cold],
    ['Stock', x => fmtNum(x.stock, 2), 'num'], ['Lotes', x => fmtNum(x.lots.size), 'num'],
    ['Caducidad mínima', x => badge(statusFromDays(x.minDays), x.minDays)], ['Días', x => fmtNum(x.minDays), 'num'],
    ['Máx. días en PROVESA', x => fmtNum(x.maxAge), 'num'], ['Último cliente', x => x.lastClient || ''], ['Fecha último albarán', x => fmtDate(x.lastSale)],
  ]);
}

function renderLots() {
  const data = state.filtered;
  el('lotsCount').textContent = `${data.length.toLocaleString('es-ES')} líneas`;
  renderExpandableTable('lotsTable', data, lotColumns());
}

function lotColumns() {
  return [
    ['Sel.', r => claimCheckbox(r)],
    ['Gestión', r => claimBadge(gestionStatus(r))],
    ['Nota recl.', r => currentClaim(r) ? escapeHtml(currentClaim(r).note || '') : ''],
    ['Nº artículo', r => r.item],
    ['Descripción', r => r.desc],
    ['Cantidad', r => fmtQty(r.stock), 'num'],
    ['Lote', r => r.lot],
    ['Caducidad', r => fmtDate(r.exp)],
    ['Proveedor entrada', r => r.supplier],
    ['Almacén', r => r.warehouse],
    ['Estado', r => badge(r.status, r.daysExp)],
    ['Política', r => policyBadge(r.policyStatus)],
  ];
}

function lotDetailFields(r) {
  return [
    ['Tipo', r.type],
    ['Frío', r.cold],
    ['Entrada', fmtDate(r.entryDate)],
    ['Nº entrada', r.entryDoc],
    ['Última compra', fmtDate(r.lastPurchaseDate)],
    ['Último cliente artículo', r.lastArticleClient],
    ['Fecha último albarán artículo', fmtDate(r.lastArticleSaleDate)],
    ['Nº último albarán artículo', r.lastArticleSaleDoc],
    ['Último cliente lote', r.lastLotClient],
    ['Fecha último albarán lote', fmtDate(r.lastLotSaleDate)],
    ['Nº último albarán lote', r.lastLotSaleDoc],
    ['Base política', r.policyBasis],
  ];
}

function renderLotDetails(row) {
  const fields = lotDetailFields(row).filter(([, value]) => value !== undefined && value !== null && String(value) !== '');
  return `
    <div class="detail-box">
      <div class="detail-title">Detalle de la línea</div>
      <div class="detail-grid">
        ${fields.map(([label, value]) => `
          <div class="detail-item">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderHeaderCell(label) {
  if (label === 'Sel.') {
    return `<th class="select-col"><input type="checkbox" id="selectAllClaims" class="select-all-checkbox" aria-label="Seleccionar todas las líneas visibles" title="Marcar todas las líneas visibles" /></th>`;
  }
  return `<th>${escapeHtml(label)}</th>`;
}

function renderExpandableTable(id, data, cols) {
  const table = el(id);
  if (!data.length) {
    table.innerHTML = `<tbody><tr><td>${document.getElementById('emptyTemplate').innerHTML}</td></tr></tbody>`;
    return;
  }
  table.innerHTML = `
    <thead><tr>${cols.map(([h]) => renderHeaderCell(h)).join('')}</tr></thead>
    <tbody>${data.map(row => {
      const rowId = row.claimId;
      const safeRowId = escapeHtml(rowId);
      const expanded = state.expandedClaimIds.has(rowId);
      const main = `<tr class="expandable-row ${expanded ? 'expanded' : ''}" data-expand-id="${safeRowId}" title="Clic para ver detalle">
        ${cols.map(([h, fn, cls]) => `<td class="${cls || ''}">${fn(row) ?? ''}</td>`).join('')}
      </tr>`;
      const detail = expanded ? `<tr class="detail-row" data-detail-for="${safeRowId}"><td colspan="${cols.length}">${renderLotDetails(row)}</td></tr>` : '';
      return main + detail;
    }).join('')}</tbody>
  `;
  updateSelectAllState();
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


function startManagementFlow() {
  if (!state.rows.length) {
    alert('Carga primero el Excel de SAP.');
    return;
  }

  if (!state.manageFlow.active) {
    state.manageFlow = {
      active: true,
      warehouseIndex: 0,
      stepIndex: 0,
      providers: [],
      providerIndex: 0,
    };
    applyCurrentManagementStep();
    return;
  }

  advanceManagementFlow();
}

function currentManagementStepKey() {
  return MANAGEMENT_STEP_ORDER[state.manageFlow.stepIndex] || '';
}

function currentManagementStep() {
  return MANAGEMENT_STEPS[currentManagementStepKey()] || null;
}

function currentManagementWarehouse() {
  const target = MANAGEMENT_WAREHOUSE_TARGETS[state.manageFlow.warehouseIndex] || MANAGEMENT_WAREHOUSE_TARGETS[0];
  return resolveWarehouseValue(target);
}

function currentManagementWarehouseLabel(stepKey = currentManagementStepKey()) {
  if (stepKey === 'productionOutPolicy') return '01 + 02';
  return currentManagementWarehouse();
}

function stepUsesCombinedWarehouses(stepKey = currentManagementStepKey()) {
  return stepKey === 'productionOutPolicy';
}

function shouldSkipCurrentManagementStep() {
  return currentManagementStepKey() === 'productionOutPolicy' && state.manageFlow.warehouseIndex > 0;
}

function resolveWarehouseValue(target) {
  const values = [...new Set(state.rows.map(r => r.warehouse).filter(Boolean))];
  const candidates = target === '01' ? ['01', '1', '001'] : ['02', '2', '002'];
  return candidates.find(v => values.includes(v)) || target;
}

function resolveTypeValue(kind) {
  if (kind === 'all') return 'all';
  const values = [...new Set(state.rows.map(r => r.type).filter(Boolean))];
  if (kind === 'pet') {
    return values.find(v => normKey(v) === 'compania') || values.find(v => normKey(v).includes('compania')) || 'all';
  }
  if (kind === 'production') {
    return values.find(v => normKey(v) === 'produccion') || values.find(v => normKey(v).includes('produccion')) || 'all';
  }
  return 'all';
}

function ensureSelectOption(selectId, value, label = value) {
  const select = el(selectId);
  if (!select) return;
  const exists = [...select.options].some(opt => opt.value === value);
  if (!exists) select.appendChild(new Option(label, value));
  select.value = value;
}

function pendingExpiredInPolicyProviders(warehouse) {
  return [...new Set(state.rows
    .filter(row =>
      row.warehouse === warehouse &&
      isCurrentlyExpired(row) &&
      isInPolicy(row) &&
      gestionStatus(row) === 'Pendiente' &&
      row.supplier
    )
    .map(row => row.supplier))]
    .sort((a, b) => a.localeCompare(b, 'es'));
}

function applyCurrentManagementStep() {
  const stepKey = currentManagementStepKey();
  const step = currentManagementStep();
  if (!step) {
    finishManagementFlow();
    return;
  }

  if (shouldSkipCurrentManagementStep()) {
    state.manageFlow.stepIndex += 1;
    state.manageFlow.providers = [];
    state.manageFlow.providerIndex = 0;
    applyCurrentManagementStep();
    return;
  }

  const warehouse = currentManagementWarehouse();

  if (stepKey === 'expiredInPolicy') {
    if (!state.manageFlow.providers.length) {
      state.manageFlow.providers = pendingExpiredInPolicyProviders(warehouse);
      state.manageFlow.providerIndex = 0;
    }
    if (!state.manageFlow.providers.length) {
      // Si no hay proveedores pendientes en política, pasamos automáticamente al siguiente bloque.
      state.manageFlow.stepIndex += 1;
      state.manageFlow.providers = [];
      state.manageFlow.providerIndex = 0;
      applyCurrentManagementStep();
      return;
    }
  }

  const supplier = step.supplier === 'provider'
    ? (state.manageFlow.providers[state.manageFlow.providerIndex] || 'all')
    : 'all';
  const typeValue = resolveTypeValue(step.typeKind);

  el('searchInput').value = '';
  ensureSelectOption('expiryFilter', step.expiry, step.expiry);
  ensureSelectOption('policyFilter', step.policy, step.policy);
  ensureSelectOption('supplierFilter', supplier, supplier === 'all' ? 'Todos' : supplier);
  ensureSelectOption('claimFilter', 'pending', 'Pendientes');
  ensureSelectOption('typeFilter', typeValue, typeValue === 'all' ? 'Todos' : typeValue);
  ensureSelectOption('coldFilter', 'all', 'Todos');
  const warehouseFilterValue = stepUsesCombinedWarehouses(stepKey) ? 'all' : warehouse;
  const warehouseFilterLabel = stepUsesCombinedWarehouses(stepKey) ? 'Todos' : `Almacén ${warehouse}`;
  ensureSelectOption('warehouseFilter', warehouseFilterValue, warehouseFilterLabel);
  ensureSelectOption('sortFilter', 'expiry', 'Caducidad próxima');

  state.selectedClaimIds.clear();
  setTab('lotes');
  applyFilters();
}

function advanceManagementFlow() {
  autoMarkCurrentManagementStep();

  const stepKey = currentManagementStepKey();

  if (stepKey === 'expiredInPolicy') {
    const nextProviderIndex = state.manageFlow.providerIndex + 1;
    if (nextProviderIndex < state.manageFlow.providers.length) {
      state.manageFlow.providerIndex = nextProviderIndex;
      applyCurrentManagementStep();
      return;
    }
  }

  state.manageFlow.stepIndex += 1;
  state.manageFlow.providers = [];
  state.manageFlow.providerIndex = 0;

  if (state.manageFlow.stepIndex >= MANAGEMENT_STEP_ORDER.length) {
    if (state.manageFlow.warehouseIndex < MANAGEMENT_WAREHOUSE_TARGETS.length - 1) {
      state.manageFlow.warehouseIndex += 1;
      state.manageFlow.stepIndex = 0;
      applyCurrentManagementStep();
      return;
    }
    finishManagementFlow();
    return;
  }

  if (shouldSkipCurrentManagementStep()) {
    finishManagementFlow();
    return;
  }

  applyCurrentManagementStep();
}

function autoMarkCurrentManagementStep() {
  const step = currentManagementStep();
  if (!step) return;

  const rows = state.filtered.filter(row => gestionStatus(row) === 'Pendiente');
  if (!rows.length) return;

  const now = new Date().toISOString();
  for (const row of rows) {
    state.claims[row.claimId] = {
      id: row.claimId,
      status: step.targetStatus,
      note: step.note,
      updatedAt: now,
      item: row.item,
      desc: row.desc,
      lot: row.lot,
      warehouse: row.warehouse,
      exp: toIsoDate(row.exp),
      supplier: row.supplier,
      entryDoc: row.entryDoc,
      stock: row.stock,
      managedByFlow: true,
    };
  }

  saveClaims();
  applyClaimsToRows();
  state.selectedClaimIds.clear();
}

function finishManagementFlow() {
  state.manageFlow = { active: false, warehouseIndex: 0, stepIndex: 0, providers: [], providerIndex: 0 };
  updateManagementFlowUi();
  applyFilters();
  alert('Gestión guiada finalizada. Se han recorrido almacén 01, almacén 02 y producción fuera de política conjunta para ambos almacenes.');
}

function updateManagementFlowUi() {
  const button = el('manageFlowBtn');
  const box = el('manageFlowStatus');
  const title = el('manageFlowTitle');
  const text = el('manageFlowText');

  if (!button) return;

  if (!state.manageFlow.active) {
    button.dataset.active = 'false';
    button.textContent = 'Gestionar';
    button.title = 'Iniciar recorrido guiado de gestión';
    if (box) box.hidden = true;
    return;
  }

  button.dataset.active = 'true';

  const stepKey = currentManagementStepKey();
  const step = currentManagementStep();
  const warehouse = currentManagementWarehouseLabel(stepKey);
  const supplier = stepKey === 'expiredInPolicy'
    ? (state.manageFlow.providers[state.manageFlow.providerIndex] || '')
    : '';
  const count = state.filtered.length;
  const providerPosition = stepKey === 'expiredInPolicy'
    ? ` · Proveedor ${state.manageFlow.providerIndex + 1} de ${state.manageFlow.providers.length}`
    : '';

  const isLastStep = state.manageFlow.stepIndex === MANAGEMENT_STEP_ORDER.length - 1;
  const isWarehouseOne = state.manageFlow.warehouseIndex === 0;
  const isFinalEffectiveStep = !isWarehouseOne && stepKey === 'petOutPolicy';

  if (stepKey === 'productionOutPolicy' && isWarehouseOne) button.textContent = 'Pasar a almacén 2';
  else if ((isLastStep && !isWarehouseOne) || isFinalEffectiveStep) button.textContent = 'Finalizar gestión';
  else button.textContent = 'Siguiente';

  if (box && title && text && step) {
    box.hidden = false;
    title.textContent = `${stepKey === 'productionOutPolicy' ? 'Almacenes' : 'Almacén'} ${warehouse} · ${step.title}${supplier ? ' · ' + supplier : ''}`;
    text.innerHTML = `${escapeHtml(step.detail)}<br><strong>${count.toLocaleString('es-ES')}</strong> línea${count === 1 ? '' : 's'} pendiente${count === 1 ? '' : 's'} en este paso${providerPosition}. Exportación recomendada: <strong>${escapeHtml(step.exportLabel)}</strong>. Al pulsar <strong>${escapeHtml(button.textContent)}</strong>, las líneas pendientes visibles pasarán a <strong>${escapeHtml(step.targetStatus)}</strong>.`;
  }
}

function updateGestionExportButtons() {
  ['exportExpiredOutPolicyBtn','exportExpiredInPolicyBtn','exportPetOutPolicyBtn','exportProductionOutPolicyBtn'].forEach(id => {
    const button = el(id);
    if (button) button.disabled = state.rows.length === 0;
  });
}

function requireWarehouseForGestionExport() {
  const wh = el('warehouseFilter').value;
  if (wh === 'all') {
    alert('Selecciona primero un almacén: 01 o 02. Así evitamos mezclar gestiones de almacenes distintos.');
    return '';
  }
  return wh;
}

function isInPolicy(row) {
  return row.policyStatus === 'En política';
}

function isOutOfPolicy(row) {
  return !isInPolicy(row);
}

function isPetType(row) {
  return normKey(row.type).includes('compania');
}

function isProductionType(row) {
  return normKey(row.type).includes('produccion');
}

function isNotExpired(row) {
  const exp = parseDate(row.exp);
  if (!exp) return false;
  exp.setHours(0, 0, 0, 0);
  return exp >= todayDateOnly();
}

function rowMatchesExportBaseFilters(row, ignore = {}) {
  const filters = getFilterValues();
  const hay = normKey([row.item, row.desc, row.group, row.type, row.lot, row.warehouse, row.supplier, row.lastArticleClient, row.lastLotClient].join(' '));

  if (!ignore.search && filters.q && !hay.includes(filters.q)) return false;

  if (!ignore.expiry) {
    if (filters.expiry === 'expired' && !isCurrentlyExpired(row)) return false;
    if (!['all','expired'].includes(filters.expiry) && !expiresWithinMonths(row, Number(filters.expiry))) return false;
  }

  if (!ignore.supplier && filters.supplier !== 'all' && row.supplier !== filters.supplier) return false;
  if (!ignore.policy && filters.policy !== 'all' && row.policyStatus !== filters.policy) return false;
  if (!ignore.claim) {
    const gestion = gestionStatus(row);
    if (filters.claim === 'pending' && gestion !== 'Pendiente') return false;
    if (filters.claim === 'tramite' && gestion !== 'En trámite') return false;
    if (filters.claim === 'oferta' && gestion !== 'En oferta') return false;
  }
  if (!ignore.type && filters.type !== 'all' && row.type !== filters.type) return false;
  if (!ignore.cold && filters.cold !== 'all' && coldFilterKey(row.cold) !== filters.cold) return false;
  if (!ignore.warehouse && filters.wh !== 'all' && row.warehouse !== filters.wh) return false;

  return true;
}

function exportRowsForGestion(kind) {
  if (kind !== 'productionOutPolicy' && !requireWarehouseForGestionExport()) return [];

  if (kind === 'expiredOutPolicy') {
    return state.rows.filter(row =>
      rowMatchesExportBaseFilters(row, { expiry: true, policy: true, type: true }) &&
      isCurrentlyExpired(row) &&
      isOutOfPolicy(row)
    );
  }

  if (kind === 'expiredInPolicy') {
    return state.rows.filter(row =>
      rowMatchesExportBaseFilters(row, { expiry: true, policy: true, type: true }) &&
      isCurrentlyExpired(row) &&
      isInPolicy(row)
    );
  }

  if (kind === 'petOutPolicy') {
    return state.rows.filter(row =>
      rowMatchesExportBaseFilters(row, { policy: true, type: true }) &&
      isNotExpired(row) &&
      isOutOfPolicy(row) &&
      isPetType(row)
    );
  }

  if (kind === 'productionOutPolicy') {
    return state.rows.filter(row =>
      rowMatchesExportBaseFilters(row, { policy: true, type: true, warehouse: true }) &&
      isNotExpired(row) &&
      isOutOfPolicy(row) &&
      isProductionType(row)
    );
  }

  return [];
}

function groupRows(rows, keyFn, seedFn, mergeFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, seedFn(row));
    else mergeFn(map.get(key), row);
  }
  return [...map.values()];
}

function maxDateValue(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da) return b || a || '';
  if (!db) return a || b || '';
  return db > da ? b : a;
}

function exportExpiredOutPolicy() {
  const rows = exportRowsForGestion('expiredOutPolicy');
  if (!rows.length) {
    alert('No hay caducados fuera de política con los filtros actuales.');
    return;
  }

  const data = groupRows(
    rows,
    r => [r.item, r.desc, r.lot].join('|'),
    r => ({
      'Nº artículo': r.item,
      'Descripción': r.desc,
      'Cantidad': r.stock,
      'Lote': r.lot,
    }),
    (acc, r) => { acc['Cantidad'] += r.stock; }
  ).sort((a, b) => String(a['Nº artículo']).localeCompare(String(b['Nº artículo']), 'es') || String(a['Lote']).localeCompare(String(b['Lote']), 'es'));

  writeGestionWorkbook(
    `caducados_fuera_politica_almacen_${el('warehouseFilter').value}`,
    [{ name: 'Caducados fuera política', data, widths: [12, 46, 12, 18] }]
  );
}

function exportExpiredInPolicyBySupplier() {
  const rows = exportRowsForGestion('expiredInPolicy');
  if (!rows.length) {
    alert('No hay caducados en política con los filtros actuales.');
    return;
  }

  const bySupplier = new Map();
  for (const row of rows) {
    const supplier = row.supplier || 'Sin proveedor';
    if (!bySupplier.has(supplier)) bySupplier.set(supplier, []);
    bySupplier.get(supplier).push(row);
  }

  const sheets = [...bySupplier.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'es'))
    .map(([supplier, supplierRows]) => {
      const data = groupRows(
        supplierRows,
        r => [r.item, r.desc, r.lot, r.entryDoc, toIsoDate(r.entryDate)].join('|'),
        r => ({
          'Nº artículo': r.item,
          'Descripción': r.desc,
          'Cantidad': r.stock,
          'Lote': r.lot,
          'Albarán de compra': r.entryDoc,
          'Fecha de compra': fmtDate(r.entryDate),
        }),
        (acc, r) => { acc['Cantidad'] += r.stock; }
      ).sort((a, b) => String(a['Nº artículo']).localeCompare(String(b['Nº artículo']), 'es') || String(a['Lote']).localeCompare(String(b['Lote']), 'es'));
      return { name: supplier, data, widths: [12, 46, 12, 18, 18, 16] };
    });

  writeGestionWorkbook(`caducados_en_politica_almacen_${el('warehouseFilter').value}`, sheets);
}

function exportPetOutPolicyOffers() {
  const rows = exportRowsForGestion('petOutPolicy');
  if (!rows.length) {
    alert('No hay artículos de compañía no caducados fuera de política con los filtros actuales.');
    return;
  }

  const sortedRows = groupRows(
    rows,
    r => [r.item, r.desc, r.lot, toIsoDate(r.exp)].join('|'),
    r => ({
      'Nº artículo': r.item,
      'Descripción': r.desc,
      'Cantidad': r.stock,
      'Lote': r.lot,
      'Caducidad': fmtDate(r.exp),
      'Descuento': '',
      '_sortCaducidad': toIsoDate(r.exp),
    }),
    (acc, r) => { acc['Cantidad'] += r.stock; }
  ).sort((a, b) =>
    String(a['_sortCaducidad'] || '9999-12-31').localeCompare(String(b['_sortCaducidad'] || '9999-12-31')) ||
    String(a['Nº artículo']).localeCompare(String(b['Nº artículo']), 'es') ||
    String(a['Lote']).localeCompare(String(b['Lote']), 'es')
  );

  const columns = ['Nº artículo', 'Descripción', 'Cantidad', 'Lote', 'Caducidad', 'Descuento'];
  const blankRow = Object.fromEntries(columns.map(col => [col, '']));
  const data = [];
  let previousMonth = '';

  for (const row of sortedRows) {
    const monthKey = String(row['_sortCaducidad'] || '').slice(0, 7);
    if (previousMonth && monthKey && monthKey !== previousMonth) data.push({ ...blankRow });
    const { _sortCaducidad, ...visibleRow } = row;
    data.push(visibleRow);
    if (monthKey) previousMonth = monthKey;
  }

  writeGestionWorkbook(
    `ofertas_compania_fuera_politica_almacen_${el('warehouseFilter').value}`,
    [{ name: 'Ofertas compañía', data, widths: [12, 46, 12, 18, 18, 14] }]
  );
}

function exportProductionOutPolicy() {
  const rows = exportRowsForGestion('productionOutPolicy');
  if (!rows.length) {
    alert('No hay artículos de producción no caducados fuera de política con los filtros actuales.');
    return;
  }

  const sortedRows = groupRows(
    rows,
    r => [r.desc, r.lot, toIsoDate(r.exp)].join('|'),
    r => ({
      'Descripción': r.desc,
      'Lote': r.lot,
      'Cantidad': r.stock,
      'Caducidad': fmtDate(r.exp),
      'Última entrada': fmtDate(r.lastPurchaseDate),
      'Última venta': fmtDate(r.lastArticleSaleDate),
      'Cliente': r.lastArticleClient || '',
      'Acción/respuesta': '',
      '_sortCaducidad': toIsoDate(r.exp),
      _lastEntryArticleRaw: r.lastPurchaseDate,
      _lastSaleRaw: r.lastArticleSaleDate,
    }),
    (acc, r) => {
      acc['Cantidad'] += r.stock;
      const entry = maxDateValue(acc._lastEntryArticleRaw, r.lastPurchaseDate);
      acc._lastEntryArticleRaw = entry;
      acc['Última entrada'] = fmtDate(entry);
      const sale = maxDateValue(acc._lastSaleRaw, r.lastArticleSaleDate);
      if (toIsoDate(sale) !== toIsoDate(acc._lastSaleRaw)) acc['Cliente'] = r.lastArticleClient || acc['Cliente'];
      acc._lastSaleRaw = sale;
      acc['Última venta'] = fmtDate(sale);
    }
  ).sort((a, b) =>
    String(a['_sortCaducidad'] || '9999-12-31').localeCompare(String(b['_sortCaducidad'] || '9999-12-31')) ||
    String(a['Descripción']).localeCompare(String(b['Descripción']), 'es') ||
    String(a['Lote']).localeCompare(String(b['Lote']), 'es')
  );

  const columns = ['Descripción', 'Lote', 'Cantidad', 'Caducidad', 'Última entrada', 'Última venta', 'Cliente', 'Acción/respuesta'];
  const blankRow = Object.fromEntries(columns.map(col => [col, '']));
  const data = [];
  let previousMonth = '';

  for (const row of sortedRows) {
    const monthKey = String(row['_sortCaducidad'] || '').slice(0, 7);
    if (previousMonth && monthKey && monthKey !== previousMonth) data.push({ ...blankRow });
    const { _sortCaducidad, _lastEntryArticleRaw, _lastSaleRaw, ...visibleRow } = row;
    data.push(visibleRow);
    if (monthKey) previousMonth = monthKey;
  }

  writeGestionWorkbook(
    'produccion_fuera_politica_almacenes_01_02',
    [{ name: 'Producción fuera política', data, widths: [38, 14, 10, 14, 17, 17, 28, 24] }]
  );
}

function writeGestionWorkbook(fileBaseName, sheets) {
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  for (const sheet of sheets) {
    if (!sheet.data.length) continue;
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    applyGestionSheetFormat(ws, sheet.data, sheet.widths || []);
    const sheetName = uniqueSheetName(sheet.name || 'Hoja', usedNames);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  if (!wb.SheetNames.length) {
    alert('No hay datos para exportar.');
    return;
  }

  const wh = el('warehouseFilter').value;
  const suffix = activeFilterParts()
    .filter(part => !part.toLowerCase().includes('almacen'))
    .join('_');
  const finalName = sanitizeFileName(`${fileBaseName}${suffix ? '_' + suffix : ''}`);
  XLSX.writeFile(wb, `${finalName}.xlsx`);
}

function applyGestionSheetFormat(ws, data, widths) {
  const columns = Object.keys(data[0] || {});
  ws['!cols'] = columns.map((_, i) => ({ wch: widths[i] || 16 }));
  ws['!rows'] = [{ hpt: 22 }];
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  ws['!margins'] = {
    left: 0.25,
    right: 0.25,
    top: 0.35,
    bottom: 0.35,
    header: 0.15,
    footer: 0.15
  };
  ws['!pageSetup'] = {
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    scale: 90
  };
  for (let c = 0; c < columns.length; c += 1) {
    const ref = `${columnLetter(c)}1`;
    if (!ws[ref]) continue;
    ws[ref].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1767C2' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
  }

  const quantityIndex = columns.findIndex(col => normKey(col) === 'cantidad');
  if (quantityIndex >= 0) {
    const quantityCol = columnLetter(quantityIndex);
    for (let r = 2; r <= data.length + 1; r += 1) {
      const ref = `${quantityCol}${r}`;
      if (!ws[ref]) continue;
      const rawValue = ws[ref].v;
      const isBlank = rawValue === undefined || rawValue === null || String(rawValue).trim() === '';
      const numericValue = isBlank ? null : parseNumber(rawValue);
      const isNumber = numericValue !== null && Number.isFinite(numericValue);
      if (isNumber) {
        ws[ref].t = 'n';
        ws[ref].v = numericValue;
      }
      const isInteger = isNumber && Math.abs(numericValue - Math.round(numericValue)) < 0.000001;
      const style = {
        ...(ws[ref].s || {}),
        alignment: { horizontal: 'center', vertical: 'center' }
      };
      if (!isBlank) style.numFmt = isInteger ? '0' : '0.###';
      ws[ref].s = style;
    }
  }
}

function columnLetter(index) {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function uniqueSheetName(base, usedNames) {
  const clean = sanitizeSheetName(base) || 'Hoja';
  let candidate = clean;
  let i = 2;
  while (usedNames.has(candidate)) {
    const suffix = ` ${i}`;
    candidate = `${clean.slice(0, 31 - suffix.length)}${suffix}`;
    i += 1;
  }
  usedNames.add(candidate);
  return candidate;
}

function exportView() {
  const title = makeExportTitle();
  const data = state.filtered.map(r => ({
    'Nº artículo': r.item,
    'Descripción artículo': r.desc,
    'Lote': r.lot,
    'Fecha caducidad': fmtDate(r.exp),
    'Estado caducidad': r.status,
    'Política caducidad': r.policyStatus,
    'Estado gestión': gestionStatus(r),
    'Nota gestión': currentClaim(r)?.note || '',
    'Stock': r.stock,
    'Fecha entrada real': fmtDate(r.entryDate),
    'Último cliente que compró artículo': r.lastArticleClient,
    'Proveedor entrada': r.supplier,
    'Nº entrada mercancía': r.entryDoc,
  }));

  const ws = XLSX.utils.aoa_to_sheet([[title], []]);
  XLSX.utils.sheet_add_json(ws, data, { origin: 'A3' });
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } }];
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
    { wch: 18 }, // Política caducidad
    { wch: 18 }, // Estado gestión
    { wch: 28 }, // Nota gestión
    { wch: 9 },  // Stock
    { wch: 12 }, // Entrada
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
  const policy = el('policyFilter').value;
  const claim = el('claimFilter').value;
  const type = el('typeFilter').value;
  const cold = el('coldFilter').value;
  const wh = el('warehouseFilter').value;

  if (q) parts.push(`busqueda ${q}`);
  if (expiry === 'expired') parts.push('caducados actuales');
  else if (expiry !== 'all') parts.push(`caducidad ${expiry} mes${expiry === '1' ? '' : 'es'} completo${expiry === '1' ? '' : 's'}`);
  if (supplier !== 'all') parts.push(supplier);
  if (policy !== 'all') parts.push(policy);
  if (claim === 'pending') parts.push('pendientes');
  else if (claim === 'tramite') parts.push('en tramite');
  else if (claim === 'oferta') parts.push('en oferta');
  else if (claim === 'all') parts.push('todos gestion');
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
