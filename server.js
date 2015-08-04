var express = require('express');
var bodyParser = require('body-parser');
var partials = require('express-partials');

var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

var User = require('./models/user');
var Pic = require('./models/pic');



var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());

// app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

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

app.post('/api/pics/:pic', bodyParser.json(), function(req, res, next){
  if(!req.pic) res.setStatus(404).send();
  console.log('post',req.path, req.body);
  if(!req.body.vote) res.setStatus(500).send();
  if(req.body.vote === 'piggy') req.pic.piggies++;
  if(req.body.vote === 'skely') req.pic.skelies++;
  req.pic.save();
  res.send(req.pic);
})

//TODO make this /api/pics call for ajax loading
app.get('/api/pics', function(req,res){
  Pic.find(function(err, pics){
    pics = pics || [];
    pics = pics.map(function(pic){
      return {
        id: pic.id,
        name: pic.filename,
        piggies: pic.piggies,
        skelies: pic.skelies
      }
    })
    res.send(pics);
  });
})

app.get('/capture', function(req,res){
  res.render('capture')
})

app.post('/capture', upload.single('pic'), function(req,res){
  var file = req.file;
  console.log('got file',file);
  if(file){
    var pic = new Pic({
      filename: file.filename,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      size: file.size,
      userid: 0, //req.session.userid,
      caption: 'none', //added later
    }).save(function(err, pic){
      console.log('new pic', err, pic);
    });
  }

  res.end();
})

// TEST 1
/* on good form: 
part --
part
Content-Disposition: form-data; name="pic"; filename="healthfitnessrevolution-com.jpg"
Content-Type: image/jpeg

����JFIFdd��C
part --
*/
// app.post('/capture', function(req, res){
//   var data = '';
//   req.on('data', function(chunk){data+=chunk});
//   req.on('end', function(){
//     // var boundary = req.headers['content-type'].match(/boundary=(.*)/)[1];
//     console.log('header',req.headers);
//     console.log('data', data.slice(0,150));
//     // var ddata = data.split(boundary).forEach(function(part){
//     //   console.log('part', part.slice(0,150));
//     // })
//   })
//   res.end();
// })
// TEST 2
// app.post('/capture', upload.single('pic'), function(req, res){
//   console.log('file', req.file);
//   res.end();
// })

app.post('/signin', bodyParser.json(), function(req, res, next){
  var username = req.body.username,
      password = req.body.password;

  User.find({username: username}, function(user){
    if(!user) return next(new Error('No such user'));
    user.checkPassword(password, function(err, foundUser){
      if(!foundUser) return next(new Error('No such user'));
      var token = jwt.encode(user, 'secret');
      res.json({token: token})
    })
  })
})

app.post('/signup', bodyParser.json(), function(req, res, next){
  var username = req.body.username,
      password = req.body.password;
  User.findOne({username:username}, function(err, user) {
    if(user) return next(new Error('User already exists!'));
    new User({username: username, password: password})
    .save(function(err, user){
      console.log('created user', err, user);
    })
  });
})

app.get('/signedin', function(req, res, next){
  var token = req.headers['x-access-token'];
  if(!token) return next(new Error('No token'));
  var user = jwt.decode(token, 'secret');
  User.findOne({username: user.username}, function(err, user){
    if(user) return res.send(200);
    if(err) return next(err);
    res.send(401);
  })
})



var port = process.env.PORT || 8888;
console.log('Pigly is listening on', port);
app.listen(port);