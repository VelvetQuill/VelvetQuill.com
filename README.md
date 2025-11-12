
# VelvetQuill - Romance Stories Platform

![VelvetQuill Logo](https://via.placeholder.com/150x50/8B0000/FFFFFF?text=VelvetQuill)

A modern, elegant platform for romance writers and readers to share and discover captivating love stories.

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

VelvetQuill is a dedicated platform for romance literature enthusiasts. We provide a beautiful, intuitive space where writers can share their romantic stories and readers can discover new voices in romance fiction.

### Key Objectives
- Create a supportive community for romance writers
- Provide readers with high-quality romantic content
- Enable monetization opportunities for authors
- Maintain a safe, respectful environment for all users

## ✨ Features

### For Readers
- **Discover Stories**: Browse thousands of romance stories across multiple subgenres
- **Personalized Recommendations**: AI-powered story suggestions based on reading history
- **Reading Lists**: Create and share collections of favorite stories
- **Social Features**: Follow authors, comment on stories, and join discussions
- **Mobile Reading**: Responsive design optimized for all devices

### For Authors
- **Author Dashboard**: Comprehensive analytics and story management
- **Rich Text Editor**: Advanced editing tools with formatting options
- **Monetization**: Multiple revenue streams including subscriptions and tips
- **Community Building**: Tools to grow and engage with your reader base
- **Copyright Protection**: Built-in content protection and DMCA compliance

### Platform Features
- **Content Moderation**: AI-assisted and human moderation system
- **Age Verification**: Strict 18+ policy with verification mechanisms
- **Multi-language Support**: Global audience reach
- **Accessibility**: WCAG 2.1 compliant interface
- **Performance**: Optimized for fast loading and smooth experience

## 🛠 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **JavaScript (ES6+)** - Modern JavaScript features
- **Materialize CSS** - UI components and design system
- **jQuery** - DOM manipulation and AJAX
- **CanvasJS** - Data visualization and charts
- **Slick Carousel** - Responsive carousels

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Primary database
- **Redis** - Caching and session storage
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Web server and reverse proxy
- **AWS S3** - File storage
- **Cloudflare** - CDN and security
- **PM2** - Process management

## 🚀 Installation

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- Redis 6.0+

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/velvetquill/platform.git
cd velvetquill
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Database setup**
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE velvetquill;"

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

5. **Start development server**
```bash
# Start backend
npm run dev

# Start frontend (in another terminal)
npm run client
```

### Docker Setup

```bash
# Using Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:migrate
```

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000
CLIENT_URL=http://localhost:8080

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=velvetquill
DB_USER=root
DB_PASS=password

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d

# File Storage
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=velvetquill-assets

# Email Service
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-key

# Content Moderation
MODERATION_API_KEY=your-moderation-key
```

### File Structure

```
velvetquill/
├── client/                 # Frontend application
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── images/            # Static images
│   └── index.html         # Main entry point
├── server/                # Backend application
│   ├── controllers/       # Route controllers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── utils/            # Utility functions
├── database/             # Database scripts
│   ├── migrations/       # Schema migrations
│   ├── seeds/           # Initial data
│   └── schema.sql       # Database schema
└── docs/                # Documentation
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh token | Yes |

### Stories Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/stories` | Get stories with filters | No |
| GET | `/api/stories/:id` | Get single story | No |
| POST | `/api/stories` | Create new story | Author |
| PUT | `/api/stories/:id` | Update story | Author |
| DELETE | `/api/stories/:id` | Delete story | Author |

### Authors Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/authors` | Get authors list | No |
| GET | `/api/authors/:username` | Get author profile | No |
| POST | `/api/authors/apply` | Apply as author | User |
| POST | `/api/authors/:id/follow` | Follow author | User |

### Example API Usage

```javascript
// Get stories from Contemporary category
fetch('/api/stories?category=contemporary&page=1&limit=20')
  .then(response => response.json())
  .then(data => console.log(data));

// Create a new story
fetch('/api/stories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: 'My Romance Story',
    content: 'Story content...',
    category_id: 1,
    content_rating: 'general'
  })
});
```

## 🗃 Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_author BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Stories
```sql
CREATE TABLE stories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  author_id INT NOT NULL,
  category_id INT NOT NULL,
  status ENUM('draft', 'published') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Categories
```sql
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT
);
```

### Entity Relationship Diagram

```
Users (1) ←→ (Many) Stories
Stories (Many) ←→ (1) Categories
Users (Many) ←→ (Many) Users (Followers)
Stories (1) ←→ (Many) Comments
Stories (1) ←→ (Many) Ratings
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**
```bash
export NODE_ENV=production
export DB_HOST=production-db-host
# ... other production variables
```

3. **Start production server**
```bash
npm start
```

### Deployment with PM2

```bash
# Create ecosystem file
npm run pm2:init

# Start application
pm2 start ecosystem.config.js

# Monitor application
pm2 monit
```

### Docker Production

```bash
# Build image
docker build -t velvetquill .

# Run container
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=host.docker.internal \
  velvetquill
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
```bash
git checkout -b feature/amazing-feature
```
3. **Commit your changes**
```bash
git commit -m 'Add amazing feature'
```
4. **Push to the branch**
```bash
git push origin feature/amazing-feature
```
5. **Open a Pull Request**

### Code Standards

- Follow ESLint configuration
- Write meaningful commit messages
- Include tests for new features
- Update documentation accordingly

### Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🛡 Security

### Reporting Security Issues

If you discover a security vulnerability, please email security@velvetquill.com. We will respond to all legitimate reports promptly.

### Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CSRF protection
- XSS prevention
- SQL injection prevention
- Rate limiting on API endpoints
- Content Security Policy (CSP)

## 📊 Analytics

### Built-in Analytics
- Story view tracking
- Reader engagement metrics
- Author performance dashboards
- Content popularity analysis
- User behavior insights

### Integration
- Google Analytics 4
- Custom event tracking
- Real-time analytics dashboard

## 🔧 Maintenance

### Regular Tasks
- Database backups
- Security updates
- Performance monitoring
- Content moderation
- User support

### Monitoring
- Uptime monitoring
- Error tracking
- Performance metrics
- Security alerts

## 🌐 Internationalization

### Supported Languages
- English (primary)
- Spanish (planned)
- French (planned)
- German (planned)

### Contributing Translations
We welcome translation contributions! Contact i18n@velvetquill.com for more information.

## 📞 Support

### Getting Help
- **Documentation**: [docs.velvetquill.com](https://docs.velvetquill.com)
- **Community Forum**: [community.velvetquill.com](https://community.velvetquill.com)
- **Email Support**: support@velvetquill.com
- **Twitter**: [@VelvetQuillApp](https://twitter.com/VelvetQuillApp)

### Resources
- [Author Guidelines](https://velvetquill.com/author-guidelines)
- [Content Policy](https://velvetquill.com/content-policy)
- [Community Standards](https://velvetquill.com/community-standards)
- [Privacy Policy](https://velvetquill.com/privacy)
- [Terms of Service](https://velvetquill.com/terms)

## 🎉 Acknowledgments

- Thanks to our beta testers and early adopters
- Inspired by the romance writing community
- Built with love for storytellers everywhere

---

**VelvetQuill** - *Where Love Stories Come to Life* 💕

For more information, visit [velvetquill.com](https://velvetquill.com) or join our [community Discord](https://discord.gg/velvetquill).

---

*Last updated: October 2023*