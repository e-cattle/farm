const mongoose = require('mongoose')
const Schema = mongoose.Schema

const FarmSchema = new Schema({
  name: String,
  city: String,
  state: String,
  address: String,
  subscription: String,
  created: { type: Date, default: Date.now },
  changed: { type: Date, default: Date.now },
  synched: { type: Date },
  active: { type: Boolean, default: true },
  stackSwarmCreated: { type: Boolean, default: false },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  users: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, role: String }]
})

module.exports = mongoose.model('Farm', FarmSchema)
