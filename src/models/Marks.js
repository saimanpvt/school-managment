const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam reference is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  obtainedMarks: {
    type: Number,
    required: [true, 'Obtained marks is required'],
    min: [0, 'Obtained marks cannot be negative']
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks is required'],
    min: [1, 'Total marks must be at least 1']
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks is required'],
    min: [0, 'Passing marks cannot be negative']
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'],
    required: [true, 'Grade is required']
  },
  gpa: {
    type: Number,
    required: [true, 'GPA is required'],
    min: [0, 'GPA cannot be negative'],
    max: [4, 'GPA cannot exceed 4.0']
  },
  status: {
    type: String,
    enum: ['Pass', 'Fail', 'Absent', 'Incomplete'],
    required: [true, 'Status is required']
  },
  remarks: {
    type: String,
    maxlength: [200, 'Remarks cannot exceed 200 characters']
  },
  examDate: {
    type: Date,
    required: [true, 'Exam date is required']
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
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recorded by reference is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for percentage
marksSchema.virtual('percentage').get(function() {
  return ((this.obtainedMarks / this.totalMarks) * 100).toFixed(2);
});

// Virtual for grade points
marksSchema.virtual('gradePoints').get(function() {
  const gradePoints = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D': 1.0, 'F': 0.0
  };
  return gradePoints[this.grade] || 0;
});

// Index for efficient queries
marksSchema.index({ student: 1 });
marksSchema.index({ exam: 1 });
marksSchema.index({ course: 1 });
marksSchema.index({ subject: 1 });
marksSchema.index({ academicYear: 1 });
marksSchema.index({ semester: 1 });
marksSchema.index({ recordedBy: 1 });
marksSchema.index({ isActive: 1 });

// Compound index for unique student-exam combination
marksSchema.index({ student: 1, exam: 1 }, { unique: true });

// Ensure student-exam combination is unique
marksSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Marks for this student and exam already exist'));
  } else {
    next();
  }
});

// Validate obtained marks don't exceed total marks
marksSchema.pre('save', function(next) {
  if (this.obtainedMarks > this.totalMarks) {
    next(new Error('Obtained marks cannot exceed total marks'));
  } else if (this.passingMarks > this.totalMarks) {
    next(new Error('Passing marks cannot exceed total marks'));
  } else {
    next();
  }
});

// Auto-calculate grade and GPA based on percentage
marksSchema.pre('save', function(next) {
  if (this.isModified('obtainedMarks') || this.isModified('totalMarks')) {
    const percentage = (this.obtainedMarks / this.totalMarks) * 100;
    
    // Determine grade based on percentage
    if (percentage >= 97) this.grade = 'A+';
    else if (percentage >= 93) this.grade = 'A';
    else if (percentage >= 90) this.grade = 'A-';
    else if (percentage >= 87) this.grade = 'B+';
    else if (percentage >= 83) this.grade = 'B';
    else if (percentage >= 80) this.grade = 'B-';
    else if (percentage >= 77) this.grade = 'C+';
    else if (percentage >= 73) this.grade = 'C';
    else if (percentage >= 70) this.grade = 'C-';
    else if (percentage >= 60) this.grade = 'D';
    else this.grade = 'F';
    
    // Determine GPA
    const gradePoints = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D': 1.0, 'F': 0.0
    };
    this.gpa = gradePoints[this.grade];
    
    // Determine status
    this.status = this.obtainedMarks >= this.passingMarks ? 'Pass' : 'Fail';
  }
  next();
});

module.exports = mongoose.model('Marks', marksSchema);
