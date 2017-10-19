var mongoose = require('mongoose');
exports.Log = mongoose.model('Log', {	
	type: String,
	message: String,
	created_at: Date
});
exports.Hotran = mongoose.model('Hotran', {
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
});