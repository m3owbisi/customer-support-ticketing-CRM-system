const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../database.sqlite');
console.log(`Resetting database at ${dbPath}...`);

// Close database connections by deleting the file or dropping tables
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('Deleted database file successfully.');
  } catch (error) {
    console.log('Database file is locked. Dropping tables instead...');
    const db = new DatabaseSync(dbPath);
    db.exec('DROP TABLE IF EXISTS notes');
    db.exec('DROP TABLE IF EXISTS tickets');
    console.log('Dropped all tables.');
  }
}

// Require db.js to re-create schema and seed the initial database
require('./db');
console.log('Database schema reset successfully.');
