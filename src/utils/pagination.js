/**
 * Generate pagination options for MongoDB queries
 * @param {Object} query - Express request query object
 * @returns {Object} - Pagination options
 */
const getPaginationOptions = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Limit maximum page size
  const maxLimit = 100;
  const finalLimit = Math.min(limit, maxLimit);

  return {
    page: Math.max(1, page),
    limit: Math.max(1, finalLimit),
    skip: Math.max(0, skip)
  };
};

/**
 * Generate pagination metadata
 * @param {Number} total - Total number of documents
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const pages = Math.ceil(total / limit);
  const hasNext = page < pages;
  const hasPrev = page > 1;

  return {
    total,
    page,
    limit,
    pages,
    hasNext,
    hasPrev
  };
};

/**
 * Generate sort options from query parameters
 * @param {Object} query - Express request query object
 * @param {Array} allowedFields - Array of allowed sort fields
 * @returns {Object} - Sort options
 */
const getSortOptions = (query, allowedFields = []) => {
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  // Validate sort field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return { createdAt: -1 }; // Default sort
  }

  return { [sortBy]: sortOrder };
};

/**
 * Generate filter options from query parameters
 * @param {Object} query - Express request query object
 * @param {Array} filterFields - Array of allowed filter fields
 * @returns {Object} - Filter options
 */
const getFilterOptions = (query, filterFields = []) => {
  const filters = {};

  filterFields.forEach(field => {
    if (query[field] !== undefined && query[field] !== '') {
      // Handle different filter types
      if (field.includes('Date') || field.includes('date')) {
        // Date range filters
        if (query[`${field}From`]) {
          filters[field] = { ...filters[field], $gte: new Date(query[`${field}From`]) };
        }
        if (query[`${field}To`]) {
          filters[field] = { ...filters[field], $lte: new Date(query[`${field}To`]) };
        }
      } else if (field.includes('search')) {
        // Text search filters
        filters.$or = [
          { [field.replace('search', 'name')]: { $regex: query[field], $options: 'i' } },
          { [field.replace('search', 'title')]: { $regex: query[field], $options: 'i' } },
          { [field.replace('search', 'email')]: { $regex: query[field], $options: 'i' } }
        ];
      } else if (query[field] === 'true' || query[field] === 'false') {
        // Boolean filters
        filters[field] = query[field] === 'true';
      } else {
        // String filters
        filters[field] = query[field];
      }
    }
  });

  return filters;
};

/**
 * Generate aggregation pipeline for pagination and filtering
 * @param {Object} matchStage - Match stage for filtering
 * @param {Object} sortStage - Sort stage
 * @param {Number} skip - Number of documents to skip
 * @param {Number} limit - Number of documents to return
 * @returns {Array} - Aggregation pipeline
 */
const getAggregationPipeline = (matchStage = {}, sortStage = { createdAt: -1 }, skip = 0, limit = 10) => {
  const pipeline = [];

  // Add match stage if filters exist
  if (Object.keys(matchStage).length > 0) {
    pipeline.push({ $match: matchStage });
  }

  // Add sort stage
  pipeline.push({ $sort: sortStage });

  // Add pagination stages
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  return pipeline;
};

module.exports = {
  getPaginationOptions,
  getPaginationMeta,
  getSortOptions,
  getFilterOptions,
  getAggregationPipeline
};
