const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireTeacherOrAdmin, allowRoles } = require('../middlewares/roleMiddleware');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication
router.use(authMiddleware);

// Common routes (accessible by all authenticated users where allowed)
router.get('/:id', marksController.getMarksRecord);

// Teacher + Admin routes
router.get('/list', requireTeacherOrAdmin, marksController.getMarksRecordList);

// Student + Teacher routes
router.post('/', allowRoles([USER_ROLES.STUDENT, USER_ROLES.TEACHER]), marksController.addMarksRecord);
router.put('/:id', allowRoles([USER_ROLES.STUDENT, USER_ROLES.TEACHER]), marksController.updateMarksRecord);

module.exports = router;
