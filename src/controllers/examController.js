const Exam = require('../models/Exam');
const User = require('../models/User');
const Course = require('../models/Course');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidObjectId, validateAcademicYear } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Get exam record list (Common - accessible by all roles)
 */
const getExamRecordList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['examDate', 'examName', 'examType', 'createdAt']);

  const filters = { isActive: true };
  
  if (req.query.course) filters.course = req.query.course;
  if (req.query.teacher) filters.teacher = req.query.teacher;
  if (req.query.examType) filters.examType = req.query.examType;
  if (req.query.academicYear) filters.academicYear = req.query.academicYear;
  if (req.query.semester) filters.semester = req.query.semester;

  const exams = await Exam.find(filters)
    .populate([
      { path: 'course', select: 'courseName courseCode department' },
      { path: 'teacher', select: 'firstName lastName email' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Exam.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Exams retrieved successfully', exams, paginationMeta);
});

/**
 * Get single exam record (Common - accessible by all roles)
 */
const getExamRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid exam ID');
  }

  const exam = await Exam.findById(id)
    .populate([
      { path: 'course', select: 'courseName courseCode department' },
      { path: 'teacher', select: 'firstName lastName email phone' }
    ]);

  if (!exam) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Exam not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Exam retrieved successfully', exam);
});

/**
 * Add exam record (Student + Teacher)
 */
const addExamRecord = asyncHandler(async (req, res) => {
  const {
    examName,
    examType,
    course,
    subject,
    teacher,
    totalMarks,
    passingMarks,
    examDate,
    startTime,
    endTime,
    duration,
    venue,
    instructions,
    academicYear,
    semester
  } = req.body;

  const requiredFields = ['examName', 'examType', 'course', 'subject', 'teacher', 'totalMarks', 'passingMarks', 'examDate', 'startTime', 'endTime', 'duration', 'venue', 'academicYear', 'semester'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  if (!isValidObjectId(course)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid course ID');
  }

  if (!isValidObjectId(teacher)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid teacher ID');
  }

  const courseDoc = await Course.findById(course);
  if (!courseDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  const teacherDoc = await User.findById(teacher);
  if (!teacherDoc || teacherDoc.role !== USER_ROLES.TEACHER) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Teacher not found or invalid role');
  }

  const exam = await Exam.create({
    examName,
    examType,
    course,
    subject,
    teacher,
    totalMarks,
    passingMarks,
    examDate,
    startTime,
    endTime,
    duration,
    venue,
    instructions,
    academicYear,
    semester
  });

  await exam.populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'teacher', select: 'firstName lastName email' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Exam added successfully', exam);
});

/**
 * Update exam record (Student + Teacher)
 */
const updateExamRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid exam ID');
  }

  const exam = await Exam.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'course', select: 'courseName courseCode department' },
    { path: 'teacher', select: 'firstName lastName email' }
  ]);

  if (!exam) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Exam not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Exam updated successfully', exam);
});

module.exports = {
  getExamRecordList,
  getExamRecord,
  addExamRecord,
  updateExamRecord
};
