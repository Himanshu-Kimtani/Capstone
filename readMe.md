# VYNYL - Music Concert Experience Platform

<p align="center">
  <b>Feel the Beat, Share the Moment</b>
</p>

## 📝 Description

VYNYL is a full-stack web application that transforms how music fans experience concerts. It creates a community where concertgoers can discover events, book tickets, follow favorite artists, and share their concert moments with others - all in one seamless platform.

## ✨ Features

### 👤 User Experience

- **Elegant Authentication** - Modern, secure signup and login system
- **Interactive Dashboard** - Personal hub for upcoming events, past events, and followed artists
- **Profile Management** - Customizable user profiles with profile picture upload
- **Ticket Management** - View, manage and download tickets for upcoming events

### 🎭 Artists & Events

- **Artist Profiles** - Dedicated pages for artists with their information and upcoming events
- **Event Discovery** - Browse and filter upcoming concerts by location, genre, and date
- **Ticket Booking** - Simple flow for purchasing event tickets with confirmation
- **Artist Following** - Follow your favorite artists to stay updated on their events

### 📱 Social Elements

- **Moments Feed** - Share photos and experiences from concerts you've attended
- **Social Interaction** - Like and comment on moments shared by other users
- **Event Tagging** - Link your moments to specific events and artists

### 🎧 Integrations

- **Spotify Integration** - Connect your Spotify account to enhance your profile
- **QR Ticket System** - Digital tickets with QR codes for event access

## 🛠️ Technologies Used

### Frontend

- EJS (Embedded JavaScript templates)
- Bootstrap 5
- CSS3 with custom animations
- Font Awesome icons
- JavaScript (ES6+)

### Backend

- Node.js
- Express.js
- PostgreSQL database
- Sequelize ORM
- Multer for file uploads
- Bcrypt for password hashing
- Express-session for session management

## 📋 Prerequisites

- Node.js (v14.0.0 or higher)
- PostgreSQL database
- npm or yarn

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Himanshu-Kimtani/Capstone
   cd vynyl
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   - Create a `.env` file in the root directory

   ```
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=yourpassword
   DB_NAME=vynyl
   SESSION_SECRET=yoursecretkey
   PORT=7778
   BASE_URL=http://localhost:7778
   ```

4. **Set up the database**

   ```bash
   npx sequelize-cli db:create
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```

5. **Start the server**

   ```bash
   npm start
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:7778`

## 🧪 Testing User Accounts

| Role   | Email           | Password |
| ------ | --------------- | -------- |
| Admin  | admin@vynyl.com | admin123 |
| User   | hk@vynyl.com    | hk@123   |
| Artist | king@vynyl.com  | king@123 |

## 🔒 Security Features

- Password hashing with bcrypt
- CSRF protection
- Session management
- Input validation
- Secure file uploads

## 🌟 Key Features by User Role

### Regular Users

- Browse and book event tickets
- Create and share moments from concerts
- Follow artists and view upcoming events
- Manage personal profile and event history

### Artists

- Manage artist profile and information
- Create and manage concert events
- View follower statistics and interactions
- Share updates with followers

### Administrators

- Full system management
- Create and manage artists and events
- Moderate user content
- View platform analytics

## 📚 API Documentation

VYNYL provides a REST API for interacting with the platform programmatically.

## 📁 Project Structure

```
vynyl/
├── controllers/       # Request handlers
├── models/           # Database models
├── public/           # Static assets
│   ├── css/          # Stylesheets
│   ├── js/           # Client-side JavaScript
│   └── uploads/      # User uploads
├── routes/           # Application routes
├── views/            # EJS templates
│   └── partials/     # Reusable view components
├── middleware/       # Custom middleware
├── server.js         # Application entry point
└── README.md         # Project documentation
```

## 🔄 Future Development

- Mobile application
- Ticket resale marketplace
- Artist merchandise integration
- Live streaming concert features
- Enhanced recommendation algorithm

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
