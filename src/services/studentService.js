const Student = require('../models/Student');
const User = require('../models/User');
const Course = require('../models/Course');
const { USER_ROLES } = require('../config/constants');

/**
 * Service layer for student-related business logic
 */
class StudentService {
  /**
   * Create a new student record
   * @param {Object} studentData - Student data
   * @returns {Object} Created student
   */
  static async createStudent(studentData) {
    const { user, studentId, parent, classTeacher, course } = studentData;

    // Validate user exists and is a student
    const userDoc = await User.findById(user);
    if (!userDoc) {
      throw new Error('User not found');
    }
    if (userDoc.role !== USER_ROLES.STUDENT) {
      throw new Error('User must have student role');
    }

    // Validate parent exists and is a parent
    const parentDoc = await User.findById(parent);
    if (!parentDoc) {
      throw new Error('Parent not found');
    }
    if (parentDoc.role !== USER_ROLES.PARENT) {
      throw new Error('Parent must have parent role');
    }

    // Validate teacher exists and is a teacher
    const teacherDoc = await User.findById(classTeacher);
    if (!teacherDoc) {
      throw new Error('Teacher not found');
    }
    if (teacherDoc.role !== USER_ROLES.TEACHER) {
      throw new Error('Class teacher must have teacher role');
    }

    // Validate course exists
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      throw new Error('Course not found');
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ user });
    if (existingStudent) {
      throw new Error('Student record already exists for this user');
    }

    // Create student
    const student = await Student.create({
      ...studentData,
      studentId: studentId.toUpperCase()
    });

    return student;
  }

  /**
   * Get students with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} sort - Sort options
   * @returns {Object} Students and pagination info
   */
  static async getStudents(filters = {}, pagination = {}, sort = {}) {
    const students = await Student.find(filters)
      .populate([
        { path: 'user', select: 'firstName lastName email phone' },
        { path: 'parent', select: 'firstName lastName email phone' },
        { path: 'classTeacher', select: 'firstName lastName email phone' },
        { path: 'course', select: 'courseName courseCode department' }
      ])
      .sort(sort)
      .skip(pagination.skip || 0)
      .limit(pagination.limit || 10);

    const total = await Student.countDocuments(filters);

    return { students, total };
  }

  /**
   * Get single student by ID
   * @param {String} studentId - Student ID
   * @returns {Object} Student data
   */
  static async getStudentById(studentId) {
    const student = await Student.findById(studentId)
      .populate([
        { path: 'user', select: 'firstName lastName email phone address' },
        { path: 'parent', select: 'firstName lastName email phone address' },
        { path: 'classTeacher', select: 'firstName lastName email phone' },
        { path: 'course', select: 'courseName courseCode department duration' }
      ]);

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Update student record
   * @param {String} studentId - Student ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated student
   */
  static async updateStudent(studentId, updateData) {
    // Validate references if provided
    if (updateData.parent) {
      const parentDoc = await User.findById(updateData.parent);
      if (!parentDoc || parentDoc.role !== USER_ROLES.PARENT) {
        throw new Error('Invalid parent');
      }
    }

    if (updateData.classTeacher) {
      const teacherDoc = await User.findById(updateData.classTeacher);
      if (!teacherDoc || teacherDoc.role !== USER_ROLES.TEACHER) {
        throw new Error('Invalid class teacher');
      }
    }

    if (updateData.course) {
      const courseDoc = await Course.findById(updateData.course);
      if (!courseDoc) {
        throw new Error('Course not found');
      }
    }

    const student = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'parent', select: 'firstName lastName email phone' },
      { path: 'classTeacher', select: 'firstName lastName email phone' },
      { path: 'course', select: 'courseName courseCode department' }
    ]);

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Deactivate student
   * @param {String} studentId - Student ID
   * @returns {Object} Deactivated student
   */
  static async deactivateStudent(studentId) {
    const student = await Student.findByIdAndUpdate(
      studentId,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Get students by parent
   * @param {String} parentId - Parent ID
   * @returns {Array} Students
   */
  static async getStudentsByParent(parentId) {
    const students = await Student.find({ 
      parent: parentId, 
      isActive: true 
    }).populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'classTeacher', select: 'firstName lastName email phone' },
      { path: 'course', select: 'courseName courseCode department' }
    ]);

    return students;
  }

  /**
   * Get students by class teacher
   * @param {String} teacherId - Teacher ID
   * @returns {Array} Students
   */
  static async getStudentsByTeacher(teacherId) {
    const students = await Student.find({ 
      classTeacher: teacherId, 
      isActive: true 
    }).populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'parent', select: 'firstName lastName email phone' },
      { path: 'course', select: 'courseName courseCode department' }
    ]);

    return students;
  }

  /**
   * Get students by course
   * @param {String} courseId - Course ID
   * @returns {Array} Students
   */
  static async getStudentsByCourse(courseId) {
    const students = await Student.find({ 
      course: courseId, 
      isActive: true 
    }).populate([
      { path: 'user', select: 'firstName lastName email phone' },
      { path: 'parent', select: 'firstName lastName email phone' },
      { path: 'classTeacher', select: 'firstName lastName email phone' }
    ]);

    return students;
  }

  /**
   * Generate student ID
   * @param {String} courseCode - Course code
   * @param {Number} year - Admission year
   * @returns {String} Generated student ID
   */
  static async generateStudentId(courseCode, year) {
    const prefix = `${courseCode}${year.toString().slice(-2)}`;
    const lastStudent = await Student.findOne({
      studentId: { $regex: `^${prefix}` }
    }).sort({ studentId: -1 });

    let nextNumber = 1;
    if (lastStudent) {
      const lastNumber = parseInt(lastStudent.studentId.slice(-3));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  }
}

module.exports = StudentService;
