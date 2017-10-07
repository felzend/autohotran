require('dotenv').config();

var moment = require("moment");
var http = require('http');
var mongoose = require('mongoose');
var fs = require("fs");
var watch = require('node-watch');
var models = require('./models');
var settings = require("./settings");
var async = require("async");
var csv = require('csvtojson');

var today = moment().format("DD/MM/YYYY");
var fileurl = "http://www2.anac.gov.br/hotran/hotran_data.asp?dt_hotran="+today+"&id_empresa=&formato=csv";
var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;
const csvFilePath = __dirname + '/' + settings.csvfile;

fs.open(settings.logfile, 'a+', (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

fs.open(".env", "a+", (err, fd) => {
	fs.close(fd, (err) => {
		if(err) throw err;
	});
});

mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise }, (err) => {
	var now = moment().format("DD/MM/YYYY HH:mm:ss");
	if(err) {
		fs.appendFile(settings.logfile, "["+now+"]: erro ao conectar à database.\n", err => {
			if(err) throw(err);
		});

		throw err;
	}
	
	fs.appendFile(settings.logfile, "["+now+"]: conectado à database.\n", err => {
		if(err) throw err;			
	});

	console.log("Conected DB");

});

var hotrans = new Array();
var file = fs.createWriteStream(settings.csvfile);
var request = http.get(fileurl, function(response) {
	response.pipe(file).on('finish', function() {
		csv({
			noheader: true,
			trim: true,
			delimiter: ";"
		}).fromFile(csvFilePath).on('json', (obj, index) => {
			if( index < 3) return;		
			models.Schedule.findOne({voo: obj.field3, cod_hotran: obj.field13}, function(err, result) {				
				if(err) throw err;
				console.log("IDX: "+index);
				if(result == null)
				{
					var now = moment().format("YYYY-MM-DD HH:mm:ss");
					var codeshare = '';
					if(obj.field25 !== undefined) {
						obj.field25.split('-').map(function(code) { 
							return code.trim(); 
						});
					}
					var schedule = {
						cod_empresa: obj.field1,
						nome_empresa: obj.field2,
						voo: obj.field3,
						aeronave: obj.field4,
						dias: {
							segunda_feira: (obj.field5 === undefined) ? '' : obj.field5.length > 0,
							terca_feira: (obj.field6 === undefined) ? '' : obj.field6.length > 0,
							quarta_feira: (obj.field7 === undefined) ? '' : obj.field7.length > 0,
							quinta_feira: (obj.field8 === undefined) ? '' : obj.field8.length > 0,
							sexta_feira: (obj.field9 === undefined) ? '' : obj.field9.length > 0,
							sabado: (obj.field10 === undefined) ? '' : obj.field10.length > 0,
							domingo: (obj.field11 === undefined) ? '' : obj.field11.length > 0
						},
						assentos: obj.field12,
						cod_hotran: obj.field13,
						data_solicitacao: obj.field14,
						data_aprovacao: obj.field15,
						data_vigencia: obj.field16,
						tipo: obj.field17,
						etapa: obj.field18,
						cod_origem: obj.field19,
						aeroporto_origem: obj.field20,
						cod_destino: obj.field21,
						aeroporto_destino: obj.field22,
						horario_partida: obj.field23,
						horario_chegada: obj.field24,
						codeshare: codeshare,
						observacao: obj.field26,
						created: now
					};
					hotrans.push( schedule );
				}
			});			
		}).on('done', error => {
			if(error) throw error;			
			async.each( hotrans, function(hotran, callback) {
				var schedule = new models.Schedule(hotran);
				schedule.save((err, schedule) => {
					if(err) throw err;
					callback();
				});
			}, function() {
				var now = moment().format("DD/MM/YYYY HH:mm:ss");
				fs.appendFile(settings.logfile, "["+now+"]: "+hotrans.length+" novo(s) hotran(s) identificado(s) e salvo(s) na database!.\n", err => {
					if(err) throw err;
				});
				process.exit(1);
			});			
		});
	});
});