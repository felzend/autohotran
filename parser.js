require('dotenv').config();
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

// Dependencies.
var http = require('http');
var mongoose = require('mongoose');
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var csv = require('csvtojson');
var shell = require('shelljs');
var cron = require('node-cron');
var moment = require('moment');
var xlsx = require('node-xlsx');

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
async.eachLimit( settings.hotrans, 1, function(hotran, callback) {
	var file = fs.createWriteStream( __dirname + hotran.path );
	var request = http.get( hotran.url, function(response) {
		if(response.statusCode == 500) {
			var now = moment().format("DD/MM/YYYY HH:mm:ss");
			fs.appendFile(settings.logfile, "["+now+"]: Erro ao obter tabela de dados. 500 - Internal server error.\n", err => {
				if(err) throw err;				
			});			
		}
		response.pipe(file).on('finish', function() {
			callback();
		});
	});
}, function() {
	console.log("Downloaded all hotran files.");
	async.eachLimit( settings.hotrans, 1, function(hotran, callback) {		
		var workSheets = xlsx.parse( __dirname + hotran.path );
		async.eachLimit( workSheets, 1, function(worksheet, callback) {
			worksheet.data.splice(0, 4);	
			async.eachLimit( worksheet.data, 50, function(data, callback) {
				if( data.length ) {					
					if( hotran.hasOwnProperty('dropColumns') ) {
						for( let n in hotran.dropColumns ) {
							data.splice( hotran.dropColumns[n], 1 );							
						}
					}					
				}				
				process.nextTick(callback);
			}, function() { // Callback for data.
				console.log("Done " + hotran.path );
				process.nextTick(callback);				
			});
		}, function() { // Callback for worksheets.
			process.nextTick(callback);
		});		
	}, function() { // Callback for parsing all files.
		console.log( "Finally done." );
		process.exit(1);
	});
});