const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Admin only routes
router.get('/', requireAdmin, feeController.getFeeStructureList);
router.get('/:id', requireAdmin, feeController.getFeeStructure);
router.post('/', requireAdmin, feeController.addFeeStructure);
router.put('/:id', requireAdmin, feeController.updateFeeStructure);
router.delete('/:id', requireAdmin, feeController.deleteFeeStructure);

module.exports = router;
