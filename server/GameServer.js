var ConnectionList  = require('./myLibs.js');
var ioc      = require('socket.io-client');
var app      = require('express')();  
var http     = require('http').Server(app);  
var io       = require('socket.io')(http);
 
function GameServer(name, ip, location, gameCoordinatorIp){
    
    this.data = {
                  name: name || "",
                  ip: ip || "",
                  location: location || "",
                  maxClients: 300,
                  connectedClients: 0,
                  
                }


    
    //Lista para iniciar partida. Minumo 4 players;
    var waitingList = new ConnectionList();
    var clientList  = new ConnectionList();
    var matches = [];


    var matchCount = 0;

    this.gameCoordinator = { 
                              data: { 
                                      ip: gameCoordinatorIp
                                    },
                              socket: {}   
                           };

    this.gameCoordinator.socket = ioc( this.gameCoordinator.data.ip );
    
    var loginObj = { ack: "server",
                     data: this.data }

    this.gameCoordinator.socket.on('connect', function( socket ){
          
          this.emit("LOGIN", JSON.stringify( loginObj ) ); 
          
    });

    io.on('connection', function( socket ){
        
        //console.log("cliente [ " +  socket.id + " ] conectado. total connections: " + io.engine.clientsCount); 

        socket.on('disconnect', function( msg ){
            
            var playerGsId = socket.id;
            var waitingArray = clientList.getAll();

            for( var i=0; i<waitingArray.length; i++ ){

                var waitingPlayer = waitingArray[i];
                
                if ( waitingPlayer.data.gs_id == playerGsId ){
                    clientList.remove( waitingPlayer.data.gc_id );
                    
                    if( waitingList.find(waitingPlayer.data.gc_id) )
                      waitingList.broadcast( "QUEUE_LIST", JSON.stringify( waitingList.getAllData() ) );

                    waitingList.remove( waitingPlayer.data.gc_id );
                    console.log("client: [ " + waitingPlayer.data.gc_id + " ] desconectado. " + clientList.length()  ); 
                    break;  
                }                                        
            }
        });

        socket.on('REGISTER', function( msg ){

            var playerObj = JSON.parse( msg );
            playerObj.data.gs_id = socket.id;
            playerObj.socket = socket;

            clientList.add( playerObj.data.gc_id, playerObj );

            console.log("client: [ " + playerObj.data.gc_id + " ] conectado. total clientes: " + clientList.length() ); 
            
            if( waitingList.length() < 3 ){

              waitingList.add( playerObj.data.gc_id, playerObj );
              console.log("QUEUE_LIST_LENGTH: " + waitingList.length() );
              waitingList.broadcast( "QUEUE_LIST", JSON.stringify( waitingList.getAllData() ) );

            } else {
                if( waitingList.length() == 3){
                    
                    // VERIFY IF EVERYONE IS ALIVE
                    console.log("preparing to start match, checking players...");
                    var readyToPlay = 0;
                    var waitingArray = waitingList.getAll();

                    for( var i=0; i< waitingArray.length; i++ ){

                        var waitingPlayer = waitingArray[i];
                        
                        if ( clientList.find( waitingPlayer.data.gc_id ) )
                            readyToPlay++;
                        else {
                            //remove cliente da lista
                            waitingPlayer.socket.emit("REMOVED_FROM_QUEUE");
                            waitingList.remove( waitingPlayer.data.gc_id ); 
                            break;                           
                        }

                    }
                    if( readyToPlay == 3 ) {
                        //pega no banco de dados o ultimo id
                        //var lastMatchId = database.getLastMatchId() +1;
                        //matches.add( new Match( matchCount+1, waitingList ) );
                        matchCount++;
                        waitingList.add( playerObj.data.gc_id, playerObj );
                        console.log("Começando partida N: " + matchCount );
                        //waitingList.broadcast( "START_MATCH", JSON.stringify( match.table ) );
                        waitingList.broadcast( "START_MATCH", JSON.stringify( {matchId: matchCount} ) );
                        waitingList.clear();
                        console.log("QUEUE_LIST_LENGTH: " + waitingList.length() );
                    }       
                }
            }
        });   

    });  

    http.listen(3001, function(){  
        console.log('servidor rodando em localhost:3001');
    });

    
}   

var ip = "127.0.0.1";
var port = "3001";

var adress = ip + ":" + port;

var gameServer = new GameServer("server01", adress, "America", "http://127.0.0.1:3000");

