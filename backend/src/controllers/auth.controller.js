const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return next(new ApiError(400, 'Please provide all required fields'));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, 'User already exists with this email address'));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    },
    message: 'User registered successfully',
  });
});

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password'));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      token,
      refreshToken,
    },
    message: 'Login successful',
  });
});

// @desc    Get current user profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const { firstName, lastName, avatar, timezone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { firstName, lastName, avatar, timezone },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: user,
    message: 'Profile updated successfully',
  });
});

// @desc    Change password
// @route   PUT /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ApiError(400, 'Please provide current and new password'));
  }

  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new ApiError(400, 'Current password does not match'));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
};

