const mysql = require('mysql2/promise');

// Configuración del pool de MySQL con soporte de variables de entorno para despliegue
// y soporte SSL automático cuando se conecta a la nube (TiDB Cloud)
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
  keepAliveInitialDelay: 10000,
  // Activa cifrado SSL obligatorio para TiDB Cloud en Render, y lo ignora en local
  ssl: process.env.DB_HOST ? {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  } : undefined
});

module.exports = pool;