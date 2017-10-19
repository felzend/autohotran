require('dotenv').config();
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

// Dependencies.
var http = require('http');
var mongoose = require('mongoose');
var fs = require("fs");
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var moment = require('moment-timezone');
var express = require("express");

var app = express();

// Creating log file if it doesn't exists.
fs.open(settings.logfile, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

// Creating env file for database configuration.
fs.open(".env", "a+", (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

// Connecting to database.
mongoose.Promise = global.Promise;
mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise }, err => {
	var now = moment().tz('America/Fortaleza').format("DD/MM/YYYY HH:mm:ss");
	if(err) 
	{
		fs.appendFile(settings.logfile, "["+now+"]: erro ao conectar à database.\n", err => {
			if(err) throw(err);
		});

		throw err;
	}	
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.locals.moment = require('moment');
app.use(express.static(__dirname + '/public'));
app.listen( settings.serverPort, function() {
	console.log("servidor iniciado na porta "+settings.serverPort);	
});

app.get('/', function(req, res) {
	var today = moment();	
	var hotranUpdate = { created_at: undefined, message: 'Sem recentes atualizações de hotran.' };
	models.Hotran.find({
		data_solicitacao: today.format('YYYY-MM-DD')
	}, (err, hotrans) => {
		if(err) throw err;
		models.Log.find({
			type: settings.logCategories.hotran,
		})
		.sort({'created_at': -1})
		.limit(1)
		.exec(function(err, log) {
			if( log != null ) {
				var hotranLastUpdate = moment(log[0].created_at, 'DD-MM-YYYY HH:mm:ss');
				hotranUpdate = hotranLastUpdate.format('DD/MM/YYYY') + " as " + hotranLastUpdate.format("HH:mm:ss");
			}
			res.render('pages/index', {
				hotranUpdate: hotranUpdate,
				hotrans: hotrans,
				year: today.format('YYYY') 
			});
		});		
	})
});