var net = require('net');

var server = net.createServer(function(socket){
	console.log("Client connected");
	socket.setEncoding('utf8');
	socket.on("data", function(data){
		console.log("Client Sent data: ");
		console.log(data);
	});
});

server.listen(8888, "127.0.0.1");

