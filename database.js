var Sequelize = require("sequelize");
var seq = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false,
});

seq.authenticate().then(() => {
    console.log("Conexão ao banco de dados realizada com sucesso!");
}).catch(err => {
    console.log("Falha na conexão ao banco de dados:", err);
    throw err;
});

// ------------------------------------------------------------------------------------------ //

var Models = {
    Hotran: seq.define('Hotran', {
        Id : { type: Sequelize.BIGINT, primaryKey : true, autoIncrement : true },
        CodHotran : { type: Sequelize.STRING, unique : true, notNull : true },
        CodEmpresa : { type : Sequelize.STRING, notNull : true },
        NomeEmpresa : { type : Sequelize.STRING, notNull : true },
        NumeroVoo : { type : Sequelize.INTEGER, notNull : true },
        Equipamento : { type : Sequelize.STRING, notNull : true },
        Passageiros : { type : Sequelize.INTEGER, defaultValue : 0 },
        Status : { type : Sequelize.STRING, notNull : true },
        DataSolicitacao : { type : Sequelize.DATE, notNull : true },
        DataInicio : { type : Sequelize.DATEONLY, notNull : true },
        DataFim : { type : Sequelize.DATEONLY, notNull : true },
        Etapa : { type : Sequelize.INTEGER, defaultValue : 1 },
        CodOrigem : { type : Sequelize.STRING, notNull : true },
        CodDestino : { type : Sequelize.STRING, notNull : true },
        NomeOrigem : { type : Sequelize.STRING, notNull : true },
        NomeDestino : { type : Sequelize.STRING, notNull : true },
        HoraPartida : { type : Sequelize.STRING, notNull : true },
        HoraChegada : { type : Sequelize.STRING, notNull : true },
        Servico : { type : Sequelize.STRING, defaultValue : null },
        Natureza : { type : Sequelize.STRING, notNull : true },
        Tipo : { type : Sequelize.STRING, notNull : true },
        Codeshare : { type : Sequelize.STRING, defaultValue : null },
        Seg : { type : Sequelize.INTEGER, defaultValue : 0 },
        Ter : { type : Sequelize.INTEGER, defaultValue : 0 },
        Qua : { type : Sequelize.INTEGER, defaultValue : 0 },
        Qui : { type : Sequelize.INTEGER, defaultValue : 0 },
        Sex : { type : Sequelize.INTEGER, defaultValue : 0 },
        Sab : { type : Sequelize.INTEGER, defaultValue : 0 },
        Dom : { type : Sequelize.INTEGER, defaultValue : 0 },
    }),

    Log: seq.define('Log', {
        Id : { type : Sequelize.BIGINT, primaryKey : true, autoIncrement : true },
        Info: { type : Sequelize.TEXT, notNull : true },
    }),
};

// ------------------------------------------------------------------------------------------ //

for(let i in Models) {
    Models[i].sync( /*{force:true}*/ );
}

exports.seq = seq;
exports.Models = Models;