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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/uploads'));

app.param('pic', function(req, res, next, filename){
  // console.log('pic param', filename, req.method);
  Pic.findOne({filename: filename}, function(err, pic){
    if(!err) req.pic = pic;
    next();
  })
});

app.get('/api/pics/:pic', function(req, res, next){
  if(!req.pic) res.send('404');
  var pic = {
    id: req.pic.id,
    piggies: req.pic.piggies,
    skelies: req.pic.skelies
  }
  res.send(pic);
})

app.post('/api/pics/:pic', function(req, res, next){
  if(!req.pic) res.setStatus(404).send();
  console.log('post',req.path, req.body);
  if(!req.body.vote) res.setStatus(500).send();
  if(req.body.vote === 'piggy') req.pic.piggies++;
  if(req.body.vote === 'skely') req.pic.skelies++;
  req.pic.save();
  res.send(req.pic);
})

//TODO make this /api/pics call for ajax loading
app.get('/', function(req,res){
  Pic.find(function(err, pics){
    pics = pics || [];
    res.render('homepage', {data : pics});
  });
})

app.get('/capture', function(req,res){
  res.render('capture')
})

app.post('/capture', upload.single('pic'), function(req,res){
  var file = req.file;
  console.log(file);
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

  res.redirect('/');
})

var port = process.env.PORT || 8888;
console.log('Pigly is listening on', port);
app.listen(port);