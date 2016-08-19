//NPM
var path = require('path');
var fs = require('fs');
var fse = require('fs-extra');
var request = require('request');
var moment = require('moment');
var prompt = require('prompt');
var ncp = require('ncp').ncp;



_setup = {

    CB: null,

    init: function(cb) {
        var _ = this;


        _.CB = cb;

        //CHECK SUBMODULE VERSION MATCHES LATEST
        var extVersion = path.join(__dirname, '../', '../', '.version');
        var intVersion = path.join(__dirname, '../', 'default', '.version');
        versionExists = fs.existsSync(extVersion);
        if (!versionExists) {
            //COPY DEFAULT FILES
            _.copyInit(function() {
                _setup.start();
            });



        } else {
            extVersion = fs.readFileSync(extVersion).toString().replace(/\n/g, '');
            intVersion = fs.readFileSync(intVersion).toString().replace(/\n/g, '');

            if (extVersion != intVersion) {
                var time = moment().format("DD-MM-YYYY @ H:mm:ss");
                prompt.message = '[' + time + ']--[INFO]---[ ';
                prompt.delimiter = '';
                prompt.start();

                prompt.get([{
                    name: 'update',
                    description: 'The provider submodule has been updated to version ' + intVersion + '. Would you like to apply updates to your project?',
                    required: true,
                    default: 'no'
                }], function(err, result) {


                    if (result.update.toLowerCase() == 'yes') {

                        _.copyUpdate();
                    }


                    setTimeout(function() {
                        _setup.start();
                    }, 2000);




                });

            } else {
                _setup.start();
            }
        }


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
                atajo.log.e("File conf/config.json not found");
            } else {
                atajo.log.e("Error in conf/config.json : " + e);
            }

            process.exit(0);
            return;
        }


        var KEYS = '';
        try {
            KEYS = fs.readFileSync(path.join(__dirname, '../', '../', 'conf', 'keys.json'));
            KEYS = JSON.parse(KEYS);

        } catch (e) {
            var msg = e.toString();
            if (msg.indexOf("ENOENT") > -1) {
                atajo.log.e("File conf/keys.json not found");
            } else {
                atajo.log.e("Error in conf/keys.json : ");
                console.log(e);
            }
            process.exit(0);
        }


        CONFIG.API_KEY = KEYS.API_KEY;
        CONFIG.CLIENT_KEY = KEYS.CLIENT_KEY;


        //CHECK API KEY
        if (typeof CONFIG.API_KEY === 'undefined' || CONFIG.API_KEY === '') {
            atajo.log.e("API KEYS NOT FOUND. PLEASE SET API KEYS PROVIDED TO YOU IN CONF/KEYS.JSON");
            process.exit(0);
        }


        _setup.CB();






    },

    copyUpdate: function() {

        //PLACE UPDATE COPIES HERE. FOR NOW JUST UPDATE VERSION
        var vers = fs.readFileSync(path.join(__dirname, '../', 'default', '.version'));
        var vers_dst = path.join(__dirname, '../', '../', '.version');
        fse.outputFileSync(vers_dst, vers);



    },


    copyInit: function(done) {


        atajo.log.d("SETTING UP PROJECT ")


        var dst = path.join(__dirname, '../', '../');
        var src = path.join(__dirname, '../', 'default');

        ncp(src, dst, {
            clobber: false,
            stopOnErr: true,
        }, function(err) {

            if (err) {
                atajo.log.e("ERROR INITIALIZING : " + err);
                process.exit(0);
            } else {
                done();
            }





        });












    }


};



module.exports = _setup;