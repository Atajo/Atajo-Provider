var clc = require('cli-color');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var stream = require('logrotate-stream');


module.exports = {

    CACHE: {},
    GLOBAL_LOG: false,

    ROTATE: {
        file: null,
        size: '100M',
        keep: 20,
        compress: true
    },


    init: function(tag, logFile) {
        var _ = this;


        if (!_.GLOBAL_LOG) {

            var logPath = path.join(__dirname, "../", "../", "logs");
            if (!fs.existsSync(logPath)) {
                fs.mkdirSync(logPath);
            }

            var globalLogPath = path.join(__dirname, "../", "../", "logs", "main.log");
            _.ROTATE.file = globalLogPath;
            _.GLOBAL_LOG = stream(_.ROTATE);

        }



        tag = (typeof tag != 'undefined') ? tag : 'MAIN';
        logFile = (typeof logFile != 'undefined') ? logFile : 'main.log';

        if (typeof _.CACHE[tag] != 'undefined') {
            return _.CACHE[tag];
        } else {

            _.CACHE[tag] = Object.create(_.WORKER);
            _.CACHE[tag].init(tag, logFile, _.GLOBAL_LOG);

            return _.CACHE[tag];

        }




    },

    WORKER: {

        TAG: '',
        FILE: null,
        LIM: 100000,

        ROTATE: {
            file: null,
            size: '100M',
            keep: 10,
            compress: true
        },


        init: function(tag, logFile, globalLog) {
            var _ = this;


            _.TAG = (typeof tag != 'undefined') ? tag : '';

            _.GLOBAL_LOG = globalLog;

            var logPath = path.join(__dirname, "../", "../", "logs", logFile);
            _.ROTATE.file = logPath;
            _.FILE = stream(_.ROTATE);

        },

        i: function(msg, tag) {
            var _ = this;
            _.log('info', msg, tag);
        },
        d: function(msg, tag) {
            var _ = this;
            _.log('debug', msg, tag);
        },
        w: function(msg, tag) {
            var _ = this;
            _.log('warn', msg, tag);
        },
        e: function(msg, tag) {
            var _ = this;
            _.log('error', msg, tag);
        },
        x: function(msg, tag) {
            var _ = this;
            _.log('important', msg, tag);
        },
        n: function(num) {
            var _ = this;
            _.space(num);
        },


        log: function(type, msg, tag) {

            var _ = this;

            if (msg === '') {
                _.write('', '');
                return;
            }

            if (!tag) {
                tag = _.TAG;
            }

            try {
                if (typeof msg === 'object') {
                    msg = JSON.stringify(msg);
                }

                msg = msg.substring(0, _.LIM);
            } catch (e) {
                msg = " RAW MESSAGE : " + msg;
            }


            var time = moment().format("DD-MM-YYYY H:mm:ss");

            var _msg = '';
            /*
						switch(type)
						{
							 case 'info'      : msg = clc.white(msg); break;
							 case 'debug'     : msg = clc.green(msg); break;
							 case 'warn'      : msg = clc.yellow(msg); break;
							 case 'error'     : msg = clc.red(msg); break;
							 case 'important' : msg = clc.red(msg); break;
							 default          : msg = clc.white(msg);
						}
					 */



            var spacer = (type.length == 4) ? '-' : '';
            tag = (tag === '') ? '' : '[' + tag + ']';
            msg = '[' + time + ']-' + tag + '-[' + type.toUpperCase() + ']-' + spacer + '-[ ' + msg;
            _.write(msg);

        },

        space: function(num) {
            var _ = this;
            if (!num) {
                _.write('', '');
                return;
            }
            for (var i in num) {
                _.write('', '');
            }

        },

        write: function(msg) {
            var _ = this;
            console.log(msg);
            //_.FILE.write(msg+'\r\n');
            _.GLOBAL_LOG.write(msg + '\r\n');
        }





    }




};