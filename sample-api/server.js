var express = require('express')
var bodyParser = require('body-parser')
var app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static('public'))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('/', function (req, res) {
  res.json({ hello: "hello from cf app" })
})

app.get('/hello', function (req, res) {
  res.json({ hello: "hello world" })
})

app.get('/hello/:name', function (req, res) {
  var name = req.params.name
  res.json({ hello: "hello " + name })
})

app.post('/hello/user', function(req, res) {
    var name = req.body.name;
    res.set('Content-Type', 'text/xml')
    res.send('<?xml version="1.0" encoding="UTF-8"?><text><para>hello ' + name  + '</para></text>');
});

app.put('/hello/user', function(req, res) {
    var name = req.body.name;
    res.send('Hello Updated ' + name + '. We just updated your info.');
});

app.delete('/hello/user', function(req, res) {
    var name = req.body.name;
    res.send('Hello ' + name + '. We just deleted your info.');
});

var port = process.env.PORT || 3000

var webServer = app.listen(port, function () {
    console.log('Listening on port %d', webServer.address().port)
})
