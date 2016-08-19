module.exports = {

    config: {

        system: null,
        app: null,

    },

    log: null,

    //LIB
    release: require('./atajo.release'),
    io: require('./atajo.io'),
    squash: require('./atajo.squash'),
    build: require('./atajo.build'),

    //NPM
    clear: require("cli-clear"),


    NAME: '',

    init: function(cb) {
        var _ = this;


        _.config.system = require('../conf-internal/config.js');
        _.NAME = _.config.system.DESCRIPTOR.NAME || 'ATAJO_GENERIC_PROCESS';


        _.log = require('./atajo.log').init(_.NAME, _.NAME.toLowerCase() + '.log');


        cb(_);


    }




}