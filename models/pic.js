var db = require('../db');

var PicSchema = db.Schema({
  filename: String,
  originalname: String,
  encoding: String,
  mimetype: String,
  size: Number,
  caption: String,
  userid: String,
  clicks: { type: Number, default: 0},
  piggies: {type: Number, default: 0},
  skelies: {type: Number, default: 0},
  created_at: {type: Date}
});

PicSchema.pre('save',function(next){
  this.created_at = new Date();
  next();
});

var Pic = db.model('Pic', PicSchema);

module.exports = Pic;
