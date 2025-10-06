const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');
const Course = require('../src/models/Course');
const { USER_ROLES } = require('../src/config/constants');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Seed initial data
const seedData = async () => {
  try {
    console.log('Starting data seeding...');

    // Clear existing data (optional - remove in production)
    // await User.deleteMany({});
    // await Course.deleteMany({});

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const admin = await User.create({
        email: 'admin@example.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Admin',
        role: USER_ROLES.ADMIN,
        phone: '+1234567890'
      });
      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create teacher user
    const teacherExists = await User.findOne({ email: 'teacher@example.com' });
    if (!teacherExists) {
      const teacher = await User.create({
        email: 'teacher@example.com',
        password: 'teacher123',
        firstName: 'John',
        lastName: 'Teacher',
        role: USER_ROLES.TEACHER,
        phone: '+1234567891'
      });
      console.log('✅ Teacher user created:', teacher.email);
    } else {
      console.log('ℹ️  Teacher user already exists');
    }

    // Create student user
    const studentExists = await User.findOne({ email: 'student@example.com' });
    if (!studentExists) {
      const student = await User.create({
        email: 'student@example.com',
        password: 'student123',
        firstName: 'Jane',
        lastName: 'Student',
        role: USER_ROLES.STUDENT,
        phone: '+1234567892'
      });
      console.log('✅ Student user created:', student.email);
    } else {
      console.log('ℹ️  Student user already exists');
    }

    // Create parent user
    const parentExists = await User.findOne({ email: 'parent@example.com' });
    if (!parentExists) {
      const parent = await User.create({
        email: 'parent@example.com',
        password: 'parent123',
        firstName: 'Bob',
        lastName: 'Parent',
        role: USER_ROLES.PARENT,
        phone: '+1234567893'
      });
      console.log('✅ Parent user created:', parent.email);
    } else {
      console.log('ℹ️  Parent user already exists');
    }

    // Create sample course
    const courseExists = await Course.findOne({ courseCode: 'CS101' });
    if (!courseExists) {
      const course = await Course.create({
        courseCode: 'CS101',
        courseName: 'Introduction to Computer Science',
        description: 'Basic concepts of computer science and programming',
        department: 'Computer Science',
        duration: 4,
        credits: 3,
        capacity: 50,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-05-15'),
        semester: 'Spring',
        academicYear: '2024-2025',
        isActive: true
      });
      console.log('✅ Sample course created:', course.courseCode);
    } else {
      console.log('ℹ️  Sample course already exists');
    }

    console.log('🎉 Data seeding completed successfully!');
    
    // Display login credentials
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Teacher: teacher@example.com / teacher123');
    console.log('Student: student@example.com / student123');
    console.log('Parent: parent@example.com / parent123');

  } catch (error) {
    console.error('❌ Seeding error:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeding
const runSeed = async () => {
  await connectDB();
  await seedData();
};

// Check if this file is being run directly
if (require.main === module) {
  runSeed();
}

module.exports = { seedData, connectDB };
