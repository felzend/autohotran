var fs = require("fs");
var file = __dirname + "/files/hotran.csv";
var db = [];

var CsvReader = require('csv-reader');
var inputStream = fs.createReadStream(file, 'utf8');

inputStream
    .pipe(CsvReader({ parseNumbers: true, parseBooleans: true, trim: true }))
    .on('data', function (row) {
        //console.log(row.length);
        row = row.join(' ').trim().split(";");
        db.push(row);        

        //db.push(row.split(";"));
    })
    .on('end', function (data) {
        db.splice(0, 2);
        console.log(db[0].length);
    });
 