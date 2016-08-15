var _log = require('../provider/lib/log');


exports.req = function(obj, cb) {


   _log.d("RUN API Handler " + JSON.stringify(obj));
   obj.RESPONSE = obj.data;
   cb(obj);

}
