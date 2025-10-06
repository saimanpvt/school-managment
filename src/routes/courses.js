const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin, allowRoles } = require('../middlewares/roleMiddleware');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(authMiddleware);

// Common routes (accessible by all authenticated users)
router.get('/', courseController.getCourseList);
router.get('/:id', courseController.getCourse);

// Student + Teacher routes
router.post('/', allowRoles([USER_ROLES.STUDENT, USER_ROLES.TEACHER]), courseController.addCourse);
router.put('/:id', allowRoles([USER_ROLES.STUDENT, USER_ROLES.TEACHER]), courseController.updateCourse);

// Admin only routes
router.delete('/:id', requireAdmin, courseController.deleteCourse);

module.exports = router;
