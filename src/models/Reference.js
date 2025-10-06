const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: [true, 'Reference type is required'],
    enum: ['Book', 'Article', 'Website', 'Video', 'Document', 'Paper', 'Report', 'Manual', 'Guide', 'Other']
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
  author: {
    type: String,
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  publisher: {
    type: String,
    trim: true,
    maxlength: [100, 'Publisher name cannot exceed 100 characters']
  },
  publicationYear: {
    type: Number,
    min: [1900, 'Publication year must be valid'],
    max: [new Date().getFullYear(), 'Publication year cannot be in future']
  },
  edition: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true,
    match: [/^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/, 'Please enter a valid ISBN']
  },
  url: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  fileUrl: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploaded by reference is required']
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  fileFormat: {
    type: String,
    enum: ['PDF', 'DOC', 'DOCX', 'PPT', 'PPTX', 'XLS', 'XLSX', 'TXT', 'HTML', 'Other']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full citation
referenceSchema.virtual('citation').get(function() {
  let citation = '';
  
  if (this.author) {
    citation += this.author;
  }
  
  if (this.title) {
    citation += ` (${this.publicationYear || 'n.d.'}). ${this.title}.`;
  }
  
  if (this.publisher) {
    citation += ` ${this.publisher}.`;
  }
  
  if (this.edition) {
    citation += ` ${this.edition} edition.`;
  }
  
  return citation;
});

// Virtual for file size in human readable format
referenceSchema.virtual('fileSizeFormatted').get(function() {
  if (!this.fileSize) return null;
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (this.fileSize === 0) return '0 Byte';
  
  const i = parseInt(Math.floor(Math.log(this.fileSize) / Math.log(1024)));
  return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Index for efficient queries
referenceSchema.index({ course: 1 });
referenceSchema.index({ subject: 1 });
referenceSchema.index({ type: 1 });
referenceSchema.index({ isRequired: 1 });
referenceSchema.index({ isActive: 1 });
referenceSchema.index({ uploadedBy: 1 });
referenceSchema.index({ tags: 1 });

// Text index for searching
referenceSchema.index({
  title: 'text',
  description: 'text',
  author: 'text',
  subject: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Reference', referenceSchema);
