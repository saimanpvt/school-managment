const { USER_ROLES, ROLE_HIERARCHY, HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Middleware to check if user has required roles
 * @param {Array} allowedRoles - Array of role numbers that are allowed
 * @returns {Function} Express middleware function
 */
const allowRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.UNAUTHORIZED + ': User not authenticated'
        });
      }

      const userRole = req.user.role;
      
      // Check if user's role is in allowed roles
      if (allowedRoles.includes(userRole)) {
        return next();
      }

      // Check role hierarchy - higher privilege roles can access lower privilege routes
      const userRoleLevel = ROLE_HIERARCHY[userRole];
      const hasPermission = allowedRoles.some(allowedRole => {
        const allowedRoleLevel = ROLE_HIERARCHY[allowedRole];
        return userRoleLevel <= allowedRoleLevel;
      });

      if (hasPermission) {
        return next();
      }

      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: MESSAGES.FORBIDDEN + ': Insufficient permissions'
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.SERVER_ERROR
      });
    }
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = allowRoles([USER_ROLES.ADMIN]);

/**
 * Middleware to check if user is admin or teacher
 */
const requireTeacherOrAdmin = allowRoles([USER_ROLES.ADMIN, USER_ROLES.TEACHER]);

/**
 * Middleware to check if user is admin, teacher, or student
 */
const requireStudentTeacherOrAdmin = allowRoles([USER_ROLES.ADMIN, USER_ROLES.TEACHER, USER_ROLES.STUDENT]);

/**
 * Middleware to check if user can access student data (admin, teacher, or parent of the student)
 */
const canAccessStudentData = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.UNAUTHORIZED + ': User not authenticated'
      });
    }

    const userRole = req.user.role;
    const studentId = req.params.id || req.params.studentId;

    // Admin and teacher can access any student data
    if (userRole === USER_ROLES.ADMIN || userRole === USER_ROLES.TEACHER) {
      return next();
    }

    // Parent can only access their own child's data
    if (userRole === USER_ROLES.PARENT) {
      if (!studentId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Check if the student belongs to this parent
      const Student = require('../models/Student');
      const student = await Student.findOne({
        _id: studentId,
        parent: req.user._id,
        isActive: true
      });

      if (!student) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: MESSAGES.FORBIDDEN + ': You can only access your child\'s data'
        });
      }

      return next();
    }

    // Student can only access their own data
    if (userRole === USER_ROLES.STUDENT) {
      if (studentId && studentId !== req.user._id.toString()) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: MESSAGES.FORBIDDEN + ': You can only access your own data'
        });
      }
      return next();
    }

    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: MESSAGES.FORBIDDEN + ': Insufficient permissions'
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR
    });
  }
};

module.exports = {
  allowRoles,
  requireAdmin,
  requireTeacherOrAdmin,
  requireStudentTeacherOrAdmin,
  canAccessStudentData
};
