// ========================================================
// 1. LÓGICA DE MOVIMIENTOS DE INVENTARIO (KARDEX)
// ========================================================
let kardexDataCompleta = [];
let productosKardexLista = [];

async function cargarKardex() {
  try {
    const res = await fetch('/api/reportes/kardex');
    kardexDataCompleta = await res.json();
    poblarSelectorProductosKardex();
    aplicarFiltrosKardex();
  } catch (err) {
    console.error("Error cargando kardex:", err);
  }
}

function poblarSelectorProductosKardex() {
  const mapa = new Map();
  kardexDataCompleta.forEach(m => {
    if (m.producto && !mapa.has(m.producto)) {
      mapa.set(m.producto, {
        nombre: m.producto,
        codigo_barras: m.codigo_barras || ''
      });
    }
  });
  productosKardexLista = Array.from(mapa.values());
  renderOpcionesKardexProducto(productosKardexLista);
}

function renderOpcionesKardexProducto(lista) {
  const container = document.getElementById('options-kardex-producto');
  if (!container) return;

  const valorActual = document.getElementById('kardex-filtro-producto')?.value || '';

  let html = `
    <div class="custom-select-option ${!valorActual ? 'selected' : ''}" onclick="seleccionarKardexProducto('', 'Todos los Productos')">
      <strong style="color: #fff;">Todos los Productos</strong>
      <small style="color: var(--text-muted); font-size: 0.74rem;">Ver todos los movimientos</small>
    </div>
  `;

  if (!lista || lista.length === 0) {
    container.innerHTML = html + `<div class="custom-select-empty">No se encontraron productos.</div>`;
    return;
  }

  html += lista.map(p => {
    const isSelected = valorActual === p.nombre;
    const cod = p.codigo_barras ? `<small style="color: var(--text-muted); font-size: 0.74rem;">Cód: <span style="font-family: monospace; color: var(--primary);">${p.codigo_barras}</span></small>` : '';
    const safeNombre = (p.nombre || '').replace(/'/g, "\\'");
    return `
      <div class="custom-select-option ${isSelected ? 'selected' : ''}" onclick="seleccionarKardexProducto('${safeNombre}', '${safeNombre}')">
        <strong style="color: #fff;">${p.nombre}</strong>
        ${cod}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function toggleDropdownKardexProducto() {
  const dd = document.getElementById('dropdown-kardex-producto');
  const box = document.getElementById('box-kardex-producto');
  const arrow = document.getElementById('arrow-kardex-producto');
  const searchInput = document.getElementById('search-kardex-producto');
  if (!dd) return;

  const abierto = !dd.classList.contains('hidden');
  cerrarTodosLosDropdowns();

  if (!abierto) {
    dd.classList.remove('hidden');
    if (box) box.classList.add('open');
    if (arrow) arrow.classList.add('rotate');
    if (searchInput) {
      searchInput.value = '';
      filtrarDropdownKardexProducto();
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}

function filtrarDropdownKardexProducto() {
  const input = document.getElementById('search-kardex-producto');
  const q = input ? input.value.trim().toLowerCase() : '';
  const filtrados = productosKardexLista.filter(p => 
    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
  );
  renderOpcionesKardexProducto(filtrados);
}

function seleccionarKardexProducto(val, textoMostrar) {
  const inputHidden = document.getElementById('kardex-filtro-producto');
  const label = document.getElementById('label-kardex-producto');
  if (inputHidden) inputHidden.value = val;
  if (label) label.textContent = textoMostrar || 'Todos los Productos';

  cerrarDropdownKardexProducto();
  aplicarFiltrosKardex();
}

function cerrarDropdownKardexProducto() {
  const dd = document.getElementById('dropdown-kardex-producto');
  const box = document.getElementById('box-kardex-producto');
  const arrow = document.getElementById('arrow-kardex-producto');
  if (dd) dd.classList.add('hidden');
  if (box) box.classList.remove('open');
  if (arrow) arrow.classList.remove('rotate');
}

function aplicarFiltrosKardex() {
  const inputBuscar = (document.getElementById('kardex-buscar') || document.querySelector('#vista-kardex input[type="text"]'))?.value.toLowerCase().trim() || '';
  const selectTipo = (document.getElementById('kardex-filtro-tipo') || document.querySelector('#vista-kardex select:nth-of-type(1)'))?.value || '';
  const selectProd = (document.getElementById('kardex-filtro-producto') || document.querySelector('#vista-kardex select:nth-of-type(2)'))?.value || '';
  const fechaDesde = (document.getElementById('kardex-fecha-desde') || document.querySelector('#vista-kardex input[type="date"]:nth-of-type(1)'))?.value || '';
  const fechaHasta = (document.getElementById('kardex-fecha-hasta') || document.querySelector('#vista-kardex input[type="date"]:nth-of-type(2)'))?.value || '';

  const filtrados = kardexDataCompleta.filter(m => {
    // 1. Filtro texto (producto, código o lote)
    const matchTexto = !inputBuscar || 
      (m.producto && m.producto.toLowerCase().includes(inputBuscar)) ||
      (m.codigo_barras && m.codigo_barras.toLowerCase().includes(inputBuscar)) ||
      (m.numero_lote && m.numero_lote.toLowerCase().includes(inputBuscar)) ||
      (m.motivo_observacion && m.motivo_observacion.toLowerCase().includes(inputBuscar));

    // 2. Filtro Tipo de Movimiento
    const matchTipo = !selectTipo || selectTipo === 'Todos los Movimientos' || m.tipo_movimiento === selectTipo;

    // 3. Filtro Producto
    const matchProd = !selectProd || selectProd === 'Todos los Productos' || m.producto === selectProd;

    // 4. Filtro Fechas (YYYY-MM-DD)
    const fechaItem = m.fecha ? m.fecha.substring(0, 10) : '';
    const matchDesde = !fechaDesde || (fechaItem && fechaItem >= fechaDesde);
    const matchHasta = !fechaHasta || (fechaItem && fechaItem <= fechaHasta);

    return matchTexto && matchTipo && matchProd && matchDesde && matchHasta;
  });

  renderTablaKardexFiltrada(filtrados);
}

function limpiarFiltrosKardex() {
  const vista = document.getElementById('vista-kardex') || document;
  const txt = document.getElementById('kardex-buscar') || vista.querySelector('input[type="text"]'); 
  if (txt) txt.value = '';
  
  const selectTipo = document.getElementById('kardex-filtro-tipo');
  if (selectTipo) selectTipo.selectedIndex = 0;

  const hiddenProd = document.getElementById('kardex-filtro-producto');
  if (hiddenProd) hiddenProd.value = '';

  const labelProd = document.getElementById('label-kardex-producto');
  if (labelProd) labelProd.textContent = 'Todos los Productos';

  vista.querySelectorAll('input[type="date"]').forEach(d => d.value = '');

  renderOpcionesKardexProducto(productosKardexLista);
  aplicarFiltrosKardex();
}

function renderTablaKardexFiltrada(lista) {
  const tbody = document.getElementById('tabla-kardex-body');
  if (!tbody) return;

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; color: var(--text-muted); padding: 35px;">No hay movimientos contables que coincidan con los filtros aplicados.</td></tr>`;
    return;
  }

  const formatoMoneda = (v) => '$ ' + (Number(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = lista.map(m => {
    const esEntrada = m.tipo_movimiento && m.tipo_movimiento.startsWith('Entrada');
    const esVenta = m.tipo_movimiento === 'Salida por Venta PEPS';
    const badgeTipo = esEntrada 
      ? `<span class="badge badge-success"><i class="fa-solid fa-arrow-down"></i> ${m.tipo_movimiento}</span>`
      : (m.tipo_movimiento && (m.tipo_movimiento.includes('Baja') || m.tipo_movimiento.includes('Daño'))
        ? `<span class="badge badge-danger"><i class="fa-solid fa-trash"></i> ${m.tipo_movimiento}</span>`
        : `<span class="badge badge-info"><i class="fa-solid fa-arrow-up"></i> ${m.tipo_movimiento}</span>`);

    const signo = esEntrada ? '+' : '-';
    const colorCant = esEntrada ? 'var(--success)' : 'var(--danger)';

    // Cálculo y badge de Ganancia / Pérdida en salidas por venta
    let ingresoVentaHtml = `<span style="color: var(--text-dim);">-</span>`;
    let gananciaPerdidaHtml = `<span style="color: var(--text-dim);">-</span>`;

    if (esVenta) {
      const ingresoVenta = Number(m.total_venta || 0);
      const costoPeps = Number(m.costo_total || 0);
      const utilidad = Number(m.utilidad_neta !== null && m.utilidad_neta !== undefined ? m.utilidad_neta : (ingresoVenta - costoPeps));

      ingresoVentaHtml = `<strong style="color: #fff; font-family: monospace; white-space: nowrap;">${formatoMoneda(ingresoVenta)}</strong>`;

      if (utilidad >= 0) {
        gananciaPerdidaHtml = `
          <span style="color: var(--success); font-weight: 800; font-size: 0.78rem; font-family: monospace; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
            <i class="fa-solid fa-arrow-trend-up"></i> +${formatoMoneda(utilidad)}
          </span>
        `;
      } else {
        gananciaPerdidaHtml = `
          <span style="color: var(--danger); font-weight: 800; font-size: 0.78rem; font-family: monospace; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
            <i class="fa-solid fa-arrow-trend-down"></i> -${formatoMoneda(Math.abs(utilidad))}
          </span>
        `;
      }
    }

    return `
      <tr>
        <td style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; white-space: nowrap;">${m.fecha ? m.fecha.substring(0, 16) : ''}</td>
        <td style="line-height: 1.2;">
          <strong style="font-size: 0.80rem; color: #fff;">${m.producto || ''}</strong><br>
          <small style="color: var(--text-dim); font-size: 0.69rem; font-family: monospace;">${m.codigo_barras || ''}</small>
        </td>
        <td><code style="color: var(--primary); font-size: 0.74rem;">${m.numero_lote || 'N/A'}</code></td>
        <td>${badgeTipo}</td>
        <td style="font-weight: 800; color: ${colorCant}; font-size: 0.82rem; white-space: nowrap;">
          ${signo}${Math.abs(m.cantidad || 0)} u.
        </td>
        <td style="white-space: nowrap; font-size: 0.78rem;">${formatoMoneda(m.costo_unitario)}</td>
        <td style="font-weight: bold; color: #fff; white-space: nowrap; font-size: 0.78rem;">${formatoMoneda(m.costo_total)}</td>
        <td style="white-space: nowrap;">${ingresoVentaHtml}</td>
        <td style="white-space: nowrap;">${gananciaPerdidaHtml}</td>
        <td style="white-space: nowrap;">
          <span style="font-weight: 700; background: rgba(55,65,81,0.5); padding: 2px 6px; border-radius: 4px; font-size: 0.74rem;">
            ${m.saldo_stock_resultante !== undefined ? m.saldo_stock_resultante + ' u.' : '-'}
          </span>
        </td>
        <td style="font-size: 0.74rem; color: var(--text-muted); max-width: 180px; line-height: 1.2;">
          ${m.motivo_observacion || '-'}<br>
          <small style="color: var(--text-dim); font-size: 0.68rem;">Por: ${m.usuario || 'Sistema'}</small>
        </td>
      </tr>
    `;
  }).join('');
}

// Compatibilidad con SPA
const KardexView = {
  cargar: cargarKardex,
  limpiarFiltros: limpiarFiltrosKardex,
  filtrarKardexDebounced: aplicarFiltrosKardex
};

// Exposición global
window.kardexDataCompleta = kardexDataCompleta;
window.productosKardexLista = productosKardexLista;
window.cargarKardex = cargarKardex;
window.poblarSelectorProductosKardex = poblarSelectorProductosKardex;
window.renderOpcionesKardexProducto = renderOpcionesKardexProducto;
window.toggleDropdownKardexProducto = toggleDropdownKardexProducto;
window.filtrarDropdownKardexProducto = filtrarDropdownKardexProducto;
window.seleccionarKardexProducto = seleccionarKardexProducto;
window.cerrarDropdownKardexProducto = cerrarDropdownKardexProducto;
window.aplicarFiltrosKardex = aplicarFiltrosKardex;
window.limpiarFiltrosKardex = limpiarFiltrosKardex;
window.renderTablaKardexFiltrada = renderTablaKardexFiltrada;
window.KardexView = KardexView;
