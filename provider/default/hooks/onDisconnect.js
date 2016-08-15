var _log = require('../provider/lib/log');


_onDisconnect = {

    evt : function()
     {
        _log.i("HOOK : onDisconnect");
     }


};


module.exports = _onDisconnect;
