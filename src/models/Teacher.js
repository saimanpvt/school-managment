const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/constants');

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  subjects: [{
    type: String,
    required: true,
    trim: true
  }],
  qualification: {
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true
    },
    institution: {
      type: String,
      required: [true, 'Institution is required'],
      trim: true
    },
    yearOfPassing: {
      type: Number,
      required: [true, 'Year of passing is required'],
      min: [1900, 'Year of passing must be valid'],
      max: [new Date().getFullYear(), 'Year of passing cannot be in future']
    }
  },
  experience: {
    totalYears: {
      type: Number,
      default: 0,
      min: [0, 'Experience cannot be negative']
    },
    previousInstitutions: [{
      name: String,
      position: String,
      duration: String,
      from: Date,
      to: Date
    }]
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative']
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required'],
    default: Date.now
  },
  isClassTeacher: {
    type: Boolean,
    default: false
  },
  classTeacherFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resignationDate: Date,
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full qualification
teacherSchema.virtual('fullQualification').get(function() {
  return `${this.qualification.degree} from ${this.qualification.institution} (${this.qualification.yearOfPassing})`;
});

// Index for efficient queries
teacherSchema.index({ employeeId: 1 });
teacherSchema.index({ user: 1 });
teacherSchema.index({ department: 1 });
teacherSchema.index({ isActive: 1 });
teacherSchema.index({ isClassTeacher: 1 });

// Ensure employeeId is unique
teacherSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Employee ID already exists'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Teacher', teacherSchema);
