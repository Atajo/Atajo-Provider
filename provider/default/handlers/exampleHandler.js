require('../provider/lib/atajo.fork').init({


    req: function(obj, cb, dbi, api) {


        obj.RESPONSE = '123456';
        cb(obj);


    }



});