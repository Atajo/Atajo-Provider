//NPM
var compressor = require('node-minify');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

module.exports = {

    FRAMEWORK: false,
    BASE_DIR: null,

    build: function(version, cb) {
        var _ = this;

        var baseDir = path.join(__dirname, '../../', 'packages');

        //CLEAN VERSION

        /*
        "COREVERSION"  : "1.0",
        "CORELIB"      : "BASE",
        "BASEVERSION"  : "1.0",
        "BASELIB"      : "MATERIAL"
        */

        if (typeof version.COREVERSION == 'undefined') {
            version.COREVERSION = false;
        }
        if (typeof version.CORELIB == 'undefined') {
            version.CORELIB = 'BASE';
        }
        if (typeof version.BASEVERSION == 'undefined') {
            version.BASEVERSION = '1.0';
        }
        if (typeof version.BASELIB == 'undefined') {
            version.BASELIB = 'MATERIAL';
        }

        _.FRAMEWORK = version.BASELIB;


        //atajo.log.n();
        //atajo.log.i("[ BUILDING BASE PACKAGES ]");

        resp = {};

        _.BASE_DIR = baseVersionDir = path.join(baseDir, version.BASEVERSION);

        var jsDir = path.join(baseVersionDir, 'js');
        var cssDir = path.join(baseVersionDir, 'css');
        var htmlDir = path.join(baseVersionDir, 'html');
        var imgDir = path.join(baseVersionDir, 'img');

        var jsFiles = _.getFiles(jsDir, 'js', false, true); //atajo.log.d("JSFILES   --> "+JSON.stringify(jsFiles));
        var cssFilesLarge = _.getFiles(cssDir, 'css', 'small', false); //atajo.log.d("CSSLARGE  --> "+JSON.stringify(cssFilesLarge));
        var cssFilesSmall = _.getFiles(cssDir, 'css', 'large', false); //atajo.log.d("CSSSMALL  --> "+JSON.stringify(cssFilesSmall));
        var htmlFiles = _.getFiles(htmlDir, 'html', false, false); //atajo.log.d("HTMLFILES --> "+JSON.stringify(htmlFiles));
        var imgFiles = _.getFiles(imgDir, ['jpg', 'png', 'svg'], false, false); //atajo.log.d("HTMLFILES --> "+JSON.stringify(htmlFiles));


        _.packageFiles(jsFiles, 'js', version.DEBUG ? 'no-compress' : 'gcc', version.BASEVERSION, function(clear) {
            _.packageFiles(cssFilesLarge, 'large.css', version.DEBUG ? 'no-compress' : 'yui-css', version.BASEVERSION, function(clear) {
                _.packageFiles(cssFilesSmall, 'small.css', version.DEBUG ? 'no-compress' : 'yui-css', version.BASEVERSION, function(clear) {
                    _.packageFiles(htmlFiles, 'html', version.DEBUG ? 'no-compress' : 'no-compress', version.BASEVERSION, function(clear) {
                        _.packageImageFiles(imgFiles, ['png', 'svg'], version.BASEVERSION, function(clear) {
                            cb();
                        });
                    });
                });
            });
        });









    },


    hash: function(version) {
        var _ = this;


        if (typeof version.BASEVERSION == 'undefined') {
            version.BASEVERSION = '1.0';
        }

        //atajo.log.d("HASHING PACKAGE VERSION "+version.BASEVERSION);

        try {

            var baseDir = path.join(__dirname, '../', '../', 'packages', version.BASEVERSION);
            var check = '';

            //JS
            check += _.hashDir(path.join(baseDir, 'js'));
            check += _.hashDir(path.join(baseDir, 'css'));
            check += _.hashDir(path.join(baseDir, 'html'));
            check += _.hashDir(path.join(baseDir, 'img'));

            var hash = crypto.createHash('md5').update(check).digest("hex");
            return hash;


        } catch (e) {
            atajo.log.e("COULD NOT PROCESS " + baseDir + " [ " + e + " ]");
            return false;
        }



    },

    //DEPS
    getFiles: function(dir, ext, excludePrefix, addSemiColon) {
        var _ = this;


        //DO JS
        var _files = [];



        /*
        	 //ADD FRAMEWORKS
        	 //DEPRECATED --> FRAMEWORKS INSTALLED ON DEVICE / SERVED BY CORE
					
        	 var fW = path.join(__dirname, '../', 'frameworks', _.FRAMEWORK, ext);
        	 //atajo.log.d("FW IS "+fW);
        	 if( fs.existsSync(fW) )
        	 {
        			atajo.log.d("ADDING FRAMEWORK FILES");
        			var fWFiles = fs.readdirSync(fW);
        			for(var f in fWFiles)
        			{
        				 var file = fWFiles[f];
        				 if(file == '.DS_Store') continue;
        				 //atajo.log.d("ADDING "+file);
        				 _files.push(path.join(fW, file));
        			}


        	 }
        */


        var files;
        try {
            files = fs.readdirSync(dir);
        } catch (e) {
            atajo.log.d("DIR NOT FOUND " + dir);
            return [];

        }

        for (var i in files) {
            var file = files[i];
            var ref = path.join(dir, file);


            if (fs.statSync(ref).isDirectory()) {
                _files = _files.concat(_.getFiles(ref, ext, excludePrefix, addSemiColon)); //FP -> REMOVE _files =
            } else {
                if (file == '.DS_Store') {
                    continue;
                } else if (excludePrefix && file.indexOf('_' + excludePrefix) != -1) {
                    continue;
                }

                if (Object.prototype.toString.call(ext) === '[object Array]') {

                    var found = false;
                    for (var e in ext) {
                        var _ext = ext[e];
                        if (file.indexOf('.' + _ext) > -1) {
                            found = true
                        }

                    }
                    if (!found) {
                        continue;
                    }
                } else {

                    if (file.indexOf('.' + ext) == -1) {
                        continue;
                    }
                }


                //add ;; to the end of file...

                if (addSemiColon) {
                    var fileData = fs.readFileSync(ref, "utf8");
                    if (fileData.lastIndexOf(';;') < fileData.length - 5) {
                        fs.appendFileSync(ref, ';;', "utf8");
                    }
                }
                /*
                							var fileData = fs.readFileSync(ref, "utf8");
                							if(fileData.indexOf('<<<EOF>>>') === -1 )
                							{
                									fs.appendFileSync(ref, '<<<EOF>>>', "utf8");
                							}
                */


                _files.push(ref);


            }

        }




        return _files;


    },

    packageFiles: function(files, ext, type, vers, cb) {
        var _ = this;

        //	atajo.log.d("PACKAGING "+vers+" / "+ext+" / "+type);

        new compressor.minify({
            type: type,
            fileIn: files,
            fileOut: path.join(__dirname, '../', 'build', '/base-' + vers + '.' + ext),
            callback: function(err, min) {
                //  atajo.log.d("DONE PACKAGING "+vers+" / "+ext+" / "+type);
                if (err) {
                    atajo.log.e("COULD NOT PACKAGE " + type.toUpperCase() + " (NOT UPLOADING TO CORE) : " + err);
                    cb(false);
                } else {
                    cb(true);
                }

            }
        });


    },

    packageImageFiles: function(files, ext, vers, cb) {
        var _ = this;



        var images = [];

        for (var i in files) {
            var img = files[i];


            var imgPath = path.relative(_.BASE_DIR, img);

            //atajo.log.d("PROCESSING ("+_.BASE_DIR+") - "+imgPath+" / "+img);


            var nam = path.basename(img);

            var valid = false;
            for (var e in ext) {
                if (nam.indexOf('.' + ext[e]) > -1) {
                    valid = ext[e];
                    break;
                }
            }

            if (!valid) {
                atajo.log.i('IMAGE ' + nam + ' NOT A VALID IMAGE. CONTINUING');
                continue;
            }

            img = fs.readFileSync(img);

            images.push({
                name: nam,
                data: new Buffer(img).toString('base64'),
                ext: valid,
                path: imgPath.replace(nam, '').replace(/\\/g, '/') //replace any windows style slashes '\\' with unix style slashes '/'
            });

            //console.log(images[nam]);  
        }

        fs.writeFileSync(path.join(__dirname, '../', 'build', '/base-' + vers + '.img'), JSON.stringify(images));

        cb(true);


    },



    hashDir: function(dir) {
        var _ = this;

        //	atajo.log.d("HASHING DIR "+dir);
        var check = '';
        var files = fs.readdirSync(dir); //FP -> Remove var;

        for (var f in files) {
            file = files[f];

            if (file == '.DS_Store' || typeof file == 'undefined') {
                continue;
            }
            //atajo.log.d("FILE IS "+file);
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                check += _.hashDir(path.join(dir, file));
            } else {
                check += fs.readFileSync(path.join(dir, file));
            }
        }

        return check;



    },






};