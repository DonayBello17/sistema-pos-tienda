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
        'SELECT id_categoria, nombre_categoria, descripcion FROM categorias ORDER BY nombre_categoria ASC'
      );
      res.json(categorias);
    } catch (err) {
      res.status(500).json({ error: 'Error al consultar categorías: ' + err.message });
    }
  }

  static async crearCategoria(req, res) {
    const { nombre_categoria, descripcion } = req.body;

    if (!nombre_categoria || !nombre_categoria.trim()) {
      return res.status(400).json({
        ok: false,
        error: 'El nombre de la categoría es obligatorio.'
      });
    }

    const nombreLimpio = nombre_categoria.trim();

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
        'INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)',
        [nombreLimpio, descripcion ? descripcion.trim() : null]
      );

      res.status(201).json({
        ok: true,
        mensaje: 'Categoría creada exitosamente.',
        data: {
          id_categoria: resultado.insertId,
          nombre_categoria: nombreLimpio,
          descripcion: descripcion ? descripcion.trim() : null
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
    const { codigo_barras, nombre, id_categoria, precio_base, tarifa_iva, stock_minimo = 5 } = req.body;

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
         (codigo_barras, nombre, id_categoria, precio_base, tarifa_iva, precio_venta_final, stock_total, stock_minimo, estado)
         VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'Activo')`,
        [
          codigo_barras.trim(),
          nombre.trim(),
          id_categoria ? parseInt(id_categoria, 10) : null,
          pBase,
          String(tarifa_iva),
          precioVentaFinal,
          sMinimo
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
          stock_minimo: sMinimo
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

    const { nombre, codigo_barras, id_categoria, precio_base, tarifa_iva, stock_minimo = 5 } = req.body;

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
        'SELECT id_producto, nombre, codigo_barras, precio_base FROM productos WHERE id_producto = ?',
        [idProducto]
      );

      if (!productoActual) {
        return res.status(404).json({ ok: false, error: 'Producto no encontrado.' });
      }

      // 2. Verificar duplicado de código de barras
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

      // 3. Regla Financiera: Validar contra costo de compra en lotes
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

      if (costoCompra > 0 && pBase < costoCompra) {
        return res.status(400).json({
          ok: false,
          error: `El precio de venta no puede estar por debajo del costo de compra ($${costoCompra.toFixed(2)})`
        });
      }

      // 4. Calcular precio de venta final (PVP)
      let tasaIva = 0;
      if (String(tarifa_iva) === '19') tasaIva = 0.19;
      else if (String(tarifa_iva) === '5') tasaIva = 0.05;

      const precioVentaFinal = Number((pBase * (1 + tasaIva)).toFixed(2));
      const sMinimo = parseInt(stock_minimo, 10) || 5;

      // 5. Asentar actualización
      await pool.query(
        `UPDATE productos 
         SET nombre = ?, codigo_barras = ?, id_categoria = ?, precio_base = ?, tarifa_iva = ?, precio_venta_final = ?, stock_minimo = ?
         WHERE id_producto = ?`,
        [
          nombre.trim(),
          codigo_barras.trim(),
          id_categoria ? parseInt(id_categoria, 10) : null,
          pBase,
          String(tarifa_iva),
          precioVentaFinal,
          sMinimo,
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
          precio_base: pBase,
          tarifa_iva: String(tarifa_iva),
          precio_venta_final: precioVentaFinal,
          stock_minimo: sMinimo,
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
}

module.exports = ProductosController;
