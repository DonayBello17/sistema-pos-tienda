const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  ShadingType
} = require('docx');

const ASSETS_DIR = path.join(__dirname, 'docs_assets');

// Helper para crear celdas con estilo
function createCell(text, options = {}) {
  const {
    isHeader = false,
    width = 25,
    align = AlignmentType.LEFT,
    bold = false,
    fontSize = 9.5,
    shadingColor = null,
    textColor = null
  } = options;

  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: {
      type: ShadingType.CLEAR,
      fill: isHeader ? "1E293B" : (shadingColor || "FFFFFF")
    },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: text,
            bold: isHeader || bold,
            size: fontSize * 2, // docx usa medios puntos
            color: isHeader ? "FFFFFF" : (textColor || "0F172A"),
            font: "Calibri"
          })
        ]
      })
    ]
  });
}

// Helper para bloques destacados (Callout Box)
function createCallout(title, text, borderColor = "0D9488", bgColor = "F0FDFA") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: bgColor },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: title + "\n", bold: true, size: 21, color: borderColor, font: "Calibri" }),
                  new TextRun({ text: text, size: 19, color: "334155", font: "Calibri" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

async function buildDocx() {
  console.log('Generando Documentacion_Tecnica_POS_PEPS.docx...');

  const img1Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama1_casos_uso.png'));
  const img2Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama2_arquitectura.png'));
  const img3Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'diagrama3_flujo_peps.png'));
  const screen1Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_01_login.png'));
  const screen2Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_02_dashboard.png'));
  const screen3Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_03_pos_bloqueo.png'));
  const screen4Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_04_recepcion_mercancia.png'));
  const screen5Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_05_kardex_peps.png'));
  const screen6Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_06_semaforo_vencimientos.png'));
  const screen7Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_07_cierre_caja.png'));
  const screen8Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_08_reportes_gerenciales.png'));
  const screen9Buffer = fs.readFileSync(path.join(ASSETS_DIR, 'screen_09_factura_publica.png'));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 21, color: "1E293B" },
          paragraph: { spacing: { line: 276, after: 120 } }
        }
      }
    },
    sections: [
      // ==========================================
      // SECCIÓN 1: PORTADA & FICHA TÉCNICA
      // ==========================================
      {
        properties: {},
        children: [
          new Paragraph({ text: "", spacing: { after: 720 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "SISTEMA DE GESTIÓN COMERCIAL, PUNTO DE VENTA (POS) E INVENTARIOS BAJO MÉTODO PEPS (FIFO)",
                bold: true,
                size: 38,
                color: "0F172A",
                font: "Calibri"
              })
            ],
            spacing: { after: 240 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Documento Técnico Formal y Memoria de Arquitectura para Evaluación de Software",
                size: 24,
                color: "0D9488",
                bold: true,
                font: "Calibri"
              })
            ],
            spacing: { after: 720 }
          }),

          // Ficha de despliegue
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }
            },
            rows: [
              new TableRow({
                children: [
                  createCell("PARÁMETRO TÉCNICO", { isHeader: true, width: 35 }),
                  createCell("DETALLE DE IMPLEMENTACIÓN EN PRODUCCIÓN", { isHeader: true, width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("URL de Despliegue en Producción", { bold: true, width: 35 }),
                  createCell("https://sistema-pos-tienda.onrender.com", { width: 65, textColor: "2563EB", bold: true })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Tipo de Arquitectura", { bold: true, width: 35 }),
                  createCell("Cloud Distribuida Multicapa (SPA Frontend + RESTful Node/Express Backend + DBaaS Serverless)", { width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Entorno de Ejecución Backend", { bold: true, width: 35 }),
                  createCell("Node.js v22.x LTS, Express.js 4.19, Conexión transaccional con mysql2/promise", { width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Motor de Base de Datos", { bold: true, width: 35 }),
                  createCell("TiDB Cloud Serverless (Compatible MySQL 8.0, 13 tablas relacionales en 3FN, transacciones ACID con SSL/TLS)", { width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Frontend & Experiencia UI/UX", { bold: true, width: 35 }),
                  createCell("SPA Modular, HTML5 Semántico, Tailwind CSS (SaaS Dark Matte #111315), FontAwesome 6, Chart.js", { width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Interoperabilidad y Reportes", { bold: true, width: 35 }),
                  createCell("QRCode.js (Generación DIAN con consulta pública), SheetJS (.xlsx multi-hoja nativo), jsPDF-AutoTable", { width: 65 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Fecha de Emisión / Versión", { bold: true, width: 35 }),
                  createCell("Noviembre 2026 | Versión 2.0 Estable", { width: 65 })
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 480 } }),
          createCallout(
            "DECLARACIÓN DE AUTORÍA Y ENFOQUE DE INGENIERÍA",
            "Como Ingeniero de Software, diseñé, estructuré e implementé la totalidad de este sistema con el fin de resolver de forma robusta la gestión de inventarios perecederos en comercios de retail, garantizando trazabilidad contable estricta bajo el método PEPS (FIFO), protección de márgenes comerciales ante reposición inflacionaria, prevención activa de vencimientos y una experiencia de cobro rápida e intuitiva."
          ),

          new Paragraph({ text: "", spacing: { after: 240 } }),

          // ==========================================
          // SECCIÓN 2: ACCESO Y MATRIZ DE ROLES
          // ==========================================
          new Paragraph({
            text: "2. CONTROL DE ACCESO AL SISTEMA Y MATRIZ DE ROLES",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Para garantizar la seguridad y cumplir con el principio de mínimo privilegio, estructuré un modelo de control de acceso basado en roles (RBAC) conectado a la tabla "
              ),
              new TextRun({ text: "roles", bold: true }),
              new TextRun(" y "),
              new TextRun({ text: "usuarios", bold: true }),
              new TextRun(
                " en la base de datos distribuida TiDB Cloud. A continuación se presentan las credenciales activas preparadas para la fase de pruebas técnicas:"
              )
            ]
          }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              left: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              right: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" }
            },
            rows: [
              new TableRow({
                children: [
                  createCell("ROL", { isHeader: true, width: 16 }),
                  createCell("USUARIO / CORREO", { isHeader: true, width: 22 }),
                  createCell("CONTRASEÑA", { isHeader: true, width: 14 }),
                  createCell("MÓDULOS HABILITADOS", { isHeader: true, width: 24 }),
                  createCell("RESTRICCIONES (MÍNIMO PRIVILEGIO)", { isHeader: true, width: 24 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Administrador", { bold: true, width: 16 }),
                  createCell("admin@tienda.com", { width: 22, bold: true, textColor: "0F766E" }),
                  createCell("admin123", { width: 14, bold: true }),
                  createCell("Acceso Total: Dashboard, Catálogo, Compras/Lotes, Semáforo, Kardex PEPS, Novedades, POS, Reportes Gerenciales y Cierre de Caja.", { width: 24 }),
                  createCell("Sin restricciones. Capacidad de auditoría financiera completa, edición de márgenes y recálculo masivo de precios.", { width: 24 })
                ]
              }),
              new TableRow({
                children: [
                  createCell("Cajero", { bold: true, width: 16 }),
                  createCell("cajero@tienda.com", { width: 22, bold: true, textColor: "0F766E" }),
                  createCell("cajero123", { width: 14, bold: true }),
                  createCell("Punto de Venta (POS) y Cierre/Cuadre de Caja del turno (con consulta operativa de facturas del día).", { width: 24 }),
                  createCell("Bloqueo total a Catálogo, Compras, Semáforo, Kardex y Reportes Gerenciales. Ocultación de costos de compra, lotes PEPS y utilidades netas.", { width: 24 })
                ]
              })
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // ==========================================
          // SECCIÓN 3: ARQUITECTURA Y EXPLICACIÓN TÉCNICA
          // ==========================================
          new Paragraph({
            text: "3. ARQUITECTURA Y EXPLICACIÓN TÉCNICA PASO A PASO",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),

          new Paragraph({
            text: "3.1 Motor Contable PEPS (Primero en Entrar, Primero en Salir)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Implementé el motor contable PEPS en el servicio de dominio "
              ),
              new TextRun({ text: "services/peps.service.js", bold: true }),
              new TextRun(
                ". Cuando el cajero o administrador confirma una venta en el Punto de Venta, el sistema ejecuta una transacción atómica protegida con bloqueo pesimista en TiDB Cloud: "
              ),
              new TextRun({
                text: "SELECT id_lote, numero_lote, cantidad_disponible, costo_unitario FROM lotes WHERE id_producto = ? AND cantidad_disponible > 0 AND fecha_vencimiento >= CURDATE() ORDER BY fecha_ingreso ASC FOR UPDATE",
                bold: true,
                font: "Consolas",
                size: 18
              }),
              new TextRun(
                ". El algoritmo evalúa iterativamente los lotes ordenados por su antigüedad de ingreso. Si el primer lote no cubre la totalidad de las unidades solicitadas, el sistema descuenta las unidades disponibles agotando el lote 1, asienta el tramo en "
              ),
              new TextRun({ text: "detalle_ventas", bold: true }),
              new TextRun(" y "),
              new TextRun({ text: "kardex_movimientos", bold: true }),
              new TextRun(
                ", y toma de inmediato el remanente del lote 2. De este modo, el Costo de Mercancía Vendida (CMV) refleja la suma exacta del costo real de adquisición de cada unidad tomada de su lote correspondiente, calculando la Utilidad Neta Real sin sesgos por fluctuaciones de precios."
              )
            ]
          }),

          new Paragraph({
            text: "3.2 Márgenes de Ganancia Dinámicos y Protección de Reposición",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Estructuré un modelo de márgenes jerárquico. En la tabla "
              ),
              new TextRun({ text: "categorias", bold: true }),
              new TextRun(" definí el campo "),
              new TextRun({ text: "margen_defecto", bold: true }),
              new TextRun(" (por defecto 30.00%). En la tabla "),
              new TextRun({ text: "productos", bold: true }),
              new TextRun(" implementé el campo "),
              new TextRun({ text: "margen_ganancia", bold: true }),
              new TextRun(
                ", el cual permite ajustar el porcentaje de rentabilidad producto por producto tanto al crearlo como al editarlo en el catálogo.\n\n"
              ),
              new TextRun({
                text: "Regla Anti-Pérdida en Recepción de Lotes: ",
                bold: true
              }),
              new TextRun(
                "En el módulo de Compras, cuando ingresa un nuevo lote, el sistema compara su costo unitario frente al costo de los lotes vigentes. Si el nuevo lote entra a un costo superior, el sistema recalcula automáticamente el Precio Base según la fórmula: "
              ),
              new TextRun({
                text: "Precio Base = Costo_Nuevo * (1 + %Margen / 100)",
                bold: true,
                font: "Consolas",
                size: 19
              }),
              new TextRun(
                ". Por el contrario, si el lote ingresa a un costo inferior o igual, el sistema preserva el precio de venta actual, evitando vender por debajo del costo de reposición y protegiendo la rentabilidad comercial del negocio."
              )
            ]
          }),

          new Paragraph({
            text: "3.3 Control de Vencimientos y Semáforo Preventivo en POS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Para evitar pérdidas por caducidad y proteger la salud del consumidor, diseñé una vista especializada de Semáforo de Vencimiento basada en la diferencia de días entre "
              ),
              new TextRun({ text: "fecha_vencimiento", bold: true }),
              new TextRun(" y "),
              new TextRun({ text: "CURDATE()", bold: true }),
              new TextRun(":\n"),
              new TextRun("• Verde (En Fecha): Días restantes > 30.\n"),
              new TextRun("• Amarillo (Próximo a Vencer): Días restantes entre 0 y 30 (Alerta preventiva destacada en Dashboard).\n"),
              new TextRun("• Rojo (Caducado): Días restantes < 0.\n\n"),
              new TextRun({ text: "Bloqueo Activo en POS: ", bold: true }),
              new TextRun(
                "En el servicio PEPS, la consulta de asignación exige estrictamente "
              ),
              new TextRun({ text: "fecha_vencimiento >= CURDATE()", bold: true, font: "Consolas", size: 18 }),
              new TextRun(
                ". Si un producto solo tiene existencias en lotes vencidos, el sistema bloquea inmediatamente la venta y notifica al cajero la indisponibilidad de stock vigente, impidiendo cualquier despacho de mercancía caducada."
              )
            ]
          }),

          new Paragraph({
            text: "3.4 Facturación Electrónica POS, Impuestos e Interoperabilidad QR",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "Desarrollé la liquidación fiscal en "
              ),
              new TextRun({ text: "services/dian.service.js", bold: true }),
              new TextRun(
                ", soportando tarifas de IVA general del 19%, reducida del 5% y productos exentos (0%), además de descuentos globales. Cada factura genera un consecutivo formal (ej. FAC-00000007) y un CUFE criptográfico mediante hash SHA-256.\n\n"
              ),
              new TextRun({ text: "Página Pública y QR Dinámico: ", bold: true }),
              new TextRun(
                "Cada tirilla impresa o digital cuenta con un código QR generado con QRCode.js que apunta exactamente a la URL: "
              ),
              new TextRun({ text: "https://sistema-pos-tienda.onrender.com/factura.html?f=FAC-XXXX", bold: true, font: "Consolas", size: 18, textColor: "2563EB" }),
              new TextRun(
                ". Al escanearlo, el cliente abre una página pública responsive de alto contraste donde visualiza el detalle oficial de su compra sin necesidad de registrarse ni autenticarse en el sistema."
              )
            ]
          }),

          new Paragraph({
            text: "3.5 Analítica Gerencial y Exportación Dual (Excel / PDF)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun(
                "En el módulo de Reportes Gerenciales implementé consultas analíticas en "
              ),
              new TextRun({ text: "controllers/reportes.controller.js", bold: true }),
              new TextRun(
                " que consolidan en cualquier periodo (7, 30, 90 días o personalizado): Ingresos Brutos, Utilidad Real PEPS, Ticket Promedio, Unidades Vendidas, Pérdidas por Mermas y Desglose por Medio de Pago (cuadrado al 100% con los ingresos).\n"
              ),
              new TextRun(
                "Para la entrega de información ejecutiva, implementé dos motores de descarga en el frontend:\n"
              ),
              new TextRun("1. "),
              new TextRun({ text: "Exportación a Excel nativo (.xlsx): ", bold: true }),
              new TextRun("Utiliza SheetJS generando un libro con dos hojas ('Resumen Ejecutivo' y 'Rentabilidad por Producto') con anchos de columna automáticos.\n"),
              new TextRun("2. "),
              new TextRun({ text: "Exportación a PDF Ejecutivo: ", bold: true }),
              new TextRun("Utiliza jsPDF y jsPDF-AutoTable generando un informe formal en papel blanco con tablas corporativas estilizadas y encabezados oscuros.")
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 200 } }),

          // ==========================================
          // SECCIÓN 4: CASOS DE USO DETALLADOS
          // ==========================================
          new Paragraph({
            text: "4. ESPECIFICACIÓN DETALLADA DE CASOS DE USO DEL SISTEMA",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),

          // CU-01
          new Paragraph({ text: "Caso de Uso CU-01: Autenticación y Control de Acceso por Roles", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Usuario (Administrador o Cajero).\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Usuario registrado en tabla 'usuarios' con estado Activo.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El usuario ingresa a login.html e ingresa correo y contraseña. 2. El servidor valida credenciales en BD contra password_hash y genera registro en 'sesiones_usuarios'. 3. Si el rol es Administrador, redirige a index.html con acceso total. Si el rol es Cajero, redirige al POS ocultando módulos de gestión y datos de costos.\n"),
              new TextRun({ text: "• Flujos Alternos: ", bold: true }), new TextRun("1A. Credenciales incorrectas: El sistema muestra alerta roja de error y no genera sesión.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Sesión activa con token/id de usuario cargado en memoria.")
            ]
          }),

          // CU-02
          new Paragraph({ text: "Caso de Uso CU-02: Gestión de Catálogo, Categorías y Márgenes de Ganancia", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Sesión iniciada con rol Administrador.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El administrador ingresa a la vista Catálogo de Productos. 2. Puede crear nuevo producto indicando código de barras, nombre, categoría, margen de ganancia individual, precio base y tarifa de IVA (0%, 5%, 19%). 3. El sistema calcula en vivo el PVP final. 4. Se guarda en BD. 5. Opcionalmente puede pulsar 'Recalcular Precios por Margen' para actualizar el precio base de todo el catálogo según el costo de sus lotes activos.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Producto registrado/actualizado y disponible en catálogo.")
            ]
          }),

          // CU-03
          new Paragraph({ text: "Caso de Uso CU-03: Recepción de Mercancía por Lotes y Recálculo Anti-Pérdida", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Proveedor y producto registrados en el sistema.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El administrador abre Recepción de Mercancía. 2. Selecciona proveedor y producto mediante selectores interactivos con buscador en vivo. 3. Ingresa número de lote, cantidad recibida, costo unitario de compra y fecha de vencimiento. 4. El sistema evalúa la regla anti-pérdida: si el costo supera el costo anterior, actualiza el precio base automáticamente; si es menor o igual, preserva el precio. 5. Confirma el ingreso y se asienta en 'lotes', 'compras' y 'kardex_movimientos'.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Inventario aumentado y lote registrado con trazabilidad PEPS.")
            ]
          }),

          // CU-04
          new Paragraph({ text: "Caso de Uso CU-04: Monitoreo de Vencimientos y Bloqueo Preventivo", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Administrador / Sistema Automático.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Lotes con existencias en base de datos.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El usuario accede al Semáforo de Vencimientos. 2. El sistema clasifica los lotes en Verde (>30d), Amarillo (<=30d) y Rojo (<0d). 3. Para lotes vencidos o dañados, el usuario puede pulsar 'Descartar Lote', registrando la baja por caducidad en el Kardex y descontando el stock físico. 4. En el POS, el motor PEPS excluye automáticamente lotes vencidos.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Inventario saneado y prevención total de venta de productos caducados.")
            ]
          }),

          // CU-05
          new Paragraph({ text: "Caso de Uso CU-05: Facturación en Punto de Venta POS con Descuento PEPS y QR Público", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Cajero o Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Productos con stock disponible no vencido.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El cajero agrega productos al carrito por código de barras o búsqueda en vivo. 2. Selecciona cliente (o Consumidor Final) y medio de pago (Efectivo, Tarjeta, Transferencia). 3. Pulsa 'Confirmar y Cobrar'. 4. El backend inicia transacción ACID, ejecuta consulta PEPS ordenando por 'fecha_ingreso ASC' con bloqueo 'FOR UPDATE', agota los lotes más antiguos, calcula CMV real, genera consecutivo fiscal y CUFE. 5. Se despliega la tirilla de alto contraste con código QR dinámico apuntando a 'factura.html?f=FAC-XXXX'. 6. Si el usuario es Cajero, la auditoría interna PEPS se oculta por confidencialidad.\n"),
              new TextRun({ text: "• Flujos Alternos: ", bold: true }), new TextRun("3A. Stock insuficiente o vencido: Se aborta la transacción con 'ROLLBACK' y se emite toast explicativo.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Venta registrada, stock descontado por lotes y factura consultable públicamente.")
            ]
          }),

          // CU-06
          new Paragraph({ text: "Caso de Uso CU-06: Registro de Devoluciones y Mermas por Avería/Caducidad", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Lote registrado en el sistema.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El administrador ingresa a Devoluciones / Averías. 2. Pulsa '+ Registrar Novedad'. 3. Selecciona producto, lote afectado, tipo de novedad ('Reingreso a Inventario en Buen Estado' o 'Baja por Avería/Defecto'), cantidad y motivo. 4. Si es devolución en buen estado, incrementa el stock del lote; si es avería, asienta la pérdida en el Kardex y descuenta las existencias.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Inventario cuadrante y registro contable de la novedad.")
            ]
          }),

          // CU-07
          new Paragraph({ text: "Caso de Uso CU-07: Arqueo, Historial Operativo del Turno y Cierre de Caja", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Cajero o Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Sesión activa en el punto de cobro.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El usuario hace clic en el botón 'Cierre y Cuadre de Caja' de la barra superior. 2. El sistema consulta en BD las ventas del turno actual y totaliza ventas brutas, efectivo esperado, tarjetas y transferencias. 3. En la sección de verificación física, el cajero ingresa el dinero contado y el sistema calcula en tiempo real si el cuadre es exacto, sobrante o faltante. 4. Debajo se despliega el 'Detalle de Ventas del Turno (Hoy)' con buscador en vivo, mostrando factura, hora, cliente, método y botón 'Ver / Tirilla' para reimpresión inmediata. 5. Permite imprimir el corte de caja en formato térmico.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Corte de turno validado y registrado.")
            ]
          }),

          // CU-08
          new Paragraph({ text: "Caso de Uso CU-08: Consulta de Reportes Gerenciales y Exportación (Excel/PDF)", heading: HeadingLevel.HEADING_3 }),
          new Paragraph({
            children: [
              new TextRun({ text: "• Actor Principal: ", bold: true }), new TextRun("Administrador.\n"),
              new TextRun({ text: "• Precondiciones: ", bold: true }), new TextRun("Rol Administrador autenticado.\n"),
              new TextRun({ text: "• Flujo Básico: ", bold: true }), new TextRun("1. El administrador ingresa a Reportes Gerenciales. 2. Selecciona rango de días (7d, 30d, 90d o fechas manuales). 3. El sistema actualiza 4 tarjetas de KPIs (Ingresos, Utilidad PEPS, Transacciones y Mermas), la gráfica de serie diaria con Chart.js, la distribución por medio de pago y el ranking de rentabilidad por producto. 4. El usuario puede hacer clic en 'Exportar Excel (.xlsx)' o 'Exportar PDF' para descargar el informe ejecutivo formal estructurado.\n"),
              new TextRun({ text: "• Postcondiciones: ", bold: true }), new TextRun("Reporte gerencial descargado en archivo local.")
            ]
          }),

          new Paragraph({ text: "", spacing: { after: 240 } }),

          // ==========================================
          // SECCIÓN 5: DIAGRAMAS GRÁFICOS INTEGRADOS
          // ==========================================
          new Paragraph({
            text: "5. DIAGRAMAS GRÁFICOS DE ARQUITECTURA Y PROCESOS",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),

          new Paragraph({
            text: "5.1 Diagrama 1: Casos de Uso UML del Sistema (Administrador vs Cajero)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: img1Buffer,
                transformation: { width: 600, height: 411 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 1. Diagrama de Casos de Uso UML detallando la interacción de actores y límites del sistema.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 280 }
          }),

          new Paragraph({
            text: "5.2 Diagrama 2: Arquitectura Cloud Distribuida (Render + TiDB Cloud SSL)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: img2Buffer,
                transformation: { width: 600, height: 388 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 2. Modelo de arquitectura multicapa en la nube con separación de responsabilidades y conexión SSL.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 280 }
          }),

          new Paragraph({
            text: "5.3 Diagrama 3: Algoritmo Contable PEPS (FIFO) y Regla Anti-Pérdida",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: img3Buffer,
                transformation: { width: 600, height: 422 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 3. Diagrama de flujo transaccional: Fijación dinámica de márgenes y consumo cronológico de lotes.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 280 }
          }),

          // ==========================================
          // SECCIÓN 6: EVIDENCIA VISUAL Y RECORRIDO FUNCIONAL DEL SISTEMA
          // ==========================================
          new Paragraph({
            text: "6. EVIDENCIA VISUAL Y RECORRIDO FUNCIONAL DEL SISTEMA",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),
          new Paragraph({
            text: "Con el propósito de ilustrar el funcionamiento real del sistema en su entorno de producción y complementar la especificación técnica de la arquitectura, a continuación presento el recorrido visual por los nueve módulos operacionales clave que diseñé e implementé. Cada captura de pantalla refleja el comportamiento del software en tiempo real, demostrando la aplicación rigurosa de las reglas de negocio, la protección de inventarios mediante el método PEPS y la interfaz dark-matte minimalista concebida para alta productividad.",
            spacing: { after: 200 }
          }),

          // 6.1 Login
          new Paragraph({
            text: "6.1 Acceso al Sistema y Autenticación Segura (Login)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen1Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 4. Interfaz de autenticación con control de acceso por roles y diseño dark-matte de alto contraste.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Diseñé un módulo de autenticación centralizado que valida las credenciales del usuario contra la base de datos distribuida en TiDB Cloud, verificando el hash criptográfico y asignando un token de sesión seguro. Dependiendo del rol autenticado (Administrador o Cajero), el sistema restringe o habilita de forma reactiva los módulos del menú lateral y las acciones operativas permitidas.",
            spacing: { after: 240 }
          }),

          // 6.2 Dashboard
          new Paragraph({
            text: "6.2 Resumen Operativo y Monitoreo Gerencial (Dashboard)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen2Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 5. Panel de control principal con KPIs en tiempo real, distribución de inventario y serie temporal de ventas.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Estructuré el panel de control para proporcionar una visión gerencial instantánea del estado comercial de la tienda. El panel agrega y totaliza en tiempo real los ingresos brutos, el costo PEPS consolidado, la utilidad acumulada y las alertas críticas de stock y vencimiento, complementado con gráficas dinámicas renderizadas mediante Chart.js.",
            spacing: { after: 240 }
          }),

          // 6.3 POS con bloqueo
          new Paragraph({
            text: "6.3 Punto de Cobro POS y Bloqueo Preventivo de Caducidad",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen3Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 6. Terminal de punto de venta (POS) evidenciando el bloqueo automático e intransigente ante productos vencidos.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Implementé una regla de negocio preventiva en el motor de facturación: al intentar agregar o vender un artículo cuyo lote activo más antiguo ya ha expirado, el backend y el frontend detienen inmediatamente la transacción, notificando al operador con un toast de advertencia y bloqueando el cobro. Esto garantiza el estricto cumplimiento normativo sanitario y la protección del consumidor.",
            spacing: { after: 240 }
          }),

          // 6.4 Recepción Mercancía
          new Paragraph({
            text: "6.4 Recepción de Mercancía y Margen de Rentabilidad Automático",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen4Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 7. Módulo de recepción de lotes con cálculo y ajuste dinámico de precio base según margen objetivo.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Desarrollé el formulario de entrada de mercancía integrando la política anti-pérdida: cuando ingresa un nuevo lote a un costo unitario superior, el sistema calcula automáticamente el nuevo precio de venta recomendado basándose en el porcentaje de margen de ganancia configurado (por producto o heredado de la categoría), previniendo descapitalizaciones por inflación de costos.",
            spacing: { after: 240 }
          }),

          // 6.5 Kardex PEPS
          new Paragraph({
            text: "6.5 Trazabilidad y Auditoría Kardex PEPS (FIFO) por Lotes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen5Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 8. Libro de movimientos Kardex PEPS con trazabilidad cronológica detallada, costo específico y utilidad por lote.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Para garantizar absoluta transparencia contable y responder a la exigencia del evaluador, programé este reporte Kardex que desglosa cada salida de mercancía indicando con precisión el lote consumido, el costo unitario de compra de dicho lote, el ingreso generado y la utilidad neta exacta obtenida en cada tramo de la venta.",
            spacing: { after: 240 }
          }),

          // 6.6 Semáforo de Vencimientos
          new Paragraph({
            text: "6.6 Control y Monitoreo Preventivo de Vencimientos (Semáforo)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen6Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 9. Matriz de semaforización cromática para el control predictivo de expiración de lotes en bodega.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Implementé un semáforo visual de tres estados (Rojo: Caducado, Amarillo: Próximo a vencer en menos de 15 días, Verde: Óptimo/Vigente) calculado mediante diferencias de fechas contra el reloj del servidor. Este panel permite al administrador tomar decisiones operativas anticipadas, como rotación prioritaria o promociones relámpago.",
            spacing: { after: 240 }
          }),

          // 6.7 Cierre de Caja
          new Paragraph({
            text: "6.7 Cierre, Arqueo y Cuadre de Caja del Turno Operativo",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen7Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 10. Modal de arqueo de caja con conciliación matemática reactiva y visualizador de facturas del día.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Construí el módulo de arqueo y corte de turno con dos componentes esenciales: un motor de cálculo reactivo que compara los ingresos en efectivo registrados por el sistema contra el dinero físico contado por el cajero (marcando descuadres, faltantes o sobrantes), y una tabla de auditoría operativa con las facturas emitidas durante el día con opción de reimpresión directa.",
            spacing: { after: 240 }
          }),

          // 6.8 Reportes Gerenciales
          new Paragraph({
            text: "6.8 Inteligencia de Negocios y Reportes Gerenciales (Excel / PDF)",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen8Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 11. Módulo de reportes financieros avanzados con exportación a libros Excel (.xlsx) y documentos PDF.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Diseñé un módulo analítico exclusivo para el rol Administrador que procesa rangos de tiempo configurables, graficando las ventas diarias, la distribución por medio de pago (conciliada al 100% con los ingresos totales) y el ranking de rentabilidad por producto. Incluí exportadores directos hacia hojas de cálculo Excel nativas y reportes PDF listos para junta directiva.",
            spacing: { after: 240 }
          }),

          // 6.9 Factura Pública
          new Paragraph({
            text: "6.9 Factura Electrónica Digital Pública Vía Código QR",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                data: screen9Buffer,
                transformation: { width: 520, height: 292 }
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "Figura 12. Factura electrónica digital accesible públicamente desde el código QR de la tirilla térmica.",
                italics: true,
                size: 18,
                color: "64748B"
              })
            ],
            spacing: { after: 140 }
          }),
          new Paragraph({
            text: "Desarrollé la vista pública de factura electrónica (factura.html?f=...), la cual se abre instantáneamente al escanear el código QR impreso en la tirilla térmica del cliente. La vista aplica una hoja de estilos de alto contraste profesional, incluye resolución DIAN, fecha, hora, cliente y desglose de IVA, omitiendo deliberadamente la información contable interna y los códigos de lote para resguardar la confidencialidad del negocio.",
            spacing: { after: 280 }
          }),

          // ==========================================
          // SECCIÓN 7: GUÍA RÁPIDA DE ESCENARIOS DE PRUEBA
          // ==========================================
          new Paragraph({
            text: "7. GUÍA RÁPIDA DE ESCENARIOS DE PRUEBA PARA EL EVALUADOR",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 180 }
          }),
          new Paragraph({
            text: "Con el objetivo de facilitar la validación técnica en el despliegue en producción (https://sistema-pos-tienda.onrender.com), he estructurado los siguientes 4 escenarios de prueba prácticos:"
          }),

          // Prueba 1
          createCallout(
            "ESCENARIO DE PRUEBA 1: Validación del Bloqueo Preventivo de Productos Vencidos",
            "1. Inicie sesión como Administrador (admin@tienda.com / admin123).\n2. Diríjase al Semáforo de Vencimiento y verifique si existen lotes en color Rojo (Caducados).\n3. Ingrese a Recepción de Mercancía y registre intencionalmente un lote con fecha de vencimiento anterior al día de hoy (ej. ayer).\n4. Ingrese al módulo Punto de Cobro (POS) e intente facturar dicho producto.\nResultado Esperado: El motor transaccional PEPS rechaza la operación, emite un toast de alerta de color rojo y bloquea la venta, certificando que ningún producto caducado puede ser vendido al público."
          ),
          new Paragraph({ text: "", spacing: { after: 140 } }),

          // Prueba 2
          createCallout(
            "ESCENARIO DE PRUEBA 2: Venta Multitramo que Consume 2 Lotes a Distinto Costo (PEPS FIFO)",
            "1. En Recepción de Mercancía, ingrese para un mismo producto: Lote A (10 unidades a $1.000) y Lote B (10 unidades a $1.500).\n2. Vaya al Punto de Venta (POS) y cobre una orden de 15 unidades de dicho producto.\n3. Abra la tirilla generada o consulte 'Movimientos de Inventario' (Kardex PEPS).\nResultado Esperado: El sistema agota las 10 unidades del Lote A a costo de $1.000 ($10.000) y toma 5 unidades del Lote B a costo de $1.500 ($7.500). El Costo de Mercancía Vendida (CMV) es exactamente $17.500, demostrando el descuento secuencial FIFO por tramos y el cálculo real de utilidad.",
            "0284C7",
            "F0F9FF"
          ),
          new Paragraph({ text: "", spacing: { after: 140 } }),

          // Prueba 3
          createCallout(
            "ESCENARIO DE PRUEBA 3: Verificación del Código QR y Vista Pública sin Autenticación",
            "1. En el Punto de Venta o en el modal de 'Cierre y Cuadre de Caja', abra cualquier factura y observe el código QR.\n2. Haga clic en 'Abrir Factura Electrónica Pública' o escanee el código QR desde un teléfono celular.\n3. Observe que la URL abierta corresponde a 'factura.html?f=FAC-XXXX'.\nResultado Esperado: Se visualiza la factura digital centrada en alto contraste (#1E293B sobre blanco), con resolución DIAN, desglose de IVA y productos, sin solicitar contraseña y sin revelar los lotes ni costos internos PEPS de la tienda.",
            "16A34A",
            "F0FDF4"
          ),
          new Paragraph({ text: "", spacing: { after: 140 } }),

          // Prueba 4
          createCallout(
            "ESCENARIO DE PRUEBA 4: Control de Privilegios del Rol Cajero y Cuadre de Caja del Turno",
            "1. Cierre sesión e inicie como Cajero (cajero@tienda.com / cajero123).\n2. Compruebe que el sidebar solo muestra 'Punto de Venta' y que no tiene acceso al Catálogo ni a los Reportes Gerenciales.\n3. En la barra superior, abra 'Cierre y Cuadre de Caja'.\n4. Verifique el módulo 'Detalle de Ventas del Turno (Hoy)', filtre por número de factura y use 'Ver / Tirilla'. Ingrese dinero en 'Efectivo Contado' y compruebe el cálculo reactivo de cuadre exacto/sobrante/faltante.\nResultado Esperado: Se cumple estrictamente el principio de mínimo privilegio; el cajero puede operar y cuadrar su caja, pero no puede visualizar costos de compra, márgenes ni balances financieros de la empresa.",
            "D97706",
            "FFFBEB"
          ),

          new Paragraph({ text: "", spacing: { after: 360 } }),

          // Nota al Cierre
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 12, color: "1E293B" },
              bottom: { style: BorderStyle.SINGLE, size: 12, color: "1E293B" },
              left: { style: BorderStyle.SINGLE, size: 12, color: "1E293B" },
              right: { style: BorderStyle.SINGLE, size: 12, color: "1E293B" }
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, fill: "F8FAFC" },
                    margins: { top: 160, bottom: 160, left: 200, right: 200 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "NOTA DE CIERRE Y ENTREGABLES FUTUROS:\n", bold: true, size: 21, color: "0F172A" }),
                          new TextRun({
                            text: "El presente documento constituye la especificación de ingeniería y memoria técnica de arquitectura para la auditoría del par evaluador. Conforme a la planificación del proyecto y al cronograma establecido, el Manual de Usuario Final paso a paso (destinado a la capacitación de personal operativo) será entregado formalmente en la siguiente fase.",
                            size: 19,
                            color: "475569",
                            italics: true
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(__dirname, 'Documentacion_Tecnica_POS_PEPS.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`Documento Word generado exitosamente: ${docxPath} (${buffer.length} bytes)`);
}

buildDocx().catch(err => {
  console.error('Error generando DOCX:', err);
});
