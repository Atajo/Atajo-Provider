(function(){
	"use strict";
}());

var _log     = require('../../lib/log');
var request = require('request');

var _geoserver = {
	URL_BASE: "https://geo.atajo.co.za/v2",
	KEYS: require('../../../conf/keys.json'),

	/* query is {uuid:String,from:Date,to:Date}
	 * CB is passed (err, result)
	 */
	getHistory: function (query, CB) { var _ = this;
		var url = _.URL_BASE + "/location/history";
		
		var obj = {
			query: query
		};

		var headers = {
			KEY: _.KEYS.CLIENT_KEY,
			RELEASE: GLOBAL.RELEASE
		};

		_log.d("GEOSERVER retrieving " + JSON.stringify(obj) + " (" + JSON.stringify(headers) + ") from " + url);

		request({
			url: url,
			method: "POST",
			type: "json",
			headers: {
				KEY: _.KEYS.CLIENT_KEY,
				RELEASE: GLOBAL.RELEASE
			},
			json: obj
		}, function (error, response, body) {
			if (!error && response.statusCode === 200) {
				if (!body.error) {
					CB(false, body);
				} else {
					CB(true, body);
				}
			} else {
				_log.d("GEOSERVER error " + error);
				CB(error, null);
			}
		});
	},

	err: function(msg) {
		_log.e("GEOSERVER ERROR : " + msg);
	},
};

module.exports = _geoserver;
