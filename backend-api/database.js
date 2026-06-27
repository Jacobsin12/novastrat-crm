const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea la BD en un archivo en la raíz del backend
const dbPath = path.resolve(__dirname, 'nova-crm.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite (nova-crm.sqlite)');
    initDB();
  }
});

// Inicializa las tablas si no existen
function initDB() {
  db.serialize(() => {
    // 1. Tabla de Usuarios (Administradores, Consultores, Clientes)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('admin', 'consultant', 'client')) NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabla de Leads (Prospectos que llegan de la Landing Page o Manual)
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        diagnosis_score INTEGER,
        status TEXT DEFAULT 'new', 
        is_active INTEGER DEFAULT 1,
        lost_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Tabla de Pipelines (Proyectos de clientes vinculados a un consultor)
    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        consultant_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        stage TEXT DEFAULT 'Diagnóstico Inicial',
        progress INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users (id),
        FOREIGN KEY (consultant_id) REFERENCES users (id)
      )
    `);

    // 4. Tabla de Documentos (Bóveda)
    db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        uploaded_by INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )
    `);

    // 5. Seeder: Insertar un Admin por defecto si no hay usuarios
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (row.count === 0) {
        // En producción usar bcrypt, aquí para testing inicial usamos texto plano
        const bcrypt = require('bcrypt');
        const hash = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT INTO users (name, email, password, role) VALUES ('Propietario', 'admin@novastrat.com', ?, 'admin')`, [hash]);
        console.log('Se ha creado el usuario administrador por defecto (admin@novastrat.com / admin123)');
      }
    });

    console.log('Tablas inicializadas correctamente.');
  });
}

module.exports = db;
