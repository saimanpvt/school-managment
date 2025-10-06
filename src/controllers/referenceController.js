const Reference = require('../models/Reference');
const Course = require('../models/Course');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');
const { validateRequiredFields, isValidObjectId } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Get references list (Common - accessible by all roles)
 */
const getReferencesList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['title', 'author', 'type', 'createdAt']);

  const filters = { isActive: true };
  
  if (req.query.course) filters.course = req.query.course;
  if (req.query.type) filters.type = req.query.type;
  if (req.query.subject) filters.subject = req.query.subject;
  if (req.query.isRequired !== undefined) filters.isRequired = req.query.isRequired === 'true';

  if (req.query.search) {
    filters.$text = { $search: req.query.search };
  }

  const references = await Reference.find(filters)
    .populate([
      { path: 'course', select: 'courseName courseCode department' },
      { path: 'uploadedBy', select: 'firstName lastName email' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Reference.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'References retrieved successfully', references, paginationMeta);
});

/**
 * Get single reference (Common - accessible by all roles)
 */
const getReferences = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid reference ID');
  }

  const reference = await Reference.findByIdAndUpdate(
    id,
    { $inc: { downloadCount: 1 } },
    { new: true }
  ).populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  if (!reference) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Reference not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Reference retrieved successfully', reference);
});

/**
 * Add reference (Teacher + Admin)
 */
const addReferences = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    type,
    course,
    subject,
    author,
    publisher,
    publicationYear,
    edition,
    isbn,
    url,
    fileUrl,
    tags,
    isRequired,
    fileSize,
    fileFormat
  } = req.body;

  const requiredFields = ['title', 'type', 'course', 'subject'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  if (!isValidObjectId(course)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  const reference = await Reference.create({
    title,
    description,
    type,
    course,
    subject,
    author,
    publisher,
    publicationYear,
    edition,
    isbn,
    url,
    fileUrl,
    tags,
    isRequired,
    uploadedBy: req.user._id,
    fileSize,
    fileFormat
  });

  await reference.populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Reference added successfully', reference);
});

/**
 * Update reference (Teacher + Admin)
 */
const updateReferences = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid reference ID');
  }

  const reference = await Reference.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  if (!reference) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Reference not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Reference updated successfully', reference);
});

/**
 * Delete reference (Teacher + Admin)
 */
const deleteReferences = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid reference ID');
  }

  const reference = await Reference.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!reference) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Reference not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Reference deleted successfully');
});

module.exports = {
  getReferencesList,
  getReferences,
  addReferences,
  updateReferences,
  deleteReferences
};
