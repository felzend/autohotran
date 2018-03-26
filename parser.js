require("dotenv").config();

var defaultTz = "America/Fortaleza";

var fs = require("fs");
var async = require("async");
var cmd = require('node-run-cmd');
var moment = require('moment-timezone');
var CsvReader = require('csv-reader');

var rows = [];
var rowsCount = 0;
var db = require("./database.js");
var settings = require("./settings.js");
var files = [
    { url: "https://sistemas.anac.gov.br/sas/registros/Futuro/futuro.csv", output: settings.paths.hotran }
];

var currentTime = function() {
    return moment().tz(defaultTz);
};

if(!fs.existsSync(settings.paths.filesDir)) 
{
    fs.mkdirSync(settings.paths.filesDir);
}

db.seq.authenticate().then(() => {
    console.log("Conexão ao banco de dados realizada com sucesso!");
    
    async.eachLimit(files, 1, (file, callback) => {
        let log = new db.Models.Log({
            Info: "Iniciando o download do arquivo " + file.output,
            createdAt : currentTime(),
            updatedAt : currentTime(),
        });
        log.save();
        cmd.run("curl -k " + file.url + " --output " + file.output, { onDone: () => {            
            var stream = fs.createReadStream(file.output, 'utf8');
            stream.pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true }))
            .on('data', function (row) {    
                row = row.join(' ').trim().split(";");
                rows.push(row);
            })
            .on('end', function (data) {
                rows.splice(0, 2);
                let log = new db.Models.Log({
                    Info: "Iniciou o processo de análise de dados.",
                    createdAt : currentTime(),
                    updatedAt : currentTime(),
                });
                log.save();
                async.eachLimit( rows, 1, (row, callback) => {
                    var row = row.map(rdata => {                    
                        if(rdata !== undefined && typeof rdata == "string") rdata = rdata.trim();                        
                        return rdata;
                    });

                    var newhotran = {
                        CodHotran : row[12],
                        CodEmpresa : row[0],
                        NomeEmpresa : row[1],
                        NumeroVoo : row[2],
                        Equipamento : row[3],
                        Passageiros : parseInt( row[11] ),
                        Status : row[13],
                        DataSolicitacao : row[14],
                        DataInicio : row[15],
                        DataFim : row[16],
                        Etapa : parseInt( row[18] ),
                        CodOrigem : row[19],
                        CodDestino : row[21],
                        NomeOrigem : row[20],
                        NomeDestino : row[22],
                        HoraPartida : row[23],
                        HoraChegada : row[24],
                        Servico : row[25],
                        Natureza : row[17],
                        Tipo : row[26],
                        Codeshare : row[27],
                        Seg : parseInt( row[4] ),
                        Ter : parseInt( row[5] ),
                        Qua : parseInt( row[6] ),
                        Qui : parseInt( row[7] ),
                        Sex : parseInt( row[8] ),
                        Sab : parseInt( row[9] ),
                        Dom : parseInt( row[10] ),
                        createdAt : currentTime(),
                        updatedAt : currentTime(),
                    };

                    db.Models.Hotran.findOne({
                        where: {
                            CodEmpresa: newhotran.CodEmpresa,
                            NumeroVoo: newhotran.NumeroVoo,
                            CodHotran: newhotran.CodHotran,
                            Etapa: newhotran.Etapa
                        }
                    }).then(hotran => {
                        var obj = new db.Models.Hotran(newhotran);
                        if(hotran == null) 
                        {
                            obj.save().then(() => {
                                ++rowsCount;
                                process.nextTick(callback);
                            }).catch(err => {
                                if(err) {
                                    let log = new db.Models.Log({
                                        Info: "Erro ao salvar no banco de dados",
                                        createdAt : currentTime(),
                                        updatedAt : currentTime(),
                                    });
                                    log.save();
                                }
                            });
                        }
                        else
                        {
                            hotran.update(newhotran).then(() => {
                                ++rowsCount;
                                process.nextTick(callback);
                            });
                        }
                    });
                }, () => {
                    process.nextTick(callback);
                });
            });

        }});
    
    }, () => {
        let log = new db.Models.Log({
            Info: rowsCount + " dados salvos de um total de "+ rows.length + " analisados.",
            createdAt : currentTime(),
            updatedAt : currentTime(),
        });
        log.save().then(() => {
            process.exit(1);
        });
    });
});