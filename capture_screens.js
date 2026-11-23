const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, 'docs_assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function capture() {
  console.log('Iniciando navegador Edge para captura de pantallas...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    defaultViewport: { width: 1366, height: 768, deviceScaleFactor: 1.5 }
  });

  const page = await browser.newPage();

  try {
    // 1. LOGIN
    console.log('1. Capturando Pantalla de Login...');
    await page.goto('http://localhost:3000/login.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_01_login.png') });

    // Iniciar sesión como Administrador
    await page.type('#correo', 'admin@tienda.com');
    await page.type('#password', 'admin123');
    await Promise.all([
      page.click('button.btn-login'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);
    await new Promise(r => setTimeout(r, 1500));

    // 2. DASHBOARD (RESUMEN OPERATIVO)
    console.log('2. Capturando Resumen Operativo (Dashboard)...');
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_02_dashboard.png') });

    // 3. PUNTO DE COBRO (POS) CON BLOQUEO PREVENTIVO
    console.log('3. Capturando Punto de Cobro con Bloqueo Preventivo...');
    await page.evaluate(() => {
      App.cambiarVista('pos');
      // Simular alerta reactiva de bloqueo por lote vencido
      App.toast('Bloqueo por Semáforo / Stock: No hay inventario vigente para "Yogurt Natural 1L". Lotes restantes vencidos.', 'danger');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_03_pos_bloqueo.png') });

    // 4. RECEPCIÓN DE MERCANCÍA (COMPRAS Y MARGEN)
    console.log('4. Capturando Recepción de Mercancía...');
    await page.evaluate(() => {
      App.cambiarVista('compras');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_04_recepcion_mercancia.png') });

    // 5. MOVIMIENTOS PEPS (KARDEX)
    console.log('5. Capturando Movimientos de Inventario (Kardex PEPS)...');
    await page.evaluate(() => {
      App.cambiarVista('kardex');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_05_kardex_peps.png') });

    // 6. CONTROL DE VENCIMIENTOS (SEMÁFORO)
    console.log('6. Capturando Semáforo de Vencimientos...');
    await page.evaluate(() => {
      App.cambiarVista('semaforo');
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_06_semaforo_vencimientos.png') });

    // 7. CIERRE Y CUADRE DE CAJA (MODAL CON HISTORIAL DE HOY)
    console.log('7. Capturando Cierre y Cuadre de Caja...');
    await page.evaluate(() => {
      App.abrirArqueoCaja();
    });
    await new Promise(r => setTimeout(r, 1000));
    // Escribir un monto en arqueo fisico para mostrar validación de cuadre
    await page.evaluate(() => {
      const input = document.getElementById('arqueo-fisico');
      if (input) {
        input.value = '142800';
        App.calcularCuadreCaja();
      }
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_07_cierre_caja.png') });

    // Cerrar modal de arqueo
    await page.evaluate(() => {
      App.cerrarArqueoCaja();
    });
    await new Promise(r => setTimeout(r, 400));

    // 8. REPORTES GERENCIALES (BOTONES EXCEL/PDF Y GRÁFICAS)
    console.log('8. Capturando Reportes Gerenciales...');
    await page.evaluate(() => {
      App.cambiarVista('reportes');
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_08_reportes_gerenciales.png') });

    // 9. VISTA PÚBLICA DE FACTURA DIGITAL (factura.html)
    console.log('9. Capturando Vista Pública de Factura Digital...');
    await page.goto('http://localhost:3000/factura.html?f=FAC-00000001', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ASSETS_DIR, 'screen_09_factura_publica.png') });

    console.log('¡Todas las 9 capturas fueron tomadas exitosamente!');
  } catch (err) {
    console.error('Error durante la captura:', err);
  } finally {
    await browser.close();
  }
}

capture();
