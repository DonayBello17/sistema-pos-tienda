const http = require('http');
const app = require('./server');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    console.log('\n--- PRUEBA 1: Bloqueo 403 Forbidden para usuarios no autenticados en rutas protegidas ---');
    const r1 = await fetch(`${baseUrl}/api/reportes/gerenciales`);
    assert(r1.status === 403, 'GET /api/reportes/gerenciales sin credenciales devuelve 403 Forbidden');

    const r2 = await fetch(`${baseUrl}/api/reportes/kardex`);
    assert(r2.status === 403, 'GET /api/reportes/kardex sin credenciales devuelve 403 Forbidden');

    const r3 = await fetch(`${baseUrl}/api/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(r3.status === 403, 'POST /api/compras sin credenciales devuelve 403 Forbidden');

    const r4 = await fetch(`${baseUrl}/api/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(r4.status === 403, 'POST /api/productos sin credenciales devuelve 403 Forbidden');

    const r5 = await fetch(`${baseUrl}/api/inventario/baja-caducidad`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(r5.status === 403, 'POST /api/inventario/baja-caducidad sin credenciales devuelve 403 Forbidden');

    console.log('\n--- PRUEBA 2: Bloqueo 403 Forbidden para Rol Cajero (id_usuario: 2) en rutas Admin ---');
    const r6 = await fetch(`${baseUrl}/api/reportes/gerenciales`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r6.status === 403, 'Cajero intentando acceder a Reportes Gerenciales recibe 403');

    const r7 = await fetch(`${baseUrl}/api/reportes/kardex`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r7.status === 403, 'Cajero intentando acceder a Kardex recibe 403');

    const r8 = await fetch(`${baseUrl}/api/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2', 'x-user-role': 'Cajero' },
      body: JSON.stringify({ id_proveedor: 1, productos_comprados: [] })
    });
    assert(r8.status === 403, 'Cajero intentando registrar compra recibe 403');

    const r9 = await fetch(`${baseUrl}/api/productos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2', 'x-user-role': 'Cajero' },
      body: JSON.stringify({})
    });
    assert(r9.status === 403, 'Cajero intentando crear producto recibe 403');

    console.log('\n--- PRUEBA 3: Acceso Permitido para Rol Cajero en rutas de POS y Caja ---');
    const r10 = await fetch(`${baseUrl}/api/productos`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r10.status === 200, 'Cajero puede listar productos para POS (200 OK)');

    const r11 = await fetch(`${baseUrl}/api/ventas/clientes`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r11.status === 200, 'Cajero puede listar clientes para POS (200 OK)');

    const r12 = await fetch(`${baseUrl}/api/ventas/hoy`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r12.status === 200, 'Cajero puede consultar ventas del día para arqueo (200 OK)');

    const r13 = await fetch(`${baseUrl}/api/reportes/arqueo/2`, {
      headers: { 'x-user-id': '2', 'x-user-role': 'Cajero' }
    });
    assert(r13.status === 200, 'Cajero puede consultar su arqueo de caja (200 OK)');

    console.log('\n--- PRUEBA 4: Acceso Permitido para Rol Administrador (id_usuario: 1) ---');
    const r14 = await fetch(`${baseUrl}/api/reportes/gerenciales`, {
      headers: { 'x-user-id': '1', 'x-user-role': 'Administrador' }
    });
    assert(r14.status === 200, 'Administrador puede consultar Reportes Gerenciales (200 OK)');

    const r15 = await fetch(`${baseUrl}/api/reportes/kardex`, {
      headers: { 'x-user-id': '1', 'x-user-role': 'Administrador' }
    });
    assert(r15.status === 200, 'Administrador puede consultar Kardex (200 OK)');

    const r16 = await fetch(`${baseUrl}/api/dashboard/metricas`, {
      headers: { 'x-user-id': '1', 'x-user-role': 'Administrador' }
    });
    assert(r16.status === 200, 'Administrador puede consultar Métricas Dashboard (200 OK)');

    console.log('\n--- PRUEBA 5: Validación de Entradas en Ventas (POST /api/ventas) ---');
    const r17 = await fetch(`${baseUrl}/api/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2' },
      body: JSON.stringify({ items: [] })
    });
    assert(r17.status === 400, 'Carrito vacío devuelve 400 Bad Request');

    const r18 = await fetch(`${baseUrl}/api/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2' },
      body: JSON.stringify({ items: [{ id_producto: 1, cantidad: -3 }] })
    });
    const d18 = await r18.json();
    assert(r18.status === 400 && d18.error.includes('Cantidad inválida'), 'Cantidad negativa en venta devuelve 400 Bad Request con mensaje claro');

    const r19 = await fetch(`${baseUrl}/api/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2' },
      body: JSON.stringify({ items: [{ id_producto: 1, cantidad: 0 }] })
    });
    assert(r19.status === 400, 'Cantidad cero en venta devuelve 400 Bad Request');

    const r20 = await fetch(`${baseUrl}/api/ventas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '2' },
      body: JSON.stringify({ items: [{ id_producto: 1, cantidad: 1, precio: -500 }] })
    });
    assert(r20.status === 400, 'Precio negativo en venta devuelve 400 Bad Request');

    console.log('\n--- PRUEBA 6: Validación de Entradas en Compras (POST /api/compras) ---');
    const r21 = await fetch(`${baseUrl}/api/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
      body: JSON.stringify({ id_proveedor: 1, productos_comprados: [{ id_producto: 1, cantidad: -10, costo_unitario: 1000 }] })
    });
    const d21 = await r21.json();
    assert(r21.status === 400 && d21.error.includes('Cantidad inválida'), 'Cantidad negativa en compra devuelve 400 Bad Request');

    const r22 = await fetch(`${baseUrl}/api/compras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': '1' },
      body: JSON.stringify({ id_proveedor: 1, productos_comprados: [{ id_producto: 1, cantidad: 5, costo_unitario: -150 }] })
    });
    const d22 = await r22.json();
    assert(r22.status === 400 && d22.error.includes('Costo unitario inválido'), 'Costo unitario negativo en compra devuelve 400 Bad Request');

    console.log('\n--- PRUEBA 7: Endpoints de Logout ---');
    const r23 = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sesion: 1 })
    });
    const d23 = await r23.json();
    assert(r23.status === 200 && d23.ok === true, 'POST /api/auth/logout responde 200 OK con ok: true');

    const r24 = await fetch(`${baseUrl}/api/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_sesion: 1 })
    });
    assert(r24.status === 200, 'POST /api/logout responde 200 OK');

    console.log('\n--- PRUEBA 8: Cabeceras Anti-Caché (BFCache / Botón Atrás) ---');
    const cacheHeader = r14.headers.get('cache-control');
    assert(cacheHeader && cacheHeader.includes('no-store'), 'Respuesta incluye Cache-Control: no-store para evitar visualización tras logout');

  } catch (err) {
    console.error('Error fatal durante las pruebas:', err);
    failed++;
  } finally {
    server.close();
    console.log(`\n==============================================`);
    console.log(`RESULTADO DE AUDITORÍA: ${passed} PASADAS, ${failed} FALLIDAS`);
    console.log(`==============================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
