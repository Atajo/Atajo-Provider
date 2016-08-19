var _log = require('./log');

var fs = require('fs');
var path = require('path');


var hasResponded = false;


exports.init = function(handler) {

    process.on('message', function(request) {

        if (typeof request.request == 'undefined' || typeof request.request.pid == 'undefined') {
            _log.e("INVALID REQUEST -> DROPPING : " + JSON.stringify(request));
            process.exit(0);
        }

        //SET GLOBALS
        GLOBAL.RELEASE = (typeof request.release == 'undefined') ? 'DEV' : request.release;


        //PREP DBI

        require('../adapters/mongodb/adapter').init(function(dbi) {

            _log.d("HANDLER READY. PREPPING API");

            //PREP API
            api = {
                sendMessageToToken: function(token, msg) {
                    process.send({
                        type: 'API',
                        req: {
                            token: token,
                            msg: msg
                        }
                    });
                }
            }

            initWorker(request, handler, dbi, api);

        });



    });

}


function initWorker(request, handler, DBI, API) {

    var requestData = request.request;

    var WORKER = Object.create(handler);

    if (typeof WORKER.init == 'undefined') {
        try {
            WORKER.req(requestData, workerResult, DBI, API);
        } catch (e) {
            _log.e("HANDLER REQ ERROR -> " + e);
            process.exit(1);
        }

    } else {
        try {
            WORKER.init(requestData, workerResult, DBI, API).req();
        } catch (e) {
            _log.e("HANDLER INIT ERROR -> " + e);
            process.exit(1);
        }

    }


    //KILL HANDLER IF NO RESPONSE IS RECEIVED WITHIN 5 MINUTES
    setTimeout(function() {

        process.exit(1);

    }, 300000)


}




function workerResult(OBJ) {

    _log.d("GOT HANDLER RESULT");

    if (typeof OBJ.pid == 'undefined' || !OBJ.pid) {
        _log.e("HANDLER RESPONSE CONTAINS NO PID");
        return;
    }

    var _path = path.join(__dirname, '../', '../', 'cache', 'pids');
    if (!fs.existsSync(_path)) {
        fs.mkdirSync(_path);
    }

    var fnam = path.join(_path, OBJ.pid + '.json');
    var data = false;

    try {
        data = JSON.stringify(OBJ);
    } catch (e) {
        _log.e("COULD NOT STRINGIFY OBJ");
    }

    if (!data) {
        _log.e("NOT RESPONDING FOR " + fnam);
        process.exit(1);
    }

    fs.writeFile(fnam, data, function(err) {
        if (err) {
            _log.e("COULD NOT WRITE RESPONSE TO CACHE FOR " + fnam + " [ " + err + " ]");
            process.exit(1);
        }

        try {
            process.send({
                type: 'PID',
                pid: OBJ.pid
            });
        } catch (e) {
            _log.e("COULD NOT RESPOND TO PROVIDER -> " + e);

        }

        setTimeout(function() {
            process.exit(0);
        }, 5000);



    });





}