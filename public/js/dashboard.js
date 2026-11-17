/**
 * Módulo de Vista: Panel de Control, Catálogo de Productos y Registro de Mercancía
 */
const DashboardView = {
  productos: [],
  categorias: [],
  chartIngresos30d: null,
  chartHorasPico: null,

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

      // Saludo superior personalizado
      const elSaludo = document.getElementById('dashboard-saludo-rol');
      if (elSaludo && window.App && App.usuario) {
        elSaludo.textContent = `HOLA, ${(App.usuario.rol || 'ADMINISTRADOR').toUpperCase()}`;
      }

      // 1. KPI 1: Ventas del día
      const elVentas = document.getElementById('stat-ventas');
      const elTransacciones = document.getElementById('stat-transacciones');
      if (elVentas) elVentas.textContent = App.formatoMoneda(data.ventas_hoy || 0);
      if (elTransacciones) elTransacciones.textContent = `${data.transacciones_hoy || 0} facturas generadas hoy`;

      // 2. KPI 2: Utilidad Real PEPS (Hoy)
      const elUtilidad = document.getElementById('stat-utilidad-peps');
      const elUtilidadSub = document.getElementById('stat-utilidad-peps-sub');
      const utilidadHoy = Number(data.utilidad_hoy !== undefined ? data.utilidad_hoy : (data.utilidad_neta || 0));
      if (elUtilidad) {
        const signo = utilidadHoy >= 0 ? '+' : '';
        elUtilidad.textContent = `${signo}${App.formatoMoneda(utilidadHoy)}`;
        elUtilidad.style.color = utilidadHoy >= 0 ? '#2DD4BF' : '#F43F5E';
      }
      if (elUtilidadSub) {
        elUtilidadSub.textContent = `Costo lotes hoy: ${App.formatoMoneda(data.costo_peps_hoy || 0)}`;
      }

      // 3. KPI 3: Por Vencer (≤ 7 días)
      const elVencen7d = document.getElementById('stat-vencen-7d');
      const elVencenSub = document.getElementById('stat-vencen-7d-sub');
      if (elVencen7d) elVencen7d.textContent = `${data.por_vencer_7_dias || 0} lotes`;
      if (elVencenSub) {
        const cantAmarillos = data.semaforo ? data.semaforo.amarillos : 0;
        elVencenSub.textContent = `${cantAmarillos} lotes en riesgo en 30 días`;
      }

      // 4. KPI 4: Stock Crítico / Bloqueados
      const elStockCritico = document.getElementById('stat-stock-critico');
      const elStockCriticoSub = document.getElementById('stat-stock-critico-sub');
      if (elStockCritico) elStockCritico.textContent = `${data.stock_critico || 0} productos`;
      if (elStockCriticoSub) {
        const caducados = data.semaforo ? data.semaforo.rojos : 0;
        elStockCriticoSub.textContent = `${caducados} lotes caducados bloqueados`;
      }

      // Métricas compatibles secundarias
      const elInv = document.getElementById('stat-inventario');
      const elUnidades = document.getElementById('stat-unidades');
      if (elInv) elInv.textContent = App.formatoMoneda(data.valor_inventario || 0);
      if (elUnidades) elUnidades.textContent = (data.unidades_bodega || 0).toLocaleString('es-CO');

      const elBajas = document.getElementById('stat-bajas');
      const elEventosBaja = document.getElementById('stat-eventos-baja');
      if (elBajas) elBajas.textContent = App.formatoMoneda(data.perdidas_bajas || 0);
      if (elEventosBaja) elEventosBaja.textContent = (data.total_eventos_baja || 0) + ' eventos';

      // Alerta preventiva si hay lotes vencidos
      const elAlerta = document.getElementById('dashboard-alerta-vencidos');
      if (elAlerta) {
        if (data.semaforo && data.semaforo.rojos > 0) {
          elAlerta.innerHTML = `
            <div style="background: rgba(244, 63, 94, 0.12); border: 1px solid rgba(244, 63, 94, 0.35); color: #FDA4AF; padding: 14px 18px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.25rem; color: #F43F5E;"></i>
                <div>
                  <strong style="color: #fff;">¡Atención! Hay lotes con fecha de caducidad superada.</strong>
                  <div style="font-size: 0.8rem; color: #FDA4AF; margin-top: 2px;">El sistema ha bloqueado su venta en caja por seguridad preventiva.</div>
                </div>
              </div>
              <button onclick="App.cambiarVista('semaforo')" class="btn btn-danger" style="padding: 6px 12px; font-size: 0.78rem; white-space: nowrap;">
                <i class="fa-solid fa-trash-can"></i> Dar de Baja
              </button>
            </div>
          `;
          elAlerta.classList.remove('hidden');
        } else {
          elAlerta.classList.add('hidden');
        }
      }

      // Renderizar Gráficas del Dashboard
      this.renderGraficasDashboard(data.serie_ultimos_30_dias, data.horas_pico);

      // Renderizar Lista de Alertas de Vencimiento
      this.renderAlertasVencimiento(data.proximos_vencimientos);

    } catch (err) {
      console.error('Error al cargar métricas:', err);
    }
  },

  renderGraficasDashboard(serieIngresos, serieHoras) {
    // 1. Ingresos últimos 30 días
    const canvasIngresos = document.getElementById('chart-dashboard-ingresos');
    if (canvasIngresos) {
      const ctx = canvasIngresos.getContext('2d');
      if (this.chartIngresos30d) {
        this.chartIngresos30d.destroy();
        this.chartIngresos30d = null;
      }

      let labels = [];
      let dataVals = [];

      if (!serieIngresos || serieIngresos.length === 0) {
        labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
        dataVals = [0, 0, 0, 0];
      } else {
        labels = serieIngresos.map(s => {
          const p = s.fecha.split('-');
          return `${p[2]}/${p[1]}`;
        });
        dataVals = serieIngresos.map(s => s.ingresos);
      }

      const gradiente = ctx.createLinearGradient(0, 0, 0, 240);
      gradiente.addColorStop(0, 'rgba(45, 212, 191, 0.28)');
      gradiente.addColorStop(1, 'rgba(45, 212, 191, 0.00)');

      this.chartIngresos30d = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ingresos ($)',
            data: dataVals,
            borderColor: '#2DD4BF',
            backgroundColor: gradiente,
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2DD4BF',
            pointBorderColor: '#181A1D',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E2024',
              titleColor: '#F3F4F6',
              bodyColor: '#2DD4BF',
              borderColor: '#272A30',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (ctx) => ` Ingresos: ${App.formatoMoneda(ctx.parsed.y)}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: '#22252A', drawBorder: false },
              ticks: { color: '#6B7280', font: { size: 10 } }
            },
            y: {
              grid: { color: '#22252A', drawBorder: false },
              ticks: {
                color: '#6B7280',
                font: { size: 10 },
                callback: (v) => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'k' : '$' + v
              }
            }
          }
        }
      });
    }

    // 2. Horas pico de ventas
    const canvasHoras = document.getElementById('chart-dashboard-horas');
    if (canvasHoras) {
      const ctx = canvasHoras.getContext('2d');
      if (this.chartHorasPico) {
        this.chartHorasPico.destroy();
        this.chartHorasPico = null;
      }

      // Horas estándar comerciales 08h a 21h
      const horasEje = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
      const dataHoras = horasEje.map(h => {
        const item = (serieHoras || []).find(x => x.hora === h);
        return item ? item.transacciones : 0;
      });

      this.chartHorasPico = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: horasEje.map(h => `${String(h).padStart(2, '0')}h`),
          datasets: [{
            label: 'Transacciones',
            data: dataHoras,
            backgroundColor: '#10B981',
            borderRadius: 6,
            hoverBackgroundColor: '#2DD4BF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E2024',
              titleColor: '#F3F4F6',
              bodyColor: '#10B981',
              borderColor: '#272A30',
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (ctx) => ` Facturas: ${ctx.parsed.y}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#6B7280', font: { size: 9 } }
            },
            y: {
              grid: { color: '#22252A', drawBorder: false },
              ticks: { color: '#6B7280', font: { size: 10 }, stepSize: 1 }
            }
          }
        }
      });
    }
  },

  renderAlertasVencimiento(alertas) {
    const contenedor = document.getElementById('dashboard-lista-alertas');
    if (!contenedor) return;

    if (!alertas || alertas.length === 0) {
      contenedor.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 24px;">No hay alertas preventivas ni lotes próximos a caducar.</div>';
      return;
    }

    contenedor.innerHTML = alertas.map(item => {
      let badgeHtml = '';
      if (item.estado_alerta === 'CADUCADO') {
        badgeHtml = `<span class="badge" style="background: rgba(244,63,94,0.15); color: #F43F5E; border: 1px solid rgba(244,63,94,0.35); font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-circle-xmark"></i> CADUCADO (${Math.abs(item.dias_para_vencer)}d atrás)</span>`;
      } else if (item.estado_alerta === 'CRITICO') {
        badgeHtml = `<span class="badge" style="background: rgba(244,63,94,0.15); color: #F43F5E; border: 1px solid rgba(244,63,94,0.35); font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-triangle-exclamation"></i> CRÍTICO (${item.dias_para_vencer}d)</span>`;
      } else {
        badgeHtml = `<span class="badge" style="background: rgba(245,158,11,0.15); color: #F59E0B; border: 1px solid rgba(245,158,11,0.35); font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-clock"></i> PRÓXIMO (${item.dias_para_vencer}d)</span>`;
      }

      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #141619; border: 1px solid var(--border); border-radius: 10px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--warning);">
              <i class="fa-solid fa-box-open" style="font-size: 0.85rem;"></i>
            </div>
            <div>
              <strong style="color: #fff; font-size: 0.86rem;">${item.producto}</strong>
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 1px;">
                Lote: <code style="color: #2DD4BF;">${item.numero_lote}</code> &bull; Disp: <b style="color: #fff;">${item.cantidad_disponible} u.</b> &bull; Vence: ${item.fecha_vencimiento}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            ${badgeHtml}
            <button onclick="App.cambiarVista('semaforo')" class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.75rem;" title="Gestionar en Semáforo">
              Gestionar
            </button>
          </div>
        </div>
      `;
    }).join('');
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
