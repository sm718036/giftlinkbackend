import mongoose from 'mongoose'

const giftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
  },
  description: {
    type: String,
    required: true 
  },
  ageInYears: {
    type: Number,
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  zipCode: {
    type: String,
  },
  contactInfo: {
    type: String,
    required: true
  },
}, {timestamps: true})

export default mongoose.model('Gift', giftSchema)