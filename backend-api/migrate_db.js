const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'nova-crm.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA foreign_keys=OFF');
  db.run('BEGIN TRANSACTION');
  
  console.log("Creando nueva tabla de reuniones con CHECK actualizado...");
  db.run(`
    CREATE TABLE IF NOT EXISTS new_meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      date_time DATETIME NOT NULL,
      status TEXT CHECK(status IN ('pending', 'accepted', 'rejected', 'proposed', 'completed', 'cancelled')) DEFAULT 'pending',
      proposed_date_time DATETIME,
      meet_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_minutes INTEGER DEFAULT 60,
      consultant_id INTEGER,
      FOREIGN KEY (client_id) REFERENCES users (id)
    )
  `);

  console.log("Copiando datos...");
  db.run(`
    INSERT INTO new_meetings (id, client_id, title, date_time, status, proposed_date_time, meet_link, created_at, duration_minutes, consultant_id)
    SELECT id, client_id, title, date_time, status, proposed_date_time, meet_link, created_at, duration_minutes, consultant_id
    FROM meetings
  `, (err) => {
    if (err && err.message.includes("no such column")) {
       console.log("Falta alguna columna en la tabla vieja, copiando sin consultant_id/duration...");
       db.run(`
          INSERT INTO new_meetings (id, client_id, title, date_time, status, proposed_date_time, meet_link, created_at)
          SELECT id, client_id, title, date_time, status, proposed_date_time, meet_link, created_at
          FROM meetings
       `);
    }
  });

  console.log("Reemplazando tabla antigua...");
  db.run('DROP TABLE meetings');
  db.run('ALTER TABLE new_meetings RENAME TO meetings');
  
  db.run('COMMIT');
  db.run('PRAGMA foreign_keys=ON', (err) => {
    if (err) {
      console.error("Error final:", err);
    } else {
      console.log("✅ Migración exitosa. Ya puedes cancelar y completar reuniones.");
    }
  });
});
