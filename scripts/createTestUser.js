require('dotenv').config();
const { User, ClientUser } = require('../models');
const sequelize = require('../config/database');

async function createTestUser() {
    try {
        console.log('Connecting to database...');
        
        // Test DB connection
        await sequelize.authenticate();
        console.log('Database connection established');
        
        // Check if user already exists
        const existingUser = await User.findOne({ where: { email: 'test@example.com' } });
        
        if (existingUser) {
            console.log('Test user already exists.');
            console.log('Email: test@example.com');
            console.log('Password: password123');
            process.exit(0);
        }
        
        // Create main user account
        const user = await User.create({
            name: 'Test User',
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'password123', // In production, use hashed passwords
            role: 'user'
        });
        
        console.log('Main user account created with ID:', user.id);
        
        // Create client profile
        const clientProfile = await ClientUser.create({
            userId: user.id,
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
            bio: 'This is a test user account',
            profilePhoto: '',
            backgroundImage: '',
            highlights: [],
            achievements: []
        });
        
        console.log('Client profile created with ID:', clientProfile.id);
        console.log('Test user created successfully!');
        console.log('Login with:');
        console.log('Email: test@example.com');
        console.log('Password: password123');
        
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        process.exit();
    }
}

createTestUser(); 