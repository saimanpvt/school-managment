const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 year']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1']
  },
  teachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: [0, 'Current enrollment cannot be negative']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Spring', 'Summer', 'Fall', 'Winter']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requirements: {
    prerequisites: [String],
    corequisites: [String],
    minimumGrade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F']
    }
  },
  schedule: {
    days: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    timeSlots: [{
      startTime: String,
      endTime: String,
      day: String
    }],
    classroom: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for available seats
courseSchema.virtual('availableSeats').get(function() {
  return this.capacity - this.currentEnrollment;
});

// Virtual for course status
courseSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'Inactive';
  if (now < this.startDate) return 'Upcoming';
  if (now > this.endDate) return 'Completed';
  return 'Active';
});

// Index for efficient queries
courseSchema.index({ courseCode: 1 });
courseSchema.index({ courseName: 1 });
courseSchema.index({ department: 1 });
courseSchema.index({ academicYear: 1 });
courseSchema.index({ semester: 1 });
courseSchema.index({ isActive: 1 });
courseSchema.index({ teachers: 1 });

// Ensure courseCode is unique
courseSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Course code already exists'));
  } else {
    next();
  }
});

// Validate end date is after start date
courseSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Course', courseSchema);
