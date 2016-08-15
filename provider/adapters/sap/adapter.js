var sapnwrfc = require('sapnwrfc');
var config   = require('./config'); 

var conParams = null; 
 

exports.call = function(bapi, obj, cb, commit, at) { 
         
         conParams = config.conParams[GLOBAL.RELEASE]; 

         if(typeof conParams == 'undefined' || conParams == null)
          {
            cb({status:0, message:"CONNECTION PARAMETERS NOT SET. CALL INIT FIRST.", result:false}); 
            return; 
          }

         if(typeof at == 'undefined') { at = new Date().getTime(); }
         if(typeof commit == 'undefined') { commit = false; }


         q = { bapi : bapi, obj : obj, cb : cb, commit : commit, at : at }


         var _worker = Object.create(worker); 

          _worker.process(q); 

           

 }
 

var worker = {
        
        con : false, 

        process : function(q)
        {   var that = this; 

            if(typeof q == 'undefined') { return; }

            var bapi   = q.bapi; 
            var obj    = q.obj;
            var commit = q.commit; 
            var cb     = q.cb;
            var at     = (typeof q.at == 'undefined') ? false : q.at; 

            //if(typeof BAPIS[bapi] == 'undefined') { return; }

      
                if(at)
                {
                  
                    now = new Date().getTime(); 
                    delay = parseInt(at) - parseInt(now); 
                    console.log("CALL TO "+bapi+" DELAYED - CALLING IN "+delay+"ms"); 
                    if(delay > 0) { setTimeout(function() {  that.call(q); }, delay);  }
                    else { that.call(q); }
           
               }
               else
               {
                    that.call(q); 
               }
          },

          call : function(q)
          {    var that = this; 

               var bapi   = q.bapi; 
               var obj    = q.obj;
               var commit = q.commit; 
               var cb     = q.cb;
               var at     = (typeof q.at == 'undefined') ? false : q.at;

               console.log("CALLING BAPI "+bapi+" WITH DATA : "+JSON.stringify(obj).substring(0,50)+"..."); 
               that.con = new sapnwrfc.Connection;

               that.con.Open(conParams, function(err)
                {
                    if (err)
                     {  
                       console.log("CONNECTION ERROR FOR "+bapi+":"+err); 
                       res.send({status:0, message:"TRANSACTION FAILED. CONNECTION ERROR", result:err}); 
                       return; 
                     }

                    var func = that.con.Lookup(bapi);

              func.Invoke(obj, function(err, result) 
               {
                   if (err) 
                    { 
                         console.log("INVOKE ERROR FOR : "+bapi+"    ===>  DROPPING REQUEST ==> "+JSON.stringify(err)); 
                         
                         /*  
                            var sapLog = new sapSchema({
                            bapi        : bapi
                          , req         : JSON.stringify(obj) 
                          , resp        : "INVOKE ERROR : "+err 
                          , status      : "0" 
                            });

                          sapLog.save(); 

                         */ 

                        //  that.con.Close(); 
                          cb({status:0, message:"TRANSACTION FAILED. INVOKE ERROR", result:err}); 
                          return; 
                    }

/*
                   var sapLog = new sapSchema({
                            bapi        : bapi
                          , req         : JSON.stringify(obj) 
                          , resp        : JSON.stringify(result) 
                          , status      : "1"
                    });

                    sapLog.save(); 
*/ 
           console.log('====== RESULT FOR BAPI '+bapi+' IS ================'); 
           console.log(JSON.stringify(result).substring(0,100)+'...'); 
           console.log('==================================================='); 

           if(commit)
            {
                 console.log("TRANSACTION COMMIT"); 
                 cmd = "BAPI_TRANSACTION_COMMIT";
                 obj = {  WAIT:'X' } 
                 func = that.con.Lookup(cmd);

              func.Invoke(obj, function(err, commitResult) {
                if (err) 
                 {  
                   console.log(err);
                  // that.con.Close();  
                   cb({status:0, message:"COMMIT FAILED"});    
                 }
                else 
                 { 
                   cb({status:1, message:"COMMIT SUCCESS", result:result, commitresult:commitResult}); 
                 } 

              //   that.con.Close();  

              }); 
             }
            else
             {
                console.log("SENDING RESULT"); 
              //  that.con.Close(); 
                cb({status:1, message:"TRANSACTION SUCCESS", result:result});  
                             
             }



         }); 



       });



          }, 
    



    
   


  



        


   }


 
