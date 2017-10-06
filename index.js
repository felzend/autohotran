require('dotenv').config();

var mongoose = require('mongoose');
var moment = require("moment");
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

fs.open(settings.datafile, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

fs.open(settings.logfile, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

fs.open(".env", "a+", (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
})

mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise }, (err) => {
	if(err) {
		console.log(">> Failed to connect to database.");
		throw err;
	}	
	console.log(">> Successfully connected to database.");	
});

watch(settings.datafile, { recursive: true }, (evt, name) => {	
	var dir = name.replace(/\\/g, "/");
	var newRecords = 0;
	if(evt === "update" && dir === settings.datafile) {
		fs.readFile(settings.datafile, 'utf8', (err, data) => {
			if(err) throw err;

			var schedules = JSON.parse(data);
			async.each( schedules, function(schedule, callback) {				
				models.Schedule.findOne({ voo: schedule.voo, cod_hotran: schedule.cod_hotran }, function(err, result) {
					if(err) throw err;
					if(result == null)
					{
						newRecords++;
						schedule.created = moment().format('YYYY-MM-DD HH:mm:ss');
						let scheduleObject = new models.Schedule(schedule);
						scheduleObject.save((err, schedule) => {
							if(err) {
								console.log( JSON.stringify(err.errors) );
								throw err;	
							}														
						});
					}

					callback.call();
				});				
			}, function() {
				var date = moment().format("DD/MM/YYYY HH:mm:ss");
				fs.appendFile(settings.logfile, "["+date+"]: "+newRecords+" novo(s) hotran(s) identificado(s) e salvo(s) na database!.\n", err => {
					if(err) throw(err);
				});			
			});			
		});
	}
});