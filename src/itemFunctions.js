var common  = require("./common.js")();
var user    = require("./userFunctions");
var machine = require("./machineFunctions");
var Q       = require("q");
var Client  = require('node-rest-client').Client;

module.exports = {
	viewall: function(data, socket)
	{
		if(common.checkValue(data.id) == null)
		{
			common.returnJsonResponse(socket, {
				success: false, 
				message: "'data.id' is required for the vending machine ID"
			}, common.HttpCode.OK);
			return;
		}

		var query = "SELECT i.id, i.name, i.cost, i.calories, i.sugars, i.carbs, i.saturated_fat, i.trans_fat, i.protein, i.sodium, i.servings, i.pic, SUM(m.stock) as stock";
			query += " FROM item AS i, item_vending_machine AS m";
			query += " WHERE m.vending_machine_id ='" + data.id + "'" + " AND i.id = m.item_id";
			query += " GROUP BY m.item_id;";
		common.connection.query(query, function(err, result){
			if(err)
			{
				console.error("Mysql Error");
				console.error(err);
				common.returnJsonResponse(socket, {
					success: false,
					message: "Error occured: " + err
				}, common.HttpCode.OK);
			}
			else
			{
				console.log(result);
				if(common.checkValue(result[0]) == null)
				{
					common.returnJsonResponse(socket, {
						success: false,
						message: "Vending machine with id '"+data.id+"' does not exist."
					}, common.HttpCode.OK);	
				}
				else
				{
					common.returnJsonResponse(socket, {
						success: true,
						data: result
					}, common.HttpCode.OK);
				}
			}
		});

	},

	purchase: function(data, socket) 
	{
		console.log(data);
		var user_id = null;

		if (common.checkValue(data.user_id) != null) {
			user_id = data.user_id;
		} else if (common.checkValue(data.fitbit_id) != null) {
			user_id = data.fitbit_id;
		}

		if (common.checkValue(data.item_id) == null || 
			common.checkValue(data.vending_machine_id) == null ||
			user_id == null)
		{
			common.returnJsonResponse(socket, {
				success: false,
				message: "'data.item_id', 'data.vending_machine_id', and ('data.fitbit_id' OR 'data.user_id') are required to make a purchase"
			}, common.HttpCode.OK);
			return;
		} 

		console.log("1");

		// Check to ensure user has enough balance to make purchase
		// Get the cost of desired item
		// Check to make sure item is in stock in desired vending machine
			// Vend
				// Update stock count
				// Update user steps taken today
		Q.allSettled([
			getUserInfo(user_id),
			getItemCost(data.item_id),
			getVendingItemInfo(data.vending_machine_id, data.item_id)
		]).then(function (results) {
			console.log("2");
			results.forEach(function (result) {
				if (result.state === "fulfilled") {
					console.log("\n\n----------------------------------------\nFulfilled:\n" + JSON.stringify(result.value) + "\n----------------------------------------");
				} else {
					console.log("\n\n----------------------------------------\nRejected reason: " + result.reason + "\n----------------------------------------");
					// If anything is rejected, send the error response back to the client and return
					common.returnJsonResponse(socket, {
						success: false,
						message: result.reason
					}, common.HttpCode.OK);
					return;
				}
			});


			// results[0] contains {id, access_token, fitbit_id, total_steps, steps_spent_today, current_balance} at results[0][0][0]
			// results[1] contains {cost} at results[1][0][0]
			// results[2] contains {id, item_id, vending_machine_id, stock} at results[2][0][0]

			var userInfo = results[0].value[0][0];
			var itemInfo = results[1].value[0][0];
			var vendingItemInfo = results[2].value[0][0];

			// Now we have all of the info to perform the below...

			// Check if user has enough balance to make purchase
			if (userInfo.current_balance < itemInfo.cost) {
				console.log("Not enough points");
				common.returnJsonResponse(socket, {
					success: false,
					message: "Not enough points for purchase. User has " + userInfo.current_balance + " points and needs " + itemInfo.cost + " points for purchase"
				}, common.HttpCode.OK);
				return;
			}

			// Check to make sure item is in stock in desired vending machine
			if (vendingItemInfo.stock < 1) {
				console.log("out of stock");
				common.returnJsonResponse(socket, {
					success: false,
					message: "Item id '" + data.item_id + "' is out of stock in vending machine '" + data.vending_machine_id + "'"
				}, common.HttpCode.OK);
				return;
			}


			
			// Vend then on response,
				// Update stock count
				// Update user steps taken today
			var socketInfo = common.checkValue(machine.sockets[vendingItemInfo.identifier]);
			if(socketInfo == null || socketInfo.disconnect == true){
				console.log("vending machine not connected");
				common.returnJsonResponse(socket, {
					success: false,
					message: "Vending Machine is not connected"
				}, common.HttpCode.OK);
				return;
			}
	


			socketInfo.queue.push("v"+vendingItemInfo.dispenser);
			socketInfo.waitingForVendResponse = true;

			socketInfo.onVendResponse = function(response){

			socketInfo.waitingForVendResponse = false;

				if(!response.success)
				{
					common.returnJsonResponse(socket, {
						success: false
					}, common.HttpCode.OK);
					return;
				}
				// Update stock count and update user steps taken today
				// Update stock count and update user steps taken today

				//need the stock in a 000 format
				var paddedStock = vendingItemInfo.stock;
				if(vendingItemInfo.stock < 10){
					paddedStock = "0"+paddedStock;
				}
				socketInfo.queue.push("d"+vendingItemInfo.dispenser+vendingItemInfo.vend_id+paddedStock);
				Q.allSettled([
					updateItemStockCount(vendingItemInfo.id, vendingItemInfo.stock - 1),
					updateUser({id: user_id,
								steps_spent_today: userInfo.steps_spent_today + itemInfo.cost,
								date_updated: data.date_updated})
				]).then(function (results) {
					results.forEach(function (result) {
						if (result.state === "fulfilled") {
							console.log("\n\n----------------------------------------\nFulfilled:\n" + JSON.stringify(result.value) + "\n----------------------------------------");
						} else {
							console.log("\n\n----------------------------------------\nRejected reason: " + result.reason + "\n----------------------------------------");
							// If anything is rejected, send the error response back to the client and return
							common.returnJsonResponse(socket, {
								success: false,
								message: result.reason
							}, common.HttpCode.OK);
							return;
						}
					});


					/////////////////////////////////////////////////////////////
					// Add item to fitbit food log if desired
					/////////////////////////////////////////////////////////////
					if (common.checkValue(data.addToLog) == true) {
						console.log("Starting add to log process");
						getFoodUnitID(userInfo, data.item_id).then( function(foodData) {
							console.log("Returned with: ", foodData);
							addToFitbitLog(userInfo, itemInfo, foodData.unitType, foodData.defaultAmount, data.date_updated);
						}).done();
					}

					// If we made it here, everything was successful 
					common.returnJsonResponse(socket, {
						success: true
					}, common.HttpCode.OK);

				}).done();
			}
		}).done();

		function getUserInfo(user_id) {
			var deferred = Q.defer();
			user.viewall({id: user_id}, null, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function getItemCost(item_id) {
			var deferred = Q.defer();
			common.connection.query("SELECT * from item where id = '" + item_id + "'", deferred.makeNodeResolver());
			return deferred.promise;
		}

		function getVendingItemInfo(vending_machine_id, item_id) {
			var deferred = Q.defer();
			var query = "SELECT iv.id, iv.item_id, iv.vending_machine_id, iv.stock, v.identifier, i.vend_id, iv.dispenser FROM item_vending_machine iv INNER JOIN vending_machine v ON iv.vending_machine_id = v.id INNER JOIN item i ON i.id = iv.item_id WHERE vending_machine_id = '" + data.vending_machine_id + "' AND item_id = '" + data.item_id + "' GROUP BY iv.item_id ORDER BY iv.stock LIMIT 1";
			common.connection.query(query, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function updateItemStockCount(id, stock) {
			var deferred = Q.defer();
			var query = "UPDATE vendfit.item_vending_machine SET stock=" + stock + " WHERE id="+id;
			common.connection.query(query, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function updateUser(json) {
			console.log(json);
			var deferred = Q.defer();
			user.update(json, null, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function getFoodUnitID(userInfo, item_id) {
			console.log("Getting food id");
			var deferred = Q.defer();
			var client = new Client();
	        var fitbitUnitRequestURL = "https://api.fitbit.com/1/foods/" + item_id + ".json";

	        var args = {
				headers: {"Authorization": "Bearer " + userInfo.access_token} // request headers 
			};


			console.log("Sending args: ", args);
			client.get(fitbitUnitRequestURL, args, function(data, result) {
				var units = {
					unitType: data.food.defaultUnit.id,
					defaultAmount: data.food.defaultServingSize
				};
				console.log("has unit");
				console.log(units);
				deferred.resolve(units);  // fulfills the promise with 'units' as the value
			});
			return deferred.promise;
		}

		function addToFitbitLog(userInfo, itemInfo, unit_type, default_amount, date) {
			console.log("Adding to diary");
			var deferred = Q.defer();
			var client = new Client();
            var fitbitFoodLogRequestURL = "https://api.fitbit.com/1/user/" + userInfo.fitbit_id + "/foods/log.json";

            var args = {
            	parameters: { 
            		foodId: itemInfo.id,
                    mealTypeId: "7",
                    unitId: unit_type,
                    amount: default_amount * itemInfo.servings,
                    date: date 
                },
            	headers: {
            		"Content-Type": "application/json",
            		"Authorization": "Bearer " + userInfo.access_token} // request headers 
            };

		console.log("Sending fitbit log args:", args, fitbitFoodLogRequestURL);

            client.post(fitbitFoodLogRequestURL, args, function(data, result) {
		console.log("received", data);
		console.log(data.toString());
            	deferred.resolve(data);
            });
		}

	}  // End purchase() 

}
