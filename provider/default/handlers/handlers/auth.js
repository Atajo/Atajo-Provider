//var community = require('../adapters/community/adapter');
var _log = require('../provider/lib/log');


exports.req = function (obj, cb) {

		_log.d("LOGIN AUTH HANDLER CALLED: " + JSON.stringify(obj))
	    obj.RESPONSE = true;
		cb(obj);
		return;

/*
		community.loginToken(obj.credentials.username, obj.credentials.password, function(token, response) {

				if (token) {

						obj.RESPONSE = token;
						obj.ROLES    = response.details.roles;

						//cb(token, response.details);

				} else {

					obj.RESPONSE = false;
					obj.ROLES    = [];

					//  cb(token);

				}

				cb(obj);

		});
*/
}
