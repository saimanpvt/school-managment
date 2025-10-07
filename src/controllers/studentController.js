const Student = require('../models/Student');
const User = require('../models/User');
const Course = require('../models/Course');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidObjectId } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Add a new student (Admin only)
 */
const addStudent = asyncHandler(async (req, res) => {
  const {
    user,
    studentId,
    parent,
    classTeacher,
    course,
    dateOfBirth,
    gender,
    bloodGroup,
    emergencyContact,
    medicalInfo,
    academicInfo
  } = req.body;

  // Validate required fields
  const requiredFields = ['user', 'studentId', 'parent', 'classTeacher', 'course', 'dateOfBirth', 'gender', 'bloodGroup', 'emergencyContact'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate ObjectIds
  const objectIds = { user, parent, classTeacher, course };
  for (const [key, value] of Object.entries(objectIds)) {
    if (!isValidObjectId(value)) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, `Invalid ${key} ID`);
    }
  }

  // Check if user exists and is a student
  const userDoc = await User.findById(user);
  if (!userDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'User not found');
  }
  if (userDoc.role !== USER_ROLES.STUDENT) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'User must have student role');
  }

  // Check if parent exists and is a parent
  const parentDoc = await User.findById(parent);
  if (!parentDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Parent not found');
  }
  if (parentDoc.role !== USER_ROLES.PARENT) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Parent must have parent role');
  }

  // Check if teacher exists and is a teacher
  const teacherDoc = await User.findById(classTeacher);
  if (!teacherDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Teacher not found');
  }
  if (teacherDoc.role !== USER_ROLES.TEACHER) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Class teacher must have teacher role');
  }

  // Check if course exists
  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  // Check if student already exists with this user
  const existingStudent = await Student.findOne({ user });
  if (existingStudent) {
    return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'Student record already exists for this user');
  }

  // Create student
  const student = await Student.create({
    user,
    studentId: studentId.toUpperCase(),
    parent,
    classTeacher,
    course,
    dateOfBirth,
    gender,
    bloodGroup,
    emergencyContact,
    medicalInfo,
    academicInfo
  });

  // Populate references
  await student.populate([
    { path: 'user', select: 'firstName lastName email phone' },
    { path: 'parent', select: 'firstName lastName email phone' },
    { path: 'classTeacher', select: 'firstName lastName email phone' },
    { path: 'course', select: 'courseName courseCode department' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Student added successfully', student);
});

/**
 * Get student list (Admin, Teacher)
 */
const getStudentList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['firstName', 'lastName', 'studentId', 'createdAt']);

  // Build filter options
  const filters = {};
  
  if (req.query.course) {
    filters.course = req.query.course;
  }
  
  if (req.query.classTeacher) {
    filters.classTeacher = req.query.classTeacher;
  }
  
  if (req.query.gender) {
    filters.gender = req.query.gender;
  }
  
  if (req.query.isActive !== undefined) {
    filters.isActive = req.query.isActive === 'true';
  }

  if (req.query.search) {
    filters.$or = [
      { studentId: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Get students with pagination
  const students = await Student.find(filters)
    .populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'parent', select: 'firstName lastName email phone' },
      { path: 'classTeacher', select: 'firstName lastName email phone' },
      { path: 'course', select: 'courseName courseCode department' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Student.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Students retrieved successfully', students, paginationMeta);
});

/**
 * Get single student (Admin, Teacher, Parent, Student)
 */
const getStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid student ID');
  }

  const student = await Student.findById(id)
    .populate([
      { path: 'user', select: 'firstName lastName email phone address' },
      { path: 'parent', select: 'firstName lastName email phone address' },
      { path: 'classTeacher', select: 'firstName lastName email phone' },
      { path: 'course', select: 'courseName courseCode department duration' }
    ]);

  if (!student) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Student not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Student retrieved successfully', student);
});

/**
 * Update student (Admin only)
 */
const updateStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid student ID');
  }

  // Validate ObjectIds if provided
  if (updateData.parent && !isValidObjectId(updateData.parent)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid parent ID');
  }
  if (updateData.classTeacher && !isValidObjectId(updateData.classTeacher)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid class teacher ID');
  }
  if (updateData.course && !isValidObjectId(updateData.course)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const student = await Student.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'user', select: 'firstName lastName email phone' },
    { path: 'parent', select: 'firstName lastName email phone' },
    { path: 'classTeacher', select: 'firstName lastName email phone' },
    { path: 'course', select: 'courseName courseCode department' }
  ]);

  if (!student) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Student not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Student updated successfully', student);
});

/**
 * Delete student (Admin only)
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid student ID');
  }

  const student = await Student.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!student) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Student not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Student deactivated successfully');
});

module.exports = {
  addStudent,
  getStudentList,
  getStudent,
  updateStudent,
  deleteStudent
};
