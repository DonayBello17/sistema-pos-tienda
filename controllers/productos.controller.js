const pool = require('../config/db');
const InventarioService = require('../services/inventario.service');

/**
 * Controlador de Catálogo de Productos y Clasificación Tributaria
 */
class ProductosController {
  static async obtenerProductos(req, res) {
    try {
      const productos = await InventarioService.obtenerProductosConSemaforo();
      res.json(productos);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar catálogo de productos: ' + err.message });
    }
  }

  static async obtenerCategorias(req, res) {
    try {
      const [categorias] = await pool.query(
        'SELECT id_categoria, nombre_categoria, descripcion, IFNULL(margen_defecto, 30.00) AS margen_defecto FROM categorias ORDER BY nombre_categoria ASC'
      );
      res.json(categorias);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar categorías: ' + err.message });
    }
  }

  static async crearCategoria(req, res) {
    const { nombre_categoria, descripcion, margen_defecto } = req.body;

    if (!nombre_categoria || !nombre_categoria.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'El nombre de la categoría es obligatorio.'
      });
    }

    const nombreLimpio = nombre_categoria.trim();
    const margenVal = margen_defecto !== undefined && margen_defecto !== null && margen_defecto !== ''
      ? Math.max(0, parseFloat(margen_defecto) || 30.00)
      : 30.00;

    try {
      const [existentes] = await pool.query(
        'SELECT id_categoria FROM categorias WHERE LOWER(nombre_categoria) = LOWER(?)',
        [nombreLimpio]
      );

      if (existentes.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `Ya existe una categoría registrada con el nombre "${nombreLimpio}".`
        });
      }

      const [resultado] = await pool.query(
        'INSERT INTO categorias (nombre_categoria, descripcion, margen_defecto) VALUES (?, ?, ?)',
        [nombreLimpio, descripcion ? descripcion.trim() : null, margenVal]
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Categoría creada exitosamente.',
        data: {
          id_categoria: resultado.insertId,
          nombre_categoria: nombreLimpio,
          descripcion: descripcion ? descripcion.trim() : null,
          margen_defecto: margenVal
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al registrar categoría: ' + err.message
      });
    }
  }

  static async crearProducto(req, res) {
    const { codigo_barras, nombre, id_categoria, precio_base, tarifa_iva, stock_minimo = 5, margen_ganancia } = req.body;

    if (!codigo_barras || !nombre || precio_base === undefined || !tarifa_iva) {
      return res.status(400).json({
        ok: false,
        error: 'Todos los campos son obligatorios: código de barras, nombre, precio base y tarifa IVA.'
      });
    }

    const tarifasValidas = ['19', '5', '0'];
    if (!tarifasValidas.includes(String(tarifa_iva))) {
      return res.status(400).json({
        ok: false,
        error: 'Tarifa IVA inválida. Las opciones permitidas son 19%, 5% o 0%.'
      });
    }

    const pBase = parseFloat(precio_base);
    if (isNaN(pBase) || pBase <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'El precio base debe ser un valor numérico mayor a cero.'
      });
    }

    // Cálculo tributario reactivo y validado
    let tasaIva = 0;
    if (String(tarifa_iva) === '19') tasaIva = 0.19;
    else if (String(tarifa_iva) === '5') tasaIva = 0.05;

    const precioVentaFinal = Number((pBase * (1 + tasaIva)).toFixed(2));
    const sMinimo = parseInt(stock_minimo, 10) || 5;

    try {
      // Determinar margen de ganancia (hereda de categoría si no se envía)
      let margen = parseFloat(margen_ganancia);
      if (isNaN(margen) || margen < 0) {
        if (id_categoria) {
          const [[cat]] = await pool.query('SELECT margen_defecto FROM categorias WHERE id_categoria = ?', [parseInt(id_categoria, 10)]);
          margen = cat && cat.margen_defecto !== null ? parseFloat(cat.margen_defecto) : 30.00;
        } else {
          margen = 30.00;
        }
      }

      // Verificar si el código de barras ya existe
      const [existentes] = await pool.query(
        'SELECT id_producto FROM productos WHERE codigo_barras = ?',
        [codigo_barras.trim()]
      );

      if (existentes.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `El código de barras "${codigo_barras}" ya está registrado en el sistema.`
        });
      }

      const [resultado] = await pool.query(
        `INSERT INTO productos 
         (codigo_barras, nombre, id_categoria, precio_base, tarifa_iva, precio_venta_final, stock_total, stock_minimo, margen_ganancia, estado)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 'Activo')`,
        [
          codigo_barras.trim(),
          nombre.trim(),
          id_categoria ? parseInt(id_categoria, 10) : null,
          pBase,
          String(tarifa_iva),
          precioVentaFinal,
          sMinimo,
          Number(margen.toFixed(2))
        ]
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Producto registrado exitosamente.',
        data: {
          id_producto: resultado.insertId,
          codigo_barras: codigo_barras.trim(),
          nombre: nombre.trim(),
          precio_base: pBase,
          tarifa_iva: String(tarifa_iva),
          precio_venta_final: precioVentaFinal,
          stock_total: 0,
          stock_minimo: sMinimo,
          margen_ganancia: Number(margen.toFixed(2))
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al registrar producto: ' + err.message
      });
    }
  }

  /**
   * Desactivación lógica de productos (Soft Delete)
   * Preserva la integridad referencial histórica en ventas y compras
   */
  static async inactivarProducto(req, res) {
    const { id } = req.params;
    const idProducto = parseInt(id, 10);

    if (isNaN(idProducto) || idProducto <= 0) {
      return res.status(400).json({ ok: false, error: 'Identificador de producto inválido.' });
    }

    try {
      const [[producto]] = await pool.query(
        'SELECT id_producto, nombre, estado FROM productos WHERE id_producto = ?',
        [idProducto]
      );

      if (!producto) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
      }

      if (producto.estado === 'Inactivo') {
        return res.status(400).json({ ok: false, error: 'El producto ya se encuentra inactivo en el catálogo.' });
      }

      await pool.query(
        'UPDATE productos SET estado = "Inactivo" WHERE id_producto = ?',
        [idProducto]
      );

      res.json({
        ok: true,
        mensaje: `El producto "${producto.nombre}" ha sido desactivado del catálogo comercial (soft delete).`,
        id_producto: idProducto
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Error al inactivar producto: ' + err.message });
    }
  }

  /**
   * Eliminación condicional de categorías
   * Solo permite eliminar si no tiene productos vinculados (activos o inactivos)
   */
  static async eliminarCategoria(req, res) {
    const { id } = req.params;
    const idCategoria = parseInt(id, 10);

    if (isNaN(idCategoria) || idCategoria <= 0) {
      return res.status(400).json({ ok: false, error: 'Identificador de categoría inválido.' });
    }

    try {
      const [[categoria]] = await pool.query(
        'SELECT id_categoria, nombre_categoria FROM categorias WHERE id_categoria = ?',
        [idCategoria]
      );

      if (!categoria) {
        return res.status(404).json({ ok: false, error: 'Categoría no encontrada.' });
      }

      // Validar si existen productos vinculados (activos o inactivos)
      const [[conteo]] = await pool.query(
        'SELECT COUNT(*) AS total FROM productos WHERE id_categoria = ?',
        [idCategoria]
      );

      if (conteo.total > 0) {
        return res.status(400).json({
          ok: false,
          error: 'No se puede eliminar la categoría porque contiene productos vinculados. Reasigna o desactiva primero los productos.'
        });
      }

      await pool.query('DELETE FROM categorias WHERE id_categoria = ?', [idCategoria]);

      res.json({
        ok: true,
        mensaje: `La categoría "${categoria.nombre_categoria}" fue eliminada exitosamente.`
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Error al eliminar categoría: ' + err.message });
    }
  }

  /**
   * Actualización de Producto con Validación Financiera de Margen
   * Rechaza si el precio_base es inferior al costo de adquisición
   */
  static async actualizarProducto(req, res) {
    const { id } = req.params;
    const idProducto = parseInt(id, 10);

    if (isNaN(idProducto) || idProducto <= 0) {
      return res.status(400).json({ ok: false, error: 'Identificador de producto inválido.' });
    }

    const { nombre, codigo_barras, id_categoria, precio_base, tarifa_iva, stock_minimo = 5, margen_ganancia } = req.body;

    if (!nombre || !codigo_barras || precio_base === undefined || !tarifa_iva) {
      return res.status(400).json({
        ok: false,
        error: 'Todos los campos son obligatorios: código de barras, nombre, precio base y tarifa IVA.'
      });
    }

    const tarifasValidas = ['19', '5', '0'];
    if (!tarifasValidas.includes(String(tarifa_iva))) {
      return res.status(400).json({
        ok: false,
        error: 'Tarifa IVA inválida. Las opciones permitidas son 19%, 5% o 0%.'
      });
    }

    const pBase = parseFloat(precio_base);
    if (isNaN(pBase) || pBase <= 0) {
      return res.status(400).json({
        ok: false,
        error: 'El precio base debe ser un valor numérico mayor a cero.'
      });
    }

    try {
      // 1. Verificar existencia del producto
      const [[productoActual]] = await pool.query(
        'SELECT id_producto, nombre, codigo_barras, precio_base, margen_ganancia FROM productos WHERE id_producto = ?',
        [idProducto]
      );

      if (!productoActual) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
      }

      // 2. Determinar margen de ganancia
      let margen = parseFloat(margen_ganancia);
      if (isNaN(margen) || margen < 0) {
        if (id_categoria) {
          const [[cat]] = await pool.query('SELECT margen_defecto FROM categorias WHERE id_categoria = ?', [parseInt(id_categoria, 10)]);
          margen = cat && cat.margen_defecto !== null ? parseFloat(cat.margen_defecto) : 30.00;
        } else if (productoActual.margen_ganancia !== null) {
          margen = parseFloat(productoActual.margen_ganancia);
        } else {
          margen = 30.00;
        }
      }

      // 3. Verificar duplicado de código de barras
      const [duplicados] = await pool.query(
        'SELECT id_producto FROM productos WHERE codigo_barras = ? AND id_producto != ?',
        [codigo_barras.trim(), idProducto]
      );

      if (duplicados.length > 0) {
        return res.status(400).json({
          ok: false,
          error: `El código de barras "${codigo_barras}" ya está registrado en otro producto.`
        });
      }

      // 4. Regla Financiera: Validar contra costo de compra en lotes
      const [[costoRow]] = await pool.query(
        `SELECT IFNULL((
           SELECT costo_unitario 
           FROM lotes 
           WHERE id_producto = ? 
           ORDER BY fecha_ingreso DESC, id_lote DESC 
           LIMIT 1
         ), 0) AS ultimo_costo`,
        [idProducto]
      );

      const costoCompra = Number(costoRow?.ultimo_costo || 0);

      // Si se solicita recalcular precio automáticamente en base al margen
      let pBaseFinal = pBase;
      if (req.body.recalcular_precio) {
        const [[loteDisp]] = await pool.query(
          `SELECT MAX(costo_unitario) AS max_costo 
           FROM lotes 
           WHERE id_producto = ? AND cantidad_disponible > 0`,
          [idProducto]
        );
        let costoRef = loteDisp?.max_costo ? parseFloat(loteDisp.max_costo) : null;
        if (!costoRef || costoRef <= 0) {
          costoRef = costoCompra;
        }
        if (costoRef && costoRef > 0) {
          pBaseFinal = Number((costoRef * (1 + (margen / 100))).toFixed(2));
        }
      }

      if (costoCompra > 0 && pBaseFinal < costoCompra) {
        return res.status(400).json({
          ok: false,
          error: `El precio de venta no puede estar por debajo del costo de compra ($${costoCompra.toFixed(2)})`
        });
      }

      // 5. Calcular precio de venta final (PVP)
      let tasaIva = 0;
      if (String(tarifa_iva) === '19') tasaIva = 0.19;
      else if (String(tarifa_iva) === '5') tasaIva = 0.05;

      const precioVentaFinal = Number((pBaseFinal * (1 + tasaIva)).toFixed(2));
      const sMinimo = parseInt(stock_minimo, 10) || 5;

      // 6. Asentar actualización
      await pool.query(
        `UPDATE productos 
         SET nombre = ?, codigo_barras = ?, id_categoria = ?, precio_base = ?, tarifa_iva = ?, precio_venta_final = ?, stock_minimo = ?, margen_ganancia = ?
         WHERE id_producto = ?`,
        [
          nombre.trim(),
          codigo_barras.trim(),
          id_categoria ? parseInt(id_categoria, 10) : null,
          pBaseFinal,
          String(tarifa_iva),
          precioVentaFinal,
          sMinimo,
          Number(margen.toFixed(2)),
          idProducto
        ]
      );

      res.json({
        ok: true,
        mensaje: `Producto "${nombre.trim()}" actualizado exitosamente.`,
        data: {
          id_producto: idProducto,
          codigo_barras: codigo_barras.trim(),
          nombre: nombre.trim(),
          precio_base: pBaseFinal,
          tarifa_iva: String(tarifa_iva),
          precio_venta_final: precioVentaFinal,
          stock_minimo: sMinimo,
          margen_ganancia: Number(margen.toFixed(2)),
          costo_referencial: costoCompra
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al actualizar producto: ' + err.message
      });
    }
  }

  /**
   * Ajuste individual y rápido de margen_ganancia (PATCH /api/productos/:id/margen)
   * Recalcula automáticamente el precio_base en función del costo del lote más alto o último lote
   */
  static async actualizarMargenIndividual(req, res) {
    const { id } = req.params;
    const idProducto = parseInt(id, 10);

    if (isNaN(idProducto) || idProducto <= 0) {
      return res.status(400).json({ ok: false, error: 'Identificador de producto inválido.' });
    }

    const { margen_ganancia } = req.body;
    const nuevoMargen = parseFloat(margen_ganancia);

    if (isNaN(nuevoMargen) || nuevoMargen < 0) {
      return res.status(400).json({
        ok: false,
        error: 'El porcentaje de margen de ganancia debe ser un número mayor o igual a 0.'
      });
    }

    try {
      // 1. Obtener producto actual
      const [[producto]] = await pool.query(
        'SELECT id_producto, nombre, precio_base, tarifa_iva, margen_ganancia FROM productos WHERE id_producto = ?',
        [idProducto]
      );

      if (!producto) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
      }

      // 2. Buscar costo de referencia: Lote disponible más alto o último lote histórico
      const [[loteDisp]] = await pool.query(
        `SELECT MAX(costo_unitario) AS max_costo 
         FROM lotes 
         WHERE id_producto = ? AND cantidad_disponible > 0`,
        [idProducto]
      );

      let costoRef = loteDisp?.max_costo ? parseFloat(loteDisp.max_costo) : null;

      if (!costoRef || costoRef <= 0) {
        const [[ultimoLote]] = await pool.query(
          `SELECT costo_unitario 
           FROM lotes 
           WHERE id_producto = ? 
           ORDER BY fecha_ingreso DESC, id_lote DESC 
           LIMIT 1`,
          [idProducto]
        );
        if (ultimoLote?.costo_unitario) {
          costoRef = parseFloat(ultimoLote.costo_unitario);
        }
      }

      let tasaIva = 0;
      if (String(producto.tarifa_iva) === '19') tasaIva = 0.19;
      else if (String(producto.tarifa_iva) === '5') tasaIva = 0.05;

      // 3. Recalcular precio_base y PVP si hay costo de referencia
      let nuevoPrecioBase = parseFloat(producto.precio_base) || 0;
      if (costoRef && costoRef > 0) {
        nuevoPrecioBase = Number((costoRef * (1 + (nuevoMargen / 100))).toFixed(2));
      }
      const nuevoPvp = Number((nuevoPrecioBase * (1 + tasaIva)).toFixed(2));

      // 4. Actualizar en base de datos
      await pool.query(
        `UPDATE productos 
         SET margen_ganancia = ?, precio_base = ?, precio_venta_final = ? 
         WHERE id_producto = ?`,
        [Number(nuevoMargen.toFixed(2)), nuevoPrecioBase, nuevoPvp, idProducto]
      );

      res.json({
        ok: true,
        mensaje: `Margen de ganancia de "${producto.nombre}" actualizado a ${Number(nuevoMargen.toFixed(2))}% (Precio base: $${nuevoPrecioBase.toFixed(2)}).`,
        data: {
          id_producto: idProducto,
          nombre: producto.nombre,
          margen_ganancia: Number(nuevoMargen.toFixed(2)),
          costo_referencial: costoRef || 0,
          precio_base: nuevoPrecioBase,
          tarifa_iva: producto.tarifa_iva,
          precio_venta_final: nuevoPvp
        }
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al actualizar margen del producto: ' + err.message
      });
    }
  }

  /**
   * Recálculo Masivo de Precios por Margen (Opción 2)
   * Recalcula precio_base y precio_venta_final de todos los productos activos
   * usando el costo de lote más alto disponible o último costo registrado
   */
  static async recalcularPreciosMasivo(req, res) {
    try {
      const [productos] = await pool.query(
        `SELECT p.id_producto, p.nombre, p.precio_base, p.tarifa_iva, 
                IFNULL(p.margen_ganancia, IFNULL(c.margen_defecto, 30.00)) AS margen_ganancia
         FROM productos p
         LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
         WHERE p.estado = 'Activo'`
      );

      let actualizados = 0;
      const detalles = [];

      for (const prod of productos) {
        const margen = parseFloat(prod.margen_ganancia) || 30.00;

        // 1. Buscar costo del lote disponible con mayor costo
        const [[loteDisp]] = await pool.query(
          `SELECT MAX(costo_unitario) AS max_costo 
           FROM lotes 
           WHERE id_producto = ? AND cantidad_disponible > 0`,
          [prod.id_producto]
        );

        let costoRef = loteDisp?.max_costo ? parseFloat(loteDisp.max_costo) : null;

        // 2. Si no hay lotes disponibles, buscar último costo de compra
        if (!costoRef || costoRef <= 0) {
          const [[ultimoLote]] = await pool.query(
            `SELECT costo_unitario 
             FROM lotes 
             WHERE id_producto = ? 
             ORDER BY fecha_ingreso DESC, id_lote DESC 
             LIMIT 1`,
            [prod.id_producto]
          );
          if (ultimoLote?.costo_unitario) {
            costoRef = parseFloat(ultimoLote.costo_unitario);
          }
        }

        if (costoRef && costoRef > 0) {
          let tasaIva = 0;
          if (String(prod.tarifa_iva) === '19') tasaIva = 0.19;
          else if (String(prod.tarifa_iva) === '5') tasaIva = 0.05;

          const nuevoPrecioBase = Number((costoRef * (1 + (margen / 100))).toFixed(2));
          const nuevoPvp = Number((nuevoPrecioBase * (1 + tasaIva)).toFixed(2));

          if (nuevoPrecioBase !== parseFloat(prod.precio_base)) {
            await pool.query(
              `UPDATE productos 
               SET precio_base = ?, precio_venta_final = ? 
               WHERE id_producto = ?`,
              [nuevoPrecioBase, nuevoPvp, prod.id_producto]
            );
            actualizados++;
            detalles.push({
              id_producto: prod.id_producto,
              nombre: prod.nombre,
              costo_referencia: costoRef,
              margen,
              precio_base_anterior: parseFloat(prod.precio_base),
              precio_base_nuevo: nuevoPrecioBase,
              precio_venta_final: nuevoPvp
            });
          }
        }
      }

      res.json({
        ok: true,
        mensaje: `Se recalcularon exitosamente los precios de ${actualizados} producto(s) según su margen de ganancia.`,
        total_evaluados: productos.length,
        actualizados,
        detalles
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: 'Error al recalcular precios masivamente: ' + err.message
      });
    }
  }
}

module.exports = ProductosController;
