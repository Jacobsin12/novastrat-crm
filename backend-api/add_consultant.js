const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');
const db = new sqlite3.Database(path.resolve(__dirname, 'nova-crm.sqlite'));

const hash = bcrypt.hashSync('consultor123', 10);
db.run(`INSERT INTO users (name, email, password, role) VALUES ('Asesor Principal', 'consultor@novastrat.com', ?, 'consultant')`, [hash], function(err) {
  if (err) console.error(err);
  else console.log('Consultor agregado con éxito.');
});
