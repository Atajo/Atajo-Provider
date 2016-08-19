var prompt = require('prompt'),
    moment = require('moment'),



    _release = function(CB) {

        var servers = require("../../conf/servers.json");
        var args = require("../lib/args");

        //CHECK IF RELEASE IS INDICATED IN THE COMMAND LINE
        var valids = [];
        for (var s in servers) {
            var server = servers[s];
            valids.push(s);
        }

        RELEASE = args.get(2, "NONE", valids)

        if (RELEASE == 'NONE') {

            //PROMPT FOR RELEASE
            var i = 1;
            for (var s in servers) {
                var server = servers[s];
                if (server.startup) {
                    atajo.log.i(i + ". " + s + " [ " + server.protocol + "://" + server.host + ":" + server.port + " ]");
                }
                i++;

            }


            var time = moment().format("DD-MM-YYYY @ H:mm:ss");
            prompt.message = '[' + time + ']--[PROMPT]-[ ';
            prompt.delimiter = '';

            prompt.start();


            prompt.get([{
                name: 'release',
                description: 'Please choose release mode',
                required: true,
                default: '1'
            }], function(err, result) {
                //
                // Log the results.
                //
                //console.log('Command-line input received:');
                //console.log('  update: ' + result.update);
                if (typeof result == 'undefined') {
                    process.exit(1);
                }
                RELEASE = '';
                var i = 1;
                for (var s in servers) {
                    var server = servers[s];
                    if (server.startup) {

                        if (result.release == i) {
                            RELEASE = s;
                        }
                    }
                    i++;
                }

                if (RELEASE === '') {
                    RELEASE = 'DEV';
                }

                var _rel = servers[RELEASE];
                atajo.log.d("RELEASE IS " + RELEASE + " => " + _rel.protocol + "://" + _rel.host + ":" + _rel.port);


                CB(RELEASE, _rel);


            });

        } else {

            var _rel = servers[RELEASE];
            atajo.log.d("RELEASE IS " + RELEASE + " => " + _rel.protocol + "://" + _rel.host + ":" + _rel.port);
            CB(RELEASE, _rel);


        }
    };


module.exports = _release;