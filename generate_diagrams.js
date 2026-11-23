const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, 'docs_assets');
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

// --------------------------------------------------------------------------
// DIAGRAMA 1: Casos de Uso UML (Administrador vs Cajero)
// --------------------------------------------------------------------------
const svgCasosUso = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1050" height="720" viewBox="0 0 1050 720" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#EDF2F7"/>
    </linearGradient>
    <linearGradient id="adminGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <linearGradient id="cajeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#0F766E"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="115%" filterUnits="userSpaceOnUse">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Fondo General -->
  <rect width="1050" height="720" fill="url(#bgGrad)"/>

  <!-- Título del Diagrama -->
  <text x="525" y="40" text-anchor="middle" font-size="22" font-weight="800" fill="#0F172A">DIAGRAMA DE CASOS DE USO UML: SISTEMA POS &amp; INVENTARIO PEPS</text>
  <text x="525" y="65" text-anchor="middle" font-size="13" font-weight="500" fill="#64748B">Definición de Límites del Sistema y Matriz de Privilegios por Rol (Administrador y Cajero)</text>

  <!-- Límite del Sistema (System Boundary) -->
  <rect x="230" y="90" width="590" height="600" rx="16" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" filter="url(#shadow)"/>
  <rect x="230" y="90" width="590" height="38" rx="16" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1"/>
  <text x="525" y="115" text-anchor="middle" font-size="14" font-weight="700" fill="#334155" letter-spacing="0.5">SISTEMA POS &amp; GESTIÓN COMERCIAL PEPS (LÍMITE DEL SISTEMA)</text>

  <!-- ACTOR 1: Administrador (Izquierda) -->
  <g transform="translate(100, 310)">
    <!-- Stick figure -->
    <circle cx="0" cy="-45" r="22" fill="#E2E8F0" stroke="#1E293B" stroke-width="3"/>
    <path d="M 0,-23 L 0,35 M -28,-3 L 28,-3 M 0,35 L -22,85 M 0,35 L 22,85" stroke="#1E293B" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="-65" y="95" width="130" height="32" rx="8" fill="url(#adminGrad)"/>
    <text x="0" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF">ADMINISTRADOR</text>
    <text x="0" y="142" text-anchor="middle" font-size="11" font-weight="600" fill="#64748B">Acceso Total / Auditoría</text>
  </g>

  <!-- ACTOR 2: Cajero (Derecha) -->
  <g transform="translate(950, 340)">
    <!-- Stick figure -->
    <circle cx="0" cy="-45" r="22" fill="#CCFBF1" stroke="#0D9488" stroke-width="3"/>
    <path d="M 0,-23 L 0,35 M -28,-3 L 28,-3 M 0,35 L -22,85 M 0,35 L 22,85" stroke="#0D9488" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="-55" y="95" width="110" height="32" rx="8" fill="url(#cajeroGrad)"/>
    <text x="0" y="116" text-anchor="middle" font-size="13" font-weight="700" fill="#FFFFFF">CAJERO</text>
    <text x="0" y="142" text-anchor="middle" font-size="11" font-weight="600" fill="#0D9488">Operación Punto de Venta</text>
  </g>

  <!-- LINEAS DE ASOCIACIÓN ADMINISTRADOR -->
  <!-- Admin a Login -->
  <line x1="160" y1="280" x2="330" y2="160" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Catálogo -->
  <line x1="165" y1="300" x2="330" y2="215" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Compras Lotes -->
  <line x1="170" y1="320" x2="330" y2="270" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Semáforo -->
  <line x1="170" y1="340" x2="330" y2="325" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Kardex -->
  <line x1="170" y1="360" x2="330" y2="380" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Novedades -->
  <line x1="170" y1="380" x2="330" y2="435" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a POS -->
  <line x1="170" y1="400" x2="420" y2="490" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Reportes -->
  <line x1="165" y1="420" x2="330" y2="600" stroke="#94A3B8" stroke-width="1.8"/>
  <!-- Admin a Arqueo -->
  <line x1="165" y1="440" x2="420" y2="655" stroke="#94A3B8" stroke-width="1.8"/>

  <!-- LINEAS DE ASOCIACIÓN CAJERO -->
  <!-- Cajero a Login -->
  <line x1="885" y1="320" x2="680" y2="160" stroke="#0D9488" stroke-width="2"/>
  <!-- Cajero a POS -->
  <line x1="885" y1="360" x2="630" y2="490" stroke="#0D9488" stroke-width="2.2"/>
  <!-- Cajero a Arqueo / Cierre -->
  <line x1="885" y1="410" x2="630" y2="655" stroke="#0D9488" stroke-width="2"/>

  <!-- CASOS DE USO (ÓVALOS) -->

  <!-- CU-01: Autenticación -->
  <g transform="translate(525, 160)">
    <ellipse cx="0" cy="0" rx="155" ry="21" fill="#F8FAFC" stroke="#334155" stroke-width="1.8"/>
    <text x="0" y="5" text-anchor="middle" font-size="12" font-weight="700" fill="#0F172A">CU-01: Autenticación y Control de Roles</text>
  </g>

  <!-- CU-02: Gestión de Catálogo y Márgenes -->
  <g transform="translate(420, 215)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">CU-02: Catálogo, Categorías y Márgenes</text>
  </g>

  <!-- CU-03: Recepción de Mercancía por Lotes -->
  <g transform="translate(420, 270)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">CU-03: Recepción de Mercancía por Lotes (PEPS)</text>
  </g>

  <!-- CU-04: Monitoreo de Vencimientos -->
  <g transform="translate(420, 325)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">CU-04: Semáforo Preventivo y Bloqueo</text>
  </g>

  <!-- Kardex PEPS -->
  <g transform="translate(420, 380)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">Trazabilidad Cronológica de Kardex PEPS</text>
  </g>

  <!-- CU-06: Novedades / Bajas -->
  <g transform="translate(420, 435)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">CU-06: Registro de Devoluciones y Mermas</text>
  </g>

  <!-- CU-05: Facturación en Punto de Cobro POS (Ambos) -->
  <g transform="translate(525, 490)">
    <ellipse cx="0" cy="0" rx="175" ry="23" fill="#F0FDF4" stroke="#16A34A" stroke-width="2.2"/>
    <text x="0" y="5" text-anchor="middle" font-size="12" font-weight="700" fill="#15803D">CU-05: Facturación en Punto de Venta POS (PEPS)</text>
  </g>

  <!-- INCLUDE: Emisión de Tirilla y QR Dinámico -->
  <g transform="translate(525, 545)">
    <ellipse cx="0" cy="0" rx="160" ry="20" fill="#EFF6FF" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="4,3"/>
    <text x="0" y="5" text-anchor="middle" font-size="11" font-weight="600" fill="#1D4ED8">Emisión de Factura DIAN con QR Público</text>
  </g>
  <!-- Flecha include -->
  <line x1="525" y1="513" x2="525" y2="525" stroke="#2563EB" stroke-width="1.5" stroke-dasharray="3,3"/>
  <polygon points="525,525 522,519 528,519" fill="#2563EB"/>
  <text x="560" y="522" font-size="10" font-weight="700" fill="#2563EB">&lt;&lt;include&gt;&gt;</text>

  <!-- CU-08: Reportes Gerenciales y Rentabilidad PEPS -->
  <g transform="translate(420, 600)">
    <ellipse cx="0" cy="0" rx="160" ry="21" fill="#F8FAFC" stroke="#475569" stroke-width="1.5"/>
    <text x="0" y="5" text-anchor="middle" font-size="11.5" font-weight="600" fill="#1E293B">CU-08: Reportes Gerenciales y Exportación</text>
  </g>

  <!-- CU-07: Cierre y Cuadre de Caja (Ambos) -->
  <g transform="translate(525, 655)">
    <ellipse cx="0" cy="0" rx="170" ry="22" fill="#FEF3C7" stroke="#D97706" stroke-width="2"/>
    <text x="0" y="5" text-anchor="middle" font-size="12" font-weight="700" fill="#B45309">CU-07: Arqueo, Historial del Día y Cierre de Caja</text>
  </g>
</svg>`;

// --------------------------------------------------------------------------
// DIAGRAMA 2: Arquitectura Cloud Distribuida (Render + TiDB Cloud SSL)
// --------------------------------------------------------------------------
const svgArquitectura = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1050" height="680" viewBox="0 0 1050 680" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bgArqui" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#1E293B"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0D9488"/>
      <stop offset="100%" stop-color="#14B8A6"/>
    </linearGradient>
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EA580C"/>
      <stop offset="100%" stop-color="#F97316"/>
    </linearGradient>
    <filter id="shadowDark" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <rect width="1050" height="680" fill="url(#bgArqui)"/>

  <!-- Título -->
  <text x="525" y="45" text-anchor="middle" font-size="22" font-weight="800" fill="#F8FAFC">ARQUITECTURA CLOUD DISTRIBUIDA Y MODELO MULTICAPA</text>
  <text x="525" y="70" text-anchor="middle" font-size="13" font-weight="500" fill="#94A3B8">Despliegue Serverless en Render (PaaS) con Base de Datos Distribuida en TiDB Cloud (DBaaS - TLS/SSL)</text>

  <!-- CAPA 1: CLIENTES Y NAVEGADORES -->
  <g transform="translate(60, 110)">
    <rect width="260" height="500" rx="14" fill="url(#cardGrad)" stroke="#475569" stroke-width="1.5" filter="url(#shadowDark)"/>
    <rect width="260" height="42" rx="14" fill="#0F172A" stroke="#475569" stroke-width="1"/>
    <text x="130" y="27" text-anchor="middle" font-size="13" font-weight="800" fill="#38BDF8">1. CAPA DE PRESENTACIÓN</text>

    <!-- Dispositivos -->
    <g transform="translate(20, 65)">
      <rect width="220" height="90" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="110" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#F8FAFC">Dispositivos Clientes</text>
      <text x="110" y="48" text-anchor="middle" font-size="11" fill="#94A3B8">Computadores de Caja (POS)</text>
      <text x="110" y="66" text-anchor="middle" font-size="11" fill="#94A3B8">Tablets &amp; Celulares (Responsive)</text>
    </g>

    <!-- Frontend SPA -->
    <g transform="translate(20, 175)">
      <rect width="220" height="150" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="110" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#2DD4BF">Frontend SPA (Vanilla JS)</text>
      <text x="20" y="52" font-size="11" fill="#E2E8F0">• HTML5 Semántico + Dark Matte</text>
      <text x="20" y="72" font-size="11" fill="#E2E8F0">• Tailwind CSS Responsive Engine</text>
      <text x="20" y="92" font-size="11" fill="#E2E8F0">• Chart.js (Curvas y Tendencias)</text>
      <text x="20" y="112" font-size="11" fill="#E2E8F0">• QRCode.js (Generador DIAN)</text>
      <text x="20" y="132" font-size="11" fill="#E2E8F0">• SheetJS (.xlsx) + jsPDF (PDF)</text>
    </g>

    <!-- Vista Pública -->
    <g transform="translate(20, 345)">
      <rect width="220" height="125" rx="8" fill="#0F172A" stroke="#0EA5E9"/>
      <text x="110" y="28" text-anchor="middle" font-size="12" font-weight="700" fill="#38BDF8">Página Pública de Factura</text>
      <text x="110" y="48" text-anchor="middle" font-size="10.5" font-weight="600" fill="#E2E8F0">factura.html?f=FAC-XXXX</text>
      <text x="20" y="72" font-size="10.5" fill="#94A3B8">• Acceso público sin login</text>
      <text x="20" y="90" font-size="10.5" fill="#94A3B8">• Consulta digital por QR</text>
      <text x="20" y="108" font-size="10.5" fill="#94A3B8">• Impresión de tirilla limpia</text>
    </g>
  </g>

  <!-- CANAL DE COMUNICACIÓN 1: HTTPS -->
  <g transform="translate(320, 340)">
    <line x1="0" y1="0" x2="65" y2="0" stroke="#38BDF8" stroke-width="3" stroke-dasharray="6,4"/>
    <polygon points="65,0 55,-6 55,6" fill="#38BDF8"/>
    <polygon points="0,0 10,-6 10,6" fill="#38BDF8"/>
    <rect x="-10" y="-35" width="85" height="24" rx="6" fill="#0F172A" stroke="#38BDF8"/>
    <text x="32" y="-19" text-anchor="middle" font-size="10.5" font-weight="800" fill="#38BDF8">HTTPS / JSON</text>
  </g>

  <!-- CAPA 2: SERVIDOR BACKEND (RENDER PAAS) -->
  <g transform="translate(395, 110)">
    <rect width="275" height="500" rx="14" fill="url(#cardGrad)" stroke="#475569" stroke-width="1.5" filter="url(#shadowDark)"/>
    <rect width="275" height="42" rx="14" fill="#0F172A" stroke="#475569" stroke-width="1"/>
    <text x="137" y="27" text-anchor="middle" font-size="13" font-weight="800" fill="#2DD4BF">2. BACKEND (RENDER CLOUD)</text>

    <!-- Node.js + Express -->
    <g transform="translate(18, 60)">
      <rect width="239" height="70" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="119" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#4ADE80">Node.js (v22) + Express.js</text>
      <text x="119" y="46" text-anchor="middle" font-size="10.5" fill="#94A3B8">Servidor RESTful, CORS &amp; Static Files</text>
    </g>

    <!-- Controladores -->
    <g transform="translate(18, 145)">
      <rect width="239" height="110" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="119" y="24" text-anchor="middle" font-size="11.5" font-weight="700" fill="#F8FAFC">Controladores de Rutas API</text>
      <text x="20" y="46" font-size="10.5" fill="#E2E8F0">• VentasController (POS &amp; Hoy)</text>
      <text x="20" y="66" font-size="10.5" fill="#E2E8F0">• ComprasController (Recepción Lotes)</text>
      <text x="20" y="86" font-size="10.5" fill="#E2E8F0">• ReportesController (Métricas &amp; Kardex)</text>
      <text x="20" y="104" font-size="10.5" fill="#E2E8F0">• Factura Pública (/api/public/factura)</text>
    </g>

    <!-- Motor de Dominio -->
    <g transform="translate(18, 270)">
      <rect width="239" height="120" rx="8" fill="#0F172A" stroke="#14B8A6"/>
      <text x="119" y="24" text-anchor="middle" font-size="11.5" font-weight="700" fill="#2DD4BF">Servicios de Dominio</text>
      <text x="20" y="46" font-size="10.5" fill="#E2E8F0">• PepsService (Algoritmo FIFO)</text>
      <text x="20" y="66" font-size="10.5" fill="#E2E8F0">• DianService (CUFE, QR, IVA 0-5-19)</text>
      <text x="20" y="86" font-size="10.5" fill="#E2E8F0">• Anti-Loss Margin Engine</text>
      <text x="20" y="106" font-size="10.5" fill="#E2E8F0">• Semáforo Expiration Checker</text>
    </g>

    <!-- Pool de Conexiones -->
    <g transform="translate(18, 405)">
      <rect width="239" height="75" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="119" y="25" text-anchor="middle" font-size="11.5" font-weight="700" fill="#FBBF24">mysql2/promise Pool</text>
      <text x="119" y="45" text-anchor="middle" font-size="10.5" fill="#94A3B8">Transacciones ACID: commit/rollback</text>
      <text x="119" y="63" text-anchor="middle" font-size="10.5" fill="#F87171">Bloqueo Pesimista (FOR UPDATE)</text>
    </g>
  </g>

  <!-- CANAL DE COMUNICACIÓN 2: SSL/TLS TI-DB -->
  <g transform="translate(670, 340)">
    <line x1="0" y1="0" x2="65" y2="0" stroke="#F97316" stroke-width="3" stroke-dasharray="6,4"/>
    <polygon points="65,0 55,-6 55,6" fill="#F97316"/>
    <polygon points="0,0 10,-6 10,6" fill="#F97316"/>
    <rect x="-10" y="-35" width="85" height="24" rx="6" fill="#0F172A" stroke="#F97316"/>
    <text x="32" y="-19" text-anchor="middle" font-size="10.5" font-weight="800" fill="#F97316">TLS/SSL (4000)</text>
  </g>

  <!-- CAPA 3: BASE DE DATOS DISTRIBUIDA (TIDB CLOUD) -->
  <g transform="translate(745, 110)">
    <rect width="245" height="500" rx="14" fill="url(#cardGrad)" stroke="#475569" stroke-width="1.5" filter="url(#shadowDark)"/>
    <rect width="245" height="42" rx="14" fill="#0F172A" stroke="#475569" stroke-width="1"/>
    <text x="122" y="27" text-anchor="middle" font-size="13" font-weight="800" fill="#FB923C">3. DATOS (TIDB CLOUD)</text>

    <!-- Cluster Serverless -->
    <g transform="translate(15, 65)">
      <rect width="215" height="85" rx="8" fill="#0F172A" stroke="#EA580C"/>
      <text x="107" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="#F97316">Clúster TiDB Serverless</text>
      <text x="107" y="46" text-anchor="middle" font-size="10.5" fill="#94A3B8">MySQL 8.0 Compatible</text>
      <text x="107" y="65" text-anchor="middle" font-size="10.5" fill="#94A3B8">Alta Disponibilidad Multi-Zona</text>
    </g>

    <!-- Esquema Relacional -->
    <g transform="translate(15, 165)">
      <rect width="215" height="305" rx="8" fill="#0F172A" stroke="#334155"/>
      <text x="107" y="26" text-anchor="middle" font-size="11.5" font-weight="700" fill="#F8FAFC">13 Tablas Relacionales (3FN)</text>
      <text x="20" y="52" font-size="10.5" fill="#E2E8F0">1. usuarios</text>
      <text x="20" y="72" font-size="10.5" fill="#E2E8F0">2. roles</text>
      <text x="20" y="92" font-size="10.5" fill="#E2E8F0">3. sesiones_usuarios</text>
      <text x="20" y="112" font-size="10.5" fill="#E2E8F0">4. categorias (margen_defecto)</text>
      <text x="20" y="132" font-size="10.5" fill="#E2E8F0">5. productos (margen_ganancia)</text>
      <text x="20" y="152" font-size="10.5" fill="#E2E8F0">6. lotes (FIFO por ingreso)</text>
      <text x="20" y="172" font-size="10.5" fill="#E2E8F0">7. proveedores</text>
      <text x="20" y="192" font-size="10.5" fill="#E2E8F0">8. compras</text>
      <text x="20" y="212" font-size="10.5" fill="#E2E8F0">9. detalle_compras</text>
      <text x="20" y="232" font-size="10.5" fill="#E2E8F0">10. clientes</text>
      <text x="20" y="252" font-size="10.5" fill="#E2E8F0">11. ventas_facturas (CUFE/QR)</text>
      <text x="20" y="272" font-size="10.5" fill="#E2E8F0">12. detalle_ventas (costo_lote)</text>
      <text x="20" y="292" font-size="10.5" fill="#2DD4BF">13. kardex_movimientos (PEPS)</text>
    </g>
  </g>

  <!-- Pie de Arquitectura -->
  <rect x="60" y="625" width="930" height="35" rx="8" fill="#1E293B" stroke="#334155"/>
  <text x="525" y="647" text-anchor="middle" font-size="11.5" font-weight="600" fill="#94A3B8">
    Cumplimiento de Seguridad: Cero almacenamiento de secretos en frontend • Autenticación de sesiones en BD • Transacciones ACID atómicas
  </text>
</svg>`;

// --------------------------------------------------------------------------
// DIAGRAMA 3: Algoritmo PEPS (FIFO) & Cálculo de Márgenes Anti-Pérdida
// --------------------------------------------------------------------------
const svgFlujoPeps = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1050" height="740" viewBox="0 0 1050 740" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
  <defs>
    <linearGradient id="bgFlujo" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#EEF2F6"/>
    </linearGradient>
    <filter id="shadowLight" x="-5%" y="-5%" width="110%" height="115%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.08"/>
    </filter>
  </defs>

  <rect width="1050" height="740" fill="url(#bgFlujo)"/>

  <!-- Título -->
  <text x="525" y="38" text-anchor="middle" font-size="21" font-weight="800" fill="#0F172A">DIAGRAMA DE FLUJO: ALGORITMO CONTABLE PEPS Y REGLA ANTI-PÉRDIDA</text>
  <text x="525" y="62" text-anchor="middle" font-size="13" font-weight="500" fill="#64748B">Ciclo de Vida de los Lotes: Entrada, Fijación Dinámica de Precios, Bloqueo de Caducidad y Consumo FIFO</text>

  <!-- CARRIL IZQUIERDO: INGRESO DE MERCANCÍA & FIJACIÓN DE PRECIOS -->
  <rect x="50" y="85" width="450" height="625" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" filter="url(#shadowLight)"/>
  <rect x="50" y="85" width="450" height="38" rx="14" fill="#E0F2FE" stroke="#BAE6FD" stroke-width="1"/>
  <text x="275" y="110" text-anchor="middle" font-size="13" font-weight="800" fill="#0369A1">FASE 1: RECEPCIÓN Y MÁRGENES (COMPRAS)</text>

  <!-- Paso 1.1: Entrada de Lote -->
  <g transform="translate(100, 140)">
    <rect width="350" height="52" rx="8" fill="#F8FAFC" stroke="#0284C7" stroke-width="1.5"/>
    <text x="175" y="24" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0F172A">Recepción de Lote: Cantidad, Costo y Vencimiento</text>
    <text x="175" y="42" text-anchor="middle" font-size="10.5" fill="#64748B">Registra fecha_ingreso = NOW(), fecha_vencimiento</text>
  </g>
  <line x1="275" y1="192" x2="275" y2="215" stroke="#0284C7" stroke-width="2"/>
  <polygon points="275,215 271,207 279,207" fill="#0284C7"/>

  <!-- Paso 1.2: Decisión Anti-Pérdida -->
  <g transform="translate(275, 260)">
    <polygon points="0,-35 150,0 0,35 -150,0" fill="#FEF3C7" stroke="#D97706" stroke-width="1.8"/>
    <text x="0" y="-6" text-anchor="middle" font-size="11" font-weight="800" fill="#92400E">¿Costo Nuevo Lote &gt;</text>
    <text x="0" y="12" text-anchor="middle" font-size="11" font-weight="800" fill="#92400E">Costo Anterior?</text>
  </g>

  <!-- Rama SÍ: Recalcular Precio -->
  <line x1="275" y1="295" x2="275" y2="330" stroke="#16A34A" stroke-width="2"/>
  <polygon points="275,330 271,322 279,322" fill="#16A34A"/>
  <text x="290" y="315" font-size="11" font-weight="800" fill="#16A34A">SÍ (Mayor Costo)</text>

  <g transform="translate(100, 330)">
    <rect width="350" height="56" rx="8" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5"/>
    <text x="175" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="#166534">Recalcular Precio Base Anti-Pérdida</text>
    <text x="175" y="42" text-anchor="middle" font-size="10.5" font-family="monospace" fill="#15803D">Precio Base = Costo_Nuevo * (1 + %Margen)</text>
  </g>

  <!-- Rama NO: Mantener Precio -->
  <line x1="125" y1="260" x2="70" y2="260" stroke="#64748B" stroke-width="1.8"/>
  <line x1="70" y1="260" x2="70" y2="430" stroke="#64748B" stroke-width="1.8"/>
  <line x1="70" y1="430" x2="100" y2="430" stroke="#64748B" stroke-width="1.8"/>
  <polygon points="100,430 92,426 92,434" fill="#64748B"/>
  <text x="75" y="250" font-size="10" font-weight="700" fill="#64748B">NO</text>

  <g transform="translate(100, 410)">
    <rect width="350" height="50" rx="8" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5"/>
    <text x="175" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="#334155">Mantener Precio de Venta Actual</text>
    <text x="175" y="38" text-anchor="middle" font-size="10.5" fill="#64748B">Se protege el margen de rentabilidad comercial</text>
  </g>

  <!-- Paso 1.3: Asentar Lote en BD -->
  <line x1="275" y1="386" x2="275" y2="410" stroke="#16A34A" stroke-width="1.8"/>
  <line x1="275" y1="460" x2="275" y2="490" stroke="#0284C7" stroke-width="2"/>
  <polygon points="275,490 271,482 279,482" fill="#0284C7"/>

  <g transform="translate(100, 490)">
    <rect width="350" height="54" rx="8" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.5"/>
    <text x="175" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0369A1">Asentar Lote y Actualizar Stock Total</text>
    <text x="175" y="42" text-anchor="middle" font-size="10.5" fill="#64748B">Inserta en 'lotes', 'compras' y 'kardex_movimientos'</text>
  </g>

  <!-- Paso 1.4: Semáforo Preventivo -->
  <line x1="275" y1="544" x2="275" y2="570" stroke="#0284C7" stroke-width="2"/>
  <polygon points="275,570 271,562 279,562" fill="#0284C7"/>

  <g transform="translate(100, 570)">
    <rect width="350" height="60" rx="8" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1.5"/>
    <text x="175" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="#B45309">Clasificación en Semáforo de Vencimiento</text>
    <text x="175" y="40" text-anchor="middle" font-size="10.5" fill="#D97706">Verde (&gt;30d) | Amarillo (≤30d) | Rojo (&lt;0d Caducado)</text>
  </g>


  <!-- CARRIL DERECHO: SALIDA EN POS BAJO ALGORITMO PEPS -->
  <rect x="550" y="85" width="450" height="625" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" filter="url(#shadowLight)"/>
  <rect x="550" y="85" width="450" height="38" rx="14" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>
  <text x="775" y="110" text-anchor="middle" font-size="13" font-weight="800" fill="#15803D">FASE 2: DESCUENTO PEPS EN VENTA (POS)</text>

  <!-- Paso 2.1: Solicitud de Venta -->
  <g transform="translate(600, 140)">
    <rect width="350" height="48" rx="8" fill="#F8FAFC" stroke="#16A34A" stroke-width="1.5"/>
    <text x="175" y="22" text-anchor="middle" font-size="11.5" font-weight="700" fill="#0F172A">Cliente Solicita N Unidades de Producto</text>
    <text x="175" y="38" text-anchor="middle" font-size="10.5" fill="#64748B">Inicia transacción ACID en pool MySQL (START TRANSACTION)</text>
  </g>
  <line x1="775" y1="188" x2="775" y2="210" stroke="#16A34A" stroke-width="2"/>
  <polygon points="775,210 771,202 779,202" fill="#16A34A"/>

  <!-- Paso 2.2: Consulta de Lotes Vigentes con Bloqueo -->
  <g transform="translate(600, 210)">
    <rect width="350" height="60" rx="8" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5"/>
    <text x="175" y="20" text-anchor="middle" font-size="11.5" font-weight="700" fill="#166534">Consulta SQL PEPS + Bloqueo Pesimista</text>
    <text x="175" y="38" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#15803D">WHERE fecha_vencimiento &gt;= CURDATE()</text>
    <text x="175" y="52" text-anchor="middle" font-size="9.5" font-family="monospace" fill="#15803D">ORDER BY fecha_ingreso ASC FOR UPDATE</text>
  </g>
  <line x1="775" y1="270" x2="775" y2="295" stroke="#16A34A" stroke-width="2"/>
  <polygon points="775,295 771,287 779,287" fill="#16A34A"/>

  <!-- Paso 2.3: Validación de Stock Vigente -->
  <g transform="translate(775, 335)">
    <polygon points="0,-35 150,0 0,35 -150,0" fill="#FEF2F2" stroke="#EF4444" stroke-width="1.8"/>
    <text x="0" y="-6" text-anchor="middle" font-size="11" font-weight="800" fill="#991B1B">¿Stock Vigente No Vencido</text>
    <text x="0" y="12" text-anchor="middle" font-size="11" font-weight="800" fill="#991B1B">&gt;= Demanda?</text>
  </g>

  <!-- Rama NO: Bloqueo Semáforo -->
  <line x1="925" y1="335" x2="980" y2="335" stroke="#EF4444" stroke-width="2"/>
  <line x1="980" y1="335" x2="980" y2="400" stroke="#EF4444" stroke-width="2"/>
  <polygon points="980,400 976,392 984,392" fill="#EF4444"/>
  <text x="935" y="325" font-size="10.5" font-weight="800" fill="#EF4444">NO</text>

  <g transform="translate(860, 400)">
    <rect width="130" height="54" rx="8" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.5"/>
    <text x="65" y="20" text-anchor="middle" font-size="10.5" font-weight="800" fill="#991B1B">Bloqueo Preventivo</text>
    <text x="65" y="36" text-anchor="middle" font-size="9" fill="#B91C1C">Rollback Transacción</text>
    <text x="65" y="48" text-anchor="middle" font-size="9" fill="#B91C1C">¡Impide venta vencida!</text>
  </g>

  <!-- Rama SÍ: Iteración de Consumo FIFO -->
  <line x1="775" y1="370" x2="775" y2="405" stroke="#16A34A" stroke-width="2"/>
  <polygon points="775,405 771,397 779,397" fill="#16A34A"/>
  <text x="785" y="390" font-size="11" font-weight="800" fill="#16A34A">SÍ</text>

  <g transform="translate(600, 405)">
    <rect width="250" height="65" rx="8" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.5"/>
    <text x="125" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="#166534">Consumir Lote más Antiguo (FIFO)</text>
    <text x="125" y="38" text-anchor="middle" font-size="10" fill="#15803D">Descontar aDescontar = min(disp, rest)</text>
    <text x="125" y="54" text-anchor="middle" font-size="10" fill="#15803D">Asentar tramo en detalle_ventas</text>
  </g>

  <!-- ¿Demanda satisfecha? -->
  <line x1="725" y1="470" x2="725" y2="495" stroke="#16A34A" stroke-width="2"/>
  <polygon points="725,495 721,487 729,487" fill="#16A34A"/>

  <g transform="translate(600, 495)">
    <rect width="350" height="60" rx="8" fill="#F8FAFC" stroke="#0D9488" stroke-width="1.5"/>
    <text x="175" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="#0F766E">División Multitramo Automática</text>
    <text x="175" y="36" text-anchor="middle" font-size="10" fill="#475569">Si demanda &gt; lote 1: agota lote 1 y pasa a lote 2</text>
    <text x="175" y="52" text-anchor="middle" font-size="10" font-family="monospace" fill="#0D9488">CMV = Σ(cant_i * costo_lote_i)</text>
  </g>

  <!-- Paso 2.5: Factura, QR y Utilidad Real -->
  <line x1="775" y1="555" x2="775" y2="580" stroke="#0D9488" stroke-width="2"/>
  <polygon points="775,580 771,572 779,572" fill="#0D9488"/>

  <g transform="translate(600, 580)">
    <rect width="350" height="68" rx="8" fill="#ECFDF5" stroke="#059669" stroke-width="2"/>
    <text x="175" y="20" text-anchor="middle" font-size="11.5" font-weight="800" fill="#065F46">Cierre Transaccional (COMMIT)</text>
    <text x="175" y="38" text-anchor="middle" font-size="10" fill="#047857">• Asienta Kardex PEPS con saldo resultante</text>
    <text x="175" y="52" text-anchor="middle" font-size="10" fill="#047857">• Calcula Utilidad Real = VentaBase - CMV</text>
    <text x="175" y="64" text-anchor="middle" font-size="10" fill="#047857">• Genera CUFE + QR con enlace factura.html</text>
  </g>
</svg>`;

fs.writeFileSync(path.join(ASSETS_DIR, 'diagrama1_casos_uso.svg'), svgCasosUso, 'utf8');
fs.writeFileSync(path.join(ASSETS_DIR, 'diagrama2_arquitectura.svg'), svgArquitectura, 'utf8');
fs.writeFileSync(path.join(ASSETS_DIR, 'diagrama3_flujo_peps.svg'), svgFlujoPeps, 'utf8');

console.log('SVGs generados exitosamente en docs_assets/');

// Renderizar cada SVG a PNG utilizando Edge Headless
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const diagrams = [
  { id: 1, name: 'diagrama1_casos_uso', w: 1050, h: 720 },
  { id: 2, name: 'diagrama2_arquitectura', w: 1050, h: 680 },
  { id: 3, name: 'diagrama3_flujo_peps', w: 1050, h: 740 }
];

for (const d of diagrams) {
  const svgFile = path.join(ASSETS_DIR, `${d.name}.svg`);
  const pngFile = path.join(ASSETS_DIR, `${d.name}.png`);
  const htmlWrapper = path.join(ASSETS_DIR, `render_${d.name}.html`);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
    svg { display: block; width: ${d.w}px; height: ${d.h}px; }
  </style>
</head>
<body>
  ${fs.readFileSync(svgFile, 'utf8')}
</body>
</html>`;

  fs.writeFileSync(htmlWrapper, htmlContent, 'utf8');

  try {
    const cmd = `cmd.exe /c '"${edgePath}" --headless --disable-gpu --screenshot="${pngFile}" --window-size=${d.w},${d.h} "file:///${htmlWrapper.replace(/\\\\/g, '/')}"'`;
    execSync(cmd, { stdio: 'ignore' });
    console.log(`PNG generado: ${d.name}.png`);
  } catch (err) {
    console.error(`Error renderizando ${d.name}:`, err.message);
  }
}
