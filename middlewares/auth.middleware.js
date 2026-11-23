const pool = require('../config/db');

/**
 * Middleware para validar que el usuario tenga privilegios de Administrador (RBAC).
 * Si el usuario no tiene rol 'Administrador' o no está autenticado, rechaza con HTTP 403 Forbidden.
 */
async function soloAdmin(req, res, next) {
  try {
    // 1. Extraer identificador de usuario y/o rol desde headers, body o query params
    const rolHeader = req.headers['x-user-role'] || req.headers['x-rol-usuario'] || req.headers['x-rol'];
    const idUsuario = req.headers['x-user-id'] || req.headers['x-usuario-id'] || req.body?.id_usuario || req.query?.id_usuario;
    const idSesion = req.headers['x-session-id'] || req.headers['x-sesion-id'] || req.body?.id_sesion;

    // 2. Si se proporciona id_usuario, verificar en la BD que exista, esté activo y sea Administrador
    if (idUsuario) {
      const [rows] = await pool.query(
        `SELECT u.id_usuario, u.nombre_completo, u.estado, r.nombre_rol 
         FROM usuarios u 
         JOIN roles r ON u.id_rol = r.id_rol 
         WHERE u.id_usuario = ?`,
        [idUsuario]
      );

      if (rows.length === 0 || rows[0].estado !== 'Activo') {
        return res.status(403).json({
          ok: false,
          error: 'Acceso denegado (HTTP 403 Forbidden): Usuario no encontrado o inactivo.'
        });
      }

      req.usuarioAutenticado = rows[0];

      if (rows[0].nombre_rol === 'Administrador') {
        return next();
      } else {
        return res.status(403).json({
          ok: false,
          error: `Acceso denegado (HTTP 403 Forbidden): Se requieren privilegios de Administrador. Su rol actual es "${rows[0].nombre_rol}".`
        });
      }
    }

    // 3. Si se proporciona id_sesion, verificar sesión activa y rol en base de datos
    if (idSesion) {
      const [sesRows] = await pool.query(
        `SELECT u.id_usuario, u.nombre_completo, u.estado, r.nombre_rol 
         FROM sesiones_usuarios s
         JOIN usuarios u ON s.id_usuario = u.id_usuario
         JOIN roles r ON u.id_rol = r.id_rol 
         WHERE s.id_sesion = ? AND s.fecha_fin IS NULL`,
        [idSesion]
      );

      if (sesRows.length > 0 && sesRows[0].estado === 'Activo') {
        req.usuarioAutenticado = sesRows[0];
        if (sesRows[0].nombre_rol === 'Administrador') {
          return next();
        } else {
          return res.status(403).json({
            ok: false,
            error: `Acceso denegado (HTTP 403 Forbidden): Se requieren privilegios de Administrador. Su rol actual es "${sesRows[0].nombre_rol}".`
          });
        }
      }
    }

    // 4. Si viene explicitado en el encabezado x-user-role
    if (rolHeader) {
      if (rolHeader.trim().toLowerCase() === 'administrador') {
        return next();
      } else {
        return res.status(403).json({
          ok: false,
          error: `Acceso denegado (HTTP 403 Forbidden): Se requieren privilegios de Administrador. Su rol actual es "${rolHeader}".`
        });
      }
    }

    // 5. Si no se proveyó ningún dato de autenticación o sesión
    return res.status(403).json({
      ok: false,
      error: 'Acceso denegado (HTTP 403 Forbidden): Se requieren credenciales de Administrador para realizar esta acción.'
    });
  } catch (err) {
    console.error('[Middleware soloAdmin Error]:', err.message);
    return res.status(403).json({
      ok: false,
      error: 'Acceso denegado (HTTP 403 Forbidden): Error al verificar permisos del usuario.'
    });
  }
}

module.exports = {
  soloAdmin
};
