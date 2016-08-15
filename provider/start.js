require('./lib/checkNode').init(function() {



    //NPM
    var crypto = require('crypto'),
        path = require('path'),
        os = require('os'),
        fs = require('fs'),
        clear = require("cli-clear")(),
        prompt = require('prompt'),
        moment = require('moment');




    //LIB
    _setup = require('./lib/setup');
    _args = require('./lib/args');
    _io = require('./lib/io');
    _rel = null;
    _log = null;
    _base = null;



    //CONST
    var HOSTNAME = os.hostname();
    var HASH = '';
    var RELEASE = null;
    var VERSION = '';
    var ISBUILDING = false;
    var SERVER = null;
    var URI = null;


    _setup.init(function() {


        _log = require('./lib/log');
        _base = require('./lib/base');
        _rel = require('./lib/release');


        _log.i("STARTING PROVIDER");

        //GET RELEASE
        _rel(function(__RELEASE__, __SERVER__) {

            RELEASE = __RELEASE__;
            SERVER = __SERVER__;

            URI = SERVER.protocol + '://' + SERVER.host + ':' + SERVER.port;


            _log.d("CONNECTING TO : " + URI + " (" + RELEASE + ")");

            _io.init(RELEASE, URI);




        });







    });




});