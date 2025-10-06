const express = require('express');
const router = express.Router();
const referenceController = require('../controllers/referenceController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireTeacherOrAdmin } = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Common routes (accessible by all authenticated users)
router.get('/', referenceController.getReferencesList);
router.get('/:id', referenceController.getReferences);

// Teacher + Admin routes
router.post('/', requireTeacherOrAdmin, referenceController.addReferences);
router.put('/:id', requireTeacherOrAdmin, referenceController.updateReferences);
router.delete('/:id', requireTeacherOrAdmin, referenceController.deleteReferences);

module.exports = router;
