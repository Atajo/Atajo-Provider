
var fs = require('fs');
var path = require('path');
var exec    = require('child_process').exec;


_checkNode = {

    CALLBACK : null,
    ISWIN    : false,

    init : function(cb) { var _ = this;

        _.CALLBACK = cb;

        _.ISWIN = /^win/.test(process.platform);



        //CHECK FOR NODE ARCH
        //console.log(process.version);
        if( process.arch != 'x64')
        {
          console.log("PROVIDER REQUIRES 64-bit NODE");
          process.exit(0);
        }


        //CHECK FOR NODE MODULES
        var modPath = path.join(__dirname, '../', '../', 'provider', 'node_modules');
        //console.log("CHECKING FOR REQUIRED MODULES @ "+modPath);
        if(!fs.existsSync(modPath))
        {
          console.log("INSTALLING REQUIRED NPM MODULES - THIS CAN TAKE A FEW MINUTES");

          if(_.ISWIN)
          {
            cmd = 'cd provider & npm install';
          }
          else
          {
            cmd = 'cd provider; npm install;';
          }

          exec(

            cmd,

             function(error, stdout, stderr)
             {

               console.log(error+' -> '+stdout+' // '+stderr);

               cb();


             });



        }
        else
        {
           cb();
        }


    },

};



module.exports = _checkNode;
