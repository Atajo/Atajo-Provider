//NPM
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var request = require('request');
var moment = require('moment');
var prompt = require('prompt');
var unzip = require('unzip');
var ncp = require('ncp').ncp;





//LIBS
var _log = null;

_setup = {

    CB: null,

    init: function(cb) {
        var _ = this;


        _.CB = cb;

        //CHECK IF EXTERNAL VERSION FILE EXISTS
        var extVersion = path.join(__dirname, '../', '../', '.version');
        var intVersion = path.join(__dirname, '../', 'default', '.version');
        versionExists = fs.existsSync(extVersion);
        if (!versionExists) {
            //COPY DEFAULT FILES
            _.copyInit();

        }

        _log = require('./log');

        // CHECK IF VERSIONS MATCH. IF NOT. DOWNLOAD AND RE-INIT
        var currVersion = fs.readFileSync(extVersion).toString().replace(/\n/g, '');

        _log.d("CURRENT VERSION IS " + currVersion);


        // CONTACT SERVER AND CHECK VERSION
        var updateURL = require('../default/conf/servers.json').UPDATE;
        updateURL = updateURL.protocol + '://' + updateURL.host + ':' + updateURL.port + '/getVersion/' + currVersion;

        _log.d("CHECKING FOR UPDATES @ " + updateURL);

        var opts = {
            url: updateURL,
            timeout: 5000,
        };

        request(opts, function(error, response, version) {
            if (!error && response.statusCode == 200) {

                _log.d("VERSION ON SERVER IS : " + version);

                if (version !== currVersion) {
                    //UPDATE?
                    var prompt = require('prompt');
                    prompt.start();


                    _.update(version);

                } else {

                    _.start();
                }


            } else {
                _log.e("COULD NOT CHECK FOR UPDATES. PLEASE ENSURE YOU CAN CONNECT TO : " + updateURL);
                _.start();

            }

        });


        //_log.d(prevVersion + ' -> '+currVersion);
        //  if(prevVersion != currVersion)














    },

    update: function(version) {
        var _ = this;


        //
        // Get two properties from the user: username and email
        //
        var time = moment().format("DD-MM-YYYY @ H:mm:ss");
        prompt.message = '[' + time + ']--[INFO]---[ ';
        prompt.delimiter = '';

        prompt.start();


        prompt.get([{
            name: 'update',
            description: 'An update to version ' + version + ' is available. Would you like to update? ',
            required: true,
            default: 'yes'
        }], function(err, result) {
            //
            // Log the results.
            //
            //console.log('Command-line input received:');
            //console.log('  update: ' + result.update);


            var packageLoc = path.join(__dirname, '../', '../', 'updates');
            //_.extract(packageLoc, version);

            //return;


            if (result.update == 'yes') {


                _log.i("UPDATING TO VERSION " + version);

                //FETCH AND SAVE THE PACKAGE
                var updateURL = require('../default/conf/servers.json').UPDATE;
                updateURL = updateURL.protocol + '://' + updateURL.host + ':' + updateURL.port + '/updateVersion/' + version;

                try {
                    fs.mkdirSync(packageLoc);
                } catch (e) {

                }

                var opts = {
                    url: updateURL,
                    timeout: 5000,
                };

                var ProgressBar = require('progress'),
                    bar;

                var time = moment().format("DD-MM-YYYY @ H:mm:ss");


                var req = request(opts);

                req.on('data', function(chunk) {
                        bar = bar || new ProgressBar('[' + time + ']--[INFO]---[ :bar ] :percent :etas [ :current / :total ]', {
                            complete: '|',
                            incomplete: ' ',
                            width: 40,
                            total: parseInt(req.response.headers['content-length'])
                        });

                        bar.tick(chunk.length);
                    })
                    .pipe(fs.createWriteStream(path.join(packageLoc, 'package.zip')))
                    .on('close', function() {




                        //EXTRACT THE PACKAGE
                        _.extract(packageLoc, version);





                    });







            } else {
                _.start();
            }










        });






    },


    extract: function(packageLoc, version) {
        var _ = this;

        _log.i("INSTALLING UPDATE");

        fs.createReadStream(path.join(packageLoc, 'package.zip'))
            .pipe(unzip.Extract({
                path: path.join(packageLoc)
            }))
            .on('close', function() {

                //COPY IT
                var dst = path.join(__dirname, '../', '../', 'provider');
                var src = path.join(packageLoc, 'provider');
                fse.copySync(src, dst);


                _.copyInit();


                //DELETE UPDATE FILES
                fse.removeSync(packageLoc);




                _log.n(2);
                _log.i("<<<< PROVIDER UPDATED TO VERSION " + version + " - PLEASE RESTART THE PROVIDER >>>>");
                _log.n(2);

                process.exit(1);

            });



    },

    start: function() {
        var _ = this;



        //VALIDATE CONFIG
        var CONFIG = '';
        try {
            CONFIG = fs.readFileSync(path.join(__dirname, '../', '../', 'conf', 'config.json'));
            CONFIG = JSON.parse(CONFIG);

        } catch (e) {
            var msg = e.toString();
            if (msg.indexOf("ENOENT") > -1) {
                _log.e("File conf/config.json not found");
            } else {
                _log.e("Error in conf/config.json : ");
                console.log(e);
            }
            process.exit(0);
        }


        var KEYS = '';
        try {
            KEYS = fs.readFileSync(path.join(__dirname, '../', '../', 'conf', 'keys.json'));
            KEYS = JSON.parse(KEYS);

        } catch (e) {
            var msg = e.toString();
            if (msg.indexOf("ENOENT") > -1) {
                _log.e("File conf/keys.json not found");
            } else {
                _log.e("Error in conf/keys.json : ");
                console.log(e);
            }
            process.exit(0);
        }


        CONFIG.API_KEY = KEYS.API_KEY;
        CONFIG.CLIENT_KEY = KEYS.CLIENT_KEY;


        //CHECK API KEY
        if (typeof CONFIG.API_KEY === 'undefined' || CONFIG.API_KEY === '') {
            _log.e("API KEYS NOT FOUND. PLEASE SET API KEYS PROVIDED TO YOU IN CONF/KEYS.JSON");
            process.exit(0);
        }


        _setup.CB();






    },


    copyInit: function() {

        dst = path.join(__dirname, '../', '../', 'cache');
        src = path.join(__dirname, '../', 'default', 'cache');

        ncp(src, dst, {
            clobber: false
        }, function(err) {
            if (err) {
                return console.error(err);
            }

        });


        dst = path.join(__dirname, '../', '../', 'conf');
        src = path.join(__dirname, '../', 'default', 'conf');
        ncp(src, dst, {
            clobber: false
        }, function(err) {
            if (err) {
                return console.error(err);
            }

        });

        dst = path.join(__dirname, '../', '../', 'handlers');
        src = path.join(__dirname, '../', 'default', 'handlers');
        ncp(src, dst, {
            clobber: false
        }, function(err) {
            if (err) {
                return console.error(err);
            }

        });


        dst = path.join(__dirname, '../', '../', 'hooks');
        src = path.join(__dirname, '../', 'default', 'hooks');
        ncp(src, dst, {
            clobber: false
        }, function(err) {
            if (err) {
                return console.error(err);
            }

        });


        dst = path.join(__dirname, '../', '../', 'packages');
        src = path.join(__dirname, '../', 'default', 'packages');
        ncp(src, dst, {
            clobber: false
        }, function(err) {
            if (err) {
                return console.error(err);
            }

        });



        //COPY VERSION
        vers = fs.readFileSync(path.join(__dirname, '../', 'default', '.version'));
        vers_dst = path.join(__dirname, '../', '../', '.version');
        fse.outputFileSync(vers_dst, vers);






    }


};



module.exports = _setup;