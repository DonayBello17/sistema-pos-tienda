/**
 * Módulo de Vista: Reportes Gerenciales Ejecutivos
 * Análisis Financiero, Rentabilidad PEPS, Serie Diaria con Chart.js y Exportación
 */
const ReportesView = {
  rangoDias: 30,
  fechaDesde: '',
  fechaHasta: '',
  chartDiario: null,
  datosActuales: null,

  async cargar() {
    this.inicializarFechas();
    await this.consultarDatos();
  },

  inicializarFechas() {
    if (!this.fechaHasta || !this.fechaDesde) {
      const hoy = new Date();
      this.fechaHasta = hoy.toISOString().slice(0, 10);
      const pasado = new Date();
      pasado.setDate(pasado.getDate() - this.rangoDias);
      this.fechaDesde = pasado.toISOString().slice(0, 10);
    }

    const inputDesde = document.getElementById('reportes-fecha-desde');
    const inputHasta = document.getElementById('reportes-fecha-hasta');
    if (inputDesde) inputDesde.value = this.fechaDesde;
    if (inputHasta) inputHasta.value = this.fechaHasta;

    const elPeriodo = document.getElementById('reportes-rango-subtitulo');
    if (elPeriodo) {
      elPeriodo.textContent = `Periodo analizado: ${this.formatearFechaCorta(this.fechaDesde)} - ${this.formatearFechaCorta(this.fechaHasta)}`;
    }
  },

  formatearFechaCorta(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length < 3) return fechaStr;
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const idx = parseInt(partes[1], 10) - 1;
    return `${partes[2]} ${meses[idx] || partes[1]} ${partes[0]}`;
  },

  async consultarDatos() {
    try {
      const url = `/api/reportes/gerenciales?desde=${encodeURIComponent(this.fechaDesde)}&hasta=${encodeURIComponent(this.fechaHasta)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al obtener datos del reporte');
      }

      this.datosActuales = data;
      this.renderKPIs(data.kpis);
      this.renderGraficaDiaria(data.serie_diaria);
      this.renderMetodosPago(data.por_metodo_pago, data.kpis.total_ingresos);
      this.renderTopProductos(data.top_productos);
    } catch (err) {
      console.error('Error cargando reportes gerenciales:', err);
      if (window.App && typeof App.toast === 'function') {
        App.toast(err.message, 'danger');
      }
    }
  },

  renderKPIs(kpis) {
    if (!kpis) return;

    const elIngresos = document.getElementById('rep-kpi-ingresos');
    const elVentas = document.getElementById('rep-kpi-ventas');
    const elUtilidad = document.getElementById('rep-kpi-utilidad');
    const elTicket = document.getElementById('rep-kpi-ticket');
    const elMermas = document.getElementById('rep-kpi-mermas');
    const elUnidades = document.getElementById('rep-kpi-unidades');

    if (elIngresos) elIngresos.textContent = App.formatoMoneda(kpis.total_ingresos || 0);
    if (elVentas) elVentas.textContent = `${kpis.cantidad_ventas || 0} transacciones`;
    if (elUtilidad) {
      const val = Number(kpis.utilidad_neta_peps || 0);
      const signo = val >= 0 ? '+' : '';
      elUtilidad.textContent = `${signo}${App.formatoMoneda(val)}`;
      elUtilidad.style.color = val >= 0 ? '#2DD4BF' : '#F43F5E';
    }
    if (elTicket) elTicket.textContent = App.formatoMoneda(kpis.ticket_promedio || 0);
    if (elMermas) elMermas.textContent = App.formatoMoneda(kpis.total_mermas || 0);
    if (elUnidades) elUnidades.textContent = `${(kpis.unidades_vendidas || 0).toLocaleString('es-CO')} u.`;
  },

  renderGraficaDiaria(serie) {
    const canvas = document.getElementById('chart-reportes-diario');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destruir instancia previa de Chart.js si existe
    if (this.chartDiario) {
      this.chartDiario.destroy();
      this.chartDiario = null;
    }

    let labels = [];
    let dataIngresos = [];
    let dataUtilidad = [];

    if (!serie || serie.length === 0) {
      // Estado sin datos para el periodo
      labels = [this.fechaDesde, this.fechaHasta];
      dataIngresos = [0, 0];
      dataUtilidad = [0, 0];
    } else {
      labels = serie.map(item => this.formatearFechaCorta(item.fecha));
      dataIngresos = serie.map(item => item.ingresos);
      dataUtilidad = serie.map(item => item.utilidad);
    }

    // Crear gradiente turquesa para el área de ingresos
    const gradiente = ctx.createLinearGradient(0, 0, 0, 300);
    gradiente.addColorStop(0, 'rgba(45, 212, 191, 0.28)');
    gradiente.addColorStop(1, 'rgba(45, 212, 191, 0.00)');

    this.chartDiario = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos Totales',
            data: dataIngresos,
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
          },
          {
            label: 'Utilidad Real PEPS',
            data: dataUtilidad,
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#181A1D',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              color: '#9CA3AF',
              font: { size: 11, weight: '600' }
            }
          },
          tooltip: {
            backgroundColor: '#1E2024',
            titleColor: '#F3F4F6',
            bodyColor: '#E5E7EB',
            borderColor: '#272A30',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${App.formatoMoneda(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: '#22252A',
              drawBorder: false
            },
            ticks: {
              color: '#6B7280',
              font: { size: 10 },
              maxRotation: 0
            }
          },
          y: {
            grid: {
              color: '#22252A',
              drawBorder: false
            },
            ticks: {
              color: '#6B7280',
              font: { size: 10 },
              callback: function(value) {
                if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                return '$' + value;
              }
            }
          }
        }
      }
    });
  },

  renderMetodosPago(metodos, totalIngresos) {
    const contenedor = document.getElementById('rep-metodos-pago-container');
    if (!contenedor) return;

    if (!metodos || metodos.length === 0) {
      contenedor.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 30px 0; font-size: 0.85rem;">No hay transacciones en el periodo.</div>';
      return;
    }

    const iconos = {
      Efectivo: 'fa-money-bill-wave',
      Tarjeta: 'fa-credit-card',
      Transferencia: 'fa-mobile-screen'
    };

    const colores = {
      Efectivo: '#10B981',
      Tarjeta: '#38BDF8',
      Transferencia: '#A78BFA'
    };

    contenedor.innerHTML = metodos.map(m => {
      const icono = iconos[m.metodo_pago] || 'fa-wallet';
      const color = colores[m.metodo_pago] || '#2DD4BF';
      const porcentaje = m.porcentaje || 0;

      return `
        <div style="margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 26px; height: 26px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 0.75rem;">
                <i class="fa-solid ${icono}"></i>
              </div>
              <strong style="color: #fff;">${m.metodo_pago}</strong>
              <span style="color: var(--text-dim); font-size: 0.72rem;">(${m.transacciones} ops)</span>
            </div>
            <div style="text-align: right;">
              <span style="font-weight: 700; color: #fff;">${App.formatoMoneda(m.total)}</span>
              <span style="color: ${color}; font-size: 0.74rem; font-weight: 700; margin-left: 6px;">${porcentaje}%</span>
            </div>
          </div>
          <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 999px; overflow: hidden;">
            <div style="width: ${porcentaje}%; height: 100%; background: ${color}; border-radius: 999px; transition: width 0.6s ease;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTopProductos(productos) {
    const tbody = document.getElementById('rep-top-productos-body');
    if (!tbody) return;

    if (!productos || productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 30px;">No se registraron ventas de productos en este rango de fechas.</td></tr>';
      return;
    }

    tbody.innerHTML = productos.map((p, idx) => {
      let badgeRankClass = 'background: rgba(255,255,255,0.05); color: var(--text-muted);';
      if (idx === 0) badgeRankClass = 'background: rgba(245, 158, 11, 0.18); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.35); font-weight: 800;';
      else if (idx === 1) badgeRankClass = 'background: rgba(203, 213, 225, 0.15); color: #E2E8F0; border: 1px solid rgba(203, 213, 225, 0.3); font-weight: 800;';
      else if (idx === 2) badgeRankClass = 'background: rgba(217, 119, 6, 0.15); color: #FBBF24; border: 1px solid rgba(217, 119, 6, 0.3); font-weight: 800;';

      return `
        <tr>
          <td style="text-align: center; width: 38px;">
            <span style="display: inline-flex; width: 22px; height: 22px; border-radius: 50%; align-items: center; justify-content: center; font-size: 0.70rem; ${badgeRankClass}">
              #${idx + 1}
            </span>
          </td>
          <td>
            <strong style="color: #fff; font-size: 0.80rem;">${p.nombre}</strong>
          </td>
          <td>
            <code style="color: #2DD4BF; font-size: 0.72rem; font-weight: 600;">${p.codigo_barras}</code>
          </td>
          <td style="text-align: right; font-weight: 700; color: #fff; white-space: nowrap;">
            ${p.unidades_vendidas.toLocaleString('es-CO')} u.
          </td>
          <td style="text-align: right; font-weight: 600; color: #E5E7EB; white-space: nowrap;">
            ${App.formatoMoneda(p.ingresos_totales)}
          </td>
          <td style="text-align: right; color: var(--text-dim); font-size: 0.78rem; white-space: nowrap;">
            ${App.formatoMoneda(p.costo_peps)}
          </td>
          <td style="text-align: right; font-weight: 800; color: #2DD4BF; white-space: nowrap;">
            +${App.formatoMoneda(p.utilidad_peps)}
          </td>
          <td style="text-align: center; white-space: nowrap;">
            <span class="badge" style="background: rgba(45, 212, 191, 0.12); color: #2DD4BF; border: 1px solid rgba(45, 212, 191, 0.3); font-weight: 700; font-size: 0.68rem; padding: 2px 6px;">
              ${p.margen_promedio}%
            </span>
          </td>
        </tr>
      `;
    }).join('');
  },

  filtrarRangoRapido(dias) {
    this.rangoDias = dias;
    const hoy = new Date();
    this.fechaHasta = hoy.toISOString().slice(0, 10);
    const pasado = new Date();
    pasado.setDate(pasado.getDate() - dias);
    this.fechaDesde = pasado.toISOString().slice(0, 10);

    // Actualizar botones píldora
    ['7', '30', '90'].forEach(d => {
      const btn = document.getElementById(`btn-filtro-${d}d`);
      if (btn) {
        if (parseInt(d, 10) === dias) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    this.inicializarFechas();
    this.consultarDatos();
  },

  aplicarFiltrosManuales() {
    const inputDesde = document.getElementById('reportes-fecha-desde');
    const inputHasta = document.getElementById('reportes-fecha-hasta');

    if (!inputDesde || !inputHasta || !inputDesde.value || !inputHasta.value) {
      App.toast('Por favor ingrese fechas válidas.', 'warning');
      return;
    }

    if (inputDesde.value > inputHasta.value) {
      App.toast('La fecha de inicio no puede ser posterior a la fecha final.', 'warning');
      return;
    }

    this.fechaDesde = inputDesde.value;
    this.fechaHasta = inputHasta.value;

    // Desmarcar botones de rango predefinido si es personalizado
    ['7', '30', '90'].forEach(d => {
      const btn = document.getElementById(`btn-filtro-${d}d`);
      if (btn) btn.classList.remove('active');
    });

    const elPeriodo = document.getElementById('reportes-rango-subtitulo');
    if (elPeriodo) {
      elPeriodo.textContent = `Periodo analizado: ${this.formatearFechaCorta(this.fechaDesde)} - ${this.formatearFechaCorta(this.fechaHasta)}`;
    }

    this.consultarDatos();
    App.toast('Filtros de reporte aplicados', 'info');
  },

  exportarExcel() {
    if (!this.datosActuales) {
      App.toast('No hay datos disponibles para exportar', 'warning');
      return;
    }

    if (typeof XLSX === 'undefined') {
      App.toast('La librería SheetJS (XLSX) no está cargada. Verifique su conexión.', 'danger');
      return;
    }

    try {
      const { periodo, kpis, por_metodo_pago, top_productos } = this.datosActuales;
      const wb = XLSX.utils.book_new();

      // ================= HOJA 1: RESUMEN EJECUTIVO =================
      const resumenData = [
        ['SISTEMA DE GESTIÓN COMERCIAL & INVENTARIO PEPS'],
        ['REPORTE GERENCIAL EJECUTIVO'],
        ['Periodo Analizado:', `${periodo.desde} al ${periodo.hasta}`],
        ['Fecha de Generación:', new Date().toLocaleString('es-CO')],
        [],
        ['INDICADORES CLAVE (KPIS)', 'VALOR', 'DETALLE'],
        ['Total Vendido (Ingresos Base + IVA)', Number(kpis.total_ingresos || 0), 'Facturación bruta acumulada'],
        ['Transacciones Realizadas', Number(kpis.cantidad_ventas || 0), 'Número de facturas emitidas'],
        ['Utilidad Real PEPS', Number(kpis.utilidad_neta_peps || 0), 'Ganancia real descontando costo PEPS'],
        ['Ticket Promedio', Number(kpis.ticket_promedio || 0), 'Promedio cobrado por transacción'],
        ['Unidades Vendidas', Number(kpis.unidades_vendidas || 0), 'Volumen físico de unidades vendidas'],
        ['Pérdidas por Mermas / Bajas', Number(kpis.total_mermas || 0), 'Costo total de bajas por caducidad o avería'],
        [],
        ['DISTRIBUCIÓN POR MEDIO DE PAGO', 'TRANSACCIONES', 'TOTAL RECAUDADO', 'PARTICIPACIÓN %']
      ];

      (por_metodo_pago || []).forEach(m => {
        resumenData.push([
          m.metodo_pago,
          m.transacciones,
          Number(m.total || 0),
          `${m.porcentaje}%`
        ]);
      });

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      wsResumen['!cols'] = [
        { wch: 38 },
        { wch: 22 },
        { wch: 32 },
        { wch: 18 }
      ];
      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

      // ================= HOJA 2: RENTABILIDAD POR PRODUCTO =================
      const prodHeaders = [
        'Posición',
        'Producto',
        'Código de Barras',
        'Unidades Vendidas',
        'Ingresos Totales',
        'Costo PEPS',
        'Utilidad PEPS',
        '% Margen'
      ];

      const prodRows = (top_productos || []).map(p => [
        p.posicion || 0,
        p.nombre || '',
        p.codigo_barras || '',
        Number(p.unidades_vendidas || 0),
        Number(p.ingresos_totales || 0),
        Number(p.costo_peps || 0),
        Number(p.utilidad_peps || 0),
        `${p.margen_promedio || 0}%`
      ]);

      const wsProductos = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
      wsProductos['!cols'] = [
        { wch: 10 },
        { wch: 36 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 }
      ];
      XLSX.utils.book_append_sheet(wb, wsProductos, 'Rentabilidad por Producto');

      // Descarga de archivo XLSX
      const nombreArchivo = `Reporte_Gerencial_${periodo.desde}_al_${periodo.hasta}.xlsx`;
      XLSX.writeFile(wb, nombreArchivo);
      App.toast('Reporte Excel (.xlsx) generado exitosamente', 'success');
    } catch (err) {
      console.error('Error generando Excel:', err);
      App.toast('Error al exportar Excel: ' + err.message, 'danger');
    }
  },

  exportarPDF() {
    if (!this.datosActuales) {
      App.toast('No hay datos disponibles para exportar', 'warning');
      return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
      App.toast('La librería jsPDF no está cargada. Verifique su conexión.', 'danger');
      return;
    }

    try {
      const { periodo, kpis, por_metodo_pago, top_productos } = this.datosActuales;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Encabezado Corporativo Limpio (Fondo blanco de papel)
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('SISTEMA DE GESTIÓN COMERCIAL & INVENTARIO PEPS', 14, 16);

      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Reporte Gerencial Ejecutivo | Periodo: ${periodo.desde} al ${periodo.hasta}`, 14, 22);

      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Fecha y hora de emisión: ${new Date().toLocaleString('es-CO')}`, 14, 27);

      // Línea divisoria decorativa
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, 29, 196, 29);

      // ================= TABLA 1: KPIS FINANCIEROS =================
      doc.autoTable({
        startY: 33,
        head: [['Indicador Clave (KPI)', 'Valor Registrado', 'Descripción / Detalle']],
        body: [
          ['Total Vendido (Ingresos)', App.formatoMoneda(kpis.total_ingresos || 0), 'Venta bruta acumulada'],
          ['Transacciones Realizadas', `${kpis.cantidad_ventas || 0} facturas`, 'Total de facturas emitidas'],
          ['Utilidad Real PEPS', App.formatoMoneda(kpis.utilidad_neta_peps || 0), 'Margen neto descontando costo de lotes PEPS'],
          ['Ticket Promedio', App.formatoMoneda(kpis.ticket_promedio || 0), 'Valor promedio recaudado por factura'],
          ['Unidades Vendidas', `${(kpis.unidades_vendidas || 0).toLocaleString('es-CO')} u.`, 'Volumen total comercializado'],
          ['Pérdidas por Mermas / Bajas', App.formatoMoneda(kpis.total_mermas || 0), 'Descartes registrados por caducidad o daño']
        ],
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 2.8, lineColor: [226, 232, 240], lineWidth: 0.1 },
        margin: { left: 14, right: 14 }
      });

      // ================= TABLA 2: MEDIOS DE PAGO =================
      const startY2 = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Distribución de Ingresos por Medio de Pago', 14, startY2 - 2);

      doc.autoTable({
        startY: startY2,
        head: [['Medio de Pago', 'Transacciones', 'Total Recaudado', 'Participación %']],
        body: (por_metodo_pago || []).map(m => [
          m.metodo_pago,
          `${m.transacciones} ops`,
          App.formatoMoneda(m.total),
          `${m.porcentaje}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 2.8, lineColor: [226, 232, 240], lineWidth: 0.1 },
        margin: { left: 14, right: 14 }
      });

      // ================= TABLA 3: TOP PRODUCTOS & PEPS =================
      const startY3 = doc.lastAutoTable.finalY + 8;
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text('Ranking de Productos & Rentabilidad PEPS', 14, startY3 - 2);

      doc.autoTable({
        startY: startY3,
        head: [['#', 'Producto', 'Código', 'Cant.', 'Ingresos', 'Costo PEPS', 'Utilidad Real', 'Margen %']],
        body: (top_productos || []).map((p, idx) => [
          idx + 1,
          p.nombre,
          p.codigo_barras,
          `${p.unidades_vendidas} u.`,
          App.formatoMoneda(p.ingresos_totales),
          App.formatoMoneda(p.costo_peps),
          `+${App.formatoMoneda(p.utilidad_peps)}`,
          `${p.margen_promedio}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: [15, 23, 42] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { cellPadding: 2.2, lineColor: [226, 232, 240], lineWidth: 0.1 },
        margin: { left: 14, right: 14 }
      });

      const nombrePDF = `Reporte_Gerencial_${periodo.desde}_al_${periodo.hasta}.pdf`;
      doc.save(nombrePDF);
      App.toast('Reporte PDF descargado exitosamente', 'success');
    } catch (err) {
      console.error('Error generando PDF:', err);
      App.toast('Error al exportar PDF: ' + err.message, 'danger');
    }
  },

  exportarReporte() {
    this.exportarExcel();
  }
};

window.ReportesView = ReportesView;
