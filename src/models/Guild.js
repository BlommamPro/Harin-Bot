import mongoose from 'mongoose';

const GuildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: '!' },
  language: { type: String, default: 'es' },
  welcomeChannel: { type: String, default: null },
  goodbyeChannel: { type: String, default: null },
  logChannel: { type: String, default: null },
  autoroleId: { type: String, default: null }
});

export const Guild = mongoose.model('Guild', GuildSchema);