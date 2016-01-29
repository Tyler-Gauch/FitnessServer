var net = require('net');

var HttpCode = {
	OK: "200 OK"
}

var END = "}<END>";

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

	console.log(data);

	try
	{
		//attempt to parse the JSON
		JSON.parse(data);

		console.log("Received: ");
		console.log(data);

		if(isHttp)
		{
			returnHttpJsonResponse(socket, '{"result": "success"}', HttpCode.OK);
		}
	}catch(e)
	{
		//invlaid json
		console.log(e);
		var json = {result: "error", message: "Invalid Json"};
		
		//send httpResponse if it was an http response
		if(isHttp)
		{
			returnHttpJsonResponse(socket, JSON.stringify(json), HttpCode.OK);
		}else
		{
			socket.write(JSON.stringify(json));
		}
	}
}

var returnHttpJsonResponse = function(socket, json, status){
	socket.write("HTTP/1.1 " + status+ "\n");
	socket.write("Content-Type: application/json\n");
	socket.write("Content-Length: "+json.length+"\n");
	socket.write("\n");
	socket.write(json);
	socket.end();
}