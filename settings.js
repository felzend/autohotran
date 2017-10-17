var fs = require('fs');
exports.csvfile = "data/hotran.csv";
exports.logfile = 'data/log.txt';
exports.hotrans = {
	semParecer: { url: 'http://www2.anac.gov.br/arquivos/xls/hotran/1.1.xls', path: 'data/1.1.xls' },
	comParecer: { url: 'http://www2.anac.gov.br/arquivos/xls/hotran/1.2.xls', path: 'data/1.2.xls' },
	aVigorar: { url: 'http://www2.anac.gov.br/arquivos/xls/hotran/1.4.xls', path: 'data/1.4.xls' }
};