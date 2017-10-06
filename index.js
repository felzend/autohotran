var mongoose = require('mongoose');
var moment = require("moment");
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");

mongoose.connect('mongodb://127.0.0.1:27017/'+settings.dbName, { useMongoClient: true, promiseLibrary: global.Promise }, (err) => {
	if(err) {
		console.log(">> Failed to connect to database.");
		throw err;
	}

	console.log(">> Successfully connected to database.");	
});

fs.open(settings.filedir, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

fs.open(settings.logfile, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

watch(settings.filedir, { recursive: true }, (evt, name) => {
	var newRecords = 0;
	let dir = name.replace(/\\/g, "/");
	if(evt === "update" && dir === settings.filedir) {
		fs.readFile(settings.filedir, 'utf8', (err, data) => {
			if(err) throw err;

			let schedules = JSON.parse(data);
			for(let a = 0; a < schedules.length; a++) 
			{
				var cs = schedules[a];
				console.log("Checking for "+cs.voo+" | Date: " +cs.data_solicitacao );
				models.Schedule.findOne({ voo: cs.voo, data_solicitacao: cs.data_solicitacao }, (err, result) => {
					if(err) throw (err);
					if(result == null)
					{
						cs.created = moment().format('YYYY-MM-DD HH:mm:ss');						
						let schedule = new models.Schedule(cs);
						schedule.save((err, schedule) => {
							if(err) {
								console.log( JSON.stringify(err.errors) );
								throw(err);
								return;
							}							
						});

						var date = moment().format("DD/MM/YYYY HH:mm:ss");						
						fs.appendFile(settings.logfile, "["+date+"]: HOTRAN novo identificado e salvo na database!.\n", err => {
							if(err) throw(err);
						});
					}
				});				
			}
		});
	}
});