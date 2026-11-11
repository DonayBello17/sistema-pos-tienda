const mysql = require('mysql2/promise');

// Configuración del pool de MySQL con soporte de variables de entorno para despliegue
// y valores por defecto para ejecución local en MySQL Workbench
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'donay',
  database: process.env.DB_NAME || 'sistema_pos_tienda',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // Preserva formato YYYY-MM-DD sin desviaciones de zona horaria
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

module.exports = pool;
