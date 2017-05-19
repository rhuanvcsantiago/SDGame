var ConnectionList  = require('./myLibs.js');
var ioc      = require('socket.io-client');
var app      = require('express')();  
var http     = require('http').Server(app);  
var io       = require('socket.io')(http);

function Match(matchId, playersList){

    this.data = {
        id: matchId,
        table: [],
        turn: 0,
        maxTurns: 10,
        playersList: [],
        playerTurnTimeOut: 30000, //milisec
        stats: undefined //{type: executing/finished, value:}              
    }

    this.playerTurnActions = new ConnectionList(); // [playerID] = array("right", "r_left", "botton");
    this.nextTurn;
    this.players = playersList;
    this.rocksAmmount = 8;

    this.execute = function(){
        //applyTurnActions();
        //checkLastPlayerStand();
        console.log ("Executando turno [ " + this.data.turn + " ]  ...");
    }

    function checkLastPlayerStand(){
        
        var hasMoreThanOnePlayer = false;
        var firstPlayer = undefined;
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){            
                
                if( table[i][j].length > 0 ){
                    var piece = getPiece(i,j);
                
                    if(firstPlayer){
                        firstPlayer = piece.playerId;
                    }

                    if( piece.playerId != firstPlayer)
                        hasMoreThanOnePlayer = true;
                }
            }
        }

    }

    this.initialize = function(){
        //createTable();
        //randomizePlayersPositions();
        //randomizeBlocksPositions();
        this.data.playersList = this.players.getAllData();
        this.data.stats = 'executing';
    }

    this.addPlayerTurnCommand = function( playerId, turnCommand){
        this.playerTurnActions.add(playerId, turnCommand);    
    }

    function createTable(){}
    function randomizePlayersPositions(){}
    function randomizeBlocksPositions(){}
    
    function solveConflicts(){
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){            
                if( table[i][j].length > 1 )
                    solveConflict(i,j);
            }
        }
    }

    function solveConflict(i, j){
        //var piecesArray = table[i][j];
    }

    function applyTurnActions(){  
        // execute 3 actions per turn
        for( var k = 0; k < 3; k++ ) {
             
            for ( var playerId in this.playerTurnActions ) {              
                
                var playerActions = this.playerTurnActions[playerId];

                if( playerActions != undefined ){

                    var action = this.playerTurnActions[playerId][k]; 
                    if( action != undefined )
                     tryMovePlayerPieces( playerId, i, j, action );

                }
            }
            solveConflicts();
        } 
        cleanTurnActions();
    } 

    function cleanTurnActions(){
        this.playerTurnActions.clean();
    }

    function tryMovePlayerPieces(playerId, i, j, action){
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){
                
                var piece = getPiece(i, j);
                if( piece.playerId == playerId )
                    tryMovePiece(i, j, action);

            }
        }
    }

    function isOutOfTable(i,j){
        if(i < 0 || i > 7 || j < 0 || j > 7)
            return true;
        return false;    
    }

    function getPiece(i,j){
        return table[i][j][0]
    }

    function tryMovePiece(i, j, action){

        var piece = getPiece(i, j);

        // se é uma rotação, apenas muda a variável da peça
        if( action.type == "rotate"){
            if( action.value == "right" ){
                if( piece.lookingAt == "right" )
                    piece.lookingAt = "down";

                if( piece.lookingAt == "down" )
                    piece.lookingAt = "left";

                if( piece.lookingAt == "left" )
                    piece.lookingAt = "up";

                if( piece.lookingAt == "up" )
                    piece.lookingAt = "right";            
            } else {
                if( piece.lookingAt == "right" )
                    piece.lookingAt = "up";

                if( piece.lookingAt == "up" )
                    piece.lookingAt = "left";

                if( piece.lookingAt == "left" )
                    piece.lookingAt = "down";

                if( piece.lookingAt == "down" )
                    piece.lookingAt = "right";  
            }
        } else { // se é um movimento, calcula qual a posicão.

            var next_i;
            var next_j;

            if( action.value == "left"){
                next_i = i-1;
                next_j = j;    
            }
            if( action.value == "right"){
                next_i = i+1;
                next_j = j;
            }
            if( action.value == "down"){
                next_i = i;
                next_j = j+1;
            }
            if( action.value == "up"){
                next_i = i;
                next_j = j-1;
            }

            // se a posição de movimento desejada não é fora do tabuleiro
            if( !isOutOfTable(next_i, next_j) ){

                piece.lastPosition_x = i;
                piece.lastPosition_y = j;

                var next_piece = getPiece(next_i, next_j);

                // se a posição desejada não é uma pedra
                if( next_piece.type != "rock" ) {
                    table[next_i][next_j].push( piece );
                }
                
            }

        }
    }

    this.initialize();

}
// piece{playerId, type}
// action{type, value}
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

    function getGameCoordinatorId(gameSerderId){
        var clientArray = clientList.getAllData();
        
        for (var i = 0; i < clientArray.length; i++) {
            var element = clientArray[i];
            if( element.gs_id == gameSerderId )
                return element.gc_id;
        } 

        return false;

    }

    io.on('connection', function( socket ){
        
        //console.log("cliente [ " +  socket.id + " ] conectado. total connections: " + io.engine.clientsCount); 

        socket.on('disconnect', function( msg ){
            
            var playerGsId = socket.id;
            var playerGcId = getGameCoordinatorId( playerGsId );
            

            if( waitingList.find( playerGcId ) ){
                waitingList.remove( playerGcId );
                waitingList.broadcast( "QUEUE_LIST", JSON.stringify( waitingList.getAllData() ) );
            }

            if( clientList.find( playerGcId ) ) {
                console.log("player: [" + clientList.get( playerGcId ).data.name + "] id: [" + playerGcId +"] desconectou."); 
                clientList.remove( playerGcId );
            } 
            else
                throw("Erro ao disconectar player id: [" + playerGcId +"] desconectou.");
        });

        socket.on( 'TURN_COMMANDS', function( msg ){

            var turnCommand = JSON.parse(msg);

            var playerGcId = getGameCoordinatorId(socket.id);

            if( playerGcId ) {

                var matchId = getPlayerMatchId( playerGcId );

                if( matchId ){

                    var match = matches.get(matchId);
                    match.addPlayerTurnCommand( playerGcId, turnCommand);
                    match.players.broadcast( "PLAYER_READY", playerGcId );

                    if( match.playerTurnActions.length() == 4 ){
                        clearTimeout( match.nextTurn );
                        updateMatch( matchId );
                    }

                }
                else
                    throw("fudeu, nao achou um MATCH_ID referente a esse playerGcId");
            } 
            else
                throw("fudeu, nao achou um ID do GC referente a esse GS ID do player");
            
        });

        function getPlayerMatchId( playerId ){
            var matchsArray = matches.getAll();

            for (var i = 0; i < matchsArray.length; i++) {
                var match = matchsArray[i];
                if( match.players.find( playerId ) )
                    return match.data.id;
            }

            throw ("ERROR: getPlayerMatchId() - Não existe nenhuma partida rolando que tenha o jogador-id: "+ playerId);     
        }
        
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
                        
                        waitingList.add( playerObj.data.gc_id, playerObj );
                        startMatch();
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
        match.players.broadcast( "UPDATE_MATCH", match.data /* MATCH DATA */);
        match.data.turn++;  

        if( match.data.turn < 11 && match.stats != "finished" )
            match.nextTurn = setTimeout( updateMatch.bind(this, matchId ), match.data.playerTurnTimeOut );
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

        for (var key in waitingList.client) {
            clientList.get(key).data.currentMatch = matchCount;
        }

        var match = new Match( matchCount, waitingList.clone() );
        matches.add( matchCount, match );

        waitingList.broadcast( "START_MATCH", JSON.stringify( match.data ) /* MATCH DATA */ );
      
        updateMatch( matchCount );

        console.log("Começando partida N: " + matchCount );

    }

    http.listen(3001, function(){  
        console.log('servidor rodando em localhost:3001');
    });

    
}   

var ip = "127.0.0.1";
var port = "3001";

var adress = ip + ":" + port;

var gameServer = new GameServer("server01Rhuan", adress, "America", "http://127.0.0.1:3000");

