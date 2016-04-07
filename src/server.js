var net = require('net');
var common = require("./common")();
var user = require("./userFunctions");
var item = require("./itemFunctions");
var machine = require("./machineFunctions");
var queue = require("fifo");

var server = net.createServer(function(socket){
	console.log("Client connected");
	socket.setEncoding('utf8');

	socket.isHttp = false;

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
		if(!socket.isHttp && socket.identifier != null)
		{
			console.log(socket.identifier + " disconnected.");
			machine.sockets[socket.identifier].disconnect = true;
		}
	});
});

var handleMachineSocket = function(socket, time){
	var currentTime = Math.floor(Date.now() / 1000);//current time in seconds
	if(common.checkValue(time) == null){
		time = currentTime;
	}

	var socketInfo = machine.sockets[socket.identifier];

	if(!socket.writable || socketInfo.disconnect)
	{
		socketInfo.disconnect = true;
		return;
	}

	if(!socketInfo.queue.isEmpty())
	{
		var cmd = socketInfo.queue.shift();
		if(cmd.indexOf("v") > -1 && socketInfo.waitingForVendResponse){
			console.log("Sending Vend Command: " + cmd + " to " + socket.identifier);
			socket.write(cmd+"\n");	
		}else if(cmd.indexOf("v") == -1){
			console.log("Sending: " + cmd + " to " + socket.identifier);
			socket.write(cmd+"\n");
		}
	}else if(currentTime - time > 10)//checkin time
	{
		socketInfo.queue.push("c");
		time = currentTime;
	}


	setTimeout(function(){
		handleMachineSocket(socket, time);
	}, 100)
}

var port = 8888;

server.listen(port, "0.0.0.0");

console.log("Server is running on "+port);

var processInput = function(data, socket){
	data = data.substring(0, data.length - (data.length - data.indexOf(common.END)) + 1);
	socket.isHttp = false;
	
	//Check if we have a post request.
	if(data.substring(0,4).indexOf("POST") > -1)
	{
		socket.isHttp = true;

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
		else if (json.operation.indexOf("user_") > -1 && socket.isHttp)
		{
			if(json.operation == "user_basic")
			{
				user.viewbasic(json.data, socket);
			}
			else if(json.operation == "user_all")
			{
				user.viewall(json.data, socket);
			}
			else if(json.operation == "user_create" || json.operation == "user_add")
			{
				user.create(json.data, socket);
			}
			else if(json.operation == "user_update")
			{
				user.update(json.data, socket);
			}
			else
			{
				response.success = false;
				response.message = "Function not available";
			}

		}
		else if (json.operation.indexOf("item_") > -1 && socket.isHttp)
		{
			if (json.operation == "item_all")
			{
				item.viewall(json.data, socket);
			}
			else if (json.operation == "item_purchase")
			{
				item.purchase(json.data, socket);
			}
			else
			{
				response.success = false;
				response.message = "Function not available";
			}
		}
		else if(json.operation.indexOf("machine_") > -1 && !socket.isHttp)
		{
			if(json.operation == "machine_registration")
			{
				if(json.data.identifier != null)
				{
					var socketInfo = common.checkValue(machine.sockets[json.data.identifier]);
					if(socketInfo == null)
					{
						socketInfo = {};
						socketInfo.queue = queue();
					}
					socket.identifier = json.data.identifier;
					socketInfo.socket = socket;
					socketInfo.disconnect = false;
					machine.sockets[socket.identifier] = socketInfo;
					handleMachineSocket(socket);
					machine.registration(json.data, socket);
				}
			}else if(json.operation == "machine_checkin")
			{
				if(common.checkValue(machine.sockets[socket.identifier]) == null){
					socket.write('r\n');//force the machine to register first
				}else{
					machine.checkin(json.data);
				}
			}else if(json.operation == "machine_vend_response"){
				machine.sockets[socket.identifier].onVendResponse(json.data);
			}
		}
		else
		{
			response.success = false;
			response.message = "Invalid operation '"+json.operation+"'";
		}

		if (!response.success) 
		{
			common.returnJsonResponse(socket, response, common.HttpCode.OK);
		}

	}catch(e)
	{
		//invlaid json
		console.error("Invalid JSON");
		console.error(data);
		console.error("ERROR:");
		console.error(e, e.stack.split("\n"));
		var json = {success: false, message: "Invalid Json"};
		//scommon.END Response
		common.returnJsonResponse(socket, json, common.HttpCode.OK);
	}
}

