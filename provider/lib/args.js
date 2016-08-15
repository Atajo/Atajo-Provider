_args = {

    get : function(idx, _default, valids) {

        if(typeof valids == 'undefined') { valids = false; }

        if (process.argv[idx])
         {
           val = process.argv[idx];
           if(val)
           {
              if(!valids)
              {
                 return val;
              }
              else if(valids.indexOf(val) > -1)
              {
                 return val;
              }
             else
              {
                return _default;
              }
           }


        } else {
          return _default;
        }



    }

};

module.exports = _args;
