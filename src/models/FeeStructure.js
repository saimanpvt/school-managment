const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true,
    maxlength: [100, 'Fee structure name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
  },
  semester: {
    type: String,
    required: [true, 'Semester is required'],
    enum: ['Spring', 'Summer', 'Fall', 'Winter']
  },
  feeComponents: [{
    name: {
      type: String,
      required: [true, 'Fee component name is required'],
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Fee component amount is required'],
      min: [0, 'Fee amount cannot be negative']
    },
    isMandatory: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Component description cannot exceed 200 characters']
    },
    dueDate: {
      type: Date
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['One-time', 'Monthly', 'Quarterly', 'Semester', 'Annual'],
      default: 'One-time'
    }
  }],
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  discountPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative'],
    max: [100, 'Discount percentage cannot exceed 100']
  },
  lateFeePercentage: {
    type: Number,
    default: 0,
    min: [0, 'Late fee percentage cannot be negative'],
    max: [100, 'Late fee percentage cannot exceed 100']
  },
  lateFeeGraceDays: {
    type: Number,
    default: 0,
    min: [0, 'Grace days cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  validFrom: {
    type: Date,
    required: [true, 'Valid from date is required']
  },
  validTo: {
    type: Date,
    required: [true, 'Valid to date is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by reference is required']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for discounted amount
feeStructureSchema.virtual('discountedAmount').get(function() {
  return this.totalAmount * (1 - this.discountPercentage / 100);
});

// Virtual for late fee amount
feeStructureSchema.virtual('lateFeeAmount').get(function() {
  return this.totalAmount * (this.lateFeePercentage / 100);
});

// Virtual for status
feeStructureSchema.virtual('status').get(function() {
  const now = new Date();
  if (!this.isActive) return 'Inactive';
  if (now < this.validFrom) return 'Upcoming';
  if (now > this.validTo) return 'Expired';
  return 'Active';
});

// Index for efficient queries
feeStructureSchema.index({ course: 1 });
feeStructureSchema.index({ academicYear: 1 });
feeStructureSchema.index({ semester: 1 });
feeStructureSchema.index({ isActive: 1 });
feeStructureSchema.index({ createdBy: 1 });

// Validate valid to date is after valid from date
feeStructureSchema.pre('save', function(next) {
  if (this.validTo <= this.validFrom) {
    next(new Error('Valid to date must be after valid from date'));
  } else {
    next();
  }
});

// Auto-calculate total amount from fee components
feeStructureSchema.pre('save', function(next) {
  if (this.feeComponents && this.feeComponents.length > 0) {
    this.totalAmount = this.feeComponents.reduce((total, component) => {
      return total + component.amount;
    }, 0);
  }
  next();
});

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
