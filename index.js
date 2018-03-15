require("dotenv").config();

var fs = require("fs");
var async = require("async");
var cmd = require('node-run-cmd');

var db = require("./database.js");
var settings = require("./settings.js");

var files = [
    { url: "https://sistemas.anac.gov.br/sas/registros/Futuro/futuro.csv", output: settings.fileDir + "hotran.csv" }
];

if(!fs.existsSync(settings.fileDir)) 
{
    fs.mkdirSync(settings.fileDir);
}

async.eachLimit(files, 1, (file, callback) => {
    console.log("Fetching", file.url + "...");
    cmd.run("curl -k " + file.url + " --output " + file.output, { onDone: () => process.nextTick(callback) });
}, () => {
    console.log("Process is done.");
    process.exit(1);
});