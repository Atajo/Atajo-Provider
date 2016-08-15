/**
 * This is a helper to call http requests for handlers
 * This when using an underlying web api
 */
(function() {
    var apiConfig = require('../../apiConfig.json');
    var http = require('http');
    var path = require('path');
    var url = require('url');
    var _log = require('./log');
    var Q = require('q');
    var request = require('request');

    /**
     * This is the fallback error
     * @type {String}
     */
    var unresolvedErrorMessage = "Network Error";

    /**
     * This is a regex to detect leading slashes
     * @type {RegExp}
     */
    var leadingSlashRegex = /^\/+/;

    /**
     * It is expected that the app and web api are served at one place (otherwise use appropriate url)
     */
    var baseURL = apiConfig.REST_BASE_URL;

    var makeRequest = function(options) {
        var deferred = Q.defer();
        _log.d(" start handler web request via uri: " + options.uri);
        request(options, function(error, response, body) {

            if (!error && response.statusCode == 200) {
                if (typeof body == 'object') {
                    deferred.resolve(body);
                } else {
                    deferred.resolve(JSON.parse(body));
                }

            } else {
                _log.e("Request unsuccessfull: " + (error ? error : '') + " | status: " + (response ? response.statusCode : 'N/A'));
                deferred.resolve({ error: true, msg: unresolvedErrorMessage });
            }
        });
        return deferred.promise;
    };

    var post = function(urlPath, postData, params) {
        var deferred = Q.defer();

        params = params || {};

        var options = {
            uri: baseURL + urlPath.replace(leadingSlashRegex, ''),
            method: 'POST',
            json: true,
            body: postData,
            qs: params
        };
        makeRequest(options).then(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;
    };

    var get = function(urlPath, params) {
        var deferred = Q.defer();

        params = params || {};

        var options = {
            uri: baseURL + urlPath.replace(leadingSlashRegex, ''),
            method: 'GET',
            qs: params
        };
        makeRequest(options).then(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;
    };

    var put = function(urlPath, postData, params) {
        var deferred = Q.defer();

        params = params || {};

        var options = {
            uri: baseURL + urlPath.replace(leadingSlashRegex, ''),
            method: 'PUT',
            json: true,
            body: postData,
            qs: params
        };
        makeRequest(options).then(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;
    };

    var deleteReq = function(urlPath, params) {
        var deferred = Q.defer();

        params = params || {};

        var options = {
            uri: baseURL + urlPath.replace(leadingSlashRegex, ''),
            method: 'DELETE',
            qs: params
        };
        makeRequest(options).then(function(data) {
            deferred.resolve(data);
        });

        return deferred.promise;
    };

    module.exports = {
        post: post,
        get: get,
        put: put,
        delete: deleteReq
    };
}());
