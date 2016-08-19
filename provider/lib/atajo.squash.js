var LZString = require('lz-string');


module.exports = {

    inflate: function(OBJ) {

        //DECOMPRESS IT
        var _lB = OBJ.length;
        OBJ = LZString.decompressFromUTF16(OBJ);
        var _lA = OBJ.length;

        atajo.log.d("SQUASH INFLATED FROM " + _lB + " -> " + _lA);

        try {
            OBJ = JSON.parse(OBJ);
        } catch (e) {
            atajo.log.e("SQUASH COULD NOT PARSE OBJECT : " + e);
            return {};
        }

        return OBJ;

    },

    deflate: function(OBJ) {

        //DECOMPRESS IT

        try {
            OBJ = JSON.stringify(OBJ);
        } catch (e) {
            atajo.log.e("SQUASH COULD NOT STRINGIFY OBJECT : " + e);
            return {};
        }

        var _lB = OBJ.length;
        OBJ = LZString.compressToUTF16(OBJ);
        var _lA = OBJ.length;

        atajo.log.d("SQUASH DEFLATED FROM " + _lB + " -> " + _lA);


        return OBJ;

    }


};