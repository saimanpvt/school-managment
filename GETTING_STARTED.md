# Getting Started Guide

This guide will help you set up and run the Student Management System backend API.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### 1. Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 2. Environment Configuration

Edit `.env` file with your settings:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/student_management_system

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup

Make sure MongoDB is running on your system:

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Linux)
sudo systemctl start mongod

# Start MongoDB (Windows)
net start MongoDB
```

### 4. Seed Initial Data

```bash
npm run seed
```

This will create sample users:
- **Admin**: admin@example.com / admin123
- **Teacher**: teacher@example.com / teacher123
- **Student**: student@example.com / student123
- **Parent**: parent@example.com / parent123

### 5. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 🧪 Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123",
    "firstName": "New",
    "lastName": "User",
    "role": 3
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### Access Protected Route
```bash
# Use the token from login response
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📊 API Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | User registration |
| POST | `/api/auth/login` | Public | User login |
| GET | `/api/auth/profile` | Authenticated | Get user profile |
| GET | `/api/students` | Teacher+Admin | List students |
| GET | `/api/students/:id` | All (with restrictions) | Get student details |
| POST | `/api/students` | Admin | Create student |
| GET | `/api/courses` | All | List courses |
| GET | `/api/marks` | Teacher+Admin | List marks |
| POST | `/api/marks` | Student+Teacher | Add marks |

## 🔐 Role-Based Access

### Role Hierarchy
1. **Admin (1)** - Full system access
2. **Teacher (2)** - Student management, courses, marks
3. **Student (3)** - Own data, course enrollment
4. **Parent (4)** - Child's data only

### Access Examples

**Admin Access:**
```bash
# Create student (Admin only)
curl -X POST http://localhost:3000/api/students \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user": "USER_ID", "studentId": "CS2024001", ...}'

# List all teachers (Admin only)
curl -X GET http://localhost:3000/api/teachers \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Teacher Access:**
```bash
# List students (Teacher+Admin)
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer TEACHER_TOKEN"

# Add marks (Student+Teacher)
curl -X POST http://localhost:3000/api/marks \
  -H "Authorization: Bearer TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"student": "STUDENT_ID", "exam": "EXAM_ID", ...}'
```

**Student Access:**
```bash
# View own profile
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer STUDENT_TOKEN"

# List courses
curl -X GET http://localhost:3000/api/courses \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Parent Access:**
```bash
# View child's data (restricted)
curl -X GET http://localhost:3000/api/students/CHILD_ID \
  -H "Authorization: Bearer PARENT_TOKEN"
```

## 🛠️ Development

### Project Structure
```
src/
├── config/          # Database & constants
├── controllers/     # Request handlers
├── middlewares/     # Auth & validation
├── models/          # Database schemas
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
└── app.js           # Main application
```

### Adding New Endpoints

1. **Create Model** (if needed):
```javascript
// src/models/NewModel.js
const mongoose = require('mongoose');
const newModelSchema = new mongoose.Schema({
  // schema definition
});
module.exports = mongoose.model('NewModel', newModelSchema);
```

2. **Create Controller**:
```javascript
// src/controllers/newController.js
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse } = require('../utils/response');

const getNewData = asyncHandler(async (req, res) => {
  // controller logic
  sendSuccessResponse(res, 200, 'Success', data);
});

module.exports = { getNewData };
```

3. **Create Routes**:
```javascript
// src/routes/newRoutes.js
const express = require('express');
const router = express.Router();
const newController = require('../controllers/newController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);
router.get('/', newController.getNewData);
module.exports = router;
```

4. **Register Routes** in `src/app.js`:
```javascript
const newRoutes = require('./routes/newRoutes');
app.use('/api/new', newRoutes);
```

## 🚨 Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
- Ensure MongoDB is running
- Check connection string in `.env`
- Verify MongoDB port (default: 27017)

**2. JWT Token Error**
```
Error: jwt malformed
```
- Check JWT_SECRET in `.env`
- Ensure token is properly formatted
- Verify token hasn't expired

**3. Role Access Error**
```
Error: Insufficient permissions
```
- Check user role in database
- Verify role middleware configuration
- Ensure proper role hierarchy

**4. Validation Error**
```
Error: Validation failed
```
- Check required fields in request
- Verify data types and formats
- Review model validation rules

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Database Queries

Connect to MongoDB shell:
```bash
mongosh student_management_system
```

View collections:
```javascript
show collections
db.users.find()
db.students.find()
```

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [Postman](https://www.postman.com/) - API testing tool

## 🆘 Support

If you encounter issues:

1. Check the error logs
2. Verify environment configuration
3. Ensure all dependencies are installed
4. Check MongoDB connection
5. Review API endpoint documentation

For additional help, create an issue in the repository or check the main README.md file.
