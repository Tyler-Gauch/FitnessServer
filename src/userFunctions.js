var common = require("./common.js")();

module.exports = {
	viewbasic: function(data, isHttp, socket, callback)
	{
		if(common.checkValue(data.id) == null)
		{

			var err = "'data.id' is required";

			if (callback) {
				callback(err, null);
				return;
			}

			common.returnJsonResponse(isHttp, socket, {
				success: false,
				message: err
			}, common.HttpCode.OK);
		}else{
			var query = "SELECT access_token, total_steps - steps_spent_today as current_balance";
				query += " FROM vendfit.user";
				query += " WHERE fitbit_id='" + data.id + "'";

			if (typeof(data.id) == 'number') {
				query += "OR id='" + id +"'";
			} 

			if (callback) {
				common.connection.query(query, callback);
				return;
			}

			common.connection.query(query, function(err, result){
				if(err)
				{
					console.error("Mysql Error");
					console.error(err);

					common.returnJsonResponse(isHttp, socket, {
						success: false,
						message: "An Unkown error occured"
					}, common.HttpCode.OK);
				}else
				{
					common.returnJsonResponse(isHttp, socket, {
						success: true,
						data: result[0]
					}, common.HttpCode.OK);
				}
			});
		}
	},

	viewall: function(data, isHttp, socket, callback)
	{
		if(common.checkValue(data.id) == null)
		{
			var err = "'data.id' is required";

			if (callback) {
				callback(err, null);
				return;
			}

			common.returnJsonResponse(isHttp, socket, {
				success: false, 
				message: err
			}, common.HttpCode.OK);
		}else{
			var query = "SELECT id, access_token, fitbit_id, total_steps, steps_spent_today, total_steps - steps_spent_today as current_balance";
				query += " FROM vendfit.user";
				query += " WHERE fitbit_id='" + data.id + "'";

			if (typeof(data.id) == 'number') {
				query += "OR id='" + id +"'";
			} 

			if (callback) {
				common.connection.query(query, callback);
				return;
			}

			common.connection.query(query, function(err, result){
				if(err)
				{
					console.error("Mysql Error");
					console.error(err);
					common.returnJsonResponse(isHttp, socket, {
						success: false,
						message: "An Unkown error occured"
					}, common.HttpCode.OK);
				}else
				{
					console.log(result);
					if(common.checkValue(result[0]) == null)
					{
						common.returnJsonResponse(isHttp, socket, {
							success: false,
							message: "User with id '"+data.id+"' does not exist."
						}, common.HttpCode.OK);	
					}else
					{
						common.returnJsonResponse(isHttp, socket, {
							success: true,
							data: result[0]
						}, common.HttpCode.OK);
					}
				}
			});
		}
	},

	create: function(data, isHttp, socket)
	{
		if(common.checkValue(data.fitbit_id) == null)
		{
			common.returnJsonResponse(isHttp, socket, {
				success: false, 
				message: "'data.fitbit_id' is required"
			}, common.HttpCode.OK);
		}else if(common.checkValue(data.access_token) == null)
		{
			common.returnJsonResponse(isHttp, socket, {
				success: false, 
				message: "'data.access_token' is required"
			}, common.HttpCode.OK);
		}else{
			data.total_steps = common.checkValue(data.total_steps, 0);
			data.steps_spent_today = common.checkValue(data.steps_spent_today, 0);
			var query = "INSERT INTO vendfit.user SET ?";
			common.connection.query(query, data, function(err, result){
				if(err)
				{
					console.error("Mysql Error");
					console.error(err);
					if(err.errno == 1062)
					{
						common.returnJsonResponse(isHttp, socket, {
							success: false,
							message: "User with fitbit_id '"+data.fitbit_id+"' already exists."
						}, common.HttpCode.OK);
					}else{
						common.returnJsonResponse(isHttp, socket, {
							success: false,
							message: "An unkown error occured"
						}, common.HttpCode.OK);
					}
					
				}else
				{
					console.log(result);
					common.returnJsonResponse(isHttp, socket, {
						success: true,
						data: {
							created_id: result.insertId
						}
					}, common.HttpCode.OK);
				}
			});
		}
	},

	update: function(data, isHttp, socket, callback)
	{
		if(common.checkValue(data.id) == null)
		{
			var err = "'data.id' is required";

			if (callback) {
				callback(err, null);
				return;
			}

			common.returnJsonResponse(isHttp, socket, {
				success: false, 
				message: err
			}, common.HttpCode.OK);
		}else{
			var id = data.id;
			delete data.id;
			if (typeof(id) == 'number') {
				var query = "UPDATE vendfit.user SET ? WHERE id='"+id+"' OR fitbit_id='"+id+"'";
			} else {
				var query = "UPDATE vendfit.user SET ? WHERE fitbit_id='"+id+"'";
			}

			if (callback) {
				common.connection.query(query, data, callback);
				return;
			}

			common.connection.query(query, data, function(err, result){
				if(err)
				{
					console.error("Mysql Error");
					console.error(err);
					common.returnJsonResponse(isHttp, socket, {
						success: false,
						message: "An unkown error occured"
					}, common.HttpCode.OK);
				}else
				{
					console.log(result);
					common.returnJsonResponse(isHttp, socket, {
						success: true,
					}, common.HttpCode.OK);
				}
			});
		}
	}

}