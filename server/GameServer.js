var ConnectionList  = require('./myLibs.js');
var ioc      = require('socket.io-client');
var app      = require('express')();  
var http     = require('http').Server(app);  
var io       = require('socket.io')(http);

function Match(matchId, playersList){

    this.id = matchId;
    this.players = playersList;
    this.turn = 0;
    this.maxTurns = 10;
    this.clientTurnTimeOut = 30; // segundos
    this.clientActions = [];
    this.pieces = [];
    this.invalidCells = [];
    this.stats = "executing";

    this.execute = function(){
        console.log ("turno executado [ " + this.turn + " ]  com sucesso.");
    }
}

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
    var matches     = new ConnectionList();


    var matchCount = 0;
    var turnTimeOut = 30000; //milliseconds

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
                        waitingList.add( playerObj.data.gc_id, playerObj );
                        startMatch(  );
                        waitingList.clear();
                        console.log("QUEUE_LIST_LENGTH: " + waitingList.length() );
                    }       
                }
            }
        });   

    });  

    function updateMatch( matchId ){
        var match   = matches.get( matchId );  
        
        match.execute();
        match.players.broadcast( "UPDATE_MATCH", match.turn /* MATCH DATA */);
        match.turn++;  

        if( match.turn < 11 && match.stats != "finished" )
            setTimeout( updateMatch.bind(this, matchId ), 5000 );
        else
            endMatch( match );
               
    }

    function endMatch( match ){

        match.players.broadcast( "END_MATCH", match.turn /* MATCH DATA */); 
        console.log("match [ " + match.id + " ] ended.");
        matches.remove( match.id );
        

    }

    function startMatch(){

        matchCount++;
        // corrigir referencia perdida.
        // var copiedObject = jQuery.extend(true, {}, originalObject);
        matches.add( matchCount, new Match( matchCount, waitingList.clone() ) );

        updateMatch( matchCount );

        console.log("Começando partida N: " + matchCount );
        waitingList.broadcast( "START_MATCH", JSON.stringify( {matchId: matchCount} ) /* MATCH DATA */ );

    }

    http.listen(3001, function(){  
        console.log('servidor rodando em localhost:3001');
    });

    
}   

var ip = "127.0.0.1";
var port = "3001";

var adress = ip + ":" + port;

var gameServer = new GameServer("server01Rhuan", adress, "America", "http://127.0.0.1:3000");

