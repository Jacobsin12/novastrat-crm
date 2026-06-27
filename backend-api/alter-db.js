const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'nova-crm.sqlite');
const db = new sqlite3.Database(dbPath);

db.run("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;", (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('Column is_active already exists.');
    } else {
      console.error(err.message);
    }
  } else {
    console.log('Column is_active added successfully.');
  }
  db.close();
});
