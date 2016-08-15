var _log = require('../provider/lib/log');


exports.req = function(obj, cb) {


   // obj.RESPONSE = { data : new Date().getTime()};
   // _log.d("RUN DATEHANDLER " + JSON.stringify(obj));
   // cb(obj);
   
   date  = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');

   obj.RESPONSE = [{key : 'key' , date : date }];
   _log.d("RUN EXAMPLEHANDLER " + JSON.stringify(obj));
   cb(obj);

}
