require('../provider/lib/atajo.fork').init({


    req: function(obj, cb, dbi, api) {

		//DO CREDENTIAL VALIDATION ON obj.credentials
		atajo.log.d("CREDENTIALS ARE : "+JSON.stringify(obj.credentials)); 


        obj.RESPONSE = 'AUTH_TOKEN';
        cb(obj);


    }



});