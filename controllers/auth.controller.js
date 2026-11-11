const pool = require('../config/db');

/**
 * Controlador de Autenticación y Gestión de Sesiones de Usuario
 */
class AuthController {
  static async login(req, res) {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Debe ingresar correo y contraseña.' });
    }

    try {
      const [rows] = await pool.query(
        `SELECT u.id_usuario, u.nombre_completo, u.correo, u.password_hash, u.id_rol, r.nombre_rol 
         FROM usuarios u 
         JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.correo = ? AND u.estado = 'Activo'`,
        [correo]
      );

      if (rows.length === 0 || rows[0].password_hash !== password) {
        return res.status(401).json({ error: 'Credenciales inválidas o usuario inactivo en el sistema.' });
      }

      const usuario = rows[0];

      // Registrar inicio de sesión en la tabla `sesiones_usuarios`
      const [resSesion] = await pool.query(
        'INSERT INTO sesiones_usuarios (id_usuario, fecha_inicio) VALUES (?, NOW())',
        [usuario.id_usuario]
      );

      res.json({
        id_usuario: usuario.id_usuario,
        id_sesion: resSesion.insertId,
        nombre: usuario.nombre_completo,
        correo: usuario.correo,
        rol: usuario.nombre_rol,
        id_rol: usuario.id_rol
      });
    } catch (err) {
      res.status(500).json({ error: 'Error interno al autenticar usuario: ' + err.message });
    }
  }

  static async logout(req, res) {
    const { id_sesion } = req.body;
    try {
      if (id_sesion) {
        await pool.query(
          'UPDATE sesiones_usuarios SET fecha_fin = NOW() WHERE id_sesion = ?',
          [id_sesion]
        );
      }
      res.json({ mensaje: 'Sesión cerrada exitosamente.' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = AuthController;
