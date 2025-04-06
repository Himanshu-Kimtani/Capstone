const bcrypt = require('bcrypt');
const { User } = require('../models');

async function createAdminUser() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        await User.create({
            name: 'Admin',
            email: 'admin@vynyl.com',
            password: hashedPassword,
            fullName: 'Admin User',
            role: 'admin'
        });

        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        process.exit();
    }
}

createAdminUser(); 