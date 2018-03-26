var Sequelize = require("sequelize");
var seq = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    operatorsAliases: false,
    logging: false,
    define: {
        timestamps : false,
    },
});

// ------------------------------------------------------------------------------------------ //

var Models = {
    Hotran: seq.define('hotran', {
        Id : { type: Sequelize.BIGINT, primaryKey : true, autoIncrement : true },
        CodHotran : { type: Sequelize.TEXT, notNull : true },
        CodEmpresa : { type : Sequelize.TEXT, notNull : true },
        NomeEmpresa : { type : Sequelize.TEXT, notNull : true },
        NumeroVoo : { type : Sequelize.TEXT, notNull : true },
        Equipamento : { type : Sequelize.TEXT, notNull : true },
        Passageiros : { type : Sequelize.INTEGER, defaultValue : 0 },
        Status : { type : Sequelize.TEXT, notNull : true },
        DataSolicitacao : { type : Sequelize.DATE, notNull : true },
        DataInicio : { type : Sequelize.DATEONLY, notNull : true },
        DataFim : { type : Sequelize.DATEONLY, notNull : true },
        Etapa : { type : Sequelize.INTEGER, defaultValue : 1 },
        CodOrigem : { type : Sequelize.TEXT, notNull : true },
        CodDestino : { type : Sequelize.TEXT, notNull : true },
        NomeOrigem : { type : Sequelize.TEXT, notNull : true },
        NomeDestino : { type : Sequelize.TEXT, notNull : true },
        HoraPartida : { type : Sequelize.TEXT, notNull : true },
        HoraChegada : { type : Sequelize.TEXT, notNull : true },
        Servico : { type : Sequelize.TEXT, defaultValue : null },
        Natureza : { type : Sequelize.TEXT, notNull : true },
        Tipo : { type : Sequelize.TEXT, notNull : true },
        Codeshare : { type : Sequelize.TEXT, defaultValue : null },
        Seg : { type : Sequelize.INTEGER, defaultValue : 0 },
        Ter : { type : Sequelize.INTEGER, defaultValue : 0 },
        Qua : { type : Sequelize.INTEGER, defaultValue : 0 },
        Qui : { type : Sequelize.INTEGER, defaultValue : 0 },
        Sex : { type : Sequelize.INTEGER, defaultValue : 0 },
        Sab : { type : Sequelize.INTEGER, defaultValue : 0 },
        Dom : { type : Sequelize.INTEGER, defaultValue : 0 },
        createdAt : { type : Sequelize.DATE },
        updatedAt : { type : Sequelize.DATE },        
    }),

    Log: seq.define('log', {
        Id : { type : Sequelize.BIGINT, primaryKey : true, autoIncrement : true },
        Info: { type : Sequelize.TEXT, notNull : true },
        createdAt : { type : Sequelize.DATE },
        updatedAt : { type : Sequelize.DATE },
    }),
};

// ------------------------------------------------------------------------------------------ //

for(let i in Models) {
    Models[i].sync( /*{force:true}*/ );
}

exports.seq = seq;
exports.Models = Models;