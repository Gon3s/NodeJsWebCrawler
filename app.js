/**
 * Liste des dépendences
 */

var express   = require('express'),
    path = require('path'),
    http 	  = require('http'),
    routes 	  = require('./routes'),
    API       = require('./models/api');
    // request   = require('request'),
    // cheerio   = require('cheerio'),
    // aerospike = require('aerospike'),
    // MD5       = require('MD5'),

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/', routes.index);

new API();

http.createServer(app).listen(4231, function(){
  console.log('Express server listening on port ' + 4231);
});