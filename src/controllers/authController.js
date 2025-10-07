const User = require('../models/User');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');
const { HTTP_STATUS, USER_ROLES } = require('../config/constants');
const { validateRequiredFields, isValidEmail, validatePassword } = require('../utils/validation');

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  
  // Only admins can create new users
  const user = await User.findById(req.user?._id);
  if(!user && user.role !== USER_ROLES.ADMIN) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_RUNAUTHORIZEDEQUEST, 'Permission Dennied', {message: "Only admins can create new users"});
  }

  const { email, password, firstName, lastName, role, phone } = req.body;

  // Validate required fields
  const requiredFields = ['email', 'password', 'firstName', 'lastName', 'role'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
  }

  // Validate password strength
  const passwordValidation = validatePassword(password, "register");
  if (!passwordValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Password validation failed', passwordValidation.errors);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendErrorResponse(res, HTTP_STATUS.CONFLICT, 'User already exists with this email');
  }

  // Create user
  const addedUser = await User.create({
    email,
    password,
    firstName,
    lastName,
    role: USER_ROLES[role] || USER_ROLES.STUDENT,
    phone
  });

  sendSuccessResponse(res, HTTP_STATUS.CREATED, 'User registered successfully', {
    addedUser : {
      email : addedUser.email, 
      firstName : addedUser.firstName,
      lastName : addedUser.lastName, 
      role: role,
      phone: addedUser.phone
    }
  });
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  const requiredFields = ['email', 'password'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate email format
  if (!isValidEmail(email)) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Please provide a valid email address');
  }

  // Find user and include password
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    return sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  if (!user.isActive) {
    return sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Account is deactivated');
  }

  // Check password
  const isPasswordValid = await user.comparePassword(String(password), "login");
  
  if (!isPasswordValid) {
    return sendErrorResponse(res, HTTP_STATUS.UNAUTHORIZED, 'Invalid credentials');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT token
  const token = user.generateAuthToken();

  // Set cookie
  res.cookie('token', token, {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Login successful', {
    addedUser : {
      email : user.email, 
      firstName : user.firstName,
      lastName : user.lastName, 
      phone: user.phone
    },
    token
  });
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    expires: new Date(0),
    httpOnly: true
  });

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Logout successful');
});

/**
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  sendSuccessResponse(res, HTTP_STATUS.OK, 'Profile retrieved successfully', req.user);
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone, address } = req.body;
  
  const updateData = {};
  
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  const email = req.user.email;
  const user = await User.findOne({ email });;

  const updateUser = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Profile updated successfully', 
    {
      email : updateUser.email, 
      firstName : updateUser.firstName,
      lastName : updateUser.lastName,
      phone: updateUser.phone
    }
  );
});

/**
 * Change password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate required fields
  const requiredFields = ['currentPassword', 'newPassword'];
  const fieldValidation = validateRequiredFields(req.body, requiredFields);
  
  if (!fieldValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Validation failed', fieldValidation.errors);
  }

  // Validate new password strength
  const passwordValidation = validatePassword(newPassword, "register");
  if (!passwordValidation.isValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'New password validation failed', passwordValidation.errors);
  }

  // Get user with password
  const email = req.user.email;
  const user = await User.findOne({email}).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  
  if (!isCurrentPasswordValid) {
    return sendErrorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, HTTP_STATUS.OK, 'Password changed successfully');
});

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword
};
