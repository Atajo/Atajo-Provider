
var request = require('request');
var _log    = require('../../lib/log');

var https =
{

      post : function(url, json, cb) {

        request({
            url     : 'https://'+url,
            method  : "POST",
            json    : true,
            headers : { },
            json    : json
        },
        function (error, response, body) {
                if (!error && response.statusCode === 200) {

                    _log.d("HTTPS -> RESPONSE OK : "+JSON.stringify(body));
                    cb(body);

                }
                else
                {
                    _log.e("HTTPS -> ERROR : "+error);
                    _log.e("response.statusCode: " + response.statusCode)
                    _log.e("response.statusText: " + response.statusText)
                    cb(false);
                }
        });



      },


}


module.exports = https;
