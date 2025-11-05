import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    author: { type: String, default: 'AI Generated' },
    thumbnail: { type: String, default: '🎧' },
    genre: { type: String, default: 'Education' },
    script: { type: String, default: '' },
    audioUrl: { type: String },
    duration: { type: String }, // Format: "15:32"
    durationSec: { type: Number, default: 0 },
    status: { type: String, enum: ['generating', 'completed', 'failed'], default: 'generating' },
    style: { type: String, enum: ['professional', 'conversational', 'energetic'], default: 'professional' },
    plays: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }, // Start with no rating
    ratingCount: { type: Number, default: 0 }, // Track number of ratings
    error: { type: String },
  },
  { timestamps: true }
);

const Podcast = mongoose.model('Podcast', podcastSchema);
export default Podcast;


