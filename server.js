var server = require('http').createServer(),
		express = require('express'),
		app = express(),
		port = 80,
		multer  = require('multer'),
		fs = require('fs');
var resources = [];
var images = [];

fs.readdir('build/image', function(err, files){
	if(err)
		console.log(err);
	else
		for(var i=0;i<files.length;i++)
			images.push(files[i].substr(0, files[i].lastIndexOf('.')));
});
fs.readdir('build/resource', function(err, files){
	if(err)
		console.log(err);
	else
		for(var i=0;i<files.length;i++)
			resources.push(files[i].substr(0, files[i].lastIndexOf('.')));
});

var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function newFileName(){
	var name = '';
	for(var i=0;i<32;i++)
		name += characters[Math.floor(Math.random() * characters.length)];
	return name;
}

var imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'build/image')
  },
  filename: function (req, file, cb) {
	var name;
	do{
		name = newFileName();
	}while(images.indexOf(name)!=-1);
	cb(null, name+file.originalname.substr(file.originalname.lastIndexOf('.')))
  }
});
var resourceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'build/resource')
  },
  filename: function (req, file, cb) {
	var name;
	do{
		name = newFileName();
	}while(resources.indexOf(name)!=-1);
	cb(null, name+file.originalname.substr(file.originalname.lastIndexOf('.')))
  }
});
function imageFilter (req, file, cb) {
	cb(null, file && file.mimetype.match(/^image.*/));
}

app.set('view engine', 'ejs');
app.use(express.static('build'));

// Page for testing outputs
app.post('/test', function(req, res) {
	console.log(req.files);
	res.send(req.files);
});

// Post for submitting images
app.post('/image', multer({ storage: imageStorage, fileFilter: imageFilter }).single('image'), function(req, res) {
	console.log(req.file);
	if(req.file)
		res.send(req.file.filename);
	else
		res.send(false);
});

//Post for submitting resources
app.post('/resource', multer({ storage: resourceStorage }).single('resource'), function(req, res) {
	if(req.file)
		res.send(req.file.filename);
	else
		res.send(false);
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });
