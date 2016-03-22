var common = require("./common.js")();

module.exports = {

	sockets: {},

	registration: function(data){

		console.log(data);

		var query = "INSERT INTO vending_machine (identifier, last_checkin_date) ";
			query += "VALUES ('"+data.identifier+"', NOW()) ";
			query += "ON DUPLICATE KEY UPDATE last_checkin_date=NOW()";

		common.connection.query(query, function(err, result){
			if(err){
				console.error("Error registering vending machine");
				console.error(err);
			}else{
				console.log("Vending machine "+data.identifier+" registered");
			}
		});
	},

	checkin: function(data){
		console.log(data);
		common.connection.query("UPDATE vending_machine SET last_checkin_date=NOW() WHERE identifier='"+data.identifer+"'", function(err, result){
			if(err){
				console.error("Error with machine checkin");
				console.error(err);
			}else{
				console.log(data.identifier + " checked in.");
			}
		});

	}
}