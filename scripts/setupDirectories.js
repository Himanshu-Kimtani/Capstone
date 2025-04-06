const fs = require('fs');
const path = require('path');

const createUploadDirectories = () => {
    const directories = [
        'public/uploads',
        'public/uploads/artists',
        'public/uploads/events',
        'public/uploads/venues',
        'public/uploads/general'
    ];

    directories.forEach(dir => {
        const fullPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`Created directory: ${fullPath}`);
        }
    });
};

createUploadDirectories(); 