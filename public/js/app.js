/**
 * Núcleo de la Aplicación Cliente (SPA): Estado Global, Enrutador, RBAC y Cierre de Caja
 */
const App = {
  // Estado Global
  usuario: null,
  vistaActual: 'dashboard',
  arqueoDataActual: null,

  // Inicialización
  init() {
    this.cargarUsuario();
    this.configurarNavegacion();
  },

  // Gestión de Usuario, RBAC y Sesión
  cargarUsuario() {
    const usuarioGuardado = localStorage.getItem('pos_usuario');
    if (!usuarioGuardado) {
      // Redirigir a login si no hay sesión
      window.location.href = 'login.html';
      return;
    }

    try {
      this.usuario = JSON.parse(usuarioGuardado);
    } catch (e) {
      console.warn('Error al parsear usuario local:', e);
      window.location.href = 'login.html';
      return;
    }

    // Actualizar datos del usuario en la barra lateral
    const elNombre = document.getElementById('user-nombre');
    const elRol = document.getElementById('user-rol');
    const elAvatar = document.getElementById('user-avatar');

    if (elNombre) elNombre.textContent = this.usuario.nombre || 'Usuario';
    if (elRol) elRol.textContent = this.usuario.rol || 'Rol';
    if (elAvatar) {
      const iniciales = (this.usuario.nombre || 'US').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      elAvatar.textContent = iniciales || 'US';
    }

    // Aplicar Restricciones Visuales según Rol (RBAC)
    this.aplicarRBAC();

    // Redirección inicial según rol
    if (this.usuario.rol === 'Cajero') {
      this.cambiarVista('pos');
    } else {
      this.cambiarVista('dashboard');
    }
  },

  aplicarRBAC() {
    const esCajero = this.usuario && this.usuario.rol === 'Cajero';

    // Restringir botones del Sidebar
    document.querySelectorAll('.nav-btn[data-roles]').forEach(btn => {
      const rolesPermitidos = btn.getAttribute('data-roles').split(',');
      if (!rolesPermitidos.includes(this.usuario.rol)) {
        btn.style.display = 'none';
      } else {
        btn.style.display = 'flex';
      }
    });

    // Ocultar botón "+ Nuevo Producto" si es Cajero
    const btnNuevoProd = document.getElementById('btn-nuevo-producto');
    if (btnNuevoProd && esCajero) {
      btnNuevoProd.style.display = 'none';
    }
  },

  async cerrarSesion() {
    if (!confirm('¿Desea cerrar la sesión actual?')) return;

    try {
      if (this.usuario && this.usuario.id_sesion) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_sesion: this.usuario.id_sesion })
        });
      }
    } catch (err) {
      console.warn('Fallo al reportar logout al servidor:', err);
    } finally {
      localStorage.removeItem('pos_usuario');
      window.location.href = 'login.html';
    }
  },

  // Enrutamiento de Vistas
  configurarNavegacion() {
    const botonesNav = document.querySelectorAll('.nav-btn[data-vista]');
    botonesNav.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-vista');
        if (target) this.cambiarVista(target);
      });
    });
  },

  cambiarVista(vista) {
    if (vista === 'mermas') vista = 'novedades';

    // Protección RBAC estricta en el cambio de vista
    if (this.usuario && this.usuario.rol === 'Cajero') {
      if (vista !== 'pos' && vista !== 'novedades') {
        this.toast('Acceso restringido: El rol Cajero tiene acceso a Punto de Cobro, Devoluciones y Cierre de Caja.', 'warning');
        vista = 'pos';
      }
    }

    this.vistaActual = vista;

    // Actualizar botones del Sidebar
    document.querySelectorAll('.nav-btn[data-vista]').forEach(btn => {
      const targetVista = btn.getAttribute('data-vista');
      const coincide = targetVista === vista || (targetVista === 'mermas' && vista === 'novedades');
      btn.classList.toggle('active', coincide);
    });

    // Ocultar todas las secciones
    const secciones = ['dashboard', 'pos', 'semaforo', 'kardex', 'compras', 'novedades', 'devoluciones'];
    secciones.forEach(s => {
      const el = document.getElementById(`vista-${s}`);
      if (el) el.classList.add('hidden');
    });

    // Mostrar sección activa
    const activa = document.getElementById(`vista-${vista}`) || 
      (vista === 'novedades' || vista === 'devoluciones' ? (document.getElementById('vista-devoluciones') || document.getElementById('vista-novedades')) : null);
    if (activa) activa.classList.remove('hidden');

    // Títulos dinámicos de cabecera en lenguaje de negocio
    const titulos = {
      dashboard: { titulo: 'Resumen General del Negocio', subtitulo: 'Métricas de Ventas, Inventario y Productos' },
      pos: { titulo: 'Punto de Cobro & Facturación', subtitulo: 'Control de ventas, despacho de inventario y facturación' },
      semaforo: { titulo: 'Control de Vencimientos', subtitulo: 'Gestión preventiva de fechas de caducidad y descarte de productos' },
      kardex: { titulo: 'Movimientos de Inventario', subtitulo: 'Historial de entradas por compra, ventas y salidas por caducidad' },
      compras: { titulo: 'Recepción de Mercancía', subtitulo: 'Ingreso formal de productos con asignación de lote y costo' },
      novedades: { titulo: 'Devoluciones y Averías', subtitulo: 'Control de reingresos, bajas por caducidad y pérdidas en mercancía' },
      devoluciones: { titulo: 'Devoluciones y Averías', subtitulo: 'Control de reingresos, bajas por caducidad y pérdidas en mercancía' }
    };

    const headerTit = document.getElementById('titulo-seccion');
    const headerSub = document.getElementById('subtitulo-seccion');
    if (headerTit && titulos[vista]) headerTit.textContent = titulos[vista].titulo;
    if (headerSub && titulos[vista]) headerSub.textContent = titulos[vista].subtitulo;

    // Carga de datos específica según vista
    if (vista === 'dashboard' && window.DashboardView) DashboardView.cargar();
    if (vista === 'pos' && window.PosView) PosView.cargar();
    if (vista === 'semaforo' && window.SemaforoView) SemaforoView.cargar();
    if (vista === 'kardex') {
      if (typeof cargarKardex === 'function') cargarKardex();
      else if (window.KardexView) KardexView.cargar();
    }
    if (vista === 'compras' && window.ComprasView) ComprasView.cargar();
    if (vista === 'novedades' || vista === 'devoluciones') {
      if (typeof cargarNovedades === 'function') cargarNovedades();
      else if (window.NovedadesView) NovedadesView.cargar();
    }
  },

  // Recarga global de datos
  recargarTodo() {
    this.cambiarVista(this.vistaActual);
    this.toast('Datos actualizados desde el servidor', 'info');
  },

  // Formateadores
  formatoMoneda(valor) {
    const num = Number(valor) || 0;
    return '$ ' + num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  formatoFecha(fechaStr) {
    if (!fechaStr) return 'N/A';
    return String(fechaStr).replace('T', ' ').slice(0, 19);
  },

  // Sistema de Notificaciones Toast
  toast(mensaje, tipo = 'info') {
    const contenedor = document.getElementById('toast-container');
    if (!contenedor) return;

    const t = document.createElement('div');
    t.className = `toast toast-${tipo}`;

    const iconos = {
      success: 'fa-circle-check',
      danger: 'fa-circle-xmark',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };

    t.innerHTML = `
      <i class="fa-solid ${iconos[tipo] || 'fa-bell'}" style="font-size: 1.1rem;"></i>
      <span style="flex: 1; line-height: 1.3;">${mensaje}</span>
    `;

    contenedor.appendChild(t);

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(40px)';
      t.style.transition = 'all 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, 4500);
  },

  // ================= CIERRE Y CUADRE DE CAJA =================
  async abrirArqueoCaja() {
    if (!this.usuario) return;

    try {
      const res = await fetch(`/api/reportes/arqueo/${this.usuario.id_usuario}`);
      const data = await res.json();
      this.arqueoDataActual = data;

      const elModal = document.getElementById('modal-arqueo');
      const elBody = document.getElementById('arqueo-body');
      if (!elModal || !elBody) return;

      const totalEfectivo = data.resumen.total_efectivo || 0;
      const totalTarjeta = data.resumen.total_tarjeta || 0;
      const totalTransferencia = data.resumen.total_transferencia || 0;

      elBody.innerHTML = `
        <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid var(--border); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">Responsable del Turno:</div>
            <strong style="font-size: 1rem; color: #fff;">${data.usuario.nombre_completo}</strong>
            <span class="badge ${data.usuario.nombre_rol === 'Administrador' ? 'badge-info' : 'badge-success'}" style="margin-left: 8px;">
              ${data.usuario.nombre_rol}
            </span>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 0.75rem; color: var(--text-muted);">Fecha de Corte:</div>
            <div style="font-size: 0.9rem; font-family: monospace; font-weight: bold; color: var(--primary);">${data.fecha}</div>
          </div>
        </div>

        <!-- Tarjetas Resumen de Ventas del Turno -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div style="background: var(--bg-main); padding: 14px; border-radius: 10px; border: 1px solid var(--border);">
            <div style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase;">Facturas Emitidas Hoy</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-top: 4px;">${data.resumen.total_ventas_dia}</div>
          </div>
          <div style="background: var(--bg-main); padding: 14px; border-radius: 10px; border: 1px solid var(--border);">
            <div style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase;">Total General Recaudado</div>
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--success); margin-top: 4px;">${App.formatoMoneda(data.resumen.gran_total)}</div>
          </div>
        </div>

        <!-- Discriminación Agrupada por Métodos de Pago -->
        <div style="background: var(--bg-main); border: 1px solid var(--border); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
          <h4 style="font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; font-weight: 700;">
            <i class="fa-solid fa-list-check" style="color: var(--primary);"></i> Desglose por Medio de Pago
          </h4>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                <i class="fa-solid fa-money-bill-wave" style="color: var(--success);"></i> Total Efectivo:
              </span>
              <strong style="font-size: 1.1rem; color: var(--success); font-family: monospace;">${App.formatoMoneda(totalEfectivo)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border);">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                <i class="fa-solid fa-credit-card" style="color: #38bdf8;"></i> Total Tarjeta:
              </span>
              <strong style="font-size: 1.1rem; color: #38bdf8; font-family: monospace;">${App.formatoMoneda(totalTarjeta)}</strong>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                <i class="fa-solid fa-mobile-screen" style="color: #c084fc;"></i> Total Transferencia:
              </span>
              <strong style="font-size: 1.1rem; color: #c084fc; font-family: monospace;">${App.formatoMoneda(totalTransferencia)}</strong>
            </div>
          </div>
        </div>

        <!-- Módulo de Cuadre de Caja -->
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 16px;">
          <h4 style="font-size: 0.85rem; color: var(--warning); text-transform: uppercase; margin-bottom: 10px; font-weight: 700;">
            <i class="fa-solid fa-calculator"></i> Verificación y Cuadre de Dinero Físico
          </h4>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items: center;">
            <div>
              <label style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 4px;">
                Efectivo Contado en Caja ($):
              </label>
              <input type="number" id="arqueo-fisico" step="0.01" class="input-field" placeholder="Monto contado físicamente" oninput="App.calcularCuadreCaja()">
            </div>
            <div>
              <label style="font-size: 0.76rem; color: var(--text-muted); display: block; margin-bottom: 4px;">
                Efectivo Esperado en Sistema:
              </label>
              <div style="font-size: 1.15rem; font-weight: 800; color: #fff; font-family: monospace;">
                ${App.formatoMoneda(totalEfectivo)}
              </div>
            </div>
          </div>

          <div id="arqueo-resultado-cuadre" style="margin-top: 14px; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; text-align: center; background: rgba(0,0,0,0.3); color: var(--text-muted);">
            Ingrese el dinero contado para validar el cuadre de caja
          </div>
        </div>
      `;

      elModal.classList.remove('hidden');
    } catch (err) {
      this.toast('Error al consultar cuadre de caja: ' + err.message, 'danger');
    }
  },

  calcularCuadreCaja() {
    if (!this.arqueoDataActual) return;
    const inputFisico = document.getElementById('arqueo-fisico');
    const elRes = document.getElementById('arqueo-resultado-cuadre');
    if (!inputFisico || !elRes) return;

    const fisico = parseFloat(inputFisico.value);
    if (isNaN(fisico)) {
      elRes.style.background = 'rgba(0,0,0,0.3)';
      elRes.style.color = 'var(--text-muted)';
      elRes.innerHTML = 'Ingrese el dinero contado para validar el cuadre de caja';
      return;
    }

    const esperado = Number(this.arqueoDataActual.resumen.total_efectivo || 0);
    const diferencia = fisico - esperado;

    if (Math.abs(diferencia) < 0.01) {
      elRes.style.background = 'rgba(16, 185, 129, 0.2)';
      elRes.style.color = 'var(--success)';
      elRes.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡CUADRE EXACTO! El dinero físico coincide al 100% con el sistema.';
    } else if (diferencia > 0) {
      elRes.style.background = 'rgba(56, 189, 248, 0.2)';
      elRes.style.color = '#38bdf8';
      elRes.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> SOBRANTE EN CAJA: +${App.formatoMoneda(diferencia)}`;
    } else {
      elRes.style.background = 'rgba(239, 68, 68, 0.2)';
      elRes.style.color = 'var(--danger)';
      elRes.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> FALTANTE EN CAJA: -${App.formatoMoneda(Math.abs(diferencia))}`;
    }
  },

  cerrarArqueoCaja() {
    const elModal = document.getElementById('modal-arqueo');
    if (elModal) elModal.classList.add('hidden');
  },

  // ================= IMPRESIÓN TÉRMICA DE CORTE DE CAJA =================
  imprimirArqueo() {
    if (!this.arqueoDataActual) {
      this.toast('No hay datos de arqueo para imprimir.', 'warning');
      return;
    }

    const data = this.arqueoDataActual;
    const inputFisico = document.getElementById('arqueo-fisico');
    const fisico = parseFloat(inputFisico?.value);
    const esperado = Number(data.resumen.total_efectivo || 0);

    let lineaCuadre = 'NO REGISTRADO';
    let fisicoStr = 'NO INGRESADO';
    if (!isNaN(fisico)) {
      const dif = fisico - esperado;
      if (Math.abs(dif) < 0.01) {
        lineaCuadre = 'EXACTO (0.00)';
      } else if (dif > 0) {
        lineaCuadre = `SOBRANTE (+${App.formatoMoneda(dif)})`;
      } else {
        lineaCuadre = `FALTANTE (-${App.formatoMoneda(Math.abs(dif))})`;
      }
      fisicoStr = App.formatoMoneda(fisico);
    }

    const fechaHora = new Date().toLocaleString('es-CO');
    const lineSep = '------------------------------------------';

    const ticketDiv = document.getElementById('ticket-arqueo-impresion');
    if (!ticketDiv) return;

    ticketDiv.innerHTML = `
      <div style="text-align: center; font-weight: bold; font-size: 13px;">
        SISTEMA DE GESTIÓN COMERCIAL
      </div>
      <div style="text-align: center; font-size: 10px; margin-bottom: 4px;">
        Control de Inventarios & Facturación
      </div>
      <div style="text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 6px;">
        COMPROBANTE DE CIERRE Y ARQUEO DE CAJA
      </div>

      <div style="margin-bottom: 4px;">${lineSep}</div>

      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>FECHA / HORA:</span>
        <span>${fechaHora}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>RESPONSABLE:</span>
        <span>${data.usuario.nombre_completo}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>ROL / CARGO:</span>
        <span>${data.usuario.nombre_rol}</span>
      </div>

      <div style="margin: 4px 0;">${lineSep}</div>

      <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">RESUMEN DE OPERACIÓN DEL TURNO:</div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Facturas Emitidas Hoy:</span>
        <strong>${data.resumen.total_ventas_dia}</strong>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Base Imponible:</span>
        <span>${App.formatoMoneda(data.resumen.gran_subtotal)}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Total IVA Recaudado:</span>
        <span>${App.formatoMoneda(data.resumen.gran_iva)}</span>
      </div>
      <div style="font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 4px;">
        <span>GRAN TOTAL RECAUDADO:</span>
        <span>${App.formatoMoneda(data.resumen.gran_total)}</span>
      </div>

      <div style="margin: 4px 0;">${lineSep}</div>

      <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">DESGLOSE POR MEDIO DE PAGO:</div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Total Efectivo:</span>
        <span>${App.formatoMoneda(data.resumen.total_efectivo)}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Total Tarjeta:</span>
        <span>${App.formatoMoneda(data.resumen.total_tarjeta)}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Total Transferencia:</span>
        <span>${App.formatoMoneda(data.resumen.total_transferencia)}</span>
      </div>

      <div style="margin: 4px 0;">${lineSep}</div>

      <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">VERIFICACIÓN Y CUADRE DE CAJA:</div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Efectivo en Sistema:</span>
        <span>${App.formatoMoneda(esperado)}</span>
      </div>
      <div style="font-size: 10px; display: flex; justify-content: space-between;">
        <span>Efectivo Contado Físico:</span>
        <span>${fisicoStr}</span>
      </div>
      <div style="font-size: 11px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 4px;">
        <span>ESTADO DEL CUADRE:</span>
        <span>${lineaCuadre}</span>
      </div>

      <div style="margin: 6px 0;">${lineSep}</div>

      <div style="margin-top: 30px; display: flex; justify-content: space-between; gap: 12px; text-align: center; font-size: 9px;">
        <div style="flex: 1; border-top: 1px solid #000; padding-top: 4px;">
          FIRMA CAJERO<br>
          <span style="font-size: 8px; color: #444;">${data.usuario.nombre_completo}</span>
        </div>
        <div style="flex: 1; border-top: 1px solid #000; padding-top: 4px;">
          FIRMA SUPERVISOR<br>
          <span style="font-size: 8px; color: #444;">ADMINISTRADOR</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 8px; color: #666; margin-top: 14px;">
        *** COMPROBANTE DE CONTROL FISCAL Y ARQUEO DIARIO ***<br>
        Documento interno de auditoría y tesorería comercial
      </div>
    `;

    document.body.classList.add('imprimiendo-arqueo');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimiendo-arqueo');
    }, 1200);
  }
};

window.addEventListener('DOMContentLoaded', () => App.init());
