
var watch = require('watch');
var _log = require('../lib/log');
var path = require('path');


exports.init = function(cb) {


  watch.createMonitor(path.join(__dirname, '../../', 'packages'), function (monitor) {
    monitor.files['/dev/null']; // Stat object for my zshrc.
    monitor.on("created", function (f, stat) {
      // Handle new files
       _log.d("BASE PACKAGE FILE CREATED @ "+f);
    });
    monitor.on("changed", function (f, curr, prev) {
      // Handle file changes
       _log.d("BASE PACKAGE FILE CHANGE @ "+f);
        cb();

    });
    monitor.on("removed", function (f, stat) {

      // Handle file changes
       _log.d("BASE PACKAGE FILE REMOVED @ "+f);
        cb();
    });
  //  monitor.stop(); // Stop watching
  });


};
