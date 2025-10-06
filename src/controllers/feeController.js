const FeeStructure = require('../models/FeeStructure');
const Course = require('../models/Course');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');
const { validateRequiredFields, isValidObjectId, validateAcademicYear } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Get fee structure list (Admin only)
 */
const getFeeStructureList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['name', 'academicYear', 'semester', 'createdAt']);

  const filters = { isActive: true };
  
  if (req.query.course) filters.course = req.query.course;
  if (req.query.academicYear) filters.academicYear = req.query.academicYear;
  if (req.query.semester) filters.semester = req.query.semester;

  const fees = await FeeStructure.find(filters)
    .populate([
      { path: 'course', select: 'courseName courseCode department' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await FeeStructure.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Fee structures retrieved successfully', fees, paginationMeta);
});

/**
 * Get single fee structure (Admin only)
 */
const getFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid fee structure ID');
  }

  const feeStructure = await FeeStructure.findById(id)
    .populate([
      { path: 'course', select: 'courseName courseCode department' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

  if (!feeStructure) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Fee structure not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Fee structure retrieved successfully', feeStructure);
});

/**
 * Add fee structure (Admin only)
 */
const addFeeStructure = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    course,
    academicYear,
    semester,
    feeComponents,
    discountPercentage,
    lateFeePercentage,
    lateFeeGraceDays,
    validFrom,
    validTo
  } = req.body;

  const requiredFields = ['name', 'course', 'academicYear', 'semester', 'feeComponents', 'validFrom', 'validTo'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  if (!isValidObjectId(course)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const academicYearValidation = validateAcademicYear(academicYear);
  if (!academicYearValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Academic year validation failed', academicYearValidation.errors);
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  const feeStructure = await FeeStructure.create({
    name,
    description,
    course,
    academicYear,
    semester,
    feeComponents,
    discountPercentage,
    lateFeePercentage,
    lateFeeGraceDays,
    validFrom,
    validTo,
    createdBy: req.user._id
  });

  await feeStructure.populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'createdBy', select: 'firstName lastName email' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Fee structure added successfully', feeStructure);
});

/**
 * Update fee structure (Admin only)
 */
const updateFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid fee structure ID');
  }

  if (updateData.academicYear) {
    const academicYearValidation = validateAcademicYear(updateData.academicYear);
    if (!academicYearValidation.isValid) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Academic year validation failed', academicYearValidation.errors);
    }
  }

  const feeStructure = await FeeStructure.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'createdBy', select: 'firstName lastName email' }
  ]);

  if (!feeStructure) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Fee structure not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Fee structure updated successfully', feeStructure);
});

/**
 * Delete fee structure (Admin only)
 */
const deleteFeeStructure = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid fee structure ID');
  }

  const feeStructure = await FeeStructure.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!feeStructure) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Fee structure not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Fee structure deleted successfully');
});

module.exports = {
  getFeeStructureList,
  getFeeStructure,
  addFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
};
