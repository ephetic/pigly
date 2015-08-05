var express = require('express');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var jwt = require('jwt-simple');

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var User = require('./models/user');
var Pic = require('./models/pic');



var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

var setToken = function(req, res, next, user){
  var token = jwt.encode(user, 'secret');
  res.json({token: token})
}
app.use(function(req, res, next){
  var token = req.headers['x-access-token'];
  if(token) {
    req.token = token;
    var user = jwt.decode(token, 'secret');
    User.findOne({username: user.username}, function(err, user){
      if(user) req.user = user;
      return next();
    })
  }
  else return next();
})
app.param('pic', function(req, res, next, filename){
  Pic.findOne({filename: filename}, function(err, pic){
    if(!err) req.pic = pic;
    next();
  })
});

app.get('/api/pics/:pic', function(req, res, next){
  if(!req.pic) res.send('404');
  var pic = {
    id: req.pic.id,
    name: req.pic.filename,
    piggies: req.pic.piggies,
    skelies: req.pic.skelies
  }
  res.send(pic);
})

// vote
app.post('/api/pics/:pic', bodyParser.json(), function(req, res, next){
  if(!req.token || !req.user) return res.status(401).send();
  if(!req.pic) return res.status(404).send();
  if(!req.body.vote) res.status(400).send();
  console.log(req.user);
  var canVote = req.user.votes.reduce(function(ok,vote){
    console.log(req.pic.id, vote.picid);
    return ok && vote.picid !== req.pic.id;
  }, true);
  if(!canVote) return res.send(res.writeHead(420, 'Enhance your calm.'));

  if(req.body.vote === 'piggy') req.pic.piggies++;
  if(req.body.vote === 'skely') req.pic.skelies++;
  req.pic.save();
  req.user.votes.push({picid: req.pic.id, vote: req.body.vote});
  req.user.save();
  console.log(req.user);

  res.send();
})

app.get('/api/pics', function(req,res){
  Pic.find(function(err, pics){
    pics = pics || [];
    pics = pics.map(function(pic){
      var vote = req.user.votes.reduce(function(vote, uservote){
        if(pic.id === uservote.picid){
          return uservote.vote;
        }
        return vote;
      },'');
      return {
        id: pic.id,
        name: pic.filename,
        piggies: pic.piggies,
        skelies: pic.skelies,
        vote: vote
      }
    })
    res.send(pics);
  });
})

app.get('/capture', function(req,res){
  res.render('capture')
})

app.post('/capture', upload.single('pic'), function(req,res){
  if(!req.token || !req.user) return res.status(401).end();
  var file = req.file;
  console.log('got file',file);
  if(file){
    var pic = new Pic({
      filename: file.filename,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      userid: req.user._id,
      caption: '',
    }).save(function(err, pic){
      console.log('new pic', err, pic);
    });
  }
  res.end();
})

app.post('/api/users/signin', bodyParser.json(), function(req, res, next){
  var username = req.body.username,
      password = req.body.password;

  User.findOne({username: username}, function(err, user){
    console.log('signin', req.body, user);
    if(!user) return next(new Error('No such user'));
    user.checkPassword(password, function(err, foundUser){
      if(!foundUser) return next(new Error('Passwords don\'t match'));
      setToken(req, res, next, user);
    })
  })
})

app.post('/api/users/signup', bodyParser.json(), function(req, res, next){
  var username = req.body.username,
      password = req.body.password;
  User.findOne({username:username}, function(err, user) {
    console.log('signup', err, user);
    if(user) return next(new Error('User already exists!'));
    var u = new User({username: username, password: password})
    .save(function(err, user){
      console.log('created user', err, user);
      setToken(req, res, next, user);
    })
  })
})

app.get('/api/users/signedin', function(req, res, next){
  if(!req.token || !req.user) return res.send(401);
  return res.end();
//   User.findOne({username: token.user.username}, function(err, user){
//     if(user) return res.send(200);
//     if(err) return next(err);
//     res.send(401);
//     // res.redirect('/#/signin');
//   })
})



var port = process.env.PORT || 8888;
console.log('Pigly is listening on', port);
app.listen(port);