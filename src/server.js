var net = require('net');
var common = require("./common")();
var user = require("./userFunctions");
var item = require("./itemFunctions");

var server = net.createServer(function(socket){
	console.log("Client connected");
	socket.setEncoding('utf8');

	var allData = "";

	socket.on("data", function(data){
		allData += data;
		if(data.indexOf(common.END) > -1)
		{
			processInput(allData, socket);
			allData = "";
		}
	});

	socket.on("end", function(){
		console.log("Client left :(");
	});
});

server.listen(8888, "0.0.0.0");

var processInput = function(data, socket){
	data = data.substring(0, data.length - (data.length - data.indexOf(common.END)) + 1);
	var isHttp = false;
	
	//Check if we have a post request.
	if(data.substring(0,4).indexOf("POST") > -1)
	{
		isHttp = true;

		//check if we have windows line common.ENDings or unix
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

		if(common.checkValue(json.operation) == null)
		{
			response.success = false;
			response.message = "The 'operation' field is required";
			//common.returnJsonResponse(isHttp, socket, response, common.HttpCode.OK);
		}
		else if(common.checkValue(json.data) == null)
		{
			response.success = false;
			response.message = "'data' is required";
			// common.returnJsonResponse(isHttp, socket, {
			// 	success: false,
			// 	message: "'data' is required."
			// }, common.HttpCode.OK);
		}
		else if (json.operation.indexOf("user_") > -1 && isHttp)
		{
			if(json.operation == "user_basic")
			{
				user.viewbasic(json.data, isHttp, socket);
			}
			else if(json.operation == "user_all")
			{
				user.viewall(json.data, isHttp, socket);
			}
			else if(json.operation == "user_create" || json.operation == "user_add")
			{
				user.create(json.data, isHttp, socket);
			}
			else if(json.operation == "user_update")
			{
				user.update(json.data, isHttp, socket);
			}
			else
			{
				response.success = false;
				response.message = "Function not available";
			}

		}
		else if (json.operation.indexOf("item_") > -1 && isHttp)
		{
			if (json.operation == "item_all")
			{
				item.viewall(json.data, isHttp, socket);
			}
			else
			{
				response.success = false;
				response.message = "Function not available";
			}
		}
		else
		{
			response.success = false;
			response.message = "Invalid operation '"+json.operation+"'";
		}

		if (!response.success) 
		{
			common.returnJsonResponse(isHttp, socket, response, common.HttpCode.OK);
		}
		// else if(json.operation.indexOf("user_") > -1 && !isHttp)
		// {
		// 	common.returnJsonResponse(isHttp, socket, {
		// 		success: false, 
		// 		message: "Function not available."
		// 	}, common.HttpCode.OK);
		// }
		// else if(json.operation == "user_basic")
		// {
		// 	user.viewbasic(json.data, isHttp, socket);
		// }else if(json.operation == "user_all")
		// {
		// 	user.viewall(json.data, isHttp, socket);
		// }else if(json.operation == "user_create")
		// {
		// 	user.create(json.data, isHttp, socket);
		// }else if(json.operation == "user_update")
		// {
		// 	user.update(json.data, isHttp, socket);
		// }
		// else
		// {
		// 	response.success = false;
		// 	response.message = "Invalid operation '"+json.operation+"'";
		// 	common.returnJsonResponse(isHttp, socket, response, common.HttpCode.OK);
		// }
	}catch(e)
	{
		//invlaid json
		console.error("Invalid JSON");
		console.error(data);
		console.error(e);
		var json = {success: false, message: "Invalid Json"};
		//scommon.END Response
		common.returnJsonResponse(isHttp, socket, json, common.HttpCode.OK);
	}
}

