var mongoose = require('mongoose');
var os       = require('os');
var fs       = require('fs');
var path     = require('path');

var _log     = require('../../lib/log');

_mongodb = {

  SCHEMAS   : {},
  RELEASE   : null,
  DB        : null,
  CONNECTED : false,
  LOCAL     : false,
  CONF      : null,


  init: function(CB) { var _ = this;

    _log.d("            MONGODB ADAPTER INIT > ");

    try
    {
       _.CONF = require('../../../conf/mongodb');
    }
    catch (e)
    {

      _log.e("COULD NOT REQUIRE MONGODB CONFIG. PLEASE ENSURE conf/mongodb.json EXISTS AND IS CONFIGURED");
      CB(false); 
      return; 

    }


     _.LOCAL = (typeof LOCAL != 'undefined') ? ( LOCAL == 'local' ? true : false ) : false;

     _.RELEASE = RELEASE ? RELEASE : 'DEV';

     var SCHEMA_DIR = _.CONF.schemas;
     _log.d("LOADING SCHEMAS FROM "+SCHEMA_DIR);

     fs.readdir(SCHEMA_DIR, function(err, files) {

         if (err)
         {
            _log.e("COULD NOT READ SCHEMAS. MONGODB INIT FAILED : "+err);
            return;
         }

         for(var f in files)
         {

            var file = files[f];
            if(file.indexOf('.js') > -1)
            {
              var rNam = file.replace('.js', '');
              try
              {
                 _.SCHEMAS[rNam] = require(path.join('../../../'+SCHEMA_DIR, rNam));
              }
              catch (e)
              {
                  _log.e("COULD NOT REQUIRE SCHEMA "+rNam+" : "+e);
              }
            }

         }

         if(_.SCHEMAS.length == 0)
         {
            _log.i("NO SCHEMAS DEFINED. NOT CONNECTING DB");
            return;
         }

         //INIT THE SCHEMAS
         for (var schema in _.SCHEMAS) {

           var schemaName = schema;
           var schemaData = _.SCHEMAS[schema];

           var schemaRefName = schemaName.replace('Schema', '') + 's';
           _log.d("                     LOADING SCHEMA "+schemaName+" ("+schemaRefName+")"); // => "+JSON.stringify(schemaInstance));

           _.SCHEMAS[schemaRefName] = (typeof _.SCHEMAS[schemaRefName] == 'undefined') ? mongoose.model(schemaName,   new mongoose.Schema( schemaData )) :_.SCHEMAS[schemaRefName];

         }

         _.connect(CB);



     });


  },


  connect: function(CB) {
    var _ = this;

    var options = {   db: { native_parser: true } };

    if(_.CONF.username && _.CONF.password)
    {
      options.user = _.CONF.username;
      options.pass = _.CONF.password;
    };

      //GET ENDPOINT
      var mongoURL = _.CONF.host;

      _log.d("MONGO CONNECTING TO "+mongoURL);


    //CONNECT TO DB
       _.DB = mongoose.connection;
       _.DB.on('error', _.err);
       _.DB.once('open', function callback() { if(_.CONNECTED) { return; }

        _.CONNECTED = true;

        _log.d("MONGO CONNECTED TO "+mongoURL);
        CB(_.SCHEMAS);
    });

  mongoose.connect(mongoURL, options);
//mongoose.connect(mongoURL);

    process.on('SIGINT', function() {
      _.DB.close(function() {
        _log.e('<<<<<<<<<<<<<<<<<<<  MONGO DISCONNECTED  >>>>>>>>>>>>>>>>>>>');
        process.exit(0);
      });
    });



  },

  err: function(msg) {

    _log.e("MONGO ERROR : " + msg);
    _log.e("COULD NOT CONNECT TO MONGO -> STOPPING");
    //process.exit(1);

  }

};

module.exports = _mongodb;
