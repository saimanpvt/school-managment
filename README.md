# Student-Teacher-Parent-Admin Management System

A comprehensive backend API for managing educational institutions with role-based access control for students, teachers, parents, and administrators.

## 🚀 Features

- **Role-Based Access Control (RBAC)** with 4 user roles: Admin, Teacher, Student, Parent
- **JWT Authentication** with secure token management
- **MongoDB Integration** with Mongoose ODM
- **Comprehensive Data Models** with proper relationships
- **RESTful API Design** with clean endpoints
- **Input Validation** and error handling
- **Security Middleware** (Helmet, CORS, Rate Limiting)
- **Logging** with Morgan
- **Async/Await** error handling
- **Pagination** support for list endpoints

## 🏗️ Architecture

```
src/
├── config/          # Database and constants configuration
├── controllers/     # Request handlers and business logic
├── middlewares/     # Authentication, authorization, and error handling
├── models/          # MongoDB schemas and models
├── routes/          # API route definitions
├── services/        # Business logic services
├── utils/           # Utility functions and helpers
└── app.js           # Main application file
```

## 👥 User Roles & Hierarchy

| Role | Level | Access |
|------|-------|--------|
| Admin | 1 | Full system access |
| Teacher | 2 | Student management, course management, marks |
| Student | 3 | Own data access, course enrollment |
| Parent | 4 | Child's data access only |

## 📊 Data Models

### Core Models
- **User**: Base user model with authentication
- **Student**: Student-specific information and relationships
- **Teacher**: Teacher profiles and qualifications
- **Course**: Course details and scheduling
- **Exam**: Exam information and scheduling
- **Marks**: Student exam results and grades
- **FeeStructure**: Fee management and billing
- **Reference**: Course materials and resources

## 🔐 Authentication & Authorization

### JWT Authentication
- Secure token-based authentication
- Token expiration and refresh
- Cookie-based token storage option

### Role-Based Access Control
- Middleware-based role checking
- Hierarchical permission system
- Data access restrictions based on relationships

## 📋 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `PUT /change-password` - Change password

### Students (`/api/students`)
- `GET /` - Get student list (Teacher + Admin)
- `GET /:id` - Get student details (All with restrictions)
- `POST /` - Add student (Admin only)
- `PUT /:id` - Update student (Admin only)
- `DELETE /:id` - Delete student (Admin only)

### Teachers (`/api/teachers`)
- `GET /` - Get teacher list (Admin only)
- `GET /:id` - Get teacher details (Admin only)
- `POST /` - Add teacher (Admin only)
- `PUT /:id` - Update teacher (Admin only)
- `DELETE /:id` - Delete teacher (Admin only)

### Courses (`/api/courses`)
- `GET /` - Get course list (All roles)
- `GET /:id` - Get course details (All roles)
- `POST /` - Add course (Student + Teacher)
- `PUT /:id` - Update course (Student + Teacher)
- `DELETE /:id` - Delete course (Admin only)

### Marks (`/api/marks`)
- `GET /:id` - Get marks record (All with restrictions)
- `GET /list` - Get marks list (Teacher + Admin)
- `POST /` - Add marks record (Student + Teacher)
- `PUT /:id` - Update marks record (Student + Teacher)

### Exams (`/api/exams`)
- `GET /` - Get exam list (All roles)
- `GET /:id` - Get exam details (All roles)
- `POST /` - Add exam (Student + Teacher)
- `PUT /:id` - Update exam (Student + Teacher)

### References (`/api/references`)
- `GET /` - Get references list (All roles)
- `GET /:id` - Get reference details (All roles)
- `POST /` - Add reference (Teacher + Admin)
- `PUT /:id` - Update reference (Teacher + Admin)
- `DELETE /:id` - Delete reference (Teacher + Admin)

### Fees (`/api/fees`)
- `GET /` - Get fee structure list (Admin only)
- `GET /:id` - Get fee structure details (Admin only)
- `POST /` - Add fee structure (Admin only)
- `PUT /:id` - Update fee structure (Admin only)
- `DELETE /:id` - Delete fee structure (Admin only)

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd student-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/student_management_system
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRE=7d
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |

### Database Setup

1. **Start MongoDB service**
2. **Create database**: The application will create the database automatically
3. **Collections**: Models will create collections with proper indexes

## 📝 Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": 1
  }'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### Get Students (with authentication)
```bash
curl -X GET http://localhost:3000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Testing

The API can be tested using:
- **Postman**: Import the API collection
- **curl**: Command-line testing
- **Thunder Client**: VS Code extension
- **Insomnia**: API testing tool

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **JWT**: Secure token authentication
- **bcrypt**: Password hashing
- **Input Validation**: Data sanitization
- **Error Handling**: Secure error responses

## 📈 Performance

- **Database Indexing**: Optimized queries
- **Pagination**: Efficient data loading
- **Connection Pooling**: MongoDB connection management
- **Caching**: Response caching strategies
- **Compression**: Response compression

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   NODE_ENV=production
   MONGODB_URI=mongodb://your-production-db
   JWT_SECRET=your-production-secret
   ```

2. **Build and Start**
   ```bash
   npm start
   ```

3. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start src/app.js --name "student-management-api"
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - User management with RBAC
  - Student, Teacher, Course management
  - Marks and Exam tracking
  - Fee structure management
  - Reference materials system

---

**Note**: This is a backend-only implementation. Frontend integration requires additional setup and configuration.
