var common = require("./common.js")();

module.exports = {

	sockets: {},

	registration: function(data, socket){
		console.log("Running registration");
		console.log(data);

		var query = "INSERT INTO vending_machine (identifier, last_checkin_date) ";
			query += "VALUES ('"+data.identifier+"', NOW()) ";
			query += "ON DUPLICATE KEY UPDATE last_checkin_date=NOW()";

		common.connection.query(query, (function(err, result){
			console.log(result);
			if(err){
				console.error("Error registering vending machine");
				console.error(err);
			}else{
				console.log("Vending machine "+data.identifier+" registered");
				common.connection.query("SELECT iv.*, i.* FROM item_vending_machine iv INNER JOIN item i ON i.id=iv.item_id WHERE vending_machine_id="+result.insertId, (function(err2, result2){
					console.log(result2);
					if(err2){
						console.error("Error getting stock counts");
						console.error(err2);
					}else{
						console.log(result2);
						for(var i = 0; i < result2.length; i++)
						{
							var paddedStock = result2[i].stock;
							if(result2[i].stock < 10){
								paddedStock = "0"+paddedStock;
							}
							this.sockets[socket.identifier].queue.push("d"+result2[i].dispenser+result2[i].vend_id+paddedStock);
						}
					}
				}).bind(this));
			}
		}).bind(this));
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
