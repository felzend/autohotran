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

var now = currentTime();
var rowsCount = 0;
var rows = [];
var currentDate = now.format("YYYY-MM-DD");
var hotranFile = settings.paths.hotranFile;
var hotranIndex = settings.paths.hotransIndex;

console.log("Iniciando...");

var stream = fs.createReadStream(settings.paths.hotran, 'utf8');
stream.pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true }))
.on('data', function (row) {    
    row = row.join(' ').trim().split(";");
    rows.push(row);
})
.on('end', function (data) {
    console.log("Iniciando Análise...");
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
                ++rowsCount;
                console.log(rowsCount, "dados de um total de", rows.length);
                process.nextTick(callback);
            }
            else
            {
                process.nextTick(callback);
            }
        })
    }, () => {
        console.log(rowsCount, "novos dados salvos.");
    });
})