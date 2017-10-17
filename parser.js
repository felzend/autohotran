require('dotenv').config();
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

// Dependencies.
var moment = require("moment");
var http = require('http');
var mongoose = require('mongoose');
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var csv = require('csvtojson');

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
mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise }, err => {
	var now = moment().format("DD/MM/YYYY HH:mm:ss");
	if(err) 
	{
		fs.appendFile(settings.logfile, "["+now+"]: erro ao conectar à database.\n", err => {
			if(err) throw(err);
		});
		throw err;
	}

	fs.appendFile(settings.logfile, "["+now+"]: conectado à database.\n", err => {
		if(err) throw err;			
	});
});

// Downloading all hotran files.
async.eachLimit( settings.hotrans, 3, function(hotran, callback) {
	var file = fs.createWriteStream( hotran.path );
	var request = http.get( hotran.url, function(response) {
		if(response.statusCode == 500) {
			var now = moment().format("DD/MM/YYYY HH:mm:ss");
			fs.appendFile(settings.logfile, "["+now+"]: Erro ao obter tabela de dados. 500 - Internal server error.\n", err => {
				if(err) throw err;				
			});			
		}
		response.pipe(file).on('finish', function() {
			console.log("Downloaded", hotran.url );
			callback();
		});
	});
}, function() {
	process.exit(1);
});