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
var _ = require("underscore");

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
app.locals.moment = require('moment-timezone');
app.use(express.static(__dirname + '/public'));
app.listen( settings.serverPort, function() {
	console.log("servidor iniciado na porta "+settings.serverPort);	
});

app.get('/', function(req, res) {
	var today = moment().tz('America/Fortaleza').format('DD-MM-YYYY');
	var lastUpdate = { created_at: undefined, message: 'Não houve atualização de sistema.' };		
	models.Log.find({ // Catching hotran log.
		type: settings.logCategories.hotran,
	})
	.sort({'created_at': -1})		
	.limit(1)
	.exec(function(err, log) {		
		if(log.length) {
			var date = moment(log[0].created_at, 'DD-MM-YYYY HH:mm:ss');
			lastUpdate.message = date.format('DD/MM/YYYY') + " as " + date.format("HH:mm");
		}
		res.render('pages/index', {
			lastUpdate: lastUpdate,
			today: today
		});		
	});	
});
app.get('/hotran/fields', function(req, res) {
	if(req.query.field === undefined) { res.end(); return; }	
	var params = req.query;
	var query = { groupBy: {}, orderBy: {} };
	query.groupBy[params.field] = "$".concat(params.field);

	models.Hotran.aggregate([		
		{$group: {"_id":query.groupBy}},
		{$sort: {"_id":1}}
		], (err, result) => {		
			var filtered = result.map(obj => {
				return obj['_id'][params.field].trim();
			});		
			res.json(filtered);
		});

});
app.get('/hotran/api', function(req, res) {
	const limit = 700;
	var params = req.query;	
	Object.keys(params).forEach(key => {		
		if(!params[key].length) delete params[key];
		else if(key === "data_solicitacao") params[key] = moment(params[key], 'DD-MM-YYYY').format('YYYY-MM-DD');
	});	
	models.Hotran.find(params)	
	.sort({'nome_empresa': 1})
	.limit(limit)
	.exec((err, hotrans) => {
		if(err) throw err;
		res.json(hotrans);
	});
});
app.get('/hotran/merge', function(req, res) {
	var params = req.query;	// cod_empresa, cod_hotran, data_solicitacao, voo.
	// Deve-se pesquisar pelo cod_hotran para verificar voos de ida e volta.	
	models.Hotran.find({cod_empresa: params.cod_empresa, cod_hotran: params.cod_hotran, data_solicitacao: params.data_solicitacao}).exec((err, hotrans) => {
		if(err) throw err;
		var voos = [];
		var hotranList = hotrans;
		_.each( hotrans, hotran => {
			if(hotran.voo == params.voo) {
				_.filter( hotranList, hotranCopy => {
					if(hotran.cod_hotran == hotranCopy.cod_hotran && ( hotranCopy.voo == hotran.voo || hotranCopy.voo == hotran.voo + 1 || hotranCopy.voo == hotran.voo - 1 )) {
						hotranList = _.without(hotranList, hotranCopy);
						voos.push(hotranCopy);
						return hotranCopy;
					}
				});
			}
		});	

		res.json(voos);
	});
});