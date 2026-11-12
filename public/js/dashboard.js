/**
 * Módulo de Vista: Panel de Control, Catálogo de Productos y Registro de Mercancía
 */
const DashboardView = {
  productos: [],
  categorias: [],

  async cargar() {
    await Promise.all([
      this.cargarMetricas(),
      this.cargarCatalogo(),
      this.cargarCategorias()
    ]);
  },

  async cargarMetricas() {
    try {
      const res = await fetch('/api/dashboard/metricas');
      const data = await res.json();

      // 1. Ventas del día
      const elVentas = document.getElementById('stat-ventas');
      const elTransacciones = document.getElementById('stat-transacciones');
      if (elVentas) elVentas.textContent = App.formatoMoneda(data.ventas_hoy || 0);
      if (elTransacciones) elTransacciones.textContent = data.transacciones_hoy || 0;

      // 2. Costo Total del Inventario
      const elInv = document.getElementById('stat-inventario');
      const elUnidades = document.getElementById('stat-unidades');
      if (elInv) elInv.textContent = App.formatoMoneda(data.valor_inventario || 0);
      if (elUnidades) elUnidades.textContent = (data.unidades_bodega || 0).toLocaleString('es-CO');

      // 3. Alertas de Caducidad
      const elRojos = document.getElementById('stat-rojos');
      const elAmarillos = document.getElementById('stat-amarillos');
      const elVerdes = document.getElementById('stat-verdes');
      if (elRojos) elRojos.textContent = data.semaforo ? data.semaforo.rojos : 0;
      if (elAmarillos) elAmarillos.textContent = data.semaforo ? data.semaforo.amarillos : 0;
      if (elVerdes) elVerdes.textContent = data.semaforo ? data.semaforo.verdes : 0;

      // 4. Pérdidas por Productos Descartados
      const elBajas = document.getElementById('stat-bajas');
      const elEventosBaja = document.getElementById('stat-eventos-baja');
      if (elBajas) elBajas.textContent = App.formatoMoneda(data.perdidas_bajas || 0);
      if (elEventosBaja) elEventosBaja.textContent = (data.total_eventos_baja || 0) + ' eventos';

      // 5. Utilidad / Ganancia Real (PEPS)
      const elUtilidad = document.getElementById('stat-utilidad-peps');
      const elVentasBase = document.getElementById('stat-ventas-base');
      const elCostoPeps = document.getElementById('stat-costo-peps');
      const utilidadNeta = Number(data.utilidad_neta || 0);

      if (elUtilidad) {
        const signo = utilidadNeta >= 0 ? '+' : '-';
        const color = utilidadNeta >= 0 ? 'var(--success)' : 'var(--danger)';
        elUtilidad.innerHTML = `<span style="color: ${color}; font-weight: 800;">${signo}${App.formatoMoneda(Math.abs(utilidadNeta))}</span>`;
      }
      if (elVentasBase) elVentasBase.textContent = App.formatoMoneda(data.total_venta || 0);
      if (elCostoPeps) elCostoPeps.textContent = App.formatoMoneda(data.costo_peps || 0);

      // Alerta preventiva si hay lotes vencidos
      const elAlerta = document.getElementById('dashboard-alerta-vencidos');
      if (elAlerta) {
        if (data.semaforo && data.semaforo.rojos > 0) {
          elAlerta.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #fca5a5; padding: 14px 20px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.25rem; color: var(--danger);"></i>
                <div>
                  <strong>¡Atención! Hay productos con fecha de caducidad superada. El sistema ha bloqueado su cobro en caja por seguridad.</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">Se recomienda realizar la salida y descarte correspondiente para ajustar el inventario.</div>
                </div>
              </div>
              <button onclick="App.cambiarVista('semaforo')" class="btn btn-danger" style="padding: 8px 14px; font-size: 0.82rem; white-space: nowrap;">
                <i class="fa-solid fa-trash-can"></i> Dar de Baja Mercancía
              </button>
            </div>
          `;
          elAlerta.classList.remove('hidden');
        } else {
          elAlerta.classList.add('hidden');
        }
      }
    } catch (err) {
      console.error('Error al cargar métricas:', err);
    }
  },

  async cargarCatalogo() {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    try {
      const res = await fetch('/api/productos');
      this.productos = await res.json();
      this.renderTabla(this.productos);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger); padding: 30px;">Error al consultar catálogo: ${err.message}</td></tr>`;
    }
  },

  renderTabla(lista) {
    const tbody = document.getElementById('tabla-productos-body');
    if (!tbody) return;

    if (!lista || lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">No se encontraron productos coincidentes.</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(p => {
      let badgeEstado = '';
      if (p.estado_semaforo === 'ROJO') {
        badgeEstado = `<span class="badge badge-danger"><i class="fa-solid fa-circle-xmark"></i> Caducado / Bloqueado</span>`;
      } else if (p.estado_semaforo === 'AMARILLO') {
        badgeEstado = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Próximo (${p.dias_minimos_vencer}d)</span>`;
      } else {
        badgeEstado = `<span class="badge badge-success"><i class="fa-solid fa-check"></i> En Fecha (${p.dias_minimos_vencer}d)</span>`;
      }

      const tarifaBadgeClass = p.tarifa_iva === '19' ? 'badge-danger' : (p.tarifa_iva === '5' ? 'badge-warning' : 'badge-info');
      const nombreEscapado = (p.nombre || '').replace(/'/g, "\\'");

      return `
        <tr id="fila-producto-${p.id_producto}">
          <td><code style="color: var(--primary); font-weight: bold;">${p.codigo_barras}</code></td>
          <td><strong>${p.nombre}</strong></td>
          <td><span style="color: var(--text-muted);">${p.nombre_categoria || 'General'}</span></td>
          <td id="celda-margen-${p.id_producto}">
            <button type="button" 
                    id="btn-margen-${p.id_producto}"
                    onclick="DashboardView.activarEdicionRapidaMargen(${p.id_producto}, ${p.margen_ganancia || 30})"
                    class="badge" 
                    style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; transition: all 0.2s;" 
                    title="Clic para editar rápidamente este margen y recalcular precio">
              <span>${p.margen_ganancia || 30}%</span>
              <i class="fa-solid fa-pen" style="font-size: 0.65rem; opacity: 0.7;"></i>
            </button>
          </td>
          <td id="col-base-${p.id_producto}">${App.formatoMoneda(p.precio_base)}</td>
          <td><span class="badge ${tarifaBadgeClass}">IVA ${p.tarifa_iva}%</span></td>
          <td id="col-final-${p.id_producto}" style="font-weight: 700; color: var(--success);">${App.formatoMoneda(p.precio_venta_final)}</td>
          <td>
            <span style="font-weight: bold; ${p.stock_total <= p.stock_minimo ? 'color: var(--danger);' : ''}">
              ${p.stock_total} u.
            </span>
          </td>
          <td>${badgeEstado}</td>
          <td style="text-align: center; white-space: nowrap;">
            <button onclick="DashboardView.abrirModalEditarProducto(${p.id_producto})" 
                    class="btn btn-secondary" 
                    style="padding: 4px 8px; font-size: 0.75rem; color: #38bdf8; border-color: rgba(56, 189, 248, 0.3); margin-right: 4px;" 
                    title="Editar producto y precios comerciales">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="DashboardView.confirmarInactivarProducto(${p.id_producto}, '${nombreEscapado}')" 
                    class="btn btn-secondary" 
                    style="padding: 4px 8px; font-size: 0.75rem; color: #f87171; border-color: rgba(239, 68, 68, 0.3);" 
                    title="Desactivar producto del catálogo">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // Edición Rápida de Margen de Ganancia directamente en la tabla
  activarEdicionRapidaMargen(id_producto, margenActual) {
    const celda = document.getElementById(`celda-margen-${id_producto}`);
    if (!celda) return;

    celda.innerHTML = `
      <div style="display: inline-flex; align-items: center; gap: 4px;">
        <input type="number" 
               id="input-margen-rapido-${id_producto}" 
               step="0.5" 
               min="0" 
               value="${margenActual}" 
               style="width: 58px; padding: 3px 5px; font-size: 0.78rem; font-weight: 700; background: var(--bg-main); color: #38bdf8; border: 1px solid var(--primary); border-radius: 6px; outline: none; text-align: center;"
               onkeydown="DashboardView.teclaMargenRapido(event, ${id_producto}, ${margenActual})">
        <button type="button" 
                onclick="DashboardView.guardarMargenRapido(${id_producto})" 
                class="btn btn-primary" 
                style="padding: 3px 6px; font-size: 0.72rem; border-radius: 4px; line-height: 1;" 
                title="Guardar nuevo margen (Enter)">
          <i class="fa-solid fa-check"></i>
        </button>
        <button type="button" 
                onclick="DashboardView.restaurarCeldaMargen(${id_producto}, ${margenActual})" 
                class="btn btn-secondary" 
                style="padding: 3px 6px; font-size: 0.72rem; border-radius: 4px; line-height: 1;" 
                title="Cancelar (Esc)">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    const input = document.getElementById(`input-margen-rapido-${id_producto}`);
    if (input) {
      input.focus();
      input.select();
    }
  },

  teclaMargenRapido(e, id_producto, margenActual) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.guardarMargenRapido(id_producto);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.restaurarCeldaMargen(id_producto, margenActual);
    }
  },

  async guardarMargenRapido(id_producto) {
    const input = document.getElementById(`input-margen-rapido-${id_producto}`);
    if (!input) return;

    const nuevoMargen = parseFloat(input.value);
    if (isNaN(nuevoMargen) || nuevoMargen < 0) {
      App.toast('El margen debe ser un número mayor o igual a 0.', 'warning');
      return;
    }

    try {
      const res = await fetch(`/api/productos/${id_producto}/margen`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ margen_ganancia: nuevoMargen })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al actualizar margen');
      }

      App.toast(data.mensaje, 'success');

      // Actualizar producto en memoria de catálogo
      const prod = this.productos.find(p => p.id_producto === id_producto);
      if (prod) {
        prod.margen_ganancia = data.data.margen_ganancia;
        prod.precio_base = data.data.precio_base;
        prod.precio_venta_final = data.data.precio_venta_final;
      }

      // Actualizar celdas en la fila
      this.restaurarCeldaMargen(id_producto, data.data.margen_ganancia);
      const colBase = document.getElementById(`col-base-${id_producto}`);
      if (colBase) colBase.textContent = App.formatoMoneda(data.data.precio_base);
      const colFinal = document.getElementById(`col-final-${id_producto}`);
      if (colFinal) colFinal.textContent = App.formatoMoneda(data.data.precio_venta_final);

      // Sincronizar Punto de Cobro (POS)
      if (window.PosView && Array.isArray(window.PosView.productos)) {
        const prodPos = window.PosView.productos.find(p => p.id_producto === id_producto);
        if (prodPos) {
          prodPos.precio_base = data.data.precio_base;
          prodPos.precio_venta_final = data.data.precio_venta_final;
          prodPos.margen_ganancia = data.data.margen_ganancia;
          if (typeof window.PosView.renderProductos === 'function') {
            window.PosView.renderProductos(window.PosView.productos);
          }
        }
      }
    } catch (err) {
      App.toast(err.message, 'danger');
      const prod = this.productos.find(p => p.id_producto === id_producto);
      this.restaurarCeldaMargen(id_producto, prod ? (prod.margen_ganancia || 30) : 30);
    }
  },

  restaurarCeldaMargen(id_producto, margen) {
    const celda = document.getElementById(`celda-margen-${id_producto}`);
    if (!celda) return;

    celda.innerHTML = `
      <button type="button" 
              id="btn-margen-${id_producto}"
              onclick="DashboardView.activarEdicionRapidaMargen(${id_producto}, ${margen})"
              class="badge" 
              style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.35); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px; transition: all 0.2s;" 
              title="Clic para editar rápidamente este margen y recalcular precio">
        <span>${margen}%</span>
        <i class="fa-solid fa-pen" style="font-size: 0.65rem; opacity: 0.7;"></i>
      </button>
    `;
  },

  // Desactivación lógica de productos (Soft Delete)
  async confirmarInactivarProducto(id_producto, nombreProducto) {
    const confirmacion = confirm(
      `¿Deseas dar de baja este producto del catálogo comercial?\n\n"${nombreProducto}"\n\nNo se podrá seguir vendiendo pero se mantendrá su historial contable.`
    );
    if (!confirmacion) return;

    try {
      const res = await fetch(`/api/productos/${id_producto}/inactivar`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al desactivar producto');
      }

      App.toast(data.mensaje || `Producto "${nombreProducto}" desactivado del catálogo.`, 'info');
      await this.cargar();
    } catch (err) {
      App.toast(err.message, 'danger');
    }
  },

  // Buscador en Vivo en la Tabla de Productos
  filtrarCatalogo() {
    const input = document.getElementById('catalogo-buscar');
    if (!input) return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
      this.renderTabla(this.productos);
      return;
    }

    const filtrados = this.productos.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(query)) ||
      (p.codigo_barras && p.codigo_barras.toLowerCase().includes(query)) ||
      (p.nombre_categoria && p.nombre_categoria.toLowerCase().includes(query))
    );

    this.renderTabla(filtrados);
  },

  async cargarCategorias(categoriaSeleccionarId = null) {
    try {
      const res = await fetch('/api/categorias');
      this.categorias = await res.json();
      const select = document.getElementById('prod-categoria');
      if (select) {
        select.innerHTML = '<option value="">Seleccione una Categoría...</option>' +
          this.categorias.map(c => `<option value="${c.id_categoria}">${c.nombre_categoria}</option>`).join('') +
          '<option value="__CREAR_NUEVA__" style="color: var(--primary); font-weight: bold;">+ Crear nueva categoría...</option>';

        if (categoriaSeleccionarId) {
          select.value = categoriaSeleccionarId;
        }
      }
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  },

  manejarCambioCategoria(select) {
    if (!select) return;
    if (select.value === '__CREAR_NUEVA__') {
      select.value = '';
      this.abrirModalNuevaCategoria();
      return;
    }

    const catId = parseInt(select.value, 10);
    const cat = this.categorias.find(c => c.id_categoria === catId);
    if (cat && cat.margen_defecto !== undefined) {
      const inputMargen = document.getElementById('prod-margen');
      if (inputMargen) {
        inputMargen.value = cat.margen_defecto;
        this.calcularDesdeMargen();
      }
    }
  },

  // Sub-modal Nueva Categoría (rápido y fluido)
  abrirModalNuevaCategoria() {
    const modal = document.getElementById('modal-categoria');
    if (!modal) return;
    const form = document.getElementById('form-nueva-categoria');
    if (form) form.reset();
    const inputMargen = document.getElementById('cat-margen');
    if (inputMargen) inputMargen.value = '30';
    modal.classList.remove('hidden');
    const inputNombre = document.getElementById('cat-nombre');
    if (inputNombre) inputNombre.focus();
  },

  cerrarModalNuevaCategoria() {
    const modal = document.getElementById('modal-categoria');
    if (modal) modal.classList.add('hidden');
  },

  async guardarNuevaCategoria(e) {
    e.preventDefault();

    const nombre = document.getElementById('cat-nombre').value.trim();
    const descripcion = document.getElementById('cat-descripcion').value.trim();
    const margen = parseFloat(document.getElementById('cat-margen')?.value) || 30.00;

    if (!nombre) {
      App.toast('El nombre de la categoría es obligatorio.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-guardar-categoria');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
      const res = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_categoria: nombre,
          descripcion: descripcion || null,
          margen_defecto: margen
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al registrar categoría');
      }

      App.toast(`¡Categoría "${nombre}" creada y seleccionada!`, 'success');
      this.cerrarModalNuevaCategoria();

      // Recargar categorías y preseleccionar la nueva en el formulario de producto
      await this.cargarCategorias(data.data.id_categoria);
      const inputMargenProd = document.getElementById('prod-margen');
      if (inputMargenProd) {
        inputMargenProd.value = margen;
        this.calcularDesdeMargen();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Categoría';
    }
  },

  // Modal Nuevo Producto (Creación)
  abrirModalNuevoProducto() {
    const modal = document.getElementById('modal-producto');
    if (!modal) return;

    // Resetear formulario y modo
    const form = document.getElementById('form-nuevo-producto');
    if (form) form.reset();

    const inputId = document.getElementById('prod-id');
    const inputCostoOculto = document.getElementById('prod-costo-oculto');
    const inputMargen = document.getElementById('prod-margen');
    const titulo = document.getElementById('modal-producto-titulo');
    const icono = document.getElementById('modal-producto-icono');
    const btnTexto = document.getElementById('btn-guardar-producto-texto');

    if (inputId) inputId.value = '';
    if (inputCostoOculto) inputCostoOculto.value = '0';
    if (inputMargen) inputMargen.value = '30';
    if (titulo) titulo.textContent = 'Registrar Nuevo Producto';
    if (icono) icono.className = 'fa-solid fa-boxes-stacked';
    if (btnTexto) btnTexto.textContent = 'Guardar Producto';

    this.calcularPrecioFinalReactivo();
    modal.classList.remove('hidden');

    const inputCodigo = document.getElementById('prod-codigo');
    if (inputCodigo) inputCodigo.focus();
  },

  // Modal Editar Producto (Edición con Validación Financiera)
  abrirModalEditarProducto(id_producto) {
    const modal = document.getElementById('modal-producto');
    if (!modal) return;

    const prod = this.productos.find(p => p.id_producto === parseInt(id_producto, 10));
    if (!prod) {
      App.toast('Producto no encontrado para editar.', 'warning');
      return;
    }

    const inputId = document.getElementById('prod-id');
    const inputCodigo = document.getElementById('prod-codigo');
    const inputNombre = document.getElementById('prod-nombre');
    const selectCat = document.getElementById('prod-categoria');
    const inputMargen = document.getElementById('prod-margen');
    const inputBase = document.getElementById('prod-precio-base');
    const selectIva = document.getElementById('prod-iva');
    const inputStockMin = document.getElementById('prod-stock-minimo');
    const inputCostoOculto = document.getElementById('prod-costo-oculto');

    const titulo = document.getElementById('modal-producto-titulo');
    const icono = document.getElementById('modal-producto-icono');
    const btnTexto = document.getElementById('btn-guardar-producto-texto');

    if (inputId) inputId.value = prod.id_producto;
    if (inputCodigo) inputCodigo.value = prod.codigo_barras || '';
    if (inputNombre) inputNombre.value = prod.nombre || '';
    if (inputMargen) inputMargen.value = prod.margen_ganancia || 30;
    if (inputBase) inputBase.value = prod.precio_base || '';
    if (selectIva) selectIva.value = String(prod.tarifa_iva || '19');
    if (inputStockMin) inputStockMin.value = prod.stock_minimo || 5;

    // Asignar categoría correspondiente
    if (selectCat) {
      const cat = this.categorias.find(c => c.nombre_categoria === prod.nombre_categoria);
      selectCat.value = cat ? cat.id_categoria : (prod.id_categoria || '');
    }

    // Guardar costo referencial registrado (lote vigente de mayor costo o último lote)
    const costoRef = Number(prod.costo_lote_vigente || prod.ultimo_costo_compra || 0);
    if (inputCostoOculto) inputCostoOculto.value = costoRef;

    if (titulo) titulo.textContent = 'Editar Producto & Precios Comerciales';
    if (icono) icono.className = 'fa-solid fa-pen-to-square';
    if (btnTexto) btnTexto.textContent = 'Actualizar Producto';

    this.calcularPrecioFinalReactivo();
    modal.classList.remove('hidden');

    if (inputBase) inputBase.focus();
  },

  cerrarModalNuevoProducto() {
    const modal = document.getElementById('modal-producto');
    if (modal) modal.classList.add('hidden');
  },

  // Cálculo de Precio Base sugerido a partir del % de Margen Deseado
  calcularDesdeMargen() {
    const inputMargen = document.getElementById('prod-margen');
    const inputBase = document.getElementById('prod-precio-base');
    const inputCostoOculto = document.getElementById('prod-costo-oculto');

    const margen = parseFloat(inputMargen ? inputMargen.value : 30) || 0;
    const costo = parseFloat(inputCostoOculto ? inputCostoOculto.value : 0) || 0;

    if (costo > 0 && inputBase) {
      const baseSugerido = Number((costo * (1 + (margen / 100))).toFixed(2));
      inputBase.value = baseSugerido;
    }

    this.calcularPrecioFinalReactivo();
  },

  // Cálculo Reactivo en Tiempo Real de Indicadores Financieros (PVP, Ganancia, Margen %)
  calcularPrecioFinalReactivo() {
    const inputBase = document.getElementById('prod-precio-base');
    const selectIva = document.getElementById('prod-iva');
    const inputCostoOculto = document.getElementById('prod-costo-oculto');

    const elCostoRef = document.getElementById('prod-costo-referencial');
    const elGanancia = document.getElementById('prod-ganancia-bruta');
    const elMargen = document.getElementById('prod-margen-porcentaje');
    const elPrecioFinal = document.getElementById('prod-precio-final-calc');
    const alertaNegativo = document.getElementById('prod-alerta-margen-negativo');
    const alertaTexto = document.getElementById('prod-alerta-texto');
    const btnGuardar = document.getElementById('btn-guardar-producto');

    const base = parseFloat(inputBase ? inputBase.value : 0) || 0;
    const tarifa = selectIva ? selectIva.value : '19';
    const costo = parseFloat(inputCostoOculto ? inputCostoOculto.value : 0) || 0;

    let tasa = 0;
    if (tarifa === '19') tasa = 0.19;
    else if (tarifa === '5') tasa = 0.05;

    const final = base * (1 + tasa);
    const ganancia = base - costo;
    const margenPorcentaje = base > 0 ? ((base - costo) / base) * 100 : 0;

    if (elCostoRef) elCostoRef.textContent = App.formatoMoneda(costo);
    if (elPrecioFinal) elPrecioFinal.textContent = App.formatoMoneda(final);

    if (elGanancia) {
      elGanancia.textContent = (ganancia >= 0 ? '+ ' : '') + App.formatoMoneda(ganancia);
      elGanancia.style.color = ganancia >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    if (elMargen) {
      elMargen.textContent = margenPorcentaje.toFixed(1) + '%';
      elMargen.style.color = margenPorcentaje >= 15 ? 'var(--success)' : (margenPorcentaje >= 0 ? 'var(--warning)' : 'var(--danger)');
    }

    // Detección de Margen Negativo / Inviable
    if (costo > 0 && base < costo) {
      if (alertaNegativo) {
        alertaNegativo.classList.remove('hidden');
        if (alertaTexto) {
          alertaTexto.innerHTML = `<strong>¡ALERTA FINANCIERA!</strong> El precio base (${App.formatoMoneda(base)}) está por debajo del costo de compra (${App.formatoMoneda(costo)}). Pérdida por unidad: <b>-${App.formatoMoneda(Math.abs(ganancia))}</b>.`;
        }
      }
      if (btnGuardar) {
        btnGuardar.classList.remove('btn-primary');
        btnGuardar.classList.add('btn-danger');
      }
    } else {
      if (alertaNegativo) alertaNegativo.classList.add('hidden');
      if (btnGuardar) {
        btnGuardar.classList.remove('btn-danger');
        btnGuardar.classList.add('btn-primary');
      }
    }

    return final;
  },

  // Guardar Producto (creación o actualización unificada)
  async guardarProducto(e) {
    e.preventDefault();

    const id_producto = document.getElementById('prod-id')?.value;
    const codigo = document.getElementById('prod-codigo').value.trim();
    const nombre = document.getElementById('prod-nombre').value.trim();
    const id_categoria = document.getElementById('prod-categoria').value;
    const margen_ganancia = parseFloat(document.getElementById('prod-margen')?.value) || 30.00;
    const precio_base = parseFloat(document.getElementById('prod-precio-base').value) || 0;
    const tarifa_iva = document.getElementById('prod-iva').value;
    const stock_minimo = parseInt(document.getElementById('prod-stock-minimo').value, 10) || 5;

    if (!codigo || !nombre || precio_base <= 0) {
      App.toast('Por favor complete los campos obligatorios correctamente.', 'warning');
      return;
    }

    const esEdicion = Boolean(id_producto);
    const url = esEdicion ? `/api/productos/${id_producto}` : '/api/productos';
    const method = esEdicion ? 'PUT' : 'POST';

    const btn = document.getElementById('btn-guardar-producto');
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${esEdicion ? 'Actualizando...' : 'Guardando...'}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo_barras: codigo,
          nombre,
          id_categoria: id_categoria ? parseInt(id_categoria, 10) : null,
          margen_ganancia,
          precio_base,
          tarifa_iva,
          stock_minimo
        })
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al procesar producto');
      }

      App.toast(data.mensaje || `Producto "${nombre}" ${esEdicion ? 'actualizado' : 'registrado'} exitosamente.`, 'success');
      this.cerrarModalNuevoProducto();

      // Recargar catálogo y métricas
      await this.cargar();
      if (window.PosView && typeof window.PosView.cargar === 'function') {
        await window.PosView.cargar();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      btn.disabled = false;
      const btnTexto = document.getElementById('btn-guardar-producto-texto');
      btn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span id="btn-guardar-producto-texto">${esEdicion ? 'Actualizar Producto' : 'Guardar Producto'}</span>`;
    }
  },

  // Recálculo Masivo de Precios por Margen (Opción 2)
  async recalcularPreciosMasivo() {
    const confirmar = confirm(
      "¿Deseas recalcular automáticamente los Precios Base y PVP de todos los productos activos?\n\nEl sistema aplicará la fórmula [Costo Mayor × (1 + % Margen / 100)] para garantizar que ningún producto se venda a pérdida."
    );
    if (!confirmar) return;

    const btn = document.getElementById('btn-recalcular-precios');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Recalculando...';
    }

    try {
      const res = await fetch('/api/productos/recalcular-precios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al recalcular precios');
      }

      App.toast(data.mensaje, 'success');
      await this.cargar();
      if (window.PosView && typeof window.PosView.cargar === 'function') {
        await window.PosView.cargar();
      }
    } catch (err) {
      App.toast(err.message, 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = origHtml;
      }
    }
  },

  // Alias para retrocompatibilidad
  guardarNuevoProducto(e) {
    return this.guardarProducto(e);
  }
};

window.DashboardView = DashboardView;
