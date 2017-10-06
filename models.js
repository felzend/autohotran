var mongoose = require('mongoose');
exports.Schedule = mongoose.model('Schedule', {	
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
	data_solicitacao: String, // Fix
	data_aprovacao: String, // Fix
	data_vigencia: String, // Fix
	tipo: String,
	etapa: Number,
	cod_origem: String,
	aeroporto_origem: String,
	cod_destino: String,
	aeroporto_destino: String,
	horario_partida: String,
	horario_chegada: String,
	codeshare: [{type: String}],
	observacao: String,
	created: Date
});