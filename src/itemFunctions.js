// Q.all([
// 	this.queryForCost(data.item_id),
// 	//queryForPoints()
// 	]).then(function(results) {
// 		// costResult will be the first row returned from the cost
// 		var costResult = common.checkValue(results[0][0][0])  // last [0] for 1st row only. Gives array even if only 1 row returned


// 		// results[function - by order of array under all][all rows][ith returned row]
// 		var cost = null;

// 		if (costResult != null) {
// 			cost = costResult.cost;
// 		}
		
// 	});


// 	queryForCost: function(id) {
// 		var defered = Q.defer();
// 		common.connection.query(...., defered.makeNodeResolver());
// 		return defered.promise;
// 	}



// function a() {
// 	function b() {
// 		function c() {

// 		}
// 	}
// }

// ==

// Q.all([
// 	a(),
// 	b(),
// 	c()
// ]).then(function(results) {

// });





var common = require("./common.js")();
var user   = require("./userFunctions");
var machine = require("./machineFunctions");
var Q      = require("q");
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

		var query = "SELECT i.id, i.name, i.cost, i.calories, i.sugars, i.carbs, i.saturated_fat, i.trans_fat, i.protein, i.sodium, i.servings, m.stock";
			query += " FROM item AS i, item_vending_machine AS m";
			query += " WHERE m.vending_machine_id ='" + data.id + "'" + " AND i.id = m.item_id";
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

			// TODO //
			// Vend
				// Update stock count
				// Update user steps taken today

			// TODO - Vend here and perform below AFTER receive success message from vend

			machine.sockets[vendingItemInfo.identifier].queue.push("v"+vendingItemInfo.vend_id);

			machine.sockets[vendingItemInfo.identifier].onVendResponse = function(response){

				if(!response.success)
				{
					common.returnJsonResponse(socket, {
						success: false
					}, common.HttpCode.OK);
					return;
				}
				// Update stock count and update user steps taken today
				Q.allSettled([
					updateItemStockCount(vendingItemInfo.vending_machine_id, vendingItemInfo.item_id, vendingItemInfo.stock - 1),
					updateUser({id: user_id,
								steps_spent_today: userInfo.steps_spent_today + itemInfo.cost})
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
			common.connection.query("SELECT cost from item where id = '" + item_id + "'", deferred.makeNodeResolver());
			return deferred.promise;
		}

		function getVendingItemInfo(vending_machine_id, item_id) {
			var deferred = Q.defer();
			var query = "SELECT iv.id, iv.item_id, iv.vending_machine_id, iv.stock, v.identifier, i.vend_id FROM item_vending_machine iv INNER JOIN vending_machine v ON iv.vending_machine_id = v.id INNER JOIN item i ON i.id = iv.item_id WHERE vending_machine_id = '" + data.vending_machine_id + "' AND item_id = '" + data.item_id + "'";
			common.connection.query(query, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function updateItemStockCount(vending_machine_id, item_id, stock) {
			var deferred = Q.defer();
			var query = "UPDATE vendfit.item_vending_machine SET stock='" + stock + "' WHERE item_id='"+item_id+"' AND vending_machine_id='" + vending_machine_id + "'";
			common.connection.query(query, deferred.makeNodeResolver());
			return deferred.promise;
		}

		function updateUser(json) {
			var deferred = Q.defer();
			user.update(json, null, deferred.makeNodeResolver());
			return deferred.promise;
		}

	}  // End purchase() 

}
