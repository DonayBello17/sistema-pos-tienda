/**
 * Módulo de Vista: Control de Vencimientos, Trazabilidad de Lotes y Descarte de Mercancía
 */
const SemaforoView = {
  lotes: [],
  filtroActual: 'TODOS',
  loteSeleccionadoBaja: null,

  async cargar() {
    await this.cargarLotes();
  },

  async cargarLotes() {
    const tbody = document.getElementById('tabla-lotes-body');
    if (!tbody) return;

    try {
      const res = await fetch('/api/lotes');
      this.lotes = await res.json();
      this.renderTabla();
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--danger); padding: 30px;">Error al cargar lotes: ${err.message}</td></tr>`;
    }
  },

  filtrar(tipo) {
    this.filtroActual = tipo;
    document.querySelectorAll('.filter-tab').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-filtro') === tipo);
    });
    this.renderTabla();
  },

  renderTabla() {
    const tbody = document.getElementById('tabla-lotes-body');
    if (!tbody) return;

    let filtrados = this.lotes;
    if (this.filtroActual === 'ROJO') {
      filtrados = this.lotes.filter(l => l.semaforo === 'ROJO');
    } else if (this.filtroActual === 'AMARILLO') {
      filtrados = this.lotes.filter(l => l.semaforo === 'AMARILLO');
    } else if (this.filtroActual === 'VERDE') {
      filtrados = this.lotes.filter(l => l.semaforo === 'VERDE');
    }

    if (filtrados.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 35px;">No hay lotes que coincidan con el filtro seleccionado.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtrados.map(l => {
      let badgeEstado = '';
      if (l.semaforo === 'ROJO') {
        badgeEstado = `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> CADUCADO (${Math.abs(l.dias_para_vencer)}d atrás)</span>`;
      } else if (l.semaforo === 'AMARILLO') {
        badgeEstado = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Por Vencer (${l.dias_para_vencer} días)</span>`;
      } else {
        badgeEstado = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> En Fecha (${l.dias_para_vencer} días)</span>`;
      }

      const valorLote = l.cantidad_disponible * l.costo_unitario;

      return `
        <tr>
          <td><strong style="color: var(--primary); font-family: monospace;">${l.numero_lote}</strong></td>
          <td>
            <strong>${l.producto}</strong><br>
            <small style="color: var(--text-dim); font-family: monospace;">${l.codigo_barras}</small>
          </td>
          <td><strong style="font-size: 0.95rem;">${l.cantidad_disponible}</strong> <span style="font-size: 0.75rem; color: var(--text-muted);">/ ${l.cantidad_inicial} u.</span></td>
          <td>${App.formatoMoneda(l.costo_unitario)}</td>
          <td style="color: var(--text-muted); font-family: monospace;">${App.formatoMoneda(valorLote)}</td>
          <td>${l.fecha_vencimiento}</td>
          <td>${badgeEstado}</td>
          <td>
            <span class="badge ${l.estado_lote === 'Vigente' ? 'badge-info' : 'badge-danger'}">
              ${l.estado_lote}
            </span>
          </td>
          <td>
            <button onclick="SemaforoView.abrirModalBaja(${l.id_lote})" class="btn btn-danger" style="padding: 4px 10px; font-size: 0.74rem; white-space: nowrap;">
              <i class="fa-solid fa-trash-can"></i> Descartar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  abrirModalBaja(id_lote) {
    const lote = this.lotes.find(l => l.id_lote === id_lote);
    if (!lote) return;

    this.loteSeleccionadoBaja = lote;
    const elModal = document.getElementById('modal-baja');
    const elInfo = document.getElementById('baja-info-lote');
    const inputCant = document.getElementById('baja-cantidad');
    const inputMotivo = document.getElementById('baja-motivo');

    if (!elModal || !elInfo) return;

    elInfo.innerHTML = `
      <div style="background: var(--bg-main); padding: 14px; border-radius: 10px; border: 1px solid var(--border); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong>${lote.producto}</strong>
          <span class="badge ${lote.semaforo === 'ROJO' ? 'badge-danger' : 'badge-warning'}">${lote.semaforo === 'ROJO' ? 'CADUCADO' : 'POR VENCER'}</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted);">
          Lote: <b style="color: #fff;">${lote.numero_lote}</b> | Vence: <b style="color: #fff;">${lote.fecha_vencimiento}</b>
        </p>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
          Saldo en Lote: <b style="color: var(--success);">${lote.cantidad_disponible} unidades</b> | Costo unitario: <b>${App.formatoMoneda(lote.costo_unitario)}</b>
        </p>
      </div>
    `;

    if (inputCant) {
      inputCant.value = lote.cantidad_disponible;
      inputCant.max = lote.cantidad_disponible;
    }
    if (inputMotivo) {
      inputMotivo.value = lote.semaforo === 'ROJO' 
        ? 'Salida por vencimiento de vida útil (Caducado)' 
        : 'Salida preventiva por deterioro o daño de empaque';
    }

    elModal.classList.remove('hidden');
  },

  cerrarModalBaja() {
    const elModal = document.getElementById('modal-baja');
    if (elModal) elModal.classList.add('hidden');
    this.loteSeleccionadoBaja = null;
  },

  async confirmarBaja() {
    if (!this.loteSeleccionadoBaja) return;

    const inputCant = document.getElementById('baja-cantidad');
    const inputMotivo = document.getElementById('baja-motivo');
    const selectTipo = document.getElementById('baja-tipo-movimiento');

    const cantidad = parseInt(inputCant ? inputCant.value : 0, 10);
    const motivo = inputMotivo ? inputMotivo.value.trim() : '';
    const tipo = selectTipo ? selectTipo.value : 'Salida por Baja de Caducidad';

    if (isNaN(cantidad) || cantidad <= 0) {
      App.toast('Ingrese una cantidad válida mayor a cero.', 'warning');
      return;
    }

    if (cantidad > this.loteSeleccionadoBaja.cantidad_disponible) {
      App.toast('La cantidad a descartar supera el saldo disponible del lote.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/inventario/baja-caducidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_lote: this.loteSeleccionadoBaja.id_lote,
          id_usuario: App.usuario ? App.usuario.id_usuario : 1,
          cantidad,
          motivo,
          tipo_movimiento: tipo
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al procesar descarte');
      }

      App.toast(`Salida de ${cantidad} unidad(es) registrada en inventario. Pérdida: ${App.formatoMoneda(data.data.perdida_economica)}`, 'success');
      this.cerrarModalBaja();
      await this.cargarLotes();
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  }
};

window.SemaforoView = SemaforoView;
