const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'docs_assets');
const img1Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama1_casos_uso.png')).toString('base64');
const img2Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama2_arquitectura.png')).toString('base64');
const img3Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama3_flujo_peps.png')).toString('base64');
const screen1Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_01_login.png')).toString('base64');
const screen2Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_02_dashboard.png')).toString('base64');
const screen3Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_03_pos_bloqueo.png')).toString('base64');
const screen4Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_04_recepcion_mercancia.png')).toString('base64');
const screen5Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_05_kardex_peps.png')).toString('base64');
const screen6Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_06_semaforo_vencimientos.png')).toString('base64');
const screen7Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_07_cierre_caja.png')).toString('base64');
const screen8Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_08_reportes_gerenciales.png')).toString('base64');
const screen9Base64 = fs.readFileSync(path.join(ASSETS_DIR, 'screen_09_factura_publica.png')).toString('base64');

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Documentación Técnica: Sistema POS &amp; Inventarios PEPS</title>
  <style>
    @page {
      size: letter;
      margin: 16mm 16mm 16mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background-color: #FFFFFF;
      font-size: 10.5pt;
      line-height: 1.55;
    }

    .page-break {
      page-break-before: always;
    }

    /* PORTADA */
    .cover-container {
      padding: 40px 20px 20px;
      text-align: center;
    }

    .cover-badge {
      display: inline-block;
      background: #F0FDFA;
      color: #0D9488;
      border: 1px solid #99F6E4;
      font-size: 9pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 20px;
    }

    .cover-title {
      font-size: 24pt;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.25;
      margin-bottom: 14px;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #0D9488;
      font-weight: 700;
      margin-bottom: 30px;
    }

    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 9.5pt;
    }

    .meta-table th {
      background-color: #1E293B;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 12px;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
    }

    .meta-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #E2E8F0;
      color: #334155;
    }

    .meta-table tr:nth-child(even) td {
      background-color: #F8FAFC;
    }

    .meta-label {
      font-weight: 700;
      color: #0F172A;
      width: 32%;
    }

    .url-highlight {
      color: #2563EB;
      font-weight: 700;
      text-decoration: underline;
    }

    /* ENCABEZADOS DE SECCIÓN */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #0F172A;
      border-bottom: 2px solid #0D9488;
      padding-bottom: 5px;
      margin-top: 26px;
      margin-bottom: 14px;
    }

    h2 {
      font-size: 13pt;
      font-weight: 700;
      color: #1E293B;
      margin-top: 18px;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #0F766E;
      margin-top: 14px;
      margin-bottom: 6px;
    }

    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 12px;
    }

    li {
      margin-bottom: 4px;
    }

    code {
      font-family: 'Consolas', 'Courier New', monospace;
      background: #F1F5F9;
      color: #0F172A;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9.5pt;
      border: 1px solid #E2E8F0;
    }

    /* BLOQUES DESTACADOS / CALLOUT */
    .callout {
      margin: 14px 0;
      padding: 12px 16px;
      border-radius: 8px;
      background-color: #F0FDFA;
      border-left: 4px solid #0D9488;
      font-size: 9.5pt;
      line-height: 1.5;
    }

    .callout-blue {
      background-color: #F0F9FF;
      border-left-color: #0284C7;
    }

    .callout-green {
      background-color: #F0FDF4;
      border-left-color: #16A34A;
    }

    .callout-amber {
      background-color: #FFFBEB;
      border-left-color: #D97706;
    }

    .callout-title {
      font-weight: 800;
      font-size: 10.5pt;
      margin-bottom: 4px;
      text-transform: uppercase;
    }

    /* TABLAS ESTILIZADAS */
    .styled-table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      font-size: 9pt;
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
    }

    .styled-table thead tr {
      background-color: #1E293B;
      color: #FFFFFF;
    }

    .styled-table th {
      padding: 8px 10px;
      font-weight: 700;
      text-align: left;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      border: 1px solid #334155;
    }

    .styled-table td {
      padding: 8px 10px;
      border: 1px solid #E2E8F0;
      vertical-align: top;
      color: #1E293B;
    }

    .styled-table tbody tr:nth-child(even) td {
      background-color: #F8FAFC;
    }

    /* DIAGRAMAS */
    .diagram-container {
      text-align: center;
      margin: 18px 0;
      padding: 10px;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
    }

    .diagram-img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
    }

    .diagram-caption {
      font-size: 8.5pt;
      font-style: italic;
      color: #64748B;
      margin-top: 6px;
    }
  </style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-container">
    <div class="cover-badge">Documento de Ingeniería &amp; Memoria de Arquitectura</div>
    <h1 class="cover-title" style="border: none;">SISTEMA DE GESTIÓN COMERCIAL, PUNTO DE VENTA (POS) E INVENTARIOS BAJO MÉTODO PEPS (FIFO)</h1>
    <div class="cover-subtitle">Memoria Técnica Integral y Especificación Formal para Evaluación de Software</div>

    <table class="meta-table">
      <thead>
        <tr>
          <th colspan="2">FICHA TÉCNICA DEL PROYECTO IMPLEMENTADO</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="meta-label">Despliegue en Producción</td>
          <td><span class="url-highlight">https://sistema-pos-tienda.onrender.com</span></td>
        </tr>
        <tr>
          <td class="meta-label">Tipo de Arquitectura</td>
          <td>Cloud Distribuida Multicapa (SPA Responsive + REST API Node/Express + DBaaS Serverless)</td>
        </tr>
        <tr>
          <td class="meta-label">Backend y Entorno</td>
          <td>Node.js (v22.x LTS), Express.js (v4.19), Pool transaccional con mysql2/promise</td>
        </tr>
        <tr>
          <td class="meta-label">Base de Datos en la Nube</td>
          <td>TiDB Cloud Serverless (Compatible MySQL 8.0, 13 tablas relacionales en 3FN, SSL/TLS)</td>
        </tr>
        <tr>
          <td class="meta-label">Frontend &amp; Experiencia UI/UX</td>
          <td>HTML5 Semántico, CSS3 / Tailwind CSS (Dark Matte #111315), FontAwesome 6, Chart.js</td>
        </tr>
        <tr>
          <td class="meta-label">Interoperabilidad &amp; Exportación</td>
          <td>QRCode.js (Generador DIAN dinámico), SheetJS (XLSX multi-hoja), jsPDF y jsPDF-AutoTable</td>
        </tr>
        <tr>
          <td class="meta-label">Fecha y Estado</td>
          <td>Noviembre 2026 | Versión 2.0 Estable en Producción</td>
        </tr>
      </tbody>
    </table>

    <div class="callout" style="text-align: left; margin-top: 25px;">
      <div class="callout-title" style="color: #0D9488;">Declaración de Autoría y Enfoque de Ingeniería</div>
      Como Ingeniero de Software, diseñé, estructuré e implementé la totalidad de este sistema con el fin de resolver de forma robusta la gestión de inventarios perecederos en comercios de retail, garantizando trazabilidad contable estricta bajo el método PEPS (FIFO), protección de márgenes comerciales ante reposición inflacionaria, prevención activa de vencimientos y una experiencia de cobro rápida e intuitiva.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 2: CONTROL DE ACCESO Y MATRIZ DE ROLES -->
  <h1>2. CONTROL DE ACCESO AL SISTEMA Y MATRIZ DE ROLES (CREDENCIALES DE PRUEBA)</h1>
  <p>
    Para garantizar la seguridad de la información y dar cumplimiento estricto al <strong>Principio de Mínimo Privilegio</strong>, estructuré un modelo de control de acceso basado en roles (RBAC) conectado a las tablas relacionales <code>roles</code> y <code>usuarios</code> en la base de datos distribuida en TiDB Cloud.
  </p>
  <p>
    A continuación, detallo las credenciales reales activas para que el par evaluador verifique de primera mano la diferenciación de privilegios:
  </p>

  <table class="styled-table">
    <thead>
      <tr>
        <th style="width: 15%;">Rol</th>
        <th style="width: 23%;">Usuario / Correo</th>
        <th style="width: 14%;">Contraseña</th>
        <th style="width: 24%;">Módulos Habilitados</th>
        <th style="width: 24%;">Restricciones de Seguridad</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Administrador</strong></td>
        <td><code>admin@tienda.com</code></td>
        <td><code>admin123</code></td>
        <td>Acceso Total: Dashboard Ejecutivo, Catálogo &amp; Precios, Recepción de Mercancía / Compras, Semáforo de Vencimientos, Kardex PEPS, Novedades, POS, Reportes Gerenciales y Cierre de Caja.</td>
        <td>Sin restricciones. Auditoría financiera integral, modificación de márgenes de ganancia y recálculo masivo de precios.</td>
      </tr>
      <tr>
        <td><strong>Cajero</strong></td>
        <td><code>cajero@tienda.com</code></td>
        <td><code>cajero123</code></td>
        <td>Punto de Venta (POS) y Cierre/Cuadre de Caja del turno (con consulta operativa de facturas del día).</td>
        <td>Bloqueo estricto a Catálogo, Compras, Semáforo, Kardex y Reportes Gerenciales. Ocultación total de costos de compra, lotes PEPS y utilidades netas.</td>
      </tr>
    </tbody>
  </table>

  <!-- SECCIÓN 3: ARQUITECTURA Y EXPLICACIÓN TÉCNICA -->
  <h1>3. ARQUITECTURA Y EXPLICACIÓN TÉCNICA PASO A PASO</h1>

  <h2>3.1 Motor Contable PEPS (Primero en Entrar, Primero en Salir)</h2>
  <p>
    Implementé el motor contable PEPS en el servicio de dominio <code>services/peps.service.js</code>. Cuando el cajero o administrador confirma una venta en el Punto de Venta, el sistema ejecuta una transacción atómica protegida con bloqueo pesimista en TiDB Cloud:
  </p>
  <p>
    <code>SELECT id_lote, numero_lote, cantidad_disponible, costo_unitario FROM lotes WHERE id_producto = ? AND cantidad_disponible &gt; 0 AND fecha_vencimiento &gt;= CURDATE() ORDER BY fecha_ingreso ASC FOR UPDATE</code>
  </p>
  <p>
    El algoritmo evalúa iterativamente los lotes ordenados por su antigüedad de ingreso. Si el primer lote no cubre la totalidad de las unidades solicitadas, el sistema descuenta las unidades disponibles agotando el lote 1, asienta el tramo en <code>detalle_ventas</code> y en <code>kardex_movimientos</code>, y toma de inmediato el remanente del lote 2. De este modo, el Costo de Mercancía Vendida (CMV) refleja la suma exacta del costo real de adquisición de cada unidad tomada de su lote correspondiente, calculando la Utilidad Neta Real sin sesgos por fluctuaciones de precios:
  </p>
  <p style="text-align: center; font-family: 'Consolas', monospace; font-weight: bold; background: #F8FAFC; padding: 8px; border-radius: 6px; border: 1px solid #E2E8F0;">
    CMV = Σ ( Cantidad tomada del lote i × Costo unitario del lote i )<br>
    Utilidad Neta Real = Ingreso Base (Sin IVA) − CMV
  </p>

  <h2>3.2 Márgenes de Ganancia Dinámicos y Protección de Reposición (Regla Anti-Pérdida)</h2>
  <p>
    Estructuré un modelo de márgenes jerárquico. En la tabla <code>categorias</code> definí el campo <code>margen_defecto</code> (por defecto 30.00%). En la tabla <code>productos</code> implementé el campo <code>margen_ganancia</code>, el cual permite ajustar el porcentaje de rentabilidad producto por producto tanto al crearlo como al editarlo en el catálogo.
  </p>
  <div class="callout callout-blue">
    <div class="callout-title" style="color: #0284C7;">Regla Anti-Pérdida en Recepción de Lotes:</div>
    En el módulo de Compras, cuando ingresa un nuevo lote, el sistema compara su costo unitario frente al costo de los lotes vigentes. Si el nuevo lote entra a un costo superior, el sistema recalcula automáticamente el Precio Base según la fórmula:
    <code>Precio Base = Costo_Nuevo × (1 + %Margen / 100)</code>. Por el contrario, si el lote ingresa a un costo inferior o igual, el sistema preserva el precio de venta actual, evitando vender por debajo del costo de reposición y protegiendo la rentabilidad comercial del negocio.
  </div>

  <h2>3.3 Control de Vencimientos y Semáforo Preventivo en POS</h2>
  <p>
    Para evitar pérdidas por caducidad y proteger la salud del consumidor, diseñé una vista especializada de Semáforo de Vencimiento basada en la diferencia de días entre <code>fecha_vencimiento</code> y <code>CURDATE()</code>:
  </p>
  <ul>
    <li><strong>Verde (En Fecha):</strong> Días restantes &gt; 30.</li>
    <li><strong>Amarillo (Próximo a Vencer):</strong> Días restantes entre 0 y 30 (Alerta preventiva destacada en Dashboard).</li>
    <li><strong>Rojo (Caducado):</strong> Días restantes &lt; 0.</li>
  </ul>
  <p>
    <strong>Bloqueo Activo en POS:</strong> En el servicio PEPS, la consulta de asignación exige estrictamente <code>fecha_vencimiento &gt;= CURDATE()</code>. Si un producto solo tiene existencias en lotes vencidos, el sistema bloquea inmediatamente la venta y notifica al cajero la indisponibilidad de stock vigente, impidiendo cualquier despacho de mercancía caducada.
  </p>

  <h2>3.4 Facturación Electrónica POS, Impuestos e Interoperabilidad QR</h2>
  <p>
    Desarrollé la liquidación fiscal en <code>services/dian.service.js</code>, soportando tarifas de IVA general del 19%, reducida del 5% y productos exentos (0%), además de descuentos globales. Cada factura genera un consecutivo formal (ej. FAC-00000007) y un CUFE criptográfico mediante hash SHA-256.
  </p>
  <div class="callout callout-green">
    <div class="callout-title" style="color: #16A34A;">Página Pública y QR Dinámico:</div>
    Cada tirilla impresa o digital cuenta con un código QR generado con QRCode.js que apunta exactamente a la URL: <code>https://sistema-pos-tienda.onrender.com/factura.html?f=FAC-XXXX</code>. Al escanearlo, el cliente abre una página pública responsive de alto contraste donde visualiza el detalle oficial de su compra sin necesidad de registrarse ni autenticarse en el sistema.
  </div>

  <h2>3.5 Analítica Gerencial y Exportación Dual (Excel / PDF)</h2>
  <p>
    En el módulo de Reportes Gerenciales implementé consultas analíticas en <code>controllers/reportes.controller.js</code> que consolidan en cualquier periodo (7, 30, 90 días o personalizado): Ingresos Brutos, Utilidad Real PEPS, Ticket Promedio, Unidades Vendidas, Pérdidas por Mermas y Desglose por Medio de Pago (cuadrado al 100% con los ingresos).
  </p>
  <ul>
    <li><strong>Exportación a Excel nativo (.xlsx):</strong> Genera un libro con dos hojas ('Resumen Ejecutivo' y 'Rentabilidad por Producto') con anchos de columna automáticos usando SheetJS.</li>
    <li><strong>Exportación a PDF Ejecutivo:</strong> Genera un informe formal en papel blanco con tablas corporativas estilizadas y encabezados oscuros usando jsPDF y AutoTable.</li>
  </ul>

  <div class="page-break"></div>

  <!-- SECCIÓN 4: CASOS DE USO DETALLADOS -->
  <h1>4. ANÁLISIS DE REQUERIMIENTOS Y CASOS DE USO DETALLADOS</h1>

  <h3>CU-01: Autenticación y Control de Acceso por Roles</h3>
  <p><strong>Actor Principal:</strong> Usuario (Administrador o Cajero).<br>
  <strong>Precondiciones:</strong> Usuario activo en base de datos.<br>
  <strong>Flujo Básico:</strong> 1. El usuario ingresa a login.html e ingresa credenciales. 2. El servidor valida en TiDB Cloud contra <code>password_hash</code> y asienta la sesión en <code>sesiones_usuarios</code>. 3. Si el rol es Administrador, habilita el menú completo; si es Cajero, activa solo Punto de Venta y Cierre de Caja.<br>
  <strong>Flujo Alterno:</strong> 1A. Credenciales erróneas: se muestra mensaje descriptivo y se bloquea el acceso.<br>
  <strong>Postcondiciones:</strong> Sesión activa con token/id de usuario cargado en memoria.</p>

  <h3>CU-02: Gestión de Catálogo, Categorías y Márgenes de Ganancia</h3>
  <p><strong>Actor Principal:</strong> Administrador.<br>
  <strong>Precondiciones:</strong> Sesión con rol Administrador.<br>
  <strong>Flujo Básico:</strong> 1. El administrador ingresa a Catálogo de Productos. 2. Crea o edita producto indicando código de barras, nombre, margen individual, precio base y tarifa de IVA (0%, 5%, 19%). 3. Se calcula en tiempo real el PVP. 4. Opcionalmente puede ejecutar 'Recalcular Precios por Margen' para actualizar todo el catálogo con base en el lote más costoso vigente.<br>
  <strong>Postcondiciones:</strong> Catálogo actualizado en la tabla <code>productos</code>.</p>

  <h3>CU-03: Recepción de Mercancía por Lotes y Recálculo de Precios</h3>
  <p><strong>Actor Principal:</strong> Administrador.<br>
  <strong>Precondiciones:</strong> Proveedor y producto registrados.<br>
  <strong>Flujo Básico:</strong> 1. Abre Recepción de Mercancía. 2. Selecciona proveedor y producto mediante buscador interactivo. 3. Digita número de lote, cantidad, costo unitario y fecha de vencimiento. 4. Se aplica la regla anti-pérdida (actualiza precio de venta si el costo es superior, preserva si es menor). 5. Se asienta en <code>lotes</code>, <code>compras</code> y <code>kardex_movimientos</code>.<br>
  <strong>Postcondiciones:</strong> Stock aumentado y lote registrado bajo el método PEPS.</p>

  <h3>CU-04: Monitoreo de Vencimientos y Bloqueo Preventivo</h3>
  <p><strong>Actor Principal:</strong> Administrador / Sistema.<br>
  <strong>Precondiciones:</strong> Lotes registrados en el sistema.<br>
  <strong>Flujo Básico:</strong> 1. El usuario accede al Semáforo. 2. El sistema clasifica en Verde (&gt;30d), Amarillo (&le;30d) y Rojo (&lt;0d). 3. Para lotes vencidos o averiados, el administrador ejecuta 'Descartar Lote', registrando la baja contable en el Kardex. 4. En el POS, los lotes vencidos quedan automáticamente bloqueados.<br>
  <strong>Postcondiciones:</strong> Inventario auditado sin riesgo de venta de caducados.</p>

  <h3>CU-05: Facturación en Punto de Cobro con Descuento PEPS y QR Dinámico</h3>
  <p><strong>Actor Principal:</strong> Cajero o Administrador.<br>
  <strong>Precondiciones:</strong> Productos con stock no vencido.<br>
  <strong>Flujo Básico:</strong> 1. El cajero agrega productos al carrito. 2. Selecciona cliente y forma de pago. 3. Pulsa 'Confirmar y Cobrar'. 4. El motor PEPS ejecuta transacción ACID, bloquea lotes vigentes con <code>FOR UPDATE</code>, descuenta del lote más antiguo, calcula el CMV exacto y genera consecutivo fiscal y CUFE. 5. Se despliega la tirilla de alto contraste con código QR dinámico apuntando a <code>factura.html?f=FAC-XXXX</code>.<br>
  <strong>Flujo Alterno:</strong> 3A. Si no hay stock vigente no vencido, la transacción se aborta con <code>ROLLBACK</code>.<br>
  <strong>Postcondiciones:</strong> Factura emitida, stock actualizado y factura pública disponible.</p>

  <h3>CU-06: Registro de Devoluciones y Bajas por Avería/Caducidad</h3>
  <p><strong>Actor Principal:</strong> Administrador.<br>
  <strong>Precondiciones:</strong> Lotes en sistema.<br>
  <strong>Flujo Básico:</strong> 1. Ingresa a Devoluciones / Averías. 2. Pulsa '+ Registrar Novedad'. 3. Selecciona producto, lote afectado, tipo de novedad ('Reingreso a Inventario en Buen Estado' o 'Baja por Avería/Defecto'), cantidad y motivo. 4. El sistema actualiza el stock del lote y asienta el movimiento en el Kardex.<br>
  <strong>Postcondiciones:</strong> Cuadre contable y físico de inventario actualizado.</p>

  <h3>CU-07: Arqueo, Historial Operativo del Turno y Cierre de Caja</h3>
  <p><strong>Actor Principal:</strong> Cajero o Administrador.<br>
  <strong>Precondiciones:</strong> Sesión activa en caja.<br>
  <strong>Flujo Básico:</strong> 1. Abre el modal 'Cierre y Cuadre de Caja'. 2. El sistema consulta las ventas del turno y totaliza ingresos brutos, efectivo, tarjetas y transferencias. 3. El cajero digita el dinero físico contado y el sistema calcula en vivo si el cuadre es exacto, sobrante o faltante. 4. Se visualiza la tabla 'Detalle de Ventas del Turno (Hoy)' con buscador en vivo y botón 'Ver / Tirilla' para reimpresión.<br>
  <strong>Postcondiciones:</strong> Corte de turno conciliado y registrado.</p>

  <h3>CU-08: Consulta de Reportes Gerenciales y Exportación (Excel/PDF)</h3>
  <p><strong>Actor Principal:</strong> Administrador.<br>
  <strong>Precondiciones:</strong> Rol Administrador autenticado.<br>
  <strong>Flujo Básico:</strong> 1. Accede a Reportes Gerenciales. 2. Selecciona rango de fechas (7, 30, 90 días o personalizado). 3. El sistema calcula KPIs, grafica la serie diaria y genera el ranking de rentabilidad por producto. 4. Descarga el reporte en Excel nativo (.xlsx) o PDF corporativo con un solo clic.<br>
  <strong>Postcondiciones:</strong> Informe financiero descargado localmente.</p>

  <div class="page-break"></div>

  <!-- SECCIÓN 5: DIAGRAMAS GRÁFICOS -->
  <h1>5. DIAGRAMAS GRÁFICOS INTEGRADOS EN EL DOCUMENTO</h1>

  <h2>5.1 Diagrama 1: Casos de Uso UML del Sistema (Administrador vs Cajero)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${img1Base64}" class="diagram-img" alt="Diagrama de Casos de Uso UML">
    <div class="diagram-caption">Figura 1. Diagrama de Casos de Uso UML detallando la interacción de actores y límites del sistema.</div>
  </div>

  <h2>5.2 Diagrama 2: Arquitectura Cloud Distribuida (Render + TiDB Cloud SSL)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${img2Base64}" class="diagram-img" alt="Diagrama de Arquitectura Cloud">
    <div class="diagram-caption">Figura 2. Modelo de arquitectura multicapa en la nube con separación de responsabilidades y conexión SSL.</div>
  </div>

  <div class="page-break"></div>

  <h2>5.3 Diagrama 3: Algoritmo Contable PEPS (FIFO) y Regla Anti-Pérdida</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${img3Base64}" class="diagram-img" alt="Diagrama de Flujo PEPS">
    <div class="diagram-caption">Figura 3. Diagrama de flujo transaccional: Fijación dinámica de márgenes y consumo cronológico de lotes.</div>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN 6: EVIDENCIA VISUAL Y RECORRIDO FUNCIONAL DEL SISTEMA -->
  <h1>6. EVIDENCIA VISUAL Y RECORRIDO FUNCIONAL DEL SISTEMA</h1>
  <p>
    Con el propósito de ilustrar el funcionamiento real del sistema en su entorno de producción y complementar la especificación técnica de la arquitectura, a continuación presento el recorrido visual por los nueve módulos operacionales clave que diseñé e implementé. Cada captura de pantalla refleja el comportamiento del software en tiempo real, demostrando la aplicación rigurosa de las reglas de negocio, la protección de inventarios mediante el método PEPS y la interfaz dark-matte minimalista concebida para alta productividad.
  </p>

  <h2>6.1 Acceso al Sistema y Autenticación Segura (Login)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen1Base64}" class="diagram-img" alt="Login">
    <div class="diagram-caption">Figura 4. Interfaz de autenticación con control de acceso por roles y diseño dark-matte de alto contraste.</div>
  </div>
  <p>
    Diseñé un módulo de autenticación centralizado que valida las credenciales del usuario contra la base de datos distribuida en TiDB Cloud, verificando el hash criptográfico y asignando un token de sesión seguro. Dependiendo del rol autenticado (Administrador o Cajero), el sistema restringe o habilita de forma reactiva los módulos del menú lateral y las acciones operativas permitidas.
  </p>

  <div class="page-break"></div>

  <h2>6.2 Resumen Operativo y Monitoreo Gerencial (Dashboard)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen2Base64}" class="diagram-img" alt="Dashboard">
    <div class="diagram-caption">Figura 5. Panel de control principal con KPIs en tiempo real, distribución de inventario y serie temporal de ventas.</div>
  </div>
  <p>
    Estructuré el panel de control para proporcionar una visión gerencial instantánea del estado comercial de la tienda. El panel agrega y totaliza en tiempo real los ingresos brutos, el costo PEPS consolidado, la utilidad acumulada y las alertas críticas de stock y vencimiento, complementado con gráficas dinámicas renderizadas mediante Chart.js.
  </p>

  <div class="page-break"></div>

  <h2>6.3 Punto de Cobro POS y Bloqueo Preventivo de Caducidad</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen3Base64}" class="diagram-img" alt="Punto de Cobro POS">
    <div class="diagram-caption">Figura 6. Terminal de punto de venta (POS) evidenciando el bloqueo automático e intransigente ante productos vencidos.</div>
  </div>
  <p>
    Implementé una regla de negocio preventiva en el motor de facturación: al intentar agregar o vender un artículo cuyo lote activo más antiguo ya ha expirado, el backend y el frontend detienen inmediatamente la transacción, notificando al operador con un toast de advertencia y bloqueando el cobro. Esto garantiza el estricto cumplimiento normativo sanitario y la protección del consumidor.
  </p>

  <div class="page-break"></div>

  <h2>6.4 Recepción de Mercancía y Margen de Rentabilidad Automático</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen4Base64}" class="diagram-img" alt="Recepción de Mercancía">
    <div class="diagram-caption">Figura 7. Módulo de recepción de lotes con cálculo y ajuste dinámico de precio base según margen objetivo.</div>
  </div>
  <p>
    Desarrollé el formulario de entrada de mercancía integrando la política anti-pérdida: cuando ingresa un nuevo lote a un costo unitario superior, el sistema calcula automáticamente el nuevo precio de venta recomendado basándose en el porcentaje de margen de ganancia configurado (por producto o heredado de la categoría), previniendo descapitalizaciones por inflación de costos.
  </p>

  <div class="page-break"></div>

  <h2>6.5 Trazabilidad y Auditoría Kardex PEPS (FIFO) por Lotes</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen5Base64}" class="diagram-img" alt="Kardex PEPS">
    <div class="diagram-caption">Figura 8. Libro de movimientos Kardex PEPS con trazabilidad cronológica detallada, costo específico y utilidad por lote.</div>
  </div>
  <p>
    Para garantizar absoluta transparencia contable y responder a la exigencia del evaluador, programé este reporte Kardex que desglosa cada salida de mercancía indicando con precisión el lote consumido, el costo unitario de compra de dicho lote, el ingreso generado y la utilidad neta exacta obtenida en cada tramo de la venta.
  </p>

  <div class="page-break"></div>

  <h2>6.6 Control y Monitoreo Preventivo de Vencimientos (Semáforo)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen6Base64}" class="diagram-img" alt="Semáforo de Vencimientos">
    <div class="diagram-caption">Figura 9. Matriz de semaforización cromática para el control predictivo de expiración de lotes en bodega.</div>
  </div>
  <p>
    Implementé un semáforo visual de tres estados (Rojo: Caducado, Amarillo: Próximo a vencer en menos de 15 días, Verde: Óptimo/Vigente) calculado mediante diferencias de fechas contra el reloj del servidor. Este panel permite al administrador tomar decisiones operativas anticipadas, como rotación prioritaria o promociones relámpago.
  </p>

  <div class="page-break"></div>

  <h2>6.7 Cierre, Arqueo y Cuadre de Caja del Turno Operativo</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen7Base64}" class="diagram-img" alt="Cierre de Caja">
    <div class="diagram-caption">Figura 10. Modal de arqueo de caja con conciliación matemática reactiva y visualizador de facturas del día.</div>
  </div>
  <p>
    Construí el módulo de arqueo y corte de turno con dos componentes esenciales: un motor de cálculo reactivo que compara los ingresos en efectivo registrados por el sistema contra el dinero físico contado por el cajero (marcando descuadres, faltantes o sobrantes), y una tabla de auditoría operativa con las facturas emitidas durante el día con opción de reimpresión directa.
  </p>

  <div class="page-break"></div>

  <h2>6.8 Inteligencia de Negocios y Reportes Gerenciales (Excel / PDF)</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen8Base64}" class="diagram-img" alt="Reportes Gerenciales">
    <div class="diagram-caption">Figura 11. Módulo de reportes financieros avanzados con exportación a libros Excel (.xlsx) y documentos PDF.</div>
  </div>
  <p>
    Diseñé un módulo analítico exclusivo para el rol Administrador que procesa rangos de tiempo configurables, graficando las ventas diarias, la distribución por medio de pago (conciliada al 100% con los ingresos totales) y el ranking de rentabilidad por producto. Incluí exportadores directos hacia hojas de cálculo Excel nativas y reportes PDF listos para junta directiva.
  </p>

  <div class="page-break"></div>

  <h2>6.9 Factura Electrónica Digital Pública Vía Código QR</h2>
  <div class="diagram-container">
    <img src="data:image/png;base64,${screen9Base64}" class="diagram-img" alt="Factura Pública">
    <div class="diagram-caption">Figura 12. Factura electrónica digital accesible públicamente desde el código QR de la tirilla térmica.</div>
  </div>
  <p>
    Desarrollé la vista pública de factura electrónica (factura.html?f=...), la cual se abre instantáneamente al escanear el código QR impreso en la tirilla térmica del cliente. La vista aplica una hoja de estilos de alto contraste profesional, incluye resolución DIAN, fecha, hora, cliente y desglose de IVA, omitiendo deliberadamente la información contable interna y los códigos de lote para resguardar la confidencialidad del negocio.
  </p>

  <div class="page-break"></div>

  <!-- SECCIÓN 7: GUÍA DE PRUEBAS -->
  <h1>7. GUÍA RÁPIDA DE ESCENARIOS DE PRUEBA PARA EL EVALUADOR</h1>
  <p>
    Para facilitar la validación técnica en el despliegue de producción (<strong>https://sistema-pos-tienda.onrender.com</strong>), he preparado la siguiente batería de 4 pruebas prácticas:
  </p>

  <div class="callout callout-amber">
    <div class="callout-title" style="color: #D97706;">Escenario 1: Validación del Bloqueo Preventivo de Productos Vencidos</div>
    1. Inicie sesión como Administrador (<code>admin@tienda.com</code> / <code>admin123</code>).<br>
    2. En Recepción de Mercancía, registre intencionalmente un lote con fecha de vencimiento anterior al día de hoy (ej. ayer).<br>
    3. Ingrese al Punto de Cobro (POS) e intente facturar dicho producto.<br>
    <strong>Resultado Esperado:</strong> El motor transaccional PEPS rechaza la operación, emite una alerta roja y bloquea la venta, certificando que ningún producto caducado puede ser vendido al público.
  </div>

  <div class="callout callout-blue">
    <div class="callout-title" style="color: #0284C7;">Escenario 2: Venta Multitramo que Consume 2 Lotes a Distinto Costo (PEPS FIFO)</div>
    1. En Recepción de Mercancía, ingrese para un mismo producto: Lote A (10 und a $1.000) y Lote B (10 und a $1.500).<br>
    2. Vaya al Punto de Venta (POS) y cobre una orden de 15 unidades de dicho producto.<br>
    3. Abra la tirilla generada o consulte 'Movimientos de Inventario' (Kardex PEPS).<br>
    <strong>Resultado Esperado:</strong> El sistema agota las 10 unidades del Lote A a $1.000 ($10.000) y toma 5 unidades del Lote B a $1.500 ($7.500). El Costo de Mercancía Vendida (CMV) es exactamente $17.500, demostrando el descuento secuencial FIFO por tramos y el cálculo real de utilidad.
  </div>

  <div class="callout callout-green">
    <div class="callout-title" style="color: #16A34A;">Escenario 3: Verificación del Código QR y Vista Pública sin Autenticación</div>
    1. En el Punto de Venta o en 'Cierre y Cuadre de Caja', abra cualquier factura y observe el código QR.<br>
    2. Haga clic en 'Abrir Factura Electrónica Pública' o escanee el código QR desde un teléfono celular.<br>
    3. Observe que la URL abierta corresponde a <code>factura.html?f=FAC-XXXX</code>.<br>
    <strong>Resultado Esperado:</strong> Se visualiza la factura digital centrada en alto contraste (#1E293B sobre blanco), con resolución DIAN, desglose de IVA y productos, sin solicitar contraseña y sin revelar los lotes ni costos internos PEPS de la tienda.
  </div>

  <div class="callout">
    <div class="callout-title" style="color: #0D9488;">Escenario 4: Control de Privilegios del Rol Cajero y Cuadre de Caja del Turno</div>
    1. Cierre sesión e inicie como Cajero (<code>cajero@tienda.com</code> / <code>cajero123</code>).<br>
    2. Compruebe que el sidebar solo muestra 'Punto de Venta' y que no tiene acceso al Catálogo ni a los Reportes Gerenciales.<br>
    3. En la barra superior, abra 'Cierre y Cuadre de Caja'.<br>
    4. Verifique el módulo 'Detalle de Ventas del Turno (Hoy)', filtre por número de factura y use 'Ver / Tirilla'. Ingrese dinero en 'Efectivo Contado' y compruebe el cálculo reactivo de cuadre exacto/sobrante/faltante.<br>
    <strong>Resultado Esperado:</strong> Se cumple estrictamente el principio de mínimo privilegio; el cajero puede operar y cuadrar su caja, pero no puede visualizar costos de compra, márgenes ni balances financieros de la empresa.
  </div>

  <div class="callout" style="background: #F8FAFC; border-left-color: #0F172A; margin-top: 25px;">
    <div class="callout-title" style="color: #0F172A;">Nota al Cierre y Entregables Futuros:</div>
    <em>El presente documento constituye la especificación de ingeniería y memoria técnica de arquitectura para la auditoría del par evaluador. Conforme a la planificación del proyecto y al cronograma establecido, el Manual de Usuario Final paso a paso (destinado a la capacitación de personal operativo) será entregado formalmente en la siguiente fase.</em>
  </div>

</body>
</html>`;

const printHtmlPath = path.join(__dirname, 'docs_export_print.html');
fs.writeFileSync(printHtmlPath, htmlContent, 'utf8');

const publicPrintPath = path.join(__dirname, 'public', 'docs_export_print.html');
fs.writeFileSync(publicPrintPath, htmlContent, 'utf8');
console.log('Archivo HTML de impresión generado en public/docs_export_print.html');

const pdfPath = path.join(__dirname, 'Documentacion_Tecnica_POS_PEPS.pdf');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const { spawnSync } = require('child_process');

try {
  const result = spawnSync(edgePath, [
    '--headless',
    '--disable-gpu',
    `--print-to-pdf=${pdfPath}`,
    'http://localhost:3000/docs_export_print.html'
  ], { stdio: 'inherit' });

  if (fs.existsSync(pdfPath)) {
    console.log(`PDF generado exitosamente: ${pdfPath} (${fs.statSync(pdfPath).size} bytes)`);
  } else {
    console.error('No se pudo verificar la creación del PDF.');
  }
} catch (err) {
  console.error('Error generando PDF:', err.message);
}
