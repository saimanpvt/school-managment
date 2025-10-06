const Marks = require('../models/Marks');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidObjectId } = require('../utils/validation');
const { getPaginationOptions, getPaginationMeta, getSortOptions } = require('../utils/pagination');

/**
 * Get marks record (Common - accessible by all roles where allowed)
 */
const getMarksRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid marks ID');
  }

  const marks = await Marks.findById(id)
    .populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'exam', select: 'examName examType examDate subject totalMarks' },
      { path: 'course', select: 'courseName courseCode' },
      { path: 'recordedBy', select: 'firstName lastName email' }
    ]);

  if (!marks) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Marks record not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Marks record retrieved successfully', marks);
});

/**
 * Get marks record list (Teacher + Admin)
 */
const getMarksRecordList = asyncHandler(async (req, res) => {
  const paginationOptions = getPaginationOptions(req.query);
  const sortOptions = getSortOptions(req.query, ['examDate', 'obtainedMarks', 'grade', 'createdAt']);

  // Build filter options
  const filters = { isActive: true };
  
  if (req.query.student) {
    filters.student = req.query.student;
  }
  
  if (req.query.exam) {
    filters.exam = req.query.exam;
  }
  
  if (req.query.course) {
    filters.course = req.query.course;
  }
  
  if (req.query.subject) {
    filters.subject = req.query.subject;
  }
  
  if (req.query.academicYear) {
    filters.academicYear = req.query.academicYear;
  }
  
  if (req.query.semester) {
    filters.semester = req.query.semester;
  }
  
  if (req.query.grade) {
    filters.grade = req.query.grade;
  }
  
  if (req.query.status) {
    filters.status = req.query.status;
  }

  // Get marks with pagination
  const marks = await Marks.find(filters)
    .populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'exam', select: 'examName examType examDate subject' },
      { path: 'course', select: 'courseName courseCode' },
      { path: 'recordedBy', select: 'firstName lastName email' }
    ])
    .sort(sortOptions)
    .skip(paginationOptions.skip)
    .limit(paginationOptions.limit);

  const total = await Marks.countDocuments(filters);
  const paginationMeta = getPaginationMeta(total, paginationOptions.page, paginationOptions.limit);

  sendPaginatedResponse(res, HTTP_STATUS.OK, 'Marks records retrieved successfully', marks, paginationMeta);
});

/**
 * Add marks record (Student + Teacher)
 */
const addMarksRecord = asyncHandler(async (req, res) => {
  const {
    student,
    exam,
    course,
    subject,
    obtainedMarks,
    totalMarks,
    passingMarks,
    remarks
  } = req.body;

  // Validate required fields
  const requiredFields = ['student', 'exam', 'course', 'subject', 'obtainedMarks', 'totalMarks', 'passingMarks'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate ObjectIds
  const objectIds = { student, exam, course };
  for (const [key, value] of Object.entries(objectIds)) {
    if (!isValidObjectId(value)) {
      return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, `Invalid ${key} ID`);
    }
  }

  // Check if exam exists and get exam details
  const examDoc = await Exam.findById(exam);
  if (!examDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Exam not found');
  }

  // Check if student exists
  const studentDoc = await User.findById(student);
  if (!studentDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Student not found');
  }

  // Check if course exists
  const courseDoc = await User.findById(course);
  if (!courseDoc) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
  }

  // Check if marks already exist for this student-exam combination
  const existingMarks = await Marks.findOne({ student, exam });
  if (existingMarks) {
    return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'Marks already exist for this student and exam');
  }

  // Create marks record
  const marks = await Marks.create({
    student,
    exam,
    course,
    subject,
    obtainedMarks,
    totalMarks,
    passingMarks,
    remarks,
    examDate: examDoc.examDate,
    academicYear: examDoc.academicYear,
    semester: examDoc.semester,
    recordedBy: req.user._id
  });

  // Populate references
  await marks.populate([
    { path: 'student', select: 'firstName lastName email' },
    { path: 'exam', select: 'examName examType examDate subject totalMarks' },
    { path: 'course', select: 'courseName courseCode' },
    { path: 'recordedBy', select: 'firstName lastName email' }
  ]);

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'Marks record added successfully', marks);
});

/**
 * Update marks record (Student + Teacher)
 */
const updateMarksRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  if (!isValidObjectId(id)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Invalid marks ID');
  }

  // Remove fields that shouldn't be updated directly
  delete updateData.student;
  delete updateData.exam;
  delete updateData.course;
  delete updateData.examDate;
  delete updateData.academicYear;
  delete updateData.semester;
  delete updateData.recordedBy;

  const marks = await Marks.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate([
    { path: 'student', select: 'firstName lastName email' },
    { path: 'exam', select: 'examName examType examDate subject totalMarks' },
    { path: 'course', select: 'courseName courseCode' },
    { path: 'recordedBy', select: 'firstName lastName email' }
  ]);

  if (!marks) {
    return sendErrorResponse(res, HTTP_STATUS.NOT_FOUND, 'Marks record not found');
  }

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Marks record updated successfully', marks);
});

module.exports = {
  getMarksRecord,
  getMarksRecordList,
  addMarksRecord,
  updateMarksRecord
};
