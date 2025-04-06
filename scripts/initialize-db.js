/**
 * Database Initialization Script
 * This script is meant to be run manually when you need to:
 * 1. Create all tables for a fresh installation
 * 2. Reset the database during development
 *
 * WARNING: Using force: true will DROP all existing tables!
 */

require("dotenv").config();
const { sequelize } = require("../models");
const session = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(session.Store);

const sessionStore = new SequelizeStore({
  db: sequelize,
});

async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");

    // Create the session store table
    await sessionStore.sync({ force: true });
    console.log("Session store table created");

    // Sync all models with the database (force: true will drop existing tables)
    await sequelize.sync({ force: true });
    console.log("All database tables have been created");

    console.log("\nDatabase initialization complete!");
    console.log("\n WARNING: All existing data has been reset.");

    process.exit(0);
  } catch (error) {
    console.error("ERROR initializing database:", error);
    process.exit(1);
  }
}

// Ask for confirmation before proceeding
console.log("\n WARNING: This will RESET your database and DELETE ALL DATA!");
console.log("Press Ctrl+C now to cancel if you want to keep your data.");
console.log("The script will proceed in 5 seconds...");

setTimeout(initializeDatabase, 5000);
