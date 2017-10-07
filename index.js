require('dotenv').config();

var mongoose = require('mongoose');
var moment = require("moment");
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

const cheerio = require('cheerio');

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
	if( evt === "update" && dir == settings.datafile) {		
		fs.readFile(settings.datafile, "utf-8", function(err, data) {
			if(err) throw err;
			const $ = cheerio.load(data);
			var rows = $("table").find("tr:nth-child(n+4)");			
			var hotran = [];
			async.each( rows, function(row, callback) {
				var codeshare = $(row).find("td:nth-child(25)").html().split('-').map(function(code) { 
					return code.trim(); 
				});
				var object = {
					cod_empresa: $(row).find("td:nth-child(1)").html().trim(),
					nome_empresa: $(row).find("td:nth-child(2)").html().trim(),
					voo: parseInt($(row).find("td:nth-child(3)").html().trim()),
					aeronave: $(row).find("td:nth-child(4)").html().trim(),
					dias: {
						segunda_feira: $(row).find("td:nth-child(5)").html().trim().length > 0,
						terca_feira: $(row).find("td:nth-child(6)").html().trim().length > 0,
						quarta_feira: $(row).find("td:nth-child(7)").html().trim().length > 0,
						quinta_feira: $(row).find("td:nth-child(8)").html().trim().length > 0,
						sexta_feira: $(row).find("td:nth-child(9)").html().trim().length > 0,
						sabado: $(row).find("td:nth-child(10)").html().trim().length > 0,
						domingo: $(row).find("td:nth-child(11)").html().trim().length > 0
					},
					assentos: parseInt($(row).find("td:nth-child(12)").html().trim()),
					cod_hotran: $(row).find("td:nth-child(13)").html().trim(),
						data_solicitacao: $(row).find("td:nth-child(14)").html().trim(),//.replace(/\//g, "-"),
						data_aprovacao: $(row).find("td:nth-child(15)").html().trim(),//.replace(/\//g, "-"),
						data_vigencia: $(row).find("td:nth-child(16)").html().trim(),//.replace(/\//g, "-"),
						tipo: $(row).find("td:nth-child(17)").html().trim(),
						etapa: parseInt($(row).find("td:nth-child(18)").html().trim()),
						cod_origem: $(row).find("td:nth-child(19)").html().trim(),
						aeroporto_origem: $(row).find("td:nth-child(20)").html().trim(),
						cod_destino: $(row).find("td:nth-child(21)").html().trim(),
						aeroporto_destino: $(row).find("td:nth-child(22)").html().trim(),
						horario_partida: $(row).find("td:nth-child(23)").html().trim(),
						horario_chegada: $(row).find("td:nth-child(24)").html().trim(),
						codeshare: codeshare,
						observacao: $(row).find("td:nth-child(26)").html().trim()
				};
				models.Schedule.findOne({ voo: object.voo, cod_hotran: object.cod_hotran }, function(err, result) {
					if(err) throw err;
					if(result == null)
					{
						object.created = moment().format('YYYY-MM-DD HH:mm:ss');
						let scheduleObject = new models.Schedule(object);
						scheduleObject.save((err, schedule) => {
							if(err) {
								console.log( JSON.stringify(err.errors) );
								throw err;	
							}
							hotran.push( object );
						});						
					}
					callback.call();
				});				
			}, function() {
				var date = moment().format("DD/MM/YYYY HH:mm:ss");
				fs.appendFile(settings.logfile, "["+date+"]: "+hotran.length+" novo(s) hotran(s) identificado(s) e salvo(s) na database!.\n", err => {
					if(err) throw(err);
				});
			});
		});
	}
	/*if(evt === "update" && dir === settings.datafile) {
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
	}*/
});