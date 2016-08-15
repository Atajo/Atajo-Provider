var _log = require('../provider/lib/log');

exports.req = function(obj, cb) {
   
   	_log.d("OBJ: " + JSON.stringify(obj));

   	if(obj.data.code == -1)
   	{
   		_log.d("handler let timeout");

   		cb(obj);
   		
   		return;

   	}

   	_log.d("handler send response");
	// "data":{"code":1,"req":"req","res":"res","msg":"msg"}
	result = { req : obj.data.req, res : obj.data.res, msg : obj.data.msg  };

    obj.RESPONSE = { jobID:obj.jobID, statusCode:obj.data.code, result:result};

    _log.d("handler send response " + JSON.stringify(obj.RESPONSE));

	cb(obj);
}