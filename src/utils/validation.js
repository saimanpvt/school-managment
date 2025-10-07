const { HTTP_STATUS } = require('../config/constants');

/**
 * Validate email format
 * @param {String} email - Email to validate
 * @returns {Boolean} - True if valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {String} phone - Phone number to validate
 * @returns {Boolean} - True if valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone);
};

/**
 * Validate password strength
 * @param {String} password - Password to validate
 * @returns {Object} - Validation result
 */
const validatePassword = (password, source) => {
  const errors = [];

  if (!password) {
    errors.push('Password is required');
  }

  if (source === 'register') {
    if (password && password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password && password.length > 128) {
      errors.push('Password must be less than 128 characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};


/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const result = {
    isValid: true,
    errors: []
  };

  requiredFields.forEach(field => {
    if (!data[field]) {
      result.isValid = false;
      result.errors.push(`${field} is required`);
    }
  });

  return result;
};

/**
 * Sanitize string input
 * @param {String} str - String to sanitize
 * @returns {String} - Sanitized string
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

/**
 * Validate MongoDB ObjectId format
 * @param {String} id - ID to validate
 * @returns {Boolean} - True if valid ObjectId format
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate date format and range
 * @param {String|Date} date - Date to validate
 * @param {Date} minDate - Minimum allowed date
 * @param {Date} maxDate - Maximum allowed date
 * @returns {Object} - Validation result
 */
const validateDate = (date, minDate = null, maxDate = null) => {
  const result = {
    isValid: true,
    errors: [],
    parsedDate: null
  };

  if (!date) {
    result.isValid = false;
    result.errors.push('Date is required');
    return result;
  }

  const parsedDate = new Date(date);
  
  if (isNaN(parsedDate.getTime())) {
    result.isValid = false;
    result.errors.push('Invalid date format');
    return result;
  }

  result.parsedDate = parsedDate;

  if (minDate && parsedDate < minDate) {
    result.isValid = false;
    result.errors.push(`Date must be after ${minDate.toDateString()}`);
  }

  if (maxDate && parsedDate > maxDate) {
    result.isValid = false;
    result.errors.push(`Date must be before ${maxDate.toDateString()}`);
  }

  return result;
};

/**
 * Validate academic year format (YYYY-YYYY)
 * @param {String} academicYear - Academic year to validate
 * @returns {Object} - Validation result
 */
const validateAcademicYear = (academicYear) => {
  const result = {
    isValid: true,
    errors: []
  };

  if (!academicYear) {
    result.isValid = false;
    result.errors.push('Academic year is required');
    return result;
  }

  const academicYearRegex = /^\d{4}-\d{4}$/;
  if (!academicYearRegex.test(academicYear)) {
    result.isValid = false;
    result.errors.push('Academic year must be in format YYYY-YYYY');
    return result;
  }

  const [startYear, endYear] = academicYear.split('-').map(Number);
  
  if (endYear !== startYear + 1) {
    result.isValid = false;
    result.errors.push('Academic year must be consecutive years (e.g., 2023-2024)');
  }

  const currentYear = new Date().getFullYear();
  if (startYear > currentYear || startYear < currentYear - 10) {
    result.isValid = false;
    result.errors.push('Academic year must be reasonable (within last 10 years or current/future)');
  }

  return result;
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validatePassword,
  validateRequiredFields,
  sanitizeString,
  isValidObjectId,
  validateDate,
  validateAcademicYear
};