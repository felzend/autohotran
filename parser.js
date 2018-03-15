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

        console.log("Fetching", file.url + "...");

        cmd.run("curl -k " + file.url + " --output " + file.output, { onDone: () => {            
            var stream = fs.createReadStream(file.output, 'utf8');

            stream.pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true }))
            .on('data', function (row) {    
                row = row.join(' ').trim().split(";"); 

                rows.push(row);
            })
            .on('end', function (data) {
                rows.splice(0, 2);
                
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

                    var obj = new db.Models.Hotran(newhotran);
                    obj.save().then(() => {
                        ++rowsCount;
                        console.log("salvou! (" + rowsCount + "/" + rows.length + ").");                        
                        process.nextTick(callback);
                    }).catch(err => {
                        if(err) {
                            console.log("Erro ao salvar no banco de dados.");
                            throw err;
                            process.exit(1);
                        }
                    });                    
                }, () => {
                    process.nextTick(callback);
                });
            });

        }});
    
    }, () => {
        process.exit(1);
    });
});