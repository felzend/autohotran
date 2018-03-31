require("dotenv").config();

var db = require("./database");
var moment = require('moment-timezone');
var express = require("express");
var app = express();
var settings = require("./settings.js");

app.set('port', 4000);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + "/public"));
app.listen(app.get('port'), () => {
    console.log("Server started at :3000");
});

// --------------------------------------------------------- //

app.get("/", (req, res) => {
    db.Models.File.findOne({order:[['createdAt', 'DESC']]}).then(result => {
        var lastUpdate = ( result == null ) ? "Nunca" : moment(result.createdAt).format('DD/MM/YYYY - HH:mm:ss');
        var currentYear = moment().tz(settings.defaultTz).format("YYYY");
        db.Models.Hotran.count().then(hotransCount => {
            res.render("pages/index", { lastUpdate: lastUpdate, hotransCount: hotransCount, currentYear: currentYear });
        });
    });
});

app.get("/hotrans/fetch", (req, res) => {
    var params = req.query;
    if(params.limit === undefined) params['limit'] = 100;
    db.Models.Hotran.findAll(params).then(hotrans => {
        res.setHeader("Content-Type", "application/json");
        res.send(hotrans);
    }); 
});