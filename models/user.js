var db = require('../db');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var UserSchema = db.Schema({
  username: {
    type: String,
    lowercase: true,
    index: { unique: true }
  },
  password: String,
  // votes: [db.Schema.Types.Mixed]
  votes: [{
    picid: String,
    vote: String
  }],
});

UserSchema.methods.checkPassword = function (password, callback) {
  bcrypt.compare(password, this.password, callback);
};

UserSchema.pre('save',function(next){
  var user = this;
  console.log('saving user', user);
  if(!this.isModified('password')) return next();
  bcrypt.hash(this.password, null, null, function(err, hash){
    if(err) return next(err);
    user.password = hash;
    next();
  })
});

var User = db.model('User', UserSchema);


module.exports = User;
