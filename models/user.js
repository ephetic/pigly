var db = require('../db');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var UserSchema = db.Schema({
  username: String,
  password: String,
});
UserSchema.methods.comparePassword = function(password, callback) {
  bcrypt.compare(password, this.password, function(err, isMatch) {
    callback(isMatch);
  });
};

UserSchema.methods.checkPassword = function (password, callback) {
  bcrypt.compare(password, this.password, callback);
};

UserSchema.pre('save',function(next){
  if(!this.isModified('password')) return next();
  bcrypt.getSalt(10,function(err,salt){
    if(err) return next(err);
    bcrypt.hash(this.password, salt, null, function(err, hash){
      if(err) return next(err);
      this.password = hash;
      // this.salt = salt;
      next();
    })
  })
});

var User = db.model('User', UserSchema);


module.exports = User;
