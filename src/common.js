var mysql = require('mysql');
module.exports = function(){
	return {
		HttpCode: {
			OK: "200 OK"
		},

		END: "}<END>",

		connection: mysql.createConnection({
			host: "127.0.0.1",
			user: "root",
			password: "P@ssword1",
			database: "vendfit"
		}),

		returnJsonResponse: function(socket, json, status){
			var jsonString = JSON.stringify(json);

			console.log("Sending: ");
			console.log(jsonString);

			if(socket.isHttp)
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
		},

		checkValue: function(value, def)
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
	}
}