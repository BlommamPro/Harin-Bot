import mongoose from 'mongoose';

const GiveawaySchema = new mongoose.Schema({
  giveawayId: { type: String, required: true, unique: true },
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  messageId: { type: String, required: true },
  prize: { type: String, required: true },
  winnerCount: { type: Number, default: 1 },
  endTime: { type: Date, required: true },
  hostedBy: { type: String, default: '' },
  hostedById: { type: String, default: '' },
  requiredRoleId: { type: String, default: null },
  requiredLevel: { type: Number, default: null },
  requiredLevelType: { type: String, enum: ['global', 'guild'], default: 'guild' },

  participants: { type: [String], default: [] },
  leftParticipants: { type: [String], default: [] },
  winners: { type: [String], default: [] },
  ended: { type: Boolean, default: false },
  lastEdit: { type: Date, default: null },
});

export const Giveaway = mongoose.model('Giveaway', GiveawaySchema);