const Course = require('../models/Course');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidObjectId, validateAcademicYear } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Get course list (Common - accessible by all roles)
 */
const getCourseList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['courseName', 'courseCode', 'department', 'createdAt']);

  // Build filter options
  const filters = { isActive: true };
  
  if (req.query.department) {
    filters.department = req.query.department;
  }
  
  if (req.query.semester) {
    filters.semester = req.query.semester;
  }
  
  if (req.query.academicYear) {
    filters.academicYear = req.query.academicYear;
  }

  if (req.query.search) {
    filters.$or = [
      { courseName: { $regex: req.query.search, $options: 'i' } },
      { courseCode: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Get courses with pagination
  const courses = await Course.find(filters)
    .populate([
      { path: 'teachers', select: 'firstName lastName email' },
      { path: 'classTeacher', select: 'firstName lastName email' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Course.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Courses retrieved successfully', courses, paginationMeta);
});

/**
 * Get single course (Common - accessible by all roles)
 */
const getCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const course = await Course.findById(id)
    .populate([
      { path: 'teachers', select: 'firstName lastName email phone' },
      { path: 'classTeacher', select: 'firstName lastName email phone' }
    ]);

  if (!course) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Course retrieved successfully', course);
});

/**
 * Add course (Student + Teacher, Admin only for full access)
 */
const addCourse = asyncHandler(async (req, res) => {
  const {
    courseCode,
    courseName,
    description,
    department,
    duration,
    credits,
    teachers,
    classTeacher,
    capacity,
    startDate,
    endDate,
    semester,
    academicYear,
    requirements,
    schedule
  } = req.body;

  // Validate required fields
  const requiredFields = ['courseCode', 'courseName', 'department', 'duration', 'credits', 'startDate', 'endDate', 'semester', 'academicYear'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate academic year format
  const academicYearValidation = validateAcademicYear(academicYear);
  if (!academicYearValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Academic year validation failed', academicYearValidation.errors);
  }

  // Validate ObjectIds
  if (teachers && Array.isArray(teachers)) {
    for (const teacherId of teachers) {
      if (!isValidObjectId(teacherId)) {
        return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID in teachers array');
      }
    }
  }

  if (classTeacher && !isValidObjectId(classTeacher)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid class teacher ID');
  }

  // Check if course code already exists
  const existingCourse = await Course.findOne({ courseCode: courseCode.toUpperCase() });
  if (existingCourse) {
    return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'Course code already exists');
  }

  // Validate teachers exist and have teacher role
  if (teachers && teachers.length > 0) {
    const teacherDocs = await User.find({ _id: { $in: teachers }, role: USER_ROLES.TEACHER });
    if (teacherDocs.length !== teachers.length) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Some teachers not found or invalid role');
    }
  }

  // Validate class teacher
  if (classTeacher) {
    const classTeacherDoc = await User.findOne({ _id: classTeacher, role: USER_ROLES.TEACHER });
    if (!classTeacherDoc) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Class teacher not found or invalid role');
    }
  }

  // Create course
  const course = await Course.create({
    courseCode: courseCode.toUpperCase(),
    courseName,
    description,
    department,
    duration,
    credits,
    teachers,
    classTeacher,
    capacity: capacity || 30,
    startDate,
    endDate,
    semester,
    academicYear,
    requirements,
    schedule
  });

  // Populate references
  await course.populate([
    { path: 'teachers', select: 'firstName lastName email' },
    { path: 'classTeacher', select: 'firstName lastName email' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Course added successfully', course);
});

/**
 * Update course (Student + Teacher, Admin only for full access)
 */
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  // Validate academic year if provided
  if (updateData.academicYear) {
    const academicYearValidation = validateAcademicYear(updateData.academicYear);
    if (!academicYearValidation.isValid) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Academic year validation failed', academicYearValidation.errors);
    }
  }

  // Validate ObjectIds if provided
  if (updateData.teachers && Array.isArray(updateData.teachers)) {
    for (const teacherId of updateData.teachers) {
      if (!isValidObjectId(teacherId)) {
        return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID in teachers array');
      }
    }
  }

  if (updateData.classTeacher && !isValidObjectId(updateData.classTeacher)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid class teacher ID');
  }

  // Check if course code already exists (if being updated)
  if (updateData.courseCode) {
    const existingCourse = await Course.findOne({ 
      courseCode: updateData.courseCode.toUpperCase(),
      _id: { $ne: id }
    });
    if (existingCourse) {
      return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'Course code already exists');
    }
    updateData.courseCode = updateData.courseCode.toUpperCase();
  }

  const course = await Course.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'teachers', select: 'firstName lastName email' },
    { path: 'classTeacher', select: 'firstName lastName email' }
  ]);

  if (!course) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Course updated successfully', course);
});

/**
 * Delete course (Admin only)
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  const course = await Course.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!course) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Course deactivated successfully');
});

module.exports = {
  getCourseList,
  getCourse,
  addCourse,
  updateCourse,
  deleteCourse
};
