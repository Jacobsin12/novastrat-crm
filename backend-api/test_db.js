const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./nova-crm.sqlite');
db.get('SELECT * FROM leads ORDER BY id DESC LIMIT 1', (err, row) => {
  console.log('Lead:', row);
  if (row) {
    db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'client')", [row.company_name, row.contact_email, 'testpass'], function(err) {
      if (err) console.log('Error inserting:', err.message);
      else console.log('Inserted client id', this.lastID);
    });
  }
});
