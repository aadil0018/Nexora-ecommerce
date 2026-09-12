const mongoose = require('mongoose');

const WhatsAppSessionSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  content: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WhatsAppSession', WhatsAppSessionSchema);
