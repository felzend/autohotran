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
			process.nextTick(callback);
		});
	});
}, function() {
	console.log("Downloaded all hotran files.");
	async.eachLimit( settings.hotrans, 1, function(hotran, callback) {		
		var workSheets = xlsx.parse( __dirname + hotran.path );
		async.eachLimit( workSheets, 1, function(worksheet, callback) {
			worksheet.data.splice(0, 4);	
			async.eachLimit( worksheet.data, 50, function(row, callback) {
				var data = row;
				if( row.length ) {					
					//console.log(row);
					if( hotran.hasOwnProperty('dropColumns') ) {
						row = data.filter((value, index) => {
							//console.log("Checking for "+index+": "+value);
							if(!hotran.dropColumns.includes(index)) {								
								return !hotran.dropColumns.includes(index);
							} else {
								console.log("Excluding "+index+": "+value);
							}
						});
					}					

					var schedule = {
						cod_empresa: data[0],
						nome_empresa: data[1],
						voo: data[2],
						aeronave: data[3],
						dias: {
							segunda_feira: data[4].trim().length > 0,
							terca_feira: data[5].trim().length > 0,
							quarta_feira: data[6].trim().length > 0,
							quinta_feira: data[7].trim().length > 0,
							sexta_feira: data[8].trim().length > 0,
							sabado: data[9].trim().length > 0,
							domingo: data[10].trim().length > 0,
						},
						assentos: parseInt(data[11]),
						cod_hotran: data[12],
						tipo: data[13],
						status: data[14],
						data_solicitacao: data[15],	
						data_vigencia: data[16],	
						natureza: data[17],
						etapa: data[18],
						cod_origem: data[19],						
						aeroporto_origem: data[20],
						cod_destino: data[21],
						aeroporto_destino: data[22],
						horario_partida: data[23],
						horario_chegada: data[24],
						equipamento_alterado: data[25]
					};
					console.log("Data: "+row.length);
					console.log(schedule);
					process.nextTick(callback);
				}				
				else process.nextTick(callback);
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

/*
cod_empresa: String,
	nome_empresa: String,
	voo: Number,
	aeronave: String,
	dias: {
		segunda_feira: {type: Boolean, default: false},
		terca_feira: {type: Boolean, default: false},
		quarta_feira: {type: Boolean, default: false},
		quinta_feira: {type: Boolean, default: false},
		sexta_feira: {type: Boolean, default: false},
		sabado: {type: Boolean, default: false},
		domingo: {type: Boolean, default: false},
	},
	assentos: Number,
	cod_hotran: String,
	tipo: String,
	status: String,
	data_solicitacao: Date,	
	data_vigencia: Date,	
	natureza: String,
	etapa: Number,
	cod_origem: String,
	aeroporto_origem: String,
	cod_destino: String,
	aeroporto_destino: String,
	horario_partida: String,
	horario_chegada: String,
	equipamento_alterado: String
	*/