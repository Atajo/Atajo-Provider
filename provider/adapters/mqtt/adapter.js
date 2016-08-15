(function(){
	"use strict";
}());

var _log     = require('../../lib/log');
var mqtt_lib = require('mqtt');

var _mqtt = {
	CONF: null,
	CLIENT: null,
	CONNECTED: false,

	init: function(CB) { var _ = this;
		try
		{
			_.CONF = require('../../../conf/mqtt');
		}
		catch (e)
		{
			_log.e("COULD NOT REQUIRE MQTT CONFIG. PLEASE ENSURE conf/mqtt.json EXISTS AND IS CONFIGURED");
			CB(false); 
			return; 
		}

		_.connect(CB);
	},


	connect: function (CB) { var _ = this;
		_.CLIENT = mqtt_lib.connect(_.CONF.connection_string);

		_.CLIENT.on('error', _.err);

		_.CLIENT.on("connect", function() {
			if (_.CONNECTED) {
				return;
			}

			_.CONNECTED = true;
			_log.d("Connected MQTT to " + _.CONF.connection_string);

			CB();
		});

		process.on('SIGINT', function() {
			_.CLIENT.end(function() {
				_log.e('<<<<<<<<<<<<<<<<<<<  MQTT DISCONNECTED  >>>>>>>>>>>>>>>>>>>');
				process.exit(0);
			});
		});
	},

	err: function(msg) {
		_log.e("MQTT ERROR : " + msg);
	},
};

module.exports = _mqtt;
