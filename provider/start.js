require('./lib/atajo.provider').init(function(atajo) {

    global.atajo = atajo;

    //atajo.clear();
    require('./lib/atajo.env').init(function() {
        require('./lib/atajo.setup').init(function() {


            atajo.log.i("STARTING PROVIDER");

            //GET RELEASE
            atajo.release(function(__RELEASE__, __SERVER__) {

                RELEASE = __RELEASE__;
                SERVER = __SERVER__;

                URI = SERVER.protocol + '://' + SERVER.host + ':' + SERVER.port;


                atajo.log.d("CONNECTING TO : " + URI + " (" + RELEASE + ")");

                atajo.io.init(RELEASE, URI);






            })




        });

    });
});