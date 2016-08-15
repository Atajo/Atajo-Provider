//var community = require('../adapters/community/adapter');
var _log = require('../provider/lib/log');


exports.req = function (obj, cb) {

		_log.d("RESET HANDLER CALLED: " + JSON.stringify(obj))
	    obj.RESPONSE = true;
		cb(obj);
		return;
}
