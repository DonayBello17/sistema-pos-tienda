/**
 * Módulo de Vista: Entrada de Compras, Gestión Rápida de Proveedores y Recepción Formal de Lotes
 * Incorpora componentes interactivos con buscador y flechas para Proveedor y Producto
 */
const ComprasView = {
  proveedores: [],
  productos: [],
  itemsRecepcion: [],

  // Estado de los Custom Dropdowns
  dropdownState: {
    proveedor: { abierto: false, indiceResaltado: -1, listaFiltrada: [] },
    producto: { abierto: false, indiceResaltado: -1, listaFiltrada: [] }
  },

  async cargar() {
    await Promise.all([
      this.cargarProveedores(),
      this.cargarProductos()
    ]);
    this.generarNumeroLoteSugerido();
    this.configurarCierreExterno();
  },

  configurarCierreExterno() {
    // Cerrar dropdowns si se hace clic fuera
    document.addEventListener('click', (e) => {
      const wrapProv = document.getElementById('custom-select-proveedor-wrap');
      const wrapProd = document.getElementById('custom-select-producto-wrap');

      if (wrapProv && !wrapProv.contains(e.target) && this.dropdownState.proveedor.abierto) {
        this.cerrarDropdown('proveedor');
      }
      if (wrapProd && !wrapProd.contains(e.target) && this.dropdownState.producto.abierto) {
        this.cerrarDropdown('producto');
      }
    });
  },

  async cargarProveedores(proveedorSeleccionarId = null) {
    try {
      const res = await fetch('/api/compras/proveedores');
      this.proveedores = await res.json();
      this.dropdownState.proveedor.listaFiltrada = [...this.proveedores];
      this.renderOpciones('proveedor', this.dropdownState.proveedor.listaFiltrada);

      if (proveedorSeleccionarId) {
        const encontrado = this.proveedores.find(p => p.id_proveedor === parseInt(proveedorSeleccionarId, 10));
        if (encontrado) this.seleccionarOpcion('proveedor', encontrado);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }
  },

  async cargarProductos() {
    try {
      const res = await fetch('/api/productos');
      this.productos = await res.json();
      this.dropdownState.producto.listaFiltrada = [...this.productos];
      this.renderOpciones('producto', this.dropdownState.producto.listaFiltrada);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  },

  // Manejo de Dropdown Interactivo
  toggleDropdown(tipo) {
    const estado = this.dropdownState[tipo];
    if (estado.abierto) {
      this.cerrarDropdown(tipo);
    } else {
      // Cerrar el otro dropdown primero
      const otro = tipo === 'proveedor' ? 'producto' : 'proveedor';
      this.cerrarDropdown(otro);
      this.abrirDropdown(tipo);
    }
  },

  abrirDropdown(tipo) {
    const dd = document.getElementById(`dropdown-${tipo}`);
    const box = document.getElementById(`box-${tipo}`);
    const arrow = document.getElementById(`arrow-${tipo}`);
    const searchInput = document.getElementById(`search-${tipo}`);

    if (!dd) return;

    this.dropdownState[tipo].abierto = true;
    this.dropdownState[tipo].indiceResaltado = -1;
    this.dropdownState[tipo].listaFiltrada = tipo === 'proveedor' ? [...this.proveedores] : [...this.productos];

    dd.classList.remove('hidden');
    if (box) box.classList.add('open');
    if (arrow) arrow.classList.add('rotate');

    if (searchInput) {
      searchInput.value = '';
      setTimeout(() => searchInput.focus(), 60);
    }

    this.renderOpciones(tipo, this.dropdownState[tipo].listaFiltrada);
  },

  cerrarDropdown(tipo) {
    const dd = document.getElementById(`dropdown-${tipo}`);
    const box = document.getElementById(`box-${tipo}`);
    const arrow = document.getElementById(`arrow-${tipo}`);

    if (!dd) return;

    this.dropdownState[tipo].abierto = false;
    this.dropdownState[tipo].indiceResaltado = -1;
    dd.classList.add('hidden');
    if (box) box.classList.remove('open');
    if (arrow) arrow.classList.remove('rotate');
  },

  filtrarDropdown(tipo) {
    const input = document.getElementById(`search-${tipo}`);
    const q = input ? input.value.trim().toLowerCase() : '';
    const fuente = tipo === 'proveedor' ? this.proveedores : this.productos;

    let filtrada = [];
    if (!q) {
      filtrada = [...fuente];
    } else {
      if (tipo === 'proveedor') {
        filtrada = fuente.filter(p =>
          (p.razon_social && p.razon_social.toLowerCase().includes(q)) ||
          (p.nit && p.nit.toLowerCase().includes(q))
        );
      } else {
        filtrada = fuente.filter(p =>
          (p.nombre && p.nombre.toLowerCase().includes(q)) ||
          (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
        );
      }
    }

    this.dropdownState[tipo].listaFiltrada = filtrada;
    this.dropdownState[tipo].indiceResaltado = filtrada.length > 0 ? 0 : -1;
    this.renderOpciones(tipo, filtrada);
  },

  renderOpciones(tipo, lista) {
    const container = document.getElementById(`options-${tipo}`);
    if (!container) return;

    if (!lista || lista.length === 0) {
      container.innerHTML = `<div class="custom-select-empty">No se encontraron resultados coincidentes.</div>`;
      return;
    }

    const valorActual = document.getElementById(`compras-${tipo}`)?.value;
    const idxResaltado = this.dropdownState[tipo].indiceResaltado;

    container.innerHTML = lista.map((it, idx) => {
      const idVal = String(tipo === 'proveedor' ? it.id_proveedor : it.id_producto);
      const isSelected = valorActual === idVal;
      const isHighlighted = idx === idxResaltado;

      if (tipo === 'proveedor') {
        return `
          <div class="custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}" 
               data-id="${it.id_proveedor}" 
               data-idx="${idx}"
               onclick="ComprasView.seleccionarPorIndice('proveedor', ${idx})">
            <strong style="color: #fff;">${it.razon_social}</strong>
            <small style="color: var(--text-muted); font-size: 0.74rem;">NIT: <span style="font-family: monospace; color: var(--primary);">${it.nit}</span></small>
          </div>
        `;
      } else {
        const costoRef = it.ultimo_costo_compra > 0 ? App.formatoMoneda(it.ultimo_costo_compra) : 'Sin costo previo';
        return `
          <div class="custom-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}" 
               data-id="${it.id_producto}" 
               data-idx="${idx}"
               onclick="ComprasView.seleccionarPorIndice('producto', ${idx})">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="color: #fff;">${it.nombre}</strong>
              <span style="font-size: 0.72rem; color: var(--text-dim); font-family: monospace;">${costoRef}</span>
            </div>
            <small style="color: var(--text-muted); font-size: 0.74rem;">Cód: <span style="font-family: monospace; color: var(--primary);">${it.codigo_barras}</span> | Stock: <b>${it.stock_total} u.</b></small>
          </div>
        `;
      }
    }).join('');

    // Asegurar scroll al elemento resaltado
    if (idxResaltado >= 0) {
      const elResaltado = container.children[idxResaltado];
      if (elResaltado) elResaltado.scrollIntoView({ block: 'nearest' });
    }
  },

  seleccionarPorIndice(tipo, idx) {
    const item = this.dropdownState[tipo].listaFiltrada[idx];
    if (item) this.seleccionarOpcion(tipo, item);
  },

  seleccionarOpcion(tipo, item) {
    const inputHidden = document.getElementById(`compras-${tipo}`);
    const label = document.getElementById(`label-${tipo}`);

    if (tipo === 'proveedor') {
      if (inputHidden) inputHidden.value = item.id_proveedor;
      if (label) {
        label.classList.remove('placeholder');
        label.innerHTML = `<strong>${item.razon_social}</strong> <span style="color: var(--text-muted); font-size: 0.78rem;">(NIT: ${item.nit})</span>`;
      }
    } else {
      if (inputHidden) inputHidden.value = item.id_producto;
      if (label) {
        label.classList.remove('placeholder');
        label.innerHTML = `<strong>${item.nombre}</strong> <span style="color: var(--text-muted); font-size: 0.78rem;">(Cód: ${item.codigo_barras})</span>`;
      }

      // Autocompletar % Margen de Ganancia del producto seleccionado
      const inputMargen = document.getElementById('compras-margen');
      if (inputMargen) {
        inputMargen.value = item.margen_ganancia !== undefined ? item.margen_ganancia : 30;
      }

      // Visualización de último costo de compra y margen sugerido
      this.actualizarBadgeUltimoCosto(item);
      this.actualizarAvisoMargen();
    }

    this.cerrarDropdown(tipo);
  },

  actualizarBadgeUltimoCosto(producto) {
    const badge = document.getElementById('compras-badge-ultimo-costo');
    const inputCosto = document.getElementById('compras-costo');
    if (!badge) return;

    badge.style.display = 'block';

    const ultimoCosto = Number(producto.ultimo_costo_compra || 0);

    if (ultimoCosto > 0) {
      badge.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 8px; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #38bdf8; font-size: 0.78rem;">
            <i class="fa-solid fa-tag"></i> <strong>Último costo de compra:</strong> ${App.formatoMoneda(ultimoCosto)}
          </span>
          <button type="button" onclick="document.getElementById('compras-costo').value = ${ultimoCosto}; ComprasView.actualizarAvisoMargen();" style="background: none; border: none; color: #38bdf8; font-size: 0.74rem; text-decoration: underline; cursor: pointer;">
            Usar este costo
          </button>
        </div>
      `;
      // Sugerir el costo en el campo si está vacío
      if (inputCosto && !inputCosto.value) {
        inputCosto.value = ultimoCosto;
      }
    } else {
      badge.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 6px 12px; color: var(--warning); font-size: 0.78rem;">
          <i class="fa-solid fa-circle-info"></i> <strong>Primer ingreso:</strong> Sin costo de compra previo registrado.
        </div>
      `;
    }
    this.actualizarAvisoMargen();
  },

  // Aviso dinámico: Margen del producto, nuevo precio base sugerido y PVP
  actualizarAvisoMargen() {
    const infoDiv = document.getElementById('compras-info-margen');
    const inputProd = document.getElementById('compras-producto');
    const inputCosto = document.getElementById('compras-costo');
    const inputMargen = document.getElementById('compras-margen');
    if (!infoDiv) return;

    const idProducto = parseInt(inputProd?.value || 0, 10);
    const prod = this.productos.find(p => p.id_producto === idProducto);
    const costo = parseFloat(inputCosto?.value || 0);

    if (!prod || isNaN(costo) || costo <= 0) {
      infoDiv.style.display = 'none';
      infoDiv.innerHTML = '';
      return;
    }

    const margenVal = inputMargen && inputMargen.value !== '' ? parseFloat(inputMargen.value) : NaN;
    const margen = !isNaN(margenVal) && margenVal >= 0 ? margenVal : (parseFloat(prod.margen_ganancia) || 30.00);

    let tasaIva = 0;
    if (String(prod.tarifa_iva) === '19') tasaIva = 0.19;
    else if (String(prod.tarifa_iva) === '5') tasaIva = 0.05;

    const precioBaseSugerido = Number((costo * (1 + (margen / 100))).toFixed(2));
    const pvpFinal = Number((precioBaseSugerido * (1 + tasaIva)).toFixed(2));
    const precioBaseActual = parseFloat(prod.precio_base) || 0;

    infoDiv.style.display = 'block';

    if (precioBaseSugerido > precioBaseActual) {
      infoDiv.innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 8px 12px; font-size: 0.77rem; color: #a7f3d0;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span><i class="fa-solid fa-chart-line"></i> Margen configurado: <strong>${margen}%</strong></span>
            <span style="color: var(--success); font-weight: 800;">PVP Sugerido: ${App.formatoMoneda(pvpFinal)}</span>
          </div>
          <div>
            Nuevo Precio Base sugerido: <strong>${App.formatoMoneda(precioBaseSugerido)}</strong> (IVA ${prod.tarifa_iva}%).
          </div>
          <div style="margin-top: 4px; font-size: 0.73rem; color: #38bdf8;">
            <i class="fa-solid fa-shield-halved"></i> <b>Protección Anti-Pérdidas activa:</b> El precio base se actualizará de ${App.formatoMoneda(precioBaseActual)} a ${App.formatoMoneda(precioBaseSugerido)}.
          </div>
        </div>
      `;
    } else {
      infoDiv.innerHTML = `
        <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 8px 12px; font-size: 0.77rem; color: #bae6fd;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span><i class="fa-solid fa-chart-line"></i> Margen configurado: <strong>${margen}%</strong></span>
            <span style="font-weight: 800; color: #fff;">PVP con este costo: ${App.formatoMoneda(pvpFinal)}</span>
          </div>
          <div>
            Precio Base con este lote: <strong>${App.formatoMoneda(precioBaseSugerido)}</strong>.
          </div>
          <div style="margin-top: 4px; font-size: 0.73rem; color: var(--text-muted);">
            <i class="fa-solid fa-lock"></i> Se conservará el precio base actual (${App.formatoMoneda(precioBaseActual)}) para mayor rentabilidad, a menos que marques "Forzar actualización".
          </div>
        </div>
      `;
    }
  },

  manejarTecladoDropdown(e, tipo) {
    const estado = this.dropdownState[tipo];
    const lista = estado.listaFiltrada;

    if (!estado.abierto) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (lista.length === 0) return;
      estado.indiceResaltado = (estado.indiceResaltado + 1) % lista.length;
      this.renderOpciones(tipo, lista);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (lista.length === 0) return;
      estado.indiceResaltado = (estado.indiceResaltado - 1 + lista.length) % lista.length;
      this.renderOpciones(tipo, lista);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (estado.indiceResaltado >= 0 && estado.indiceResaltado < lista.length) {
        this.seleccionarPorIndice(tipo, estado.indiceResaltado);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrarDropdown(tipo);
    }
  },

  generarNumeroLoteSugerido() {
    const inputLote = document.getElementById('compras-lote');
    if (!inputLote) return;

    const fechaHoy = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    inputLote.value = `LOT-${fechaHoy}-${rand}`;
  },

  // Modal Nuevo Proveedor
  abrirModalNuevoProveedor() {
    const modal = document.getElementById('modal-proveedor');
    if (!modal) return;
    const form = document.getElementById('form-nuevo-proveedor');
    if (form) form.reset();
    modal.classList.remove('hidden');
    const inputNit = document.getElementById('prov-nit');
    if (inputNit) inputNit.focus();
  },

  cerrarModalNuevoProveedor() {
    const modal = document.getElementById('modal-proveedor');
    if (modal) modal.classList.add('hidden');
  },

  async guardarNuevoProveedor(e) {
    e.preventDefault();

    const nit = document.getElementById('prov-nit').value.trim();
    const razon_social = document.getElementById('prov-razon').value.trim();
    const telefono = document.getElementById('prov-telefono').value.trim();
    const correo = document.getElementById('prov-correo').value.trim();
    const direccion = document.getElementById('prov-direccion').value.trim();

    if (!nit || !razon_social) {
      App.toast('NIT y Razón Social son campos requeridos.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-guardar-proveedor');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
      const res = await fetch('/api/compras/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nit, razon_social, telefono, correo, direccion })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al guardar proveedor');
      }

      App.toast(`¡Proveedor "${razon_social}" registrado exitosamente!`, 'success');
      this.cerrarModalNuevoProveedor();

      // Recargar lista y preseleccionar el creado en el custom dropdown
      await this.cargarProveedores(data.data.id_proveedor);
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Proveedor';
    }
  },

  agregarItem() {
    const inputProd = document.getElementById('compras-producto');
    const inputLote = document.getElementById('compras-lote');
    const inputCant = document.getElementById('compras-cantidad');
    const inputCosto = document.getElementById('compras-costo');
    const inputVence = document.getElementById('compras-vencimiento');

    const id_producto = parseInt(inputProd ? inputProd.value : 0, 10);
    const numero_lote = inputLote ? inputLote.value.trim().toUpperCase() : '';
    const cantidad = parseInt(inputCant ? inputCant.value : 0, 10);
    const costo_unitario = parseFloat(inputCosto ? inputCosto.value : 0);
    const fecha_vencimiento = inputVence ? inputVence.value : '';

    if (!id_producto) {
      App.toast('Seleccione un producto para la recepción.', 'warning');
      return;
    }
    if (!numero_lote) {
      App.toast('Ingrese el código o número del lote.', 'warning');
      return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
      App.toast('La cantidad debe ser un entero mayor a cero.', 'warning');
      return;
    }
    if (isNaN(costo_unitario) || costo_unitario <= 0) {
      App.toast('El costo unitario de compra debe ser mayor a cero.', 'warning');
      return;
    }
    if (!fecha_vencimiento) {
      App.toast('Debe asignar la fecha de caducidad para el semáforo.', 'warning');
      return;
    }

    const prod = this.productos.find(p => p.id_producto === id_producto);
    const forzar_precio = Boolean(document.getElementById('compras-forzar-precio')?.checked);
    const inputMargen = document.getElementById('compras-margen');
    const margenVal = inputMargen && inputMargen.value !== '' ? parseFloat(inputMargen.value) : NaN;
    const margen_ganancia = !isNaN(margenVal) && margenVal >= 0 ? margenVal : (parseFloat(prod?.margen_ganancia) || 30.00);

    this.itemsRecepcion.push({
      id_producto,
      nombre_producto: prod ? prod.nombre : `Producto #${id_producto}`,
      numero_lote,
      cantidad,
      margen_ganancia,
      costo_unitario,
      fecha_vencimiento,
      forzar_precio,
      subtotal: cantidad * costo_unitario
    });

    // Limpiar campos para el siguiente ítem
    if (inputCant) inputCant.value = '';
    if (inputCosto) inputCosto.value = '';
    if (inputMargen) inputMargen.value = '';
    if (inputVence) inputVence.value = '';
    const checkForzar = document.getElementById('compras-forzar-precio');
    if (checkForzar) checkForzar.checked = false;
    const infoMargen = document.getElementById('compras-info-margen');
    if (infoMargen) {
      infoMargen.style.display = 'none';
      infoMargen.innerHTML = '';
    }
    this.generarNumeroLoteSugerido();

    this.renderTablaItems();
  },

  eliminarItem(index) {
    this.itemsRecepcion.splice(index, 1);
    this.renderTablaItems();
  },

  renderTablaItems() {
    const tbody = document.getElementById('compras-items-body');
    const elTotal = document.getElementById('compras-total-recepcion');
    if (!tbody) return;

    if (this.itemsRecepcion.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 25px;">No se han agregado lotes a la recepción actual.</td></tr>`;
      if (elTotal) elTotal.textContent = '$ 0.00';
      return;
    }

    let total = 0;
    tbody.innerHTML = this.itemsRecepcion.map((it, idx) => {
      total += it.subtotal;
      return `
        <tr>
          <td><strong>${it.nombre_producto}</strong></td>
          <td><code style="color: var(--primary);">${it.numero_lote}</code></td>
          <td style="font-weight: bold;">${it.cantidad} u.</td>
          <td><span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700;">${it.margen_ganancia}%</span></td>
          <td>${App.formatoMoneda(it.costo_unitario)}</td>
          <td>${it.fecha_vencimiento}</td>
          <td style="font-weight: bold; color: var(--success);">${App.formatoMoneda(it.subtotal)}</td>
          <td>
            <button onclick="ComprasView.eliminarItem(${idx})" style="background: none; border: none; color: var(--danger); cursor: pointer;" title="Eliminar de la lista">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    if (elTotal) elTotal.textContent = App.formatoMoneda(total);
  },

  async registrarRecepcion() {
    const inputProv = document.getElementById('compras-proveedor');
    const id_proveedor = inputProv ? parseInt(inputProv.value, 10) : 0;

    if (!id_proveedor) {
      App.toast('Debe seleccionar el proveedor que remite la mercancía.', 'warning');
      return;
    }

    if (this.itemsRecepcion.length === 0) {
      App.toast('Agregue al menos un producto a la lista de recepción.', 'warning');
      return;
    }

    const payload = {
      id_proveedor,
      id_usuario: App.usuario ? App.usuario.id_usuario : 1,
      productos_comprados: this.itemsRecepcion.map(it => ({
        id_producto: it.id_producto,
        numero_lote: it.numero_lote,
        cantidad: it.cantidad,
        costo_unitario: it.costo_unitario,
        margen_ganancia: it.margen_ganancia,
        fecha_vencimiento: it.fecha_vencimiento,
        forzar_precio: Boolean(it.forzar_precio)
      }))
    };

    const btnRegistrar = document.getElementById('btn-compras-guardar');
    if (btnRegistrar) {
      btnRegistrar.disabled = true;
      btnRegistrar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Asentando Lotes en Kardex...`;
    }

    try {
      const res = await fetch('/api/compras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al registrar compra');
      }

      App.toast(`Recepción registrada con éxito (#${data.data.id_compra}). Lotes y Kardex actualizados.`, 'success');

      // Limpiar formulario y dropdowns
      this.itemsRecepcion = [];
      this.renderTablaItems();

      if (inputProv) inputProv.value = '';
      const labelProv = document.getElementById('label-proveedor');
      if (labelProv) {
        labelProv.classList.add('placeholder');
        labelProv.textContent = 'Seleccione un Proveedor...';
      }

      const inputProd = document.getElementById('compras-producto');
      if (inputProd) inputProd.value = '';
      const inputMargen = document.getElementById('compras-margen');
      if (inputMargen) inputMargen.value = '';
      const labelProd = document.getElementById('label-producto');
      if (labelProd) {
        labelProd.classList.add('placeholder');
        labelProd.textContent = 'Seleccione un Producto...';
      }

      const badgeCosto = document.getElementById('compras-badge-ultimo-costo');
      if (badgeCosto) badgeCosto.style.display = 'none';

      // Refrescar catálogo en memoria y vistas
      await this.cargarProductos();
      if (data.data?.lotes?.some(l => l.precio_actualizado)) {
        App.toast('Protección Anti-Pérdidas: Se actualizaron los precios comerciales de productos que ingresaron con costo superior.', 'info');
      }
      if (window.DashboardView && typeof window.DashboardView.cargar === 'function') {
        window.DashboardView.cargar();
      }
      if (window.PosView && typeof window.PosView.cargar === 'function') {
        window.PosView.cargar();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      if (btnRegistrar) {
        btnRegistrar.disabled = false;
        btnRegistrar.innerHTML = `<i class="fa-solid fa-truck-ramp-box"></i> Registrar Recepción en Inventario`;
      }
    }
  }
};

window.ComprasView = ComprasView;
