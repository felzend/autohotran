var page = require('webpage').create();
var moment = require('moment');
var fs = require('fs');
var settings = require("./settings");

page.open("http://www2.anac.gov.br/hotran/hotran_data.asp", function (status) {
	if( status === "success" ) {
		page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/3.0.0/jquery.min.js', function() {			
			page.evaluate(function() {
				//$("select").val(50747);
				$("input[alt=Consultar]").click();
			})
		});	
	}
});
page.onLoadFinished = function(status) {
	if( status === "success" && page.url == "http://www2.anac.gov.br/hotran/HOTRAN_data.asp" ) {
		fs.write(settings.datafile, page.content);
		page.close();
		phantom.exit();
		//page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/3.0.0/jquery.min.js', function() {			
			//var html = page.evaluate(function() {				
				/*var rows = $("table").find("tr:nth-child(n+4)");
				var hotran = [];
				for( var i = 0; i < rows.length; i++) {
					var row = rows[i];
					var codeshare = $(row).find("td:nth-child(25)").html().split('-').map(function(code) { 
						return code.trim(); 
					});
					var object = {
						cod_empresa: $(row).find("td:nth-child(1)").html().trim(),
						nome_empresa: $(row).find("td:nth-child(2)").html().trim(),
						voo: parseInt($(row).find("td:nth-child(3)").html().trim()),
						aeronave: $(row).find("td:nth-child(4)").html().trim(),
						dias: {
							segunda_feira: $(row).find("td:nth-child(5)").html().trim().length > 0,
							terca_feira: $(row).find("td:nth-child(6)").html().trim().length > 0,
							quarta_feira: $(row).find("td:nth-child(7)").html().trim().length > 0,
							quinta_feira: $(row).find("td:nth-child(8)").html().trim().length > 0,
							sexta_feira: $(row).find("td:nth-child(9)").html().trim().length > 0,
							sabado: $(row).find("td:nth-child(10)").html().trim().length > 0,
							domingo: $(row).find("td:nth-child(11)").html().trim().length > 0
						},
						assentos: parseInt($(row).find("td:nth-child(12)").html().trim()),
						cod_hotran: $(row).find("td:nth-child(13)").html().trim(),
						data_solicitacao: $(row).find("td:nth-child(14)").html().trim(),//.replace(/\//g, "-"),
						data_aprovacao: $(row).find("td:nth-child(15)").html().trim(),//.replace(/\//g, "-"),
						data_vigencia: $(row).find("td:nth-child(16)").html().trim(),//.replace(/\//g, "-"),
						tipo: $(row).find("td:nth-child(17)").html().trim(),
						etapa: parseInt($(row).find("td:nth-child(18)").html().trim()),
						cod_origem: $(row).find("td:nth-child(19)").html().trim(),
						aeroporto_origem: $(row).find("td:nth-child(20)").html().trim(),
						cod_destino: $(row).find("td:nth-child(21)").html().trim(),
						aeroporto_destino: $(row).find("td:nth-child(22)").html().trim(),
						horario_partida: $(row).find("td:nth-child(23)").html().trim(),
						horario_chegada: $(row).find("td:nth-child(24)").html().trim(),
						codeshare: codeshare,
						observacao: $(row).find("td:nth-child(26)").html().trim()
					}
					hotran.push( object );
				}
				return hotran;*/
			//});			
			/*var date = moment().format("DD/MM/YYYY HH:mm:ss");
			fs.write(settings.datafile, JSON.stringify(html));
			fs.write(settings.logfile, "["+date+"]: HOTRAN salvo com sucesso em txt.\n", "a");*/
			//phantom.exit();			
		//});
	}
}