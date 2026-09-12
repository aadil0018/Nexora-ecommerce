const mongoose = require('mongoose');

const aiActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    query: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['chat', 'search', 'recommendation', 'comparison', 'sentiment'],
      required: true,
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIActivity', aiActivitySchema);
