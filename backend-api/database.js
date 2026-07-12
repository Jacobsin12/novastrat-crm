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
        must_change_password INTEGER DEFAULT 0,
        phone TEXT,
        company_name TEXT,
        description TEXT,
        drive_folder_id TEXT,
        two_factor_secret TEXT,
        two_factor_enabled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Migración segura: agregar columnas si no existen
      db.run(`ALTER TABLE users ADD COLUMN phone TEXT`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN company_name TEXT`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN description TEXT`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN drive_folder_id TEXT`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN two_factor_secret TEXT`, (err) => {});
      db.run(`ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0`, (err) => {});
    });

    // 2. Tabla de Leads (Prospectos que llegan de la Landing Page o Manual)
    db.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT NOT NULL,
        contact_phone TEXT,
        diagnosis_score INTEGER,
        description TEXT,
        status TEXT DEFAULT 'new', 
        is_active INTEGER DEFAULT 1,
        lost_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, () => {
      // Migración segura: agregar columnas si no existen
      db.run(`ALTER TABLE leads ADD COLUMN description TEXT`, (err) => {});
      db.run(`ALTER TABLE leads ADD COLUMN contact_name TEXT`, (err) => {});
    });

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
        client_id INTEGER,
        uploaded_by INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        drive_file_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (client_id) REFERENCES users (id),
        FOREIGN KEY (uploaded_by) REFERENCES users (id)
      )
    `, () => {
      // Migración segura: agregar columnas si no existen
      db.run(`ALTER TABLE documents ADD COLUMN drive_file_id TEXT`, (err) => {});
    });

    // 5. Tabla de Suscripciones Push (Para notificaciones web push)
    db.run(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // 5c. Tabla de Asesores del Proyecto (Asignación Múltiple)
    db.run(`
      CREATE TABLE IF NOT EXISTS project_consultants (
        project_id INTEGER,
        consultant_id INTEGER,
        PRIMARY KEY (project_id, consultant_id),
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
        FOREIGN KEY (consultant_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // 5b. Tabla de Reuniones (Google Meet simulado)
    db.run(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        date_time DATETIME NOT NULL,
        status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'proposed')) DEFAULT 'pending',
        proposed_date_time DATETIME,
        meet_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users (id)
      )
    `, () => {
      db.run(`ALTER TABLE meetings ADD COLUMN duration_minutes INTEGER DEFAULT 60`, (err) => {});
    });

    // 5d. Tabla para persistir el estado de notificaciones leídas/borradas por usuario
    db.run(`
      CREATE TABLE IF NOT EXISTS user_notifications_state (
        user_id INTEGER,
        notification_id TEXT,
        is_read INTEGER DEFAULT 0,
        is_deleted INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, notification_id)
      )
    `);

    // 6. Seeder: Insertar un Admin por defecto si no hay usuarios
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (row.count === 0) {
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'nova.strat.consulting@gmail.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        
        const bcrypt = require('bcrypt');
        const hash = bcrypt.hashSync(adminPassword, 10);
        
        db.run(`INSERT INTO users (name, email, password, role) VALUES ('Propietario', ?, ?, 'admin')`, [adminEmail, hash]);
        console.log(`Se ha creado el usuario administrador por defecto usando las variables de entorno.`);
      }
    });

    console.log('Tablas inicializadas correctamente.');
  });
}

module.exports = db;
