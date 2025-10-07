const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true 
  },
  parentId: { 
    type: String, 
    required: true,
    unique: true,
    trim: true
    },
  childrenId: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
parentSchema.index({ userId: 1 });
parentSchema.index({ parentId: 1 });
parentSchema.index({ childrenId: 1 });

// Virtual: number of children
parentSchema.virtual('childrenCount').get(function() {
  return this.childrenId ? this.childrenId.length : 0;
});

module.exports = mongoose.model('Parent', parentSchema);
