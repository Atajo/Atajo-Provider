
var clc = require('cli-color');
var moment = require('moment');
var fs  = require('fs');
var path = require('path');

var logPath = path.join(__dirname, '../', '../', 'logs');
var logFile = path.join(__dirname, '../', '../', 'logs', 'provider.log');

if (!fs.existsSync(logPath)) {
   fs.mkdirSync(logPath);
}

if (!fs.existsSync(logFile)) {
   fs.writeFileSync(logFile);
}

logFile = fs.createWriteStream(logFile, {'flags': 'a'});

exports.i = function(msg, tag) { __log.log('info', msg, tag);  };
exports.d = function(msg, tag) { __log.log('debug', msg, tag);  };
exports.w = function(msg, tag) { __log.log('warn', msg, tag);  };
exports.e = function(msg, tag) { __log.log('error', msg, tag);  };
exports.n = function(num) {  __log.space(num); };

__log = {

	charLim : 500000,

	log : function(type, msg, tag)
	 {

	 	   if(msg === '')
         {
         	__log.write('', ''); return;
         }
         if(!tag) { tag = 'GENERAL'; }

         var time = moment().format("DD-MM-YYYY @ H:mm:ss"); // "Sunday, February 14th 2010, 3:25:50 pm"

         var _msg = '';
         switch(type)
         {
            case 'info'  : _msg = clc.white(msg); break;
            case 'debug' : _msg = clc.green(msg); break;
            case 'warn'  : _msg = clc.yellow(msg); break;
            case 'error' : _msg = clc.red(msg); break;
            default      : _msg = clc.white(msg);
         }



									if(type == 'info') { spacer = '-'; } else { spacer = ''; }

                      _msg = '['+time+']--['+type.toUpperCase()+']-'+spacer+'-[ '+_msg;
                      msg  = '['+time+']--['+type.toUpperCase()+']-'+spacer+'-[ '+msg;



           __log.write(_msg, msg);

	 },

	 space : function(num)
	 {
	 	if(!num) { __log.write('', ''); return; }
	 	for(var i in num)
	 	 {
	 	 	__log.write('', '');
	 	 }

	 },

	 write : function(_msg, msg)
	 {

  if(typeof msg.substring != 'undefined') { console.log(_msg.substring(0,__log.charLim));  }
               else { console.log(_msg);  }


	 	logFile.write(msg+'\r\n');
	 }

}
