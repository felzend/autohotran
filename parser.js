require("dotenv").config();

var cron = require('node-cron');
var fs = require("fs");
var async = require("async");
var cmd = require('node-run-cmd');
var moment = require('moment-timezone');
var CsvReader = require('csv-reader');
var settings = require("./settings.js");
var db = require("./database.js");
var currentTime = function() {
    return moment().tz(settings.defaultTz);
};

cron.schedule(settings.cronString, function() {
    var now = currentTime();
    var rowsCount = 0;
    var rows = [];
    var currentDate = now.format("YYYY-MM-DD");
    var hotranFile = settings.paths.hotranFile;
    var hotranIndex = settings.paths.hotransIndex;
    if(!fs.existsSync(settings.paths.filesDir)) 
    {
        fs.mkdirSync(settings.paths.filesDir);
    }

    db.seq.authenticate().then(() => {
        console.log("Autenticado!");
        db.Models.File.findOne({where:{Date:currentDate}}).then(file => {
            if(file === null) {
                cmd.run("curl -k -v " + hotranIndex, {onData: (data) => {
                    var nowDate = now.format("M/DD/YYYY");
                    var search = nowDate.replace(/\//g, "\\/");;
                    var matches = data.toString().match("3\/27\/2018");
                    if(matches !== null && matches.length > 0)
                    {
                        let log = new db.Models.Log({
                            Info: "Iniciando o download do arquivo " + hotranFile,
                            createdAt : now,
                            updatedAt : now,
                        });
                        log.save().then(() => {
                            let file = new db.Models.File({
                                Date: currentDate,
                                createdAt : now,
                                updatedAt : now,
                            });
                            file.save().then(() => {
                                let log = new db.Models.Log({
                                    Info: "Comprovante de análise diário salvo com sucesso no banco de dados.",
                                    createdAt : now,
                                    updatedAt : now,
                                });
                                log.save();
                            });
                            cmd.run("curl -k " + hotranFile + " --output " + settings.paths.hotran, { onDone: () => {
                                var stream = fs.createReadStream(settings.paths.hotran, 'utf8');
                                stream.pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true }))
                                .on('data', function (row) {    
                                    row = row.join(' ').trim().split(";");
                                    rows.push(row);
                                })
                                .on('end', function (data) {
                                    rows.splice(0, 2);
                                    let log = new db.Models.Log({
                                        Info: "Iniciou o processo de análise de dados.",
                                        createdAt : now,
                                        updatedAt : now,
                                    });
                                    log.save().then(() => {
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
                                            let log = new db.Models.Log({
                                                Info: rowsCount + " dados salvos de um total de "+ rows.length + " analisados.",
                                                createdAt : now,
                                                updatedAt : now,
                                            });
                                            log.save().then(() => {
                                                //console.log("Encerrou :).");
                                            });
                                        });
                                    });
                                })
                            }});
                        });
                    }
                }});                
            }
            else
            {
                /*let log = new db.Models.Log({
                    Info: "A tabela de hotrans de hoje já foi analisada.",
                    createdAt : now,
                    updatedAt : now,
                });
                log.save();*/
            }
        });
    });
});