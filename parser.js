require('dotenv').config();
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;

// Dependencies.
var http = require('http');
var mongoose = require('mongoose');
var fs = require("fs");
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var shell = require('shelljs');
var cron = require('node-cron');
var moment = require('moment-timezone');
var xlsx = require('node-xlsx');

var schedulerString = '*/30 * * * *';

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

cron.schedule( schedulerString, function() {
	var currentHours = moment().tz('America/Fortaleza').format('HH:mm');
	if( currentHours > "01:00" && currentHours < "08:00" ) return;
	// Downloading all hotran files.
	async.eachLimit( settings.hotrans, 1, function(hotran, callback) {
		var file = fs.createWriteStream( __dirname + hotran.path );
		var request = http.get( hotran.url, function(response) {
			if(response.statusCode == 500) {
				var now = moment().tz('America/Fortaleza').format("DD/MM/YYYY HH:mm:ss");
				fs.appendFile(settings.logfile, "["+now+"]: Erro ao obter tabela de dados. 500 - Internal server error.\n", err => {
					if(err) throw err;				
				});			
			}
			response.pipe(file).on('finish', function() {
				process.nextTick(callback);
			});
		});
	}, function() {
		var counter = 0;	
		async.eachLimit( settings.hotrans, 1, function(hotran, callback) {
			var workSheets = xlsx.parse( __dirname + hotran.path );
			async.eachLimit( workSheets, 1, function(worksheet, callback) {
				worksheet.data.splice(0, 4);
				async.eachLimit( worksheet.data, 1, function(row, callback) {
					var data = row;
					if( row.length ) {					
						if( hotran.hasOwnProperty('dropColumns') ) {
							data = data.filter((value, index) => {
								return !hotran.dropColumns.includes(index);							
							});
						}

						var schedule = {
							cod_empresa: data[0].trim(),
							nome_empresa: data[1].trim(),
							voo: data[2],
							aeronave: data[3].trim(),
							dias: {
								segunda_feira: data[4].trim().length > 0,
								terca_feira: data[5].trim().length > 0,
								quarta_feira: data[6].trim().length > 0,
								quinta_feira: data[7].trim().length > 0,
								sexta_feira: data[8].trim().length > 0,
								sabado: data[9].trim().length > 0,
								domingo: data[10].trim().length > 0,
							},
							assentos: data[11],
							cod_hotran: data[12].trim(),
							tipo: data[13].trim(),
							status: data[14].trim(),
							data_solicitacao: moment(data[15], 'DD-MM-YYYY').format('YYYY-MM-DD'),
							data_vigencia: moment(data[16], 'DD-MM-YYYY').format('YYYY-MM-DD'),	
							natureza: data[17].trim(),
							etapa: data[18],
							cod_origem: data[19].trim(),						
							aeroporto_origem: data[20].trim(),
							cod_destino: data[21].trim(),
							aeroporto_destino: data[22].trim(),
							horario_partida: data[23].trim(),
							horario_chegada: data[24].trim(),
							equipamento_alterado: data[25].trim()
						};

						models.Hotran.findOne({						
							cod_hotran: schedule.cod_hotran,
							voo: schedule.voo
						}, (err, h) => {
							if(h == null) { // If no hotran record is found.
								var obj = new models.Hotran(schedule);							
								obj.save((err, entity, numAffected) => { // Saving new hotran record.
									if(err) throw err;
									counter = counter + 1;
									process.nextTick(callback);
								});							
							} else {
								process.nextTick(callback);
							}
						});				
					}				
					else process.nextTick(callback);
				}, function() { // Callback for data.				
					process.nextTick(callback);
				});
			}, function() { // Callback for worksheets.			
				process.nextTick(callback);
			});		
		}, function() { // Callback for parsing all files.
			var now = moment().tz('America/Fortaleza').format('YYYY-MM-DD HH:mm:ss');
			var update = new models.Log({
				type: settings.logCategories.hotran,
				message: counter + " novos hotrans identificados.",
				created_at: now
			});
			update.save((err, entity, numAffected) => {
				if(err) throw err;				
			});		
		});
	});
});