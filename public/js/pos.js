/**
 * Módulo de Vista: Punto de Cobro, Ergonomía de Venta y Facturación
 */
const PosView = {
  catalogo: [],
  carrito: [],
  clientes: [],
  clienteSeleccionado: 1,
  metodoPago: 'Efectivo',
  descuentoPorcentaje: 0,
  pagaCon: 0,

  async cargar() {
    await Promise.all([
      this.cargarClientes(),
      this.cargarProductos()
    ]);
    this.enfocarBuscador();
  },

  async cargarClientes(clienteSeleccionarId = null) {
    try {
      const res = await fetch('/api/ventas/clientes');
      this.clientes = await res.json();
      const select = document.getElementById('pos-cliente-select');
      if (select) {
        select.innerHTML = this.clientes.map(c => `
          <option value="${c.id_cliente}">${c.nombre_completo} (${c.cedula_nit})</option>
        `).join('');

        if (clienteSeleccionarId) {
          this.clienteSeleccionado = clienteSeleccionarId;
          select.value = clienteSeleccionarId;
        } else if (this.clienteSeleccionado) {
          select.value = this.clienteSeleccionado;
        }
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  },

  // Modal Nuevo Cliente
  abrirModalNuevoCliente() {
    const modal = document.getElementById('modal-cliente');
    if (!modal) return;
    const form = document.getElementById('form-nuevo-cliente');
    if (form) form.reset();
    modal.classList.remove('hidden');
    const inputNit = document.getElementById('cli-nit');
    if (inputNit) inputNit.focus();
  },

  cerrarModalNuevoCliente() {
    const modal = document.getElementById('modal-cliente');
    if (modal) modal.classList.add('hidden');
  },

  async guardarNuevoCliente(e) {
    e.preventDefault();

    const cedula_nit = document.getElementById('cli-nit').value.trim();
    const nombre_completo = document.getElementById('cli-nombre').value.trim();
    const telefono = document.getElementById('cli-telefono').value.trim();
    const correo = document.getElementById('cli-correo').value.trim();
    const direccion = document.getElementById('cli-direccion').value.trim();

    if (!cedula_nit || !nombre_completo) {
      App.toast('Cédula/NIT y Nombre Completo son requeridos.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-guardar-cliente');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
      const res = await fetch('/api/ventas/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula_nit, nombre_completo, telefono, correo, direccion })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al guardar cliente');
      }

      App.toast(`¡Cliente "${nombre_completo}" registrado y seleccionado!`, 'success');
      this.cerrarModalNuevoCliente();

      // Recargar lista y preseleccionar el creado
      await this.cargarClientes(data.data.id_cliente);
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar y Seleccionar';
    }
  },

  async cargarProductos() {
    try {
      const res = await fetch('/api/productos');
      this.catalogo = await res.json();
      this.renderGrid(this.catalogo);
    } catch (err) {
      App.toast('Error al cargar productos en cobro: ' + err.message, 'danger');
    }
  },

  enfocarBuscador() {
    const input = document.getElementById('pos-buscar');
    if (input) {
      input.focus();
      input.value = '';
    }
  },

  filtrar() {
    const input = document.getElementById('pos-buscar');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
      this.renderGrid(this.catalogo);
      return;
    }

    // Comprobar coincidencia exacta de código de barras
    const matchCodigo = this.catalogo.find(p => p.codigo_barras.toLowerCase() === query);
    if (matchCodigo) {
      this.agregar(matchCodigo.id_producto);
      input.value = '';
      this.renderGrid(this.catalogo);
      return;
    }

    const filtrados = this.catalogo.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.codigo_barras.toLowerCase().includes(query)
    );

    this.renderGrid(filtrados);
  },

  renderGrid(productos) {
    const grid = document.getElementById('pos-grid-productos');
    if (!grid) return;

    if (!productos || productos.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; margin-bottom: 10px;"></i>
          <p>No se encontraron productos coincidentes.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = productos.map(p => {
      const bloqueado = p.bloqueado_pos || p.stock_vigente_no_vencido <= 0;

      let badgeEstado = '';
      if (bloqueado) {
        badgeEstado = `<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> BLOQUEADO</span>`;
      } else if (p.estado_semaforo === 'AMARILLO') {
        badgeEstado = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Próximo (${p.dias_minimos_vencer}d)</span>`;
      } else {
        badgeEstado = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> En Fecha</span>`;
      }

      return `
        <div class="prod-card ${bloqueado ? 'blocked' : ''}" onclick="PosView.agregar(${p.id_producto})">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span class="prod-card-code">${p.codigo_barras}</span>
              ${badgeEstado}
            </div>
            <div class="prod-card-title">${p.nombre}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">
              IVA: <strong style="color: var(--text);">${p.tarifa_iva}%</strong> | Disponible: <strong style="color: ${bloqueado ? 'var(--danger)' : 'var(--success)'};">${p.stock_vigente_no_vencido} u.</strong>
            </div>
          </div>
          <div>
            <div class="prod-card-price">${App.formatoMoneda(p.precio_venta_final)}</div>
            <div class="prod-card-footer">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Base: ${App.formatoMoneda(p.precio_base)}</span>
              <button class="btn ${bloqueado ? 'btn-danger' : 'btn-primary'}" style="padding: 4px 10px; font-size: 0.78rem;" ${bloqueado ? 'disabled' : ''}>
                <i class="fa-solid fa-cart-plus"></i> ${bloqueado ? 'Bloqueado' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  agregar(id_producto) {
    const prod = this.catalogo.find(p => p.id_producto === id_producto);
    if (!prod) return;

    // Validación estricta de caducidad: Bloqueo en POS si el producto no tiene lotes vigentes
    if (prod.bloqueado_pos || prod.stock_vigente_no_vencido <= 0) {
      App.toast(
        `VENTA BLOQUEADA: "${prod.nombre}" no cuenta con existencias vigentes o sus lotes han superado la fecha de caducidad. El sistema ha bloqueado su cobro en caja por seguridad.`,
        'danger'
      );
      return;
    }

    const itemEnCarrito = this.carrito.find(it => it.id_producto === id_producto);
    const cantidadActual = itemEnCarrito ? itemEnCarrito.cantidad : 0;

    // Validar que la demanda solicitada no exceda el stock vigente
    if (cantidadActual + 1 > prod.stock_vigente_no_vencido) {
      App.toast(
        `Límite de disponibilidad: Solo hay ${prod.stock_vigente_no_vencido} unidad(es) vigente(s) de "${prod.nombre}". Existencias restantes se encuentran vencidas.`,
        'warning'
      );
      return;
    }

    if (itemEnCarrito) {
      itemEnCarrito.cantidad += 1;
    } else {
      this.carrito.push({
        id_producto: prod.id_producto,
        codigo_barras: prod.codigo_barras,
        nombre: prod.nombre,
        precio_base: Number(prod.precio_base),
        tarifa_iva: prod.tarifa_iva,
        precio_venta_final: Number(prod.precio_venta_final),
        stock_maximo: prod.stock_vigente_no_vencido,
        cantidad: 1
      });
    }

    this.renderCarrito();
  },

  modificarCantidad(id_producto, delta) {
    const item = this.carrito.find(it => it.id_producto === id_producto);
    if (!item) return;

    const nuevaCant = item.cantidad + delta;
    if (nuevaCant <= 0) {
      this.eliminarDelCarrito(id_producto);
      return;
    }

    if (nuevaCant > item.stock_maximo) {
      App.toast(`Stock máximo vigente alcanzado (${item.stock_maximo} unidades).`, 'warning');
      return;
    }

    item.cantidad = nuevaCant;
    this.renderCarrito();
  },

  eliminarDelCarrito(id_producto) {
    this.carrito = this.carrito.filter(it => it.id_producto !== id_producto);
    this.renderCarrito();
  },

  vaciarCarrito() {
    this.carrito = [];
    this.renderCarrito();
  },

  renderCarrito() {
    const lista = document.getElementById('pos-carrito-lista');
    if (!lista) return;

    if (this.carrito.length === 0) {
      lista.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 50px 0; font-size: 0.85rem;">
          <i class="fa-solid fa-basket-shopping" style="font-size: 2.5rem; color: var(--border-light); margin-bottom: 12px; display: block;"></i>
          El ticket de venta está vacío.
        </div>
      `;
      this.actualizarTotalesUI({
        subtotal_base: 0,
        iva_19: 0,
        iva_5: 0,
        base_0: 0,
        descuento: 0,
        total_pagar: 0
      });
      return;
    }

    lista.innerHTML = this.carrito.map(it => {
      const subtotalLinea = it.precio_venta_final * it.cantidad;
      return `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${it.nombre}</div>
            <div class="cart-item-sub">
              ${App.formatoMoneda(it.precio_venta_final)} c/u | Tarifa IVA: ${it.tarifa_iva}%
            </div>
          </div>
          <div class="cart-item-qty">
            <button class="qty-btn" onclick="PosView.modificarCantidad(${it.id_producto}, -1)"><i class="fa-solid fa-minus"></i></button>
            <span class="qty-display">${it.cantidad}</span>
            <button class="qty-btn" onclick="PosView.modificarCantidad(${it.id_producto}, 1)"><i class="fa-solid fa-plus"></i></button>
          </div>
          <div class="cart-item-total">
            ${App.formatoMoneda(subtotalLinea)}
          </div>
          <button onclick="PosView.eliminarDelCarrito(${it.id_producto})" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 4px 6px;">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    }).join('');

    const liquidacion = this.calcularLiquidacionFiscal();
    this.actualizarTotalesUI(liquidacion);
  },

  calcularLiquidacionFiscal() {
    let base_19 = 0;
    let base_5 = 0;
    let base_0 = 0;
    let iva_19 = 0;
    let iva_5 = 0;

    for (const it of this.carrito) {
      const stBase = it.precio_base * it.cantidad;
      if (it.tarifa_iva === '19') {
        base_19 += stBase;
        iva_19 += stBase * 0.19;
      } else if (it.tarifa_iva === '5') {
        base_5 += stBase;
        iva_5 += stBase * 0.05;
      } else {
        base_0 += stBase;
      }
    }

    const subtotal_base = base_19 + base_5 + base_0;
    const bruto = subtotal_base + iva_19 + iva_5;
    const desc = bruto * (this.descuentoPorcentaje / 100);
    const total_pagar = Math.max(0, bruto - desc);

    return {
      subtotal_base,
      base_19,
      base_5,
      base_0,
      iva_19,
      iva_5,
      descuento: desc,
      total_pagar
    };
  },

  actualizarTotalesUI(liq) {
    const elSub = document.getElementById('pos-subtotal');
    const elIva19 = document.getElementById('pos-iva19');
    const elIva5 = document.getElementById('pos-iva5');
    const elExento = document.getElementById('pos-exento');
    const elDesc = document.getElementById('pos-descuento');
    const elTot = document.getElementById('pos-total');

    if (elSub) elSub.textContent = App.formatoMoneda(liq.subtotal_base);
    if (elIva19) elIva19.textContent = App.formatoMoneda(liq.iva_19);
    if (elIva5) elIva5.textContent = App.formatoMoneda(liq.iva_5);
    if (elExento) elExento.textContent = App.formatoMoneda(liq.base_0);
    if (elDesc) elDesc.textContent = App.formatoMoneda(liq.descuento);
    if (elTot) elTot.textContent = App.formatoMoneda(liq.total_pagar);

    this.calcularCambio(liq.total_pagar);
  },

  calcularCambio(total) {
    const inputPagaCon = document.getElementById('pos-paga-con');
    const elCambio = document.getElementById('pos-cambio');
    if (!inputPagaCon || !elCambio) return;

    const paga = parseFloat(inputPagaCon.value) || 0;
    const cambio = Math.max(0, paga - total);
    elCambio.textContent = App.formatoMoneda(cambio);
    elCambio.style.color = (paga >= total && total > 0) ? 'var(--success)' : 'var(--text-muted)';
  },

  cambiarMetodoPago(metodo) {
    this.metodoPago = metodo;
    document.querySelectorAll('.btn-metodo').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-metodo') === metodo);
    });

    const boxPagaCon = document.getElementById('box-pago-efectivo');
    if (boxPagaCon) {
      boxPagaCon.style.display = metodo === 'Efectivo' ? 'grid' : 'none';
    }
  },

  // Confirmar y Procesar Venta
  async procesarVenta() {
    if (this.carrito.length === 0) {
      App.toast('El ticket está vacío. Agregue productos antes de cobrar.', 'warning');
      return;
    }

    const selectCliente = document.getElementById('pos-cliente-select');
    const id_cliente = selectCliente ? parseInt(selectCliente.value, 10) : 1;
    const liq = this.calcularLiquidacionFiscal();

    // Si paga en efectivo, validar que el monto cubra el total
    if (this.metodoPago === 'Efectivo') {
      const inputPagaCon = document.getElementById('pos-paga-con');
      const paga = parseFloat(inputPagaCon ? inputPagaCon.value : 0) || 0;
      if (paga > 0 && paga < liq.total_pagar) {
        App.toast('El monto recibido en efectivo es inferior al total a pagar.', 'warning');
        return;
      }
    }

    const payload = {
      id_cliente,
      id_usuario: App.usuario ? App.usuario.id_usuario : 1,
      metodo_pago: this.metodoPago,
      tipo_comprobante: 'Factura Electronica DIAN',
      descuento_porcentaje: this.descuentoPorcentaje,
      items: this.carrito.map(it => ({
        id_producto: it.id_producto,
        cantidad: it.cantidad
      }))
    };

    const btnCobrar = document.getElementById('btn-pos-cobrar');
    if (btnCobrar) {
      btnCobrar.disabled = true;
      btnCobrar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Procesando Venta...`;
    }

    try {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Fallo en la transacción de venta');
      }

      App.toast(`¡Venta realizada con éxito! Comprobante #${data.data.numero_factura}`, 'success');

      // Mostrar Comprobante
      this.mostrarFacturaDIAN(data.data);

      // Limpiar estado
      this.vaciarCarrito();
      const inputPagaCon = document.getElementById('pos-paga-con');
      if (inputPagaCon) inputPagaCon.value = '';

      // Recargar catálogo actualizado
      await this.cargarProductos();
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      if (btnCobrar) {
        btnCobrar.disabled = false;
        btnCobrar.innerHTML = `<i class="fa-solid fa-check"></i> Confirmar y Cobrar`;
      }
    }
  },

  // Modal de Comprobante de Venta con CUFE y QR
  mostrarFacturaDIAN(venta) {
    const elModal = document.getElementById('modal-factura');
    const elBody = document.getElementById('factura-ticket-body');
    if (!elModal || !elBody) return;

    const tramosHtml = venta.tramos.map(t => `
      <tr>
        <td>${t.nombre}<br><small style="color: #666;">Lote: <b>${t.lote}</b></small></td>
        <td style="text-align: center;">${t.cantidad}</td>
        <td style="text-align: right;">${App.formatoMoneda(t.precio_base)}</td>
        <td style="text-align: right;">${App.formatoMoneda(t.subtotal)}</td>
      </tr>
    `).join('');

    elBody.innerHTML = `
      <div class="ticket-header">
        <h2 style="font-size: 1.1rem; margin-bottom: 2px;">SISTEMA DE GESTIÓN COMERCIAL</h2>
        <p>NIT: 900.987.654-3 | Régimen Común</p>
        <p>Resolución DIAN No. 18764000001 de 2026</p>
        <p style="font-weight: bold; margin-top: 4px;">FACTURA DE VENTA</p>
        <h3 style="font-size: 1.05rem; color: #000; letter-spacing: 1px;">${venta.numero_factura}</h3>
      </div>

      <div style="margin-bottom: 12px; font-size: 0.78rem;">
        <p><b>Fecha/Hora:</b> ${venta.fecha} ${venta.hora}</p>
        <p><b>Atendido por:</b> ${App.usuario ? App.usuario.nombre : 'Cajero'}</p>
        <p><b>Cliente:</b> ${venta.cliente} | <b>NIT/CC:</b> ${venta.cedula_nit}</p>
        <p><b>Forma de Pago:</b> ${venta.metodo_pago}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; margin-bottom: 12px;">
        <thead>
          <tr style="border-bottom: 1px dashed #444; border-top: 1px dashed #444;">
            <th style="padding: 6px 0; color: #111;">Descripción</th>
            <th style="padding: 6px 0; text-align: center; color: #111;">Cant.</th>
            <th style="padding: 6px 0; text-align: right; color: #111;">Base Unit.</th>
            <th style="padding: 6px 0; text-align: right; color: #111;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${tramosHtml}
        </tbody>
      </table>

      <div style="border-top: 1px dashed #444; padding-top: 8px; font-size: 0.8rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Subtotal Base:</span>
          <b>${App.formatoMoneda(venta.liquidacion.subtotal_base)}</b>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Total IVA 19%:</span>
          <b>${App.formatoMoneda(venta.liquidacion.iva_19)}</b>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Total IVA 5%:</span>
          <b>${App.formatoMoneda(venta.liquidacion.iva_5)}</b>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Exento (0%):</span>
          <b>${App.formatoMoneda(venta.liquidacion.base_0)}</b>
        </div>
        ${venta.liquidacion.descuento > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #b91c1c;">
            <span>Descuento aplicado:</span>
            <b>-${App.formatoMoneda(venta.liquidacion.descuento)}</b>
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: bold; border-top: 1px solid #111; padding-top: 6px; margin-top: 6px;">
          <span>TOTAL A PAGAR:</span>
          <span>${App.formatoMoneda(venta.liquidacion.total_pagar)}</span>
        </div>
      </div>

      <div class="ticket-cufe-box">
        <strong>CUFE:</strong><br>
        <span id="ticket-cufe-text" style="font-family: monospace;">${venta.cufe}</span>
      </div>

      <div class="ticket-qr-container">
        <div id="ticket-qr-svg" style="background: #fff; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
          <svg width="130" height="130" viewBox="0 0 100 100" fill="#000">
            <rect x="0" y="0" width="30" height="30" fill="#000"/>
            <rect x="5" y="5" width="20" height="20" fill="#fff"/>
            <rect x="10" y="10" width="10" height="10" fill="#000"/>

            <rect x="70" y="0" width="30" height="30" fill="#000"/>
            <rect x="75" y="5" width="20" height="20" fill="#fff"/>
            <rect x="80" y="10" width="10" height="10" fill="#000"/>

            <rect x="0" y="70" width="30" height="30" fill="#000"/>
            <rect x="5" y="75" width="20" height="20" fill="#fff"/>
            <rect x="10" y="80" width="10" height="10" fill="#000"/>

            <rect x="40" y="10" width="20" height="10" fill="#000"/>
            <rect x="10" y="40" width="10" height="20" fill="#000"/>
            <rect x="35" y="35" width="30" height="30" fill="#000"/>
            <rect x="45" y="45" width="10" height="10" fill="#fff"/>
            <rect x="75" y="40" width="15" height="10" fill="#000"/>
            <rect x="40" y="75" width="20" height="15" fill="#000"/>
            <rect x="70" y="70" width="25" height="25" fill="#000"/>
            <rect x="80" y="80" width="5" height="5" fill="#fff"/>
          </svg>
        </div>
        <div style="font-size: 0.72rem; color: #555; text-align: center; margin-top: 6px;">
          Comprobante Electrónico Validado
        </div>
      </div>
    `;

    elModal.classList.remove('hidden');
  },

  copiarCUFE() {
    const el = document.getElementById('ticket-cufe-text');
    if (el) {
      navigator.clipboard.writeText(el.textContent.trim());
      App.toast('CUFE copiado al portapapeles', 'success');
    }
  },

  imprimirFactura() {
    document.body.classList.add('imprimiendo-factura');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimiendo-factura');
    }, 1000);
  },

  cerrarModalFactura() {
    const elModal = document.getElementById('modal-factura');
    if (elModal) elModal.classList.add('hidden');
    this.enfocarBuscador();
  }
};

window.PosView = PosView;
