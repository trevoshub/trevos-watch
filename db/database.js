const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./products.db');

db.serialize(() => {

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      password TEXT,
      security_question TEXT,
      security_answer TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      expiry TEXT
    )
  `);

  // Default user
  db.get("SELECT * FROM users WHERE id = 1", (err, row) => {
    if (!row) {
      db.run(`
        INSERT INTO users (name, password, security_question, security_answer)
        VALUES ('User', 'password123', 'Your favorite color?', 'blue')
      `);
    }
  });

});

module.exports = db;