var net = require('net');
var mysql = require('mysql');

var HttpCode = {
	OK: "200 OK"
}

var END = "}<END>";

var connection = mysql.createConnection({
	host: "127.0.0.1",
	user: "root",
	password: "P@ssword1"
});

var server = net.createServer(function(socket){
	console.log("Client connected");
	socket.setEncoding('utf8');

	var allData = "";

	socket.on("data", function(data){
		allData += data;
		if(data.indexOf(END) > -1)
		{
			processInput(allData, socket);
			allData = "";
		}
	});

	socket.on("end", function(){
		console.log("Client left :(");
	});
});

server.listen(8888, "127.0.0.1");

var processInput = function(data, socket){
	data = data.substring(0, data.length - (data.length - data.indexOf(END)) + 1);
	var isHttp = false;
	
	//Check if we have a post request.
	if(data.substring(0,4).indexOf("POST") > -1)
	{
		isHttp = true;

		//check if we have windows line endings or unix
		//and extract the post body
		if(data.indexOf("\r\n\r\n") > -1)
		{
			data = data.substring(data.indexOf("\r\n\r\n"), data.length);
		}else
		{
			data = data.substring(data.indexOf("\n\n"), data.length);
		}
	}

	try
	{
		//attempt to parse the JSON
		var json = JSON.parse(data);

		console.log("Received: ");
		console.log(json);

		response = {success: true};

		if(checkValue(json.operation) == null)
		{
			response.success = false;
			response.message = "The 'operation' field is required";
			returnJsonResponse(isHttp, socket, response, HttpCode.OK);
		}
		else if(checkValue(json.data) == null)
		{
			returnJsonResponse(isHttp, socket, {
				success: false,
				message: "'data' is required."
			}, HttpCode.OK);
		}
		else if(json.operation.indexOf("user_") > -1 && !isHttp)
		{
			returnJsonResponse(isHttp, socket, {
				success: false, 
				message: "Function not available."
			}, HttpCode.OK);
			return;
		}
		else if(json.operation == "user_basic")
		{
			userBasic(json.data, isHttp, socket);
		}else if(json.operation == "user_all")
		{
			userAll(json.data, isHttp, socket);
		}else if(json.operation == "user_create")
		{
			userCreate(json.data, isHttp, socket);
		}else if(json.operation == "user_update")
		{
			userUpdate(json.data, isHttp, socket);
		}
		else
		{
			response.success = false;
			response.message = "Invalid operation '"+json.operation+"'";
			returnJsonResponse(isHttp, socket, response, HttpCode.OK);
		}
	}catch(e)
	{
		//invlaid json
		console.error("Invalid JSON");
		console.error(data);
		console.error(e);
		var json = {success: false, message: "Invalid Json"};
		
		//send httpResponse if it was an http response
		returnJsonResponse(isHttp, socket, json, HttpCode.OK);
	}
}

var returnJsonResponse = function(isHttp, socket, json, status){

	var jsonString = JSON.stringify(json);

	if(isHttp)
	{
		socket.write("HTTP/1.1 " + status+ "\n");
		socket.write("Content-Type: application/json\n");
		socket.write("Content-Length: "+jsonString.length+"\n");
		socket.write("\n");
		socket.write(jsonString);
		socket.end();
	}else
	{
		socket.write(jsonString);
	}
}

var checkValue = function(value, def)
{
	if(def == undefined)
	{
		def = null;
	}
	if(value == undefined)
	{
		return def;
	}

	return value;
}

var userBasic = function(data, isHttp, socket)
{
	if(checkValue(data.id) == null)
	{
		returnJsonResponse(isHttp, socket, {
			success: false, 
			message: "'data.id' is required"
		}, HttpCode.OK);
	}else{
		var query = "SELECT access_token, total_steps - steps_spent_today as current_balance";
			query += " FROM vendfit.user";
			query += " WHERE id='"+data.id+"'";
			query += " OR fitbit_id='"+data.id+"'";
		connection.query(query, function(err, result){
			if(err)
			{
				console.error("Mysql Error");
				console.error(err);
				returnJsonResponse(isHttp, socket, {
					success: false,
					message: "An Unkown error occured"
				}, HttpCode.OK);
			}else
			{
				console.log(result);
				returnJsonResponse(isHttp, socket, {
					success: true,
					data: result[0]
				}, HttpCode.OK);
			}
		});
	}
}

var userAll = function(data, isHttp, socket)
{
	if(checkValue(data.id) == null)
	{
		returnJsonResponse(isHttp, socket, {
			success: false, 
			message: "'data.id' is required"
		}, HttpCode.OK);
	}else{
		var query = "SELECT id, access_token, fitbit_id, total_steps, steps_spent_today, total_steps - steps_spent_today as current_balance";
			query += " FROM vendfit.user";
			query += " WHERE id='"+data.id+"'";
			query += " OR fitbit_id='"+data.id+"'";
		connection.query(query, function(err, result){
			if(err)
			{
				console.error("Mysql Error");
				console.error(err);
				returnJsonResponse(isHttp, socket, {
					success: false,
					message: "An Unkown error occured"
				}, HttpCode.OK);
			}else
			{
				console.log(result);
				if(checkValue(result[0]) == null)
				{
					returnJsonResponse(isHttp, socket, {
						success: false,
						message: "User with id '"+data.id+"' does not exist."
					}, HttpCode.OK);	
				}else
				{
					returnJsonResponse(isHttp, socket, {
						success: true,
						data: result[0]
					}, HttpCode.OK);
				}
			}
		});
	}
}

var userCreate = function(data, isHttp, socket)
{
	if(checkValue(data.fitbit_id) == null)
	{
		returnJsonResponse(isHttp, socket, {
			success: false, 
			message: "'data.fitbit_id' is required"
		}, HttpCode.OK);
	}else if(checkValue(data.access_token) == null)
	{
		returnJsonResponse(isHttp, socket, {
			success: false, 
			message: "'data.access_token' is required"
		}, HttpCode.OK);
	}else{
		data.total_steps = checkValue(data.total_steps, 0);
		data.steps_spent_today = checkValue(data.steps_spent_today, 0);
		var query = "INSERT INTO vendfit.user SET ?";
		connection.query(query, data, function(err, result){
			if(err)
			{
				console.error("Mysql Error");
				console.error(err);
				if(err.errno == 1062)
				{
					returnJsonResponse(isHttp, socket, {
						success: false,
						message: "User with fitbit_id '"+data.fitbit_id+"' already exists."
					}, HttpCode.OK);
				}else{
					returnJsonResponse(isHttp, socket, {
						success: false,
						message: "An unkown error occured"
					}, HttpCode.OK);
				}
				
			}else
			{
				console.log(result);
				returnJsonResponse(isHttp, socket, {
					success: true,
					data: {
						created_id: result.insertId
					}
				}, HttpCode.OK);
			}
		});
	}
}

var userUpdate = function(data, isHttp, socket)
{
	if(checkValue(data.id) == null)
	{
		returnJsonResponse(isHttp, socket, {
			success: false, 
			message: "'data.id' is required"
		}, HttpCode.OK);
	}else{
		var id = data.id;
		delete data.id;
		var query = "UPDATE vendfit.user SET ? WHERE id='"+id+"' OR fitbit_id='"+id+"'";
		connection.query(query, data, function(err, result){
			if(err)
			{
				console.error("Mysql Error");
				console.error(err);
				returnJsonResponse(isHttp, socket, {
					success: false,
					message: "An unkown error occured"
				}, HttpCode.OK);
			}else
			{
				console.log(result);
				returnJsonResponse(isHttp, socket, {
					success: true,
				}, HttpCode.OK);
			}
		});
	}
}