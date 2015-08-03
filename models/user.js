var db = require('../db');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var UserSchema = db.Schema({
  username: String,
  password: String,
});
UserSchema.methods.comparePassword = function(attemptedPassword, callback) {
  bcrypt.compare(attemptedPassword, this.password, function(err, isMatch) {
    callback(isMatch);
  });
};

UserSchema.pre('save',function(next){
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});

var User = db.model('User', UserSchema);


module.exports = User;
