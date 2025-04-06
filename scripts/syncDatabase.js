require('dotenv').config();
const { sequelize } = require('../models');

async function syncDatabase() {
    try {
        // This will drop and recreate the tables - WARNING: this will delete existing data
        await sequelize.sync({ force: true });
        console.log('Database synced successfully');
    } catch (error) {
        console.error('Error syncing database:', error);
    } finally {
        process.exit();
    }
}

syncDatabase(); 