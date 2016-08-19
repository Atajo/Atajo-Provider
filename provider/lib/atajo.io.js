//NPM
var os = require('os');
var fs = require('fs');
var path = require('path');
var io = require('socket.io-client');


_io = {

    VERSION: null,
    RELEASE: null,
    SOCKET: null,
    HOSTNAME: null,
    URI: null,
    CONFIG: null,
    HASH: null,
    KEYS: null,

    ISBUILDING: false,
    CONNECTED: false,

    RECONNECT_INT: null,
    RECONNECT_DELAY: 5000,


    init: function(RELEASE, URI) {
        var _ = this;


        //SET THE BASE PROVIDER RELEASE VERSION
        _.RELEASE = RELEASE;
        global.RELEASE = _.RELEASE;

        _.HOSTNAME = os.hostname();
        _.URI = URI;
        _.CONFIG = require('../../conf/config.json');
        _.KEYS = require('../../conf/keys.json');


        _.CONFIG.API_KEY = _.KEYS.API_KEY;
        _.CONFIG.CLIENT_KEY = _.KEYS.CLIENT_KEY;

        _.VERSION = _.CONFIG.VERSIONS[_.RELEASE];

        var OPTS = {
            reconnection: true,
            connect_timeout: 10000,
            query: 'UUID=' + _.HOSTNAME + '&KEY=' + _.CONFIG.API_KEY

        };


        //   setInterval(function() { _io.processRequestCache(); }, 1000);



        _.SOCKET = io.connect(URI, OPTS);

        //SOCKET HANDLERS
        _.SOCKET.removeAllListeners('connect_timeout');
        _.SOCKET.on('connect_timeout', function() {
            atajo.log.e("CONNECTION TIMEOUT");
        });

        _.SOCKET.removeAllListeners('reconnecting');
        _.SOCKET.on('reconnecting', function() {
            atajo.log.e("CONNECTION RECONNECTING");
        });

        _.SOCKET.removeAllListeners('reconnect_error');
        _.SOCKET.on('reconnect_error', function() {
            atajo.log.e("CONNECTION RECONNECT ERROR");
        });

        _.SOCKET.removeAllListeners('reconnect_failed');
        _.SOCKET.on('reconnect_failed', function() {
            atajo.log.e("CONNECTION RECONNECT FAILED");
        });


        _.SOCKET.removeAllListeners('connect');
        _.SOCKET.on('connect', function() {
            _io.processConnect();
        });

        _.SOCKET.removeAllListeners('disconnect');
        _.SOCKET.on('disconnect', function(reason) {
            _io.processDisconnect(reason);
        });


        //ECHO BASE HASH
        _.SOCKET.removeAllListeners('hash');
        _.SOCKET.on('hash', function() {
            _.SOCKET.emit('hash', HASH);
        });


        //CORE EVENTS (STUB);
        _.SOCKET.removeAllListeners('event');
        _.SOCKET.on('event', function(data) {
            atajo.log.i("CORE EVENT : " + JSON.stringify(data));
        });


        _.SOCKET.refreshBase = function() {
            var _ = _io;



            if (_.ISBUILDING) {
                atajo.log.w("ALREADY BUILDING. WILL TRY AGAIN IN 5 SECONDS")
                setTimeout(function() {
                    _.SOCKET.refreshBase();
                }, 5000);
                return;
            }

            _.ISBUILDING = true;


            //ADD IMG
            try {
                var icon = fs.readFileSync(path.join(__dirname, '../', 'img', 'icon.png'));
                icon = new Buffer(icon).toString('base64');
            } catch (e) {
                atajo.log.w("ICON FILE NOT FOUND");
                icon = '';
            }

            try {
                var logo = fs.readFileSync(path.join(__dirname, '../', 'img', 'logo.png'));
                logo = new Buffer(logo).toString('base64');
            } catch (e) {
                atajo.log.w("LOGO FILE NOT FOUND");
                logo = '';
            }




            _.HASH = atajo.build.hash(_.VERSION);

            //atajo.log.d("BASE HASH FOR "+_.VERSION.BASEVERSION+" IS "+_.HASH);


            atajo.build.build(_.VERSION, function(passed) {

                if (typeof passed == 'undefined') {
                    passed = true;
                }

                if (!passed) {
                    atajo.log.d("COULD NOT BUILD BASE. NOT UPLOADING TO CORE");
                    return;
                }

                //atajo.log.d("UPLOADING TO CORE");

                setTimeout(function() {

                    _.CONFIG.DEBUG = _.CONFIG.VERSIONS[RELEASE].DEBUG;
                    _.CONFIG.RELEASE = _.RELEASE;

                    _PROVIDER = {
                        HASH: _.HASH,
                        CONFIG: _.CONFIG,
                        LOGO: logo,
                        ICON: icon,
                        RELEASE: _.RELEASE,
                        HOSTNAME: _.HOSTNAME,
                        VERSION: _.VERSION,
                        DEBUG: _.CONFIG.VERSIONS[RELEASE].DEBUG,
                        PAYLOAD: {
                            js: fs.readFileSync(path.join(__dirname, '../', 'build', 'base-' + _.VERSION.BASEVERSION + '.js')),
                            css_large: fs.readFileSync(path.join(__dirname, '../', 'build', 'base-' + _.VERSION.BASEVERSION + '.large.css')),
                            css_small: fs.readFileSync(path.join(__dirname, '../', 'build', 'base-' + _.VERSION.BASEVERSION + '.small.css')),
                            html: fs.readFileSync(path.join(__dirname, '../', 'build', 'base-' + _.VERSION.BASEVERSION + '.html')),
                            img: fs.readFileSync(path.join(__dirname, '../', 'build', 'base-' + _.VERSION.BASEVERSION + '.img')),
                        }
                    };


                    atajo.log.i("                            RELEASE HASH FOR VERSION " + _.VERSION.BASEVERSION + " --[ " + _.HASH + " ]--> UPLOADING TO CORE");


                    //identify with core
                    _.SOCKET.emit('BASEPROVIDER', _PROVIDER);

                    _.ISBUILDING = false;

                    atajo.log.n();
                    atajo.log.i("<<<< WAITING FOR TRANSACTIONS >>>");
                    atajo.log.n();



                }, 1000);

            });


        };

        _.SOCKET.removeAllListeners('UNAUTHORIZED');
        _.SOCKET.on('UNAUTHORIZED', function(msg) {

            atajo.log.e("CONNECTION UNAUTHORIZED : " + msg);
            process.exit(1);

        });


        //AUTH CALL
        _.SOCKET.removeAllListeners('auth');
        _.SOCKET.on('auth', function(obj) {

            atajo.log.d("AUTH REQUEST : " + JSON.stringify(obj));

            obj = _.processLatency(obj);
            obj.responseEvent = "auth_RESPONSE";
            obj.compressResponse = false;

            _.initHandler('auth', obj);


        });

        // API REQUEST
        _.SOCKET.removeAllListeners('get');
        _.SOCKET.on('get', function(obj) {
            var _ = _io;

            //TODO : clear object...

            //log the request
            atajo.log.d("API GET (" + obj.handler + ") : " + JSON.stringify(obj));

            obj = _.processLatency(obj);
            obj.responseEvent = "req_RESPONSE";

            _.initHandler(obj.handler, obj);

        });


        //SYNC CALL
        _.SOCKET.removeAllListeners('req');
        _.SOCKET.on('ATAJO.SYNC.REQUEST', function(obj) {
            var _ = _io;

            //log the request
            atajo.log.d("SYNC REQUEST : " + JSON.stringify(obj));

            obj = _.processLatency(obj);
            obj.responseEvent = "ATAJO.SYNC.REQUEST.RESPONSE";
            obj.CHUNKED = true;

            //FIND THE HANDLER
            var service = obj.service;
            var handler = '';

            for (var i in _.CONFIG.SERVICES) {
                curr = _.CONFIG.SERVICES[i];

                if (curr.service == service) {
                    handler = curr.handler;
                }
            }


            _.initHandler(handler, obj);



        });


        _.SOCKET.removeAllListeners('req');
        _.SOCKET.on('ATAJO.SYNC.CHUNK', function(obj) {
            var _ = _io;

            //log the request
            atajo.log.d("SYNC CHUNK REQUEST : " + JSON.stringify(obj));

            obj = _.processLatency(obj);
            obj.responseEvent = "ATAJO.SYNC.CHUNK.RESPONSE";

            if (typeof obj.compressResponse == 'undefined') {
                obj.compressResponse = true;
            }


            var i = obj.chunkId || 0;

            var fnam = path.join(__dirname, '../', '../', 'cache', 'chunks', obj.pid + '.' + i + '.chunk');
            atajo.log.d("LOADING " + fnam);

            fs.readFile(fnam, 'utf8', function(err, data) {

                obj.RESPONSE = JSON.parse(data);
                _.SOCKET.emit(obj.responseEvent, (obj.compressResponse ? _squash.deflate(obj) : obj));


            });





        });




        // API CALL
        _.SOCKET.removeAllListeners('req');
        _.SOCKET.on('req', function(obj) {
            var _ = _io;


            //log the request
            atajo.log.d("API REQUEST : " + JSON.stringify(obj));

            obj = _.processLatency(obj);
            obj.responseEvent = "req_RESPONSE";


            //HANDLER (SYNC)
            if (obj.service != 'sendToQueue') {

                //FIND THE HANDLER
                var service = obj.service;
                var handler = '';

                for (var i in _.CONFIG.SERVICES) {
                    curr = _.CONFIG.SERVICES[i];

                    if (curr.service == service) {
                        handler = curr.handler;
                    }
                }


                _.initHandler(handler, obj);


            } else //JOB
            {

                //FIND THE HANDLER
                var action = obj.action;
                var handler = '';

                for (var i in _.CONFIG.ACTIONS) {
                    curr = _.CONFIG.ACTIONS[i];

                    if (curr.action == action) {
                        handler = curr.handler;
                    }
                }


                _.initHandler(handler, obj);



            }



        });


    },


    REQUEST_CACHE: {},

    initHandler: function(handlerName, obj) {
        var _ = this;


        obj = _.verifyRequest(obj);

        if (!obj) {
            atajo.log.e("INVALID REQUEST. DROPPING => " + JSON.stringify(obj));
            return;
        }

        var fnam = './handlers/' + handlerName + '.js';
        atajo.log.d("CHECKING HANDLER " + fnam);
        fs.exists(fnam, function(exists) {

            if (exists) {

                // obj.processStatus = "REQ";
                /*
                           atajo.log.d("REGISTERING PROCESS FOR "+fnam);
                           if(typeof _.REQUEST_CACHE[obj.pid] == 'undefined')
                           {
                              _.REQUEST_CACHE[obj.pid] = true;
                           }
                           else
                           {
                              atajo.log.e("DUPLICATE REQUEST FOR PID "+obj.pid+" => DROPPING");
                              return;
                           }
                */

                atajo.log.d("FORKING PROCESS FOR " + fnam);
                //spawn the process
                var fork = require('child_process').fork;
                HANDLER = fork(fnam);


                //GET RESPONSE FORM PROCESS

                HANDLER.on('message', function(msg) {

                    var _ = _io;

                    if (typeof msg.type == 'undefined') {
                        atajo.log.e("COULD NOT PROCESS HANDLER RESPONSE");
                    } else if (msg.type == 'API') {
                        _.processAPIRequest(msg.req);
                    } else if (msg.type == 'PID') {
                        _.processResponse(msg.pid);
                    } else {
                        atajo.log.d("HANDLER RESPONSE TYPE NOT RECOGNIZED");
                    }


                });


                //SEND REQUEST TO PROCESS
                HANDLER.send({
                    request: obj,
                    release: GLOBAL.RELEASE
                });


            } else {


                atajo.log.e("HANDLER NOT FOUND : " + fnam);

                obj.RESPONSE = false;
                obj = _.processLatency(obj, 'resp');

                if (typeof obj.compressResponse == 'undefined') {
                    obj.compressResponse = true;
                }

                _.SOCKET.emit(obj.responseEvent, (obj.compressResponse ? _squash.deflate(obj) : obj));


            }



        });






    },

    processAPIRequest: function(req) {
        _.getAPI().sendMessageToToken(req.token, req.msg, function() {});


    },


    processResponse: function(pid) {
        var _ = _io;



        var fnam = path.join(__dirname, '../', '../', 'cache', 'pids', pid + '.json');
        atajo.log.d("LOADING " + fnam);

        fs.readFile(fnam, 'utf8', function(err, data) {

            if (err) {
                atajo.log.e("COULD NOT READ " + fnam);
                return;

            }


            var obj = false;
            try {
                obj = JSON.parse(data);
            } catch (e) {
                atajo.log.e("COULD NOT PARSE RESPONSE (DROPPING) -> " + e);
            }

            if (obj) {
                obj = _.processLatency(obj, 'resp');
                if (typeof obj.compressResponse == 'undefined') {
                    obj.compressResponse = true;
                };


                if (obj.CHUNKED) {
                    atajo.log.d("OBJ IS CHUNKED");
                    //Chunk and cache it. Chunker will send.

                    var _test = JSON.stringify(obj.RESPONSE);
                    var len = _test.length;

                    var _data = obj.RESPONSE;
                    var arrLen = _data.length;

                    var ratio = len / arrLen;
                    atajo.log.d("CHUNKING " + arrLen + " ELEMENTS @ ~ " + ratio + " bytes PER ELEMENT");

                    var chunkSize = 1;

                    for (var i = 0; i < 50; i++) {
                        var mult = ratio * chunkSize;
                        if ((mult < len) && (mult < 100000)) {
                            chunkSize++;
                        } else {
                            break;
                        }
                    }

                    atajo.log.d("CHUNKSIZE IS " + chunkSize);
                    var chunks = [];


                    for (var i = 0, j = arrLen; i < j; i += chunkSize) {
                        chunks.push(_data.slice(i, i + chunkSize));

                    }

                    atajo.log.d("WE HAVE " + chunks.length + " CHUNKS");




                    var _path = path.join(__dirname, '../', '../', 'cache', 'chunks');
                    if (!fs.existsSync(_path)) {
                        fs.mkdirSync(_path);
                    }

                    for (var i in chunks) {
                        var fnam = path.join(_path, obj.pid + '.' + i + '.chunk');
                        fs.writeFile(fnam, JSON.stringify(chunks[i]), function(err) {
                            if (err) {
                                atajo.log.e("COULD NOT WRITE CHUNK TO CACHE FOR " + fnam + " [ " + err + " ]");
                            }

                        });
                    }

                    obj.RESPONSE = {
                        chunks: chunks.length,
                        chunkSize: chunkSize

                    }
                    _.SOCKET.emit(obj.responseEvent, (obj.compressResponse ? _squash.deflate(obj) : obj));



                } else {

                    _.SOCKET.emit(obj.responseEvent, (obj.compressResponse ? _squash.deflate(obj) : obj));
                    var fnam = path.join(__dirname, '../', '../', 'cache', 'pids', pid + '.json');
                    atajo.log.d('-->' + fnam);

                    fs.unlink(fnam, function(err) {
                        if (err) {
                            atajo.log.e("COULD NOT UNLINK " + fnam + " => " + err);
                        }
                    });



                }


            } else {
                var fnam = path.join(__dirname, '../', '../', 'cache', 'pids', pid + '.json');

                fs.unlink(fnam, function(err) {
                    if (err) {
                        atajo.log.e("COULD NOT UNLINK " + fnam + " => " + err);
                    }
                });

            }



        })



    },



    verifyRequest: function(obj) {

        if (typeof obj.pid == 'undefined') {
            return false;
        }

        return obj;


    },

    verifyResponse: function(obj) {

        if (typeof obj.pid == 'undefined') {
            return false;
        }

        return obj;


    },

    processLatency: function(obj, type) {

        var _ = this;
        type = type || 'req';

        if (typeof obj.latency != 'undefined') {
            if (type == 'req') {
                obj.latency.providerReceiveAt = new Date().getTime();
            } else {
                obj.latency.providerResponseAt = new Date().getTime();
            }
        }

        return obj;




    },

    processConnect: function() {
        var _ = this;


        require('../../hooks/onConnect.js').evt();

        var extVersion = path.join(__dirname, '../', '../', '.version');
        var currentProviderVersion = fs.readFileSync(extVersion).toString().replace(/\n/g, '');

        atajo.log.n();
        atajo.log.i("<-----[ ATAJO PROVIDER " + currentProviderVersion + " ]--[ " + _.RELEASE + " : " + _.VERSION.ID + " ]--[ RUNNING ON " + _.HOSTNAME + " ]--[ CONNECTED TO " + _.URI + ' ]----->');
        atajo.log.n();

        _.CONNECTED = true;

        //INIT CHANGE LISTENER
        var watcher = require('./atajo.watcher').init(function() {
            _.SOCKET.refreshBase();
        });

        //REBUILD PACKAGES
        _.SOCKET.refreshBase();


    },

    processDisconnect: function(reason) {
        var _ = this;

        reason = reason || '';

        atajo.log.e("PROVIDER DISCONNECTED : " + reason);
        _.CONNECTED = false;
        require('../../hooks/onDisconnect.js').evt();




    },

    getAPI: function() {
        var _ = this;

        //  atajo.log.d("INIT CORE API");
        var api = Object.create(API).INIT({
            SOCKET: _.SOCKET,
            PARENT: _
        });
        return api;

    },


    API: {
        SOCKET: null,
        PARENT: null,

        CACHE: {},

        INIT: function(INIT) {
            var _ = this;
            //  atajo.log.d("INIT CORE API WORKER");

            _.SOCKET = INIT.SOCKET;
            _.PARENT = INIT.PARENT;
            return _;

        },

        sendMessageToToken: function(token, msg, cb) {
            var _ = this;

            try {



                var payload = {
                    token: token,
                    data: msg,
                    type: 'sendMessageToToken'
                }


                _.sendPayload(payload, cb)


            } catch (e) {
                atajo.log.d("PROVIDER API ERROR : " + e);
            }

        },

        sendPayload: function(payload, cb) {
            var _ = this;

            try {

                payload.clientKey = _.PARENT.CONFIG.CLIENT_KEY;
                payload.at = new Date().getTime();

                var data = JSON.stringify(payload);

                //var hash = crypto.createHash('md5').update(data).digest("hex");
                //_.CACHE[hash] = { payload : payload, cb : cb };

                atajo.log.d("API.sendPayload -> " + data);

                _.SOCKET.emit('onProviderPayload', _squash.deflate(payload));

            } catch (e) {
                atajo.log.d("PROVIDER API ERROR : " + e);
            }

        }



    }



};


module.exports = _io;