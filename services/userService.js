const { User } = require('../models'); // PostgreSQL models
const MongoUser = require('../client/models/user'); // MongoDB model
const mongoose = require('mongoose');

async function createUser(userData) {
  // Start a transaction for PostgreSQL
  const transaction = await User.sequelize.transaction();
  
  try {
    // 1. Create the user in PostgreSQL
    const user = await User.create({
      name: userData.name,
      fullName: userData.name,
      email: userData.email,
      password: userData.password, // Should be hashed in production
      role: 'user'
    }, { transaction });
    
    // 2. Create the profile in MongoDB
    const mongoUser = await MongoUser.create({
      username: userData.email.split('@')[0],
      email: userData.email,
      name: userData.name,
      bio: 'Tell us about yourself'
    });
    
    // If both operations succeed, commit the transaction
    await transaction.commit();
    
    return {
      pgUser: user,
      mongoUser: mongoUser
    };
  } catch (error) {
    // If anything fails, roll back the PostgreSQL transaction
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  createUser
}; 