exports.paths = {
    filesDir : __dirname + "/files",
    hotran : __dirname + "/files/hotran.csv",
    hotransIndex: "https://sistemas.anac.gov.br/sas/registros/Futuro/",
    hotranFile: "https://sistemas.anac.gov.br/sas/registros/Futuro/futuro.csv",
};
exports.indexUrl = "https://sistemas.anac.gov.br/sas/registros/Futuro/serie/";
exports.defaultTz = "America/Fortaleza";
exports.cronString = "* * * * *";