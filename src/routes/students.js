const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin, requireTeacherOrAdmin, canAccessStudentData } = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.post('/', requireAdmin, studentController.addStudent);
router.put('/:id', requireAdmin, studentController.updateStudent);
router.delete('/:id', requireAdmin, studentController.deleteStudent);

// Teacher + Admin routes
router.get('/', requireTeacherOrAdmin, studentController.getStudentList);

// All roles with data access control
router.get('/:id', canAccessStudentData, studentController.getStudent);

module.exports = router;
