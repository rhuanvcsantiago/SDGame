var ConnectionList  = require('./myLibs.js');
var ioc      = require('socket.io-client');
var app      = require('express')();  
var http     = require('http').Server(app);  
var io       = require('socket.io')(http);
 
function GameServer(name, ip, location){
    
    this.data = {
                  name: name || "",
                  ip: ip || "",
                  location: location || ""
                }

    this.maxClients = 300;
    this.matches = [];
    //this.database = new Database();
    //socket para o game coordinator.
    
    //clients sockets
    //this.waitingList = new List();
    var connectedClientsHash = [];

    this.gameCoordinator = { 
                              data: { 
                                      ip: "http://127.0.0.1:3000"
                                    },
                              socket: {}   
                           };

    this.gameCoordinator.socket = ioc( this.gameCoordinator.data.ip );

    var loginObj = { ack: "server",
                     data: this.data }

    this.gameCoordinator.socket.send("LOGIN", JSON.stringify( loginObj ) );                       

    io.on('connection', function( socket ){
        
        socket.on('EVENT', function( msg ){

        });   

    });  

    http.listen(3001, function(){  
        console.log('servidor rodando em localhost:3001');
    });

    //COLOCAR CLIENTE NA LISTA DE CLIENTS
   // this.onConnection = function(){
        //AVISAR CONEXAO DO CLIENTE AO GAME COORDINATOR.
    //}
    
    /*
        
        Verifica a quantidade de clientes na lista de espera.
            Se for menor que 3
                Sdiciona cliente que esta se conectando na lista de espera
            Se for igual a 3, significa que o ultimo cliente esta se conectando.
                Verifica se os anteirores estao vivos.
                    Se tiver.
                        Cria partida com os jogadores.
                        Limpa a lista.
                    Senão.
                        Limpa cliente morto.
                        Adiciona cliente novo na lista de espera.    

    */
   // this.onReady = function(client) {

   //     if( this.waitingList.length < 3 ){
   //         this.waitingList.add(client);
   //     } else {
     //       if( this.waitingList.length == 3){
                
                //VERIFY IF EVERYONE IS ALIVE
       //         var readyToPlay = 0;
         //       for(var i=0; i< this.waitingList.length(); i++){
           //         var waitingPlayer = this.waitingList.get(i);
                    
    //                if ( waitingPlayer.isAlive() )
      //                  readyToPlay++;
        //            else {
          //              //remove cliente da lista
            //            this.waitingList.remove(i);
              //          this.waitingList.add(client);
                //        break;
 //                   }
   //             }
//
  //              if( readyToPlay == 3 ) {
    //                //pega no banco de dados o ultimo id
      //              var lastMatchId = database.getLastMatchId() +1;
        //            this.matches.add( new Match(lastMatchId, this.waitingList) );
          //          this.waitingList.clear();
            //    }       
//            }
  //      }
//    }  //ON READY
} // SERVER 

var gameServer = new GameServer();

