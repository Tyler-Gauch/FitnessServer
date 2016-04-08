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
			dateStrings: "date",
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
		},

		getDate: function(userID) { // Get the current date in yyyy-mm-dd format based on the user's timezone offset

			// First, get the offset
			if (typeof(userID.id) == 'number') {
				var query = "SELECT timezone_offset FROM user WHERE id="+id+" OR fitbit_id='" + id + "'";
			} else {
				var query = "SELECT timezone_offset FROM user WHERE fitbit_id='" + id + "'";
			}

			common.connection.query(query, (function(err, result) {
				var today = new Date();
				if(err)
				{
					// Send back the current system date
					console.error("Mysql Error");
					console.error(err);
				} else {
					// Modify 'today' based on the offset value
					var systemTime = today.getTime();
					var systemOffset = today.getTimezoneOffset() * 60000; // offset in milliseconds
					var systemUTC = systemTime + systemOffset;

					var userOffset = result[0].timezone_offset * 60000; // offset in milliseconds
					today = new Date(systemUTC + userOffset);
				}
			}
		    
		    var dd = today.getDate();
		    var mm = today.getMonth() + 1; // January is 0

		    var yyyy = today.getFullYear();

		    if (dd < 10) {
		        dd = '0' + dd;
		    }
		    if (mm < 10) {
		        mm = '0' + mm;
		    }

		    return yyyy + '-' + mm + '-' + dd;
		}
	}
}