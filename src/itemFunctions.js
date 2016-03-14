var common = require("./common.js")();

module.exports = {
	viewall: function(data, isHttp, socket)
	{
		if(common.checkValue(data.id) == null)
		{
			common.returnJsonResponse(isHttp, socket, {
				success: false, 
				message: "'data.id' is required for the vending machine ID"
			}, common.HttpCode.OK);
		}else{
			var query = "SELECT i.id, i.name, i.cost, i.calories, i.sugars, i.carbs, i.saturated_fat, i.trans_fat, i.protein, i.sodium, i.servings, m.stock";
				query += " FROM item AS i, item_vending_machine AS m";
				query += " WHERE m.vending_machine_id ='" + data.id + "'" + " AND i.id = m.item_id";
			common.connection.query(query, function(err, result){
				if(err)
				{
					console.error("Mysql Error");
					console.error(err);
					common.returnJsonResponse(isHttp, socket, {
						success: false,
						message: "Error occured: " + err
					}, common.HttpCode.OK);
				}else
				{
					console.log(result);
					if(common.checkValue(result[0]) == null)
					{
						common.returnJsonResponse(isHttp, socket, {
							success: false,
							message: "Vending machine with id '"+data.id+"' does not exist."
						}, common.HttpCode.OK);	
					}else
					{
						common.returnJsonResponse(isHttp, socket, {
							success: true,
							data: result
						}, common.HttpCode.OK);
					}
				}
			});
		}

	}
}