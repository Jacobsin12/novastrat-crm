const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'nova-crm.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error abriendo BD:', err.message);
    process.exit(1);
  }
});

const tablesToClear = [
  'project_consultants',
  'documents',
  'push_subscriptions',
  'meetings',
  'user_notifications_state',
  'projects',
  'leads',
  'users'
];

db.serialize(() => {
  db.run('BEGIN TRANSACTION');

  // Vaciar todas las tablas
  tablesToClear.forEach(table => {
    db.run("DELETE FROM " + table);
  });

  // Reiniciar secuencias
  db.run("DELETE FROM sqlite_sequence");

  // Crear Admins
  const pwd1 = bcrypt.hashSync('Password123!', 10);
  const pwd2 = bcrypt.hashSync('NovaStratTemp2026!', 10);

  db.run(`
    INSERT INTO users (name, email, password, role, is_active)
    VALUES (?, ?, ?, 'admin', 1)
  `, ['Andres Galan', 'nova.strat.consulting@gmail.com', pwd1]);

  db.run(`
    INSERT INTO users (name, email, password, role, is_active)
    VALUES (?, ?, ?, 'admin', 1)
  `, ['Tristan Jacob', 'tristanjacob755@gmail.com', pwd2]);

  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Error durante COMMIT:', err);
    } else {
      console.log('¡Base de datos del servidor reseteada y limpia! 2 Administradores creados exitosamente.');
    }
    db.close();
  });
});
