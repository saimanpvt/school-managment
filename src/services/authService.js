const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');

/**
 * Service layer for authentication-related business logic
 */
class AuthService {
  /**
   * Create a new user account
   * @param {Object} userData - User data
   * @returns {Object} Created user
   */
  static async createUser(userData) {
    const { email, password, firstName, lastName, role, phone } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || USER_ROLES.STUDENT,
      phone
    });

    return user;
  }

  /**
   * Authenticate user login
   * @param {String} email - User email
   * @param {String} password - User password
   * @returns {Object} User object with token
   */
  static async authenticateUser(email, password) {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = user.generateAuthToken();

    return { user, token };
  }

  /**
   * Get user profile
   * @param {String} userId - User ID
   * @returns {Object} User profile
   */
  static async getUserProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated user
   */
  static async updateUserProfile(userId, updateData) {
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    // Get user with password
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Deactivate user account
   * @param {String} userId - User ID
   */
  static async deactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Reactivate user account
   * @param {String} userId - User ID
   */
  static async reactivateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = AuthService;
