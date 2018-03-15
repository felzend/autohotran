require("dotenv").config();

var db = require("./database");
var express = require("express");
var app = express();

app.set('view engine', 'ejs');
app.listen(3000, () => {
    console.log("Server started at :3000");
});

// --------------------------------------------------------- //

app.get("/", (req, res) => {    
    res.render("pages/index", {test: 25});
});

app.get("/hotrans/fetch", (req, res) => {
    var params = req.query;
    if(params.limit === undefined) params['limit'] = 100;
    db.Models.Hotran.findAll(params).then(hotrans => {
        res.setHeader("Content-Type", "application/json");
        res.send(hotrans);
    }); 
});