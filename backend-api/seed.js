const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.resolve(__dirname, 'nova-crm.sqlite'));

db.serialize(() => {
  db.run(`INSERT INTO users (name, email, password, role) VALUES ('TechNova Inc.', 'ceo@technova.com', '123', 'client')`, function(err) {
    if(!err) {
      db.run(`INSERT INTO projects (client_id, title, description, stage) VALUES (${this.lastID}, 'Transformación Digital', 'Migración a la nube y optimización.', 'Diagnóstico Inicial')`);
    }
  });

  db.run(`INSERT INTO users (name, email, password, role) VALUES ('Globex Corp', 'admin@globex.com', '123', 'client')`, function(err) {
    if(!err) {
      db.run(`INSERT INTO projects (client_id, title, description, stage) VALUES (${this.lastID}, 'Auditoría Financiera Q4', 'Revisión contable anual.', 'Plan Estratégico')`);
    }
  });
  
  db.run(`INSERT INTO users (name, email, password, role) VALUES ('Inversiones Sur', 'sur@inversiones.com', '123', 'client')`, function(err) {
    if(!err) {
      db.run(`INSERT INTO projects (client_id, title, description, stage) VALUES (${this.lastID}, 'Reestructuración RRHH', 'Análisis de personal base.', 'Implementación')`);
    }
  });
});

console.log("Seeded test projects successfully.");
