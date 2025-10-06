const Teacher = require('../models/Teacher');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidObjectId } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Add teacher (Admin only)
 */
const addTeacher = asyncHandler(async (req, res) => {
  const {
    user,
    employeeId,
    department,
    subjects,
    qualification,
    experience,
    salary,
    joiningDate,
    isClassTeacher,
    classTeacherFor,
    bio
  } = req.body;

  // Validate required fields
  const requiredFields = ['user', 'employeeId', 'department', 'qualification'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate ObjectIds
  if (!isValidObjectId(user)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid user ID');
  }

  if (classTeacherFor && !isValidObjectId(classTeacherFor)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  // Check if user exists and is a teacher
  const userDoc = await User.findById(user);
  if (!userDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'User not found');
  }
  if (userDoc.role !== USER_ROLES.TEACHER) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'User must have teacher role');
  }

  // Check if teacher already exists with this user
  const existingTeacher = await Teacher.findOne({ user });
  if (existingTeacher) {
    return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'Teacher record already exists for this user');
  }

  // Create teacher
  const teacher = await Teacher.create({
    user,
    employeeId: employeeId.toUpperCase(),
    department,
    subjects,
    qualification,
    experience,
    salary,
    joiningDate: joiningDate || new Date(),
    isClassTeacher,
    classTeacherFor,
    bio
  });

  // Populate references
  await teacher.populate([
    { path: 'user', select: 'firstName lastName email phone address' },
    { path: 'classTeacherFor', select: 'courseName courseCode department' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Teacher added successfully', teacher);
});

/**
 * Get teacher list (Admin only)
 */
const getTeacherList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['firstName', 'lastName', 'employeeId', 'department', 'createdAt']);

  // Build filter options
  const filters = { isActive: true };
  
  if (req.query.department) {
    filters.department = req.query.department;
  }
  
  if (req.query.isClassTeacher !== undefined) {
    filters.isClassTeacher = req.query.isClassTeacher === 'true';
  }

  if (req.query.search) {
    filters.$or = [
      { employeeId: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Get teachers with pagination
  const teachers = await Teacher.find(filters)
    .populate([
      { path: 'user', select: 'firstName lastName email phone address' },
      { path: 'classTeacherFor', select: 'courseName courseCode department' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Teacher.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Teachers retrieved successfully', teachers, paginationMeta);
});

/**
 * Get single teacher (Admin only)
 */
const getTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID');
  }

  const teacher = await Teacher.findById(id)
    .populate([
      { path: 'user', select: 'firstName lastName email phone address' },
      { path: 'classTeacherFor', select: 'courseName courseCode department' }
    ]);

  if (!teacher) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Teacher not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Teacher retrieved successfully', teacher);
});

/**
 * Update teacher (Admin only)
 */
const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID');
  }

  // Validate ObjectIds if provided
  if (updateData.classTeacherFor && !isValidObjectId(updateData.classTeacherFor)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const teacher = await Teacher.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'user', select: 'firstName lastName email phone address' },
    { path: 'classTeacherFor', select: 'courseName courseCode department' }
  ]);

  if (!teacher) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Teacher not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Teacher updated successfully', teacher);
});

/**
 * Delete teacher (Admin only)
 */
const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID');
  }

  const teacher = await Teacher.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!teacher) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Teacher not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Teacher deactivated successfully');
});

module.exports = {
  addTeacher,
  getTeacherList,
  getTeacher,
  updateTeacher,
  deleteTeacher
};
