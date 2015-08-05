var db = require('mongoose');
db.connect(process.env.MONGOLAB_URI || 'mongodb://root:@localhost/pigly');
module.exports = db;