var _log = require('../provider/lib/log');


_onConnect = {

    evt : function()
     {
        _log.i("HOOK : onConnect");
     }


};


module.exports = _onConnect;
