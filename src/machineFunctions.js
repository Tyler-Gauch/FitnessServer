var common = require("./common.js")();

module.exports = {

	registration: function(data, socket){

		data.last_checkin_date = new Date();

		query = "INSERT INTO vending_machine (identifer, last_checkin_date) SET ?";
		common.connection.query(query, data, function(err, result){
			if(err){
				console.error("Error registering vending machine");
				console.error(err);
			}else{
				console.log("Vending machine "+socket.identifier+" registered");
			}
		});
	},

	checkin: function(data, socket){

		var params= {
			last_checkin_date: new Date()
		};

		common.connection.query("UPDATE vending_machine SET last_checkin_date=NOW() WHERE identifer='"+data.identifer+"'", function(err, result){
			if(err){
				console.error("Error with machine checkin");
				console.error(err);
			}else{
				console.log(data.identifer + " checked in.");
			}
		});

	}

}