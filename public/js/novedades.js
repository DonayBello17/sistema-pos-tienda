// ========================================================
// 2. LÓGICA DE DEVOLUCIONES Y AVERÍAS
// ========================================================
let novedadesDataCompleta = [];
let productosNovedadesLista = [];

async function cargarNovedades() {
  try {
    let res = await fetch('/api/inventario/novedades');
    if (!res.ok) {
      res = await fetch('/api/reportes/kardex');
    }
    const data = await res.json();
    const arr = Array.isArray(data) ? data : (data.historial || []);
    // Filtrar solo las que son devoluciones o salidas por merma/daño
    novedadesDataCompleta = arr.filter(m => 
      m.tipo_movimiento && (
        m.tipo_movimiento.includes('Devolución') || 
        m.tipo_movimiento.includes('Daño') || 
        m.tipo_movimiento.includes('Caducidad')
      )
    );
    poblarSelectorProductosNovedades();
    aplicarFiltrosNovedades();
  } catch (err) {
    console.error("Error cargando novedades:", err);
  }
}

function poblarSelectorProductosNovedades() {
  const mapa = new Map();
  novedadesDataCompleta.forEach(m => {
    if (m.producto && !mapa.has(m.producto)) {
      mapa.set(m.producto, {
        nombre: m.producto,
        codigo_barras: m.codigo_barras || ''
      });
    }
  });
  productosNovedadesLista = Array.from(mapa.values());
  renderOpcionesNovedadesProducto(productosNovedadesLista);
}

function renderOpcionesNovedadesProducto(lista) {
  const container = document.getElementById('options-novedades-producto');
  if (!container) return;

  const valorActual = document.getElementById('novedades-filtro-producto')?.value || '';

  let html = `
    <div class="custom-select-option ${!valorActual ? 'selected' : ''}" onclick="seleccionarNovedadesProducto('', 'Todos los Productos')">
      <strong style="color: #fff;">Todos los Productos</strong>
      <small style="color: var(--text-muted); font-size: 0.74rem;">Ver todas las novedades</small>
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
      <div class="custom-select-option ${isSelected ? 'selected' : ''}" onclick="seleccionarNovedadesProducto('${safeNombre}', '${safeNombre}')">
        <strong style="color: #fff;">${p.nombre}</strong>
        ${cod}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function toggleDropdownNovedadesProducto() {
  const dd = document.getElementById('dropdown-novedades-producto');
  const box = document.getElementById('box-novedades-producto');
  const arrow = document.getElementById('arrow-novedades-producto');
  const searchInput = document.getElementById('search-novedades-producto');
  if (!dd) return;

  const abierto = !dd.classList.contains('hidden');
  cerrarTodosLosDropdowns();

  if (!abierto) {
    dd.classList.remove('hidden');
    if (box) box.classList.add('open');
    if (arrow) arrow.classList.add('rotate');
    if (searchInput) {
      searchInput.value = '';
      filtrarDropdownNovedadesProducto();
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}

function filtrarDropdownNovedadesProducto() {
  const input = document.getElementById('search-novedades-producto');
  const q = input ? input.value.trim().toLowerCase() : '';
  const filtrados = productosNovedadesLista.filter(p => 
    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
  );
  renderOpcionesNovedadesProducto(filtrados);
}

function seleccionarNovedadesProducto(val, textoMostrar) {
  const inputHidden = document.getElementById('novedades-filtro-producto');
  const label = document.getElementById('label-novedades-producto');
  if (inputHidden) inputHidden.value = val;
  if (label) label.textContent = textoMostrar || 'Todos los Productos';

  cerrarDropdownNovedadesProducto();
  aplicarFiltrosNovedades();
}

function cerrarDropdownNovedadesProducto() {
  const dd = document.getElementById('dropdown-novedades-producto');
  const box = document.getElementById('box-novedades-producto');
  const arrow = document.getElementById('arrow-novedades-producto');
  if (dd) dd.classList.add('hidden');
  if (box) box.classList.remove('open');
  if (arrow) arrow.classList.remove('rotate');
}

// --------------------------------------------------------
// Custom Dropdown de Producto en MODAL "+ Registrar Novedad"
// --------------------------------------------------------
let productosModalLista = [];

function toggleDropdownNovModalProducto() {
  const dd = document.getElementById('dropdown-nov-modal-producto');
  const box = document.getElementById('box-nov-modal-producto');
  const arrow = document.getElementById('arrow-nov-modal-producto');
  const searchInput = document.getElementById('search-nov-modal-producto');
  if (!dd) return;

  const abierto = !dd.classList.contains('hidden');
  cerrarTodosLosDropdowns();

  if (!abierto) {
    dd.classList.remove('hidden');
    if (box) box.classList.add('open');
    if (arrow) arrow.classList.add('rotate');
    if (searchInput) {
      searchInput.value = '';
      filtrarDropdownNovModalProducto();
      setTimeout(() => searchInput.focus(), 60);
    }
  }
}

function filtrarDropdownNovModalProducto() {
  const input = document.getElementById('search-nov-modal-producto');
  const q = input ? input.value.trim().toLowerCase() : '';
  const filtrados = productosModalLista.filter(p => 
    (p.nombre && p.nombre.toLowerCase().includes(q)) ||
    (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
  );
  renderOpcionesNovModalProducto(filtrados);
}

function renderOpcionesNovModalProducto(lista) {
  const container = document.getElementById('options-nov-modal-producto');
  if (!container) return;

  const valorActual = document.getElementById('nov-producto')?.value || '';

  if (!lista || lista.length === 0) {
    container.innerHTML = `<div class="custom-select-empty">No se encontraron productos coincidentes.</div>`;
    return;
  }

  container.innerHTML = lista.map(p => {
    const isSelected = String(valorActual) === String(p.id_producto);
    const cod = p.codigo_barras ? `<small style="color: var(--text-muted); font-size: 0.74rem;">Cód: <span style="font-family: monospace; color: var(--primary);">${p.codigo_barras}</span></small>` : '';
    const safeNombre = (p.nombre || '').replace(/'/g, "\\'");
    return `
      <div class="custom-select-option ${isSelected ? 'selected' : ''}" onclick="seleccionarNovModalProducto(${p.id_producto}, '${safeNombre}')">
        <strong style="color: #fff;">${p.nombre}</strong>
        ${cod}
      </div>
    `;
  }).join('');
}

function seleccionarNovModalProducto(id_producto, nombre) {
  const inputHidden = document.getElementById('nov-producto');
  const label = document.getElementById('label-nov-modal-producto');
  if (inputHidden) inputHidden.value = id_producto;
  if (label) {
    label.textContent = nombre;
    label.classList.remove('placeholder');
  }

  cerrarDropdownNovModalProducto();
  NovedadesView.actualizarLotesPorProducto();
}

function cerrarDropdownNovModalProducto() {
  const dd = document.getElementById('dropdown-nov-modal-producto');
  const box = document.getElementById('box-nov-modal-producto');
  const arrow = document.getElementById('arrow-nov-modal-producto');
  if (dd) dd.classList.add('hidden');
  if (box) box.classList.remove('open');
  if (arrow) arrow.classList.remove('rotate');
}

// --------------------------------------------------------
// Filtrado reactivo y métricas
// --------------------------------------------------------
function aplicarFiltrosNovedades() {
  const inputBuscar = (document.getElementById('novedades-buscar') || document.querySelector('#vista-devoluciones input[type="text"]'))?.value.toLowerCase().trim() || '';
  const selectTipo = (document.getElementById('novedades-filtro-tipo') || document.querySelector('#vista-devoluciones select:nth-of-type(1)'))?.value || '';
  const selectProd = (document.getElementById('novedades-filtro-producto') || document.querySelector('#vista-devoluciones select:nth-of-type(2)'))?.value || '';
  const fechaDesde = (document.getElementById('novedades-fecha-desde') || document.querySelector('#vista-devoluciones input[type="date"]:nth-of-type(1)'))?.value || '';
  const fechaHasta = (document.getElementById('novedades-fecha-hasta') || document.querySelector('#vista-devoluciones input[type="date"]:nth-of-type(2)'))?.value || '';

  const filtrados = novedadesDataCompleta.filter(m => {
    const matchTexto = !inputBuscar || 
      (m.producto && m.producto.toLowerCase().includes(inputBuscar)) ||
      (m.numero_lote && m.numero_lote.toLowerCase().includes(inputBuscar)) ||
      (m.motivo_observacion && m.motivo_observacion.toLowerCase().includes(inputBuscar));

    const matchTipo = !selectTipo || selectTipo === 'Todas las Novedades' || m.tipo_movimiento === selectTipo;
    const matchProd = !selectProd || selectProd === 'Todos los Productos' || m.producto === selectProd;

    const fechaItem = m.fecha ? m.fecha.substring(0, 10) : '';
    const matchDesde = !fechaDesde || (fechaItem && fechaItem >= fechaDesde);
    const matchHasta = !fechaHasta || (fechaItem && fechaItem <= fechaHasta);

    return matchTexto && matchTipo && matchProd && matchDesde && matchHasta;
  });

  renderTablaNovedadesFiltrada(filtrados);
  actualizarMetricasNovedades(filtrados);
}

function actualizarMetricasNovedades(items) {
  // Sumar costo de pérdidas (solo daños y caducados)
  let perdida = 0;
  let unidades = 0;
  items.forEach(it => {
    unidades += Math.abs(parseInt(it.cantidad) || 0);
    if (it.tipo_movimiento && (it.tipo_movimiento.includes('Daño') || it.tipo_movimiento.includes('Caducidad'))) {
      perdida += parseFloat(it.costo_total) || 0;
    }
  });

  const elPerdida = document.getElementById('stat-dinero-perdido') || document.getElementById('novedades-kpi-dinero') || document.querySelector('#vista-devoluciones .stat-val');
  if (elPerdida) elPerdida.textContent = `$ ${perdida.toLocaleString('es-CO')},00`;

  const elEventos = document.getElementById('stat-total-novedades') || document.getElementById('novedades-kpi-eventos');
  if (elEventos) elEventos.textContent = `${items.length} novedades`;

  const elUnidades = document.getElementById('stat-unidades-novedades') || document.getElementById('novedades-kpi-unidades');
  if (elUnidades) elUnidades.textContent = `${unidades} u.`;
}

function limpiarFiltrosNovedades() {
  const vista = document.getElementById('vista-devoluciones') || document;
  const txt = document.getElementById('novedades-buscar') || vista.querySelector('input[type="text"]'); 
  if (txt) txt.value = '';

  const selectTipo = document.getElementById('novedades-filtro-tipo');
  if (selectTipo) selectTipo.selectedIndex = 0;

  const hiddenProd = document.getElementById('novedades-filtro-producto');
  if (hiddenProd) hiddenProd.value = '';

  const labelProd = document.getElementById('label-novedades-producto');
  if (labelProd) labelProd.textContent = 'Todos los Productos';

  vista.querySelectorAll('input[type="date"]').forEach(d => d.value = '');

  renderOpcionesNovedadesProducto(productosNovedadesLista);
  aplicarFiltrosNovedades();
}

function renderTablaNovedadesFiltrada(lista) {
  const tbody = document.getElementById('tabla-novedades-body') || document.getElementById('tabla-mermas-body');
  if (!tbody) return;

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 35px;">No se encontraron registros de novedades o averías con los filtros aplicados.</td></tr>`;
    return;
  }

  const formatoMoneda = (v) => '$ ' + (Number(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  tbody.innerHTML = lista.map(m => {
    let badgeTipo = '';
    let dineroPerdidoHTML = '';

    if (m.tipo_movimiento === 'Entrada por Devolución Cliente') {
      badgeTipo = `<span class="badge badge-success"><i class="fa-solid fa-arrow-rotate-left"></i> Devolución Cliente</span>`;
      dineroPerdidoHTML = `<span style="color: var(--success); font-size: 0.82rem; font-family: monospace;">$ 0.00 (Reingreso)</span>`;
    } else if (m.tipo_movimiento === 'Salida por Baja de Caducidad') {
      badgeTipo = `<span class="badge badge-danger"><i class="fa-solid fa-calendar-xmark"></i> Baja Caducidad</span>`;
      dineroPerdidoHTML = `<span style="font-weight: 800; color: var(--danger); font-size: 0.80rem; font-family: monospace; white-space: nowrap;">${formatoMoneda(m.costo_total)}</span>`;
    } else {
      badgeTipo = `<span class="badge badge-warning"><i class="fa-solid fa-triangle-exclamation"></i> Salida Daño</span>`;
      dineroPerdidoHTML = `<span style="font-weight: 800; color: var(--warning); font-size: 0.80rem; font-family: monospace; white-space: nowrap;">${formatoMoneda(m.costo_total)}</span>`;
    }

    const esEntrada = m.tipo_movimiento && m.tipo_movimiento.startsWith('Entrada');
    const signo = esEntrada ? '+' : '-';
    const colorCant = esEntrada ? 'var(--success)' : 'var(--danger)';

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
        <td style="white-space: nowrap;">${dineroPerdidoHTML}</td>
        <td style="font-size: 0.74rem; color: var(--text-muted); max-width: 180px; line-height: 1.2;">
          ${m.motivo_observacion || '-'}<br>
          <small style="color: var(--text-dim); font-size: 0.68rem;">Responsable: ${m.usuario || 'Sistema'}</small>
        </td>
        <td style="font-size: 0.75rem; color: #fff; white-space: nowrap;">
          <i class="fa-solid fa-user-shield" style="color: var(--primary); font-size: 0.70rem;"></i> ${m.usuario || 'Sistema'}
        </td>
      </tr>
    `;
  }).join('');
}

// Objeto NovedadesView con compatibilidad SPA y modal de registro
const NovedadesView = {
  productos: [],
  lotes: [],

  async cargar() {
    await cargarNovedades();
  },

  limpiarFiltros() {
    limpiarFiltrosNovedades();
  },

  async abrirModal() {
    const modal = document.getElementById('modal-novedades');
    if (!modal) return;
    const form = document.getElementById('form-novedades');
    if (form) form.reset();

    const elHiddenProd = document.getElementById('nov-producto');
    if (elHiddenProd) elHiddenProd.value = '';

    const labelProd = document.getElementById('label-nov-modal-producto');
    if (labelProd) {
      labelProd.textContent = 'Seleccione un Producto...';
      labelProd.classList.add('placeholder');
    }

    const selectLote = document.getElementById('nov-lote');
    if (selectLote) {
      selectLote.innerHTML = '<option value="">Primero seleccione un producto...</option>';
    }

    const elInfoLote = document.getElementById('nov-info-lote');
    if (elInfoLote) elInfoLote.innerHTML = '';

    await this.cargarDatosModal();
    modal.classList.remove('hidden');
  },

  cerrarModal() {
    const modal = document.getElementById('modal-novedades');
    if (modal) modal.classList.add('hidden');
    cerrarDropdownNovModalProducto();
  },

  async cargarDatosModal() {
    try {
      const [resProd, resLotes] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/lotes')
      ]);
      this.productos = await resProd.json();
      this.lotes = await resLotes.json();
      productosModalLista = [...this.productos];

      renderOpcionesNovModalProducto(productosModalLista);
    } catch (err) {
      if (window.App) App.toast('Error al cargar datos para novedades: ' + err.message, 'danger');
    }
  },

  actualizarLotesPorProducto() {
    const inputHidden = document.getElementById('nov-producto');
    const selectLote = document.getElementById('nov-lote');
    const elInfoLote = document.getElementById('nov-info-lote');
    if (!inputHidden || !selectLote) return;

    const idProducto = parseInt(inputHidden.value, 10);
    if (!idProducto) {
      selectLote.innerHTML = '<option value="">Primero seleccione un producto...</option>';
      if (elInfoLote) elInfoLote.innerHTML = '';
      return;
    }

    const lotesProd = this.lotes.filter(l => l.id_producto === idProducto);

    if (lotesProd.length === 0) {
      selectLote.innerHTML = '<option value="">Este producto no tiene lotes vigentes registrados</option>';
      if (elInfoLote) elInfoLote.innerHTML = '<span style="color: var(--danger); font-size: 0.75rem;">Sin lotes disponibles en inventario</span>';
      return;
    }

    selectLote.innerHTML = '<option value="">Seleccione el lote correspondiente...</option>' +
      lotesProd.map(l => `
        <option value="${l.id_lote}">
          Lote: ${l.numero_lote} | Disp: ${l.cantidad_disponible} u. | Vence: ${l.fecha_vencimiento}
        </option>
      `).join('');

    if (elInfoLote) elInfoLote.innerHTML = '';
  },

  actualizarDetalleLote() {
    const selectLote = document.getElementById('nov-lote');
    const elInfoLote = document.getElementById('nov-info-lote');
    if (!selectLote || !elInfoLote) return;

    const idLote = parseInt(selectLote.value, 10);
    const lote = this.lotes.find(l => l.id_lote === idLote);

    if (lote) {
      const formatoMoneda = (v) => '$ ' + (Number(v) || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      elInfoLote.innerHTML = `
        <div style="font-size: 0.74rem; color: var(--text-muted); background: var(--bg-card-sub); padding: 8px 12px; border-radius: 6px; margin-top: 4px; border: 1px solid var(--border);">
          Lote: <b>${lote.numero_lote}</b> | Disponible: <b style="color: var(--success);">${lote.cantidad_disponible} u.</b> | Costo Unit.: <b>${formatoMoneda(lote.costo_unitario)}</b> | Vence: <b>${lote.fecha_vencimiento}</b>
        </div>
      `;
    } else {
      elInfoLote.innerHTML = '';
    }
  },

  async guardarNovedad(e) {
    e.preventDefault();

    const inputHidden = document.getElementById('nov-producto');
    const selectLote = document.getElementById('nov-lote');
    const inputCant = document.getElementById('nov-cantidad');
    const selectTipo = document.getElementById('nov-tipo');
    const inputMotivo = document.getElementById('nov-motivo');

    const id_producto = parseInt(inputHidden ? inputHidden.value : 0, 10);
    const id_lote = parseInt(selectLote ? selectLote.value : 0, 10);
    const cantidad = parseInt(inputCant ? inputCant.value : 0, 10);
    const tipo_novedad = selectTipo ? selectTipo.value : '';
    const motivo = inputMotivo ? inputMotivo.value.trim() : '';

    if (!id_producto || !id_lote) {
      if (window.App) App.toast('Debe seleccionar producto y lote.', 'warning');
      return;
    }

    if (isNaN(cantidad) || cantidad <= 0) {
      if (window.App) App.toast('La cantidad debe ser mayor a cero.', 'warning');
      return;
    }

    if (!tipo_novedad) {
      if (window.App) App.toast('Seleccione el tipo de novedad.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-guardar-novedad');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    }

    try {
      const res = await fetch('/api/inventario/novedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_producto,
          id_lote,
          id_usuario: (window.App && App.usuario) ? App.usuario.id_usuario : 1,
          cantidad,
          tipo_novedad,
          motivo
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al procesar novedad');
      }

      if (window.App) App.toast(data.mensaje || 'Novedad registrada con éxito', 'success');
      this.cerrarModal();

      // Recargar la tabla de novedades inmediatamente
      await cargarNovedades();

      // Refrescar demás vistas activas si están visibles
      if (window.DashboardView) await DashboardView.cargar();
      const vistaPos = document.getElementById('vista-pos');
      if (window.PosView && vistaPos && !vistaPos.classList.contains('hidden')) {
        await PosView.cargar();
      }
      const vistaKardex = document.getElementById('vista-kardex');
      if (window.KardexView && vistaKardex && !vistaKardex.classList.contains('hidden')) {
        await cargarKardex();
      }
      const vistaSemaforo = document.getElementById('vista-semaforo');
      if (window.SemaforoView && vistaSemaforo && !vistaSemaforo.classList.contains('hidden')) {
        await SemaforoView.cargar();
      }
    } catch (err) {
      if (window.App) App.toast(err.message, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Registrar Novedad';
      }
    }
  }
};

// Cierre global al hacer clic fuera o presionar Escape
function cerrarTodosLosDropdowns() {
  if (typeof cerrarDropdownKardexProducto === 'function') cerrarDropdownKardexProducto();
  if (typeof cerrarDropdownNovedadesProducto === 'function') cerrarDropdownNovedadesProducto();
  if (typeof cerrarDropdownNovModalProducto === 'function') cerrarDropdownNovModalProducto();
  if (window.ComprasView && typeof ComprasView.cerrarDropdown === 'function') {
    ComprasView.cerrarDropdown('proveedor');
    ComprasView.cerrarDropdown('producto');
  }
}

document.addEventListener('click', (e) => {
  const wrapKardex = document.getElementById('custom-select-kardex-producto-wrap');
  const wrapNov = document.getElementById('custom-select-novedades-producto-wrap');
  const wrapModalNov = document.getElementById('custom-select-nov-modal-producto-wrap');

  if (wrapKardex && !wrapKardex.contains(e.target)) {
    if (typeof cerrarDropdownKardexProducto === 'function') cerrarDropdownKardexProducto();
  }
  if (wrapNov && !wrapNov.contains(e.target)) {
    if (typeof cerrarDropdownNovedadesProducto === 'function') cerrarDropdownNovedadesProducto();
  }
  if (wrapModalNov && !wrapModalNov.contains(e.target)) {
    if (typeof cerrarDropdownNovModalProducto === 'function') cerrarDropdownNovModalProducto();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    cerrarTodosLosDropdowns();
  }
});

// Exposición global
window.novedadesDataCompleta = novedadesDataCompleta;
window.productosNovedadesLista = productosNovedadesLista;
window.productosModalLista = productosModalLista;
window.cargarNovedades = cargarNovedades;
window.poblarSelectorProductosNovedades = poblarSelectorProductosNovedades;
window.renderOpcionesNovedadesProducto = renderOpcionesNovedadesProducto;
window.toggleDropdownNovedadesProducto = toggleDropdownNovedadesProducto;
window.filtrarDropdownNovedadesProducto = filtrarDropdownNovedadesProducto;
window.seleccionarNovedadesProducto = seleccionarNovedadesProducto;
window.cerrarDropdownNovedadesProducto = cerrarDropdownNovedadesProducto;

window.toggleDropdownNovModalProducto = toggleDropdownNovModalProducto;
window.filtrarDropdownNovModalProducto = filtrarDropdownNovModalProducto;
window.renderOpcionesNovModalProducto = renderOpcionesNovModalProducto;
window.seleccionarNovModalProducto = seleccionarNovModalProducto;
window.cerrarDropdownNovModalProducto = cerrarDropdownNovModalProducto;

window.aplicarFiltrosNovedades = aplicarFiltrosNovedades;
window.actualizarMetricasNovedades = actualizarMetricasNovedades;
window.limpiarFiltrosNovedades = limpiarFiltrosNovedades;
window.renderTablaNovedadesFiltrada = renderTablaNovedadesFiltrada;
window.NovedadesView = NovedadesView;
window.MermasView = NovedadesView;
window.cerrarTodosLosDropdowns = cerrarTodosLosDropdowns;
