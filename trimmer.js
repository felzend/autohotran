require('dotenv').config();

var connectionString = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASSWORD+'@localhost:27017/'+process.env.DB_NAME;
var async = require("async");
var mongoose = require('mongoose');
var models = require('./models');

// Connecting to database.
mongoose.Promise = global.Promise;
mongoose.connect(connectionString, {useMongoClient: true, promiseLibrary: global.Promise }, err => {
	if(err) throw err;	
});

models.Hotran.find({})
.exec((err, results) => {
	async.eachLimit( results, 1, (hotran, callback) => {
		models.Hotran.update({_id: hotran._id}, {
			cod_empresa: hotran.cod_empresa.trim(),
			nome_empresa: hotran.nome_empresa.trim(),			
			aeronave: hotran.aeronave.trim(),			
			cod_hotran: hotran.cod_hotran.trim(),
			tipo: hotran.tipo.trim(),
			status: hotran.status.trim(),			
			natureza: hotran.natureza.trim(),
			cod_origem: hotran.cod_origem.trim(),
			aeroporto_origem: hotran.aeroporto_origem.trim(),
			cod_destino: hotran.cod_destino.trim(),
			aeroporto_destino: hotran.aeroporto_destino.trim(),
			horario_partida: hotran.horario_partida.trim(),
			horario_chegada: hotran.horario_chegada.trim(),
			equipamento_alterado: hotran.equipamento_alterado.trim()
		}, (err, numberAffected, rawResponse) => {
			if(err) throw err;
			console.log(numberAffected);
			process.nextTick(callback);
		});		
	}, function() {		
		process.exit(1);
	});
});