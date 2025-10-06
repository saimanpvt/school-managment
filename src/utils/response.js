const { HTTP_STATUS, MESSAGES } = require('../config/constants');

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Object} data - Response data
 * @param {Object} meta - Additional metadata
 */
const sendSuccessResponse = (res, statusCode = HTTP_STATUS.OK, message = MESSAGES.SUCCESS, data = null, meta = {}) => {
  const response = {
    success: true,
    message,
    ...(data !== null && { data }),
    ...(Object.keys(meta).length > 0 && { meta })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Error message
 * @param {Object} errors - Additional error details
 */
const sendErrorResponse = (res, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, message = MESSAGES.ERROR, errors = {}) => {
  const response = {
    success: false,
    message,
    ...(Object.keys(errors).length > 0 && { errors })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code
 * @param {String} message - Success message
 * @param {Array} data - Response data array
 * @param {Object} pagination - Pagination info
 */
const sendPaginatedResponse = (res, statusCode = HTTP_STATUS.OK, message = MESSAGES.SUCCESS, data = [], pagination = {}) => {
  const response = {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: pagination.pages || 0,
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    }
  };

  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
  sendPaginatedResponse
};
