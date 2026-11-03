import mongoose from 'mongoose';

const GlobalEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['xp', 'coins'],
    required: true,
    index: true,
  },
  name: { type: String, default: '' },
  multiplier: { type: Number, required: true, min: 1.01 },
  startTime: { type: Date, required: true, index: true },
  endTime: { type: Date, required: true, index: true },
  createdBy: { type: String, default: '' },
  active: { type: Boolean, default: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

GlobalEventSchema.index({ active: 1, endTime: 1 });

export const GlobalEvent = mongoose.model('GlobalEvent', GlobalEventSchema);