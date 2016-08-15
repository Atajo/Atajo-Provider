var _log = require('../provider/lib/log');


exports.req = function(obj, cb) {


   obj.RESPONSE = [
       { name : 'Peter', surname : "Parket", married : true , id:"1" },
       { name : 'Peter', surname : "Market", married : false , id:"2" },
       { name : 'Peter', surname : "Larket", married : true , id:"3" },
       { name : 'Peter', surname : "Sarket", married : false , id:"4" },
       { name : 'Peter', surname : "Warket", married : true , id:"5" }       
    ];
   _log.d("RUN EXAMPLEHANDLER " + JSON.stringify(obj));
   cb(obj);


}
