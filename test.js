require("dotenv").config();
var fs = require("fs");
var file = __dirname + "/files/hotran.csv";
var db = require("./database.js");

db.Models.Hotran.findOne({where: {CodHotran: "VIP-000000011"}}).then(qHotran => {
    if( qHotran.)
    console.log(qHotran);
    process.exit(1);
});