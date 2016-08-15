var _log = require('../provider/lib/log');
var request = require('../provider/node_modules/request');

exports.req = function(obj, cb) {


	_log.d("PUSH HANDLER " + JSON.stringify(obj));
	

	var pushObj = { "type" : "push",
					"addr" : obj.user,
					"payload" : 
					{ 
						"message" : obj.message,
						"data" : obj.data
					}
	};

	var options = {
		uri: 'http://dev-2-0.core.atajo.co.za:80/message',
		method: 'POST',
		json: pushObj
	};

	request(options,function(error,response,body)
	{
		_log.d("Body " + body);
		obj.RESPONSE = body;
		cb(obj);
		return;
	});
}
