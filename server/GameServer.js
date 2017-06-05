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
    this.players = playersList || new ConnectionList();
    this.rocksAmmount = 8;
    this.ignoreMovedPiecesArray = [];

    this.execute = function(){
        this.applyTurnActions();
        this.cleanTurnActions();        
        //checkLastPlayerStand();
        console.log ("Executando partida [ " + this.data.id + " ] turno [ " + this.data.turn + " ]  ...");
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    this.getRandomIntEmptyCell = function(minX, maxX, minY, maxY) {
       
        var flag = true;
        var x,y,cell;
                
        while(flag){
            x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
            y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
            cell = this.data.table[ x ][ y ];
            
            if( cell.length == 0 )  
                flag = false;  
        }

        return {x:x, y:y}
    }

    function checkLastPlayerStand(){
        
        var hasMoreThanOnePlayer = false;
        var firstPlayer = undefined;
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){            
                
                if( this.data.table[i][j].length > 0 ){
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

    this.printTable = function(){
        console.log(" === begin print === \n");
        for( var i = 0; i < 8; i++ ){
            var row = "";
            for( var j = 0; j < 8; j++ ){            
                var cell = this.data.table[i][j];
                if( cell.length == 0 )
                    row += "[    ] ";
                else {
                    var piece = cell[0];

                    if(piece.type == "block")
                        row += "[XXXX] ";
                    else
                        row += "[" + this.players.get( piece.playerId ).data.name.substr(0,4) + "] ";                    
                }
                    
            }
            console.log(row+"\n");
            row = "";
        }    
        console.log(" === end print === \n");

    }

    this.initialize = function(){
        this.createTable();
        this.randomizeBlocksPositions();
        this.randomizePlayersPositions();
        //this.printTable();
        this.data.playersList = this.players.getAllDataObj();
        this.data.stats = 'executing';
    }

    this.addPlayerTurnCommand = function( playerId, turnCommand){
        this.playerTurnActions.add(playerId, turnCommand);    
    }

    this.createTable = function(){
        
        this.data.table = [];

        for( var i = 0; i < 8; i++ ){
        
            this.data.table[i] = [];
        
            for( var j = 0; j < 8; j++ ){            
                this.data.table[i][j] = [];
            }
        }    
    }

     this.randomizePlayersPositions = function(){

        var lookingAtArray = ["left", "right", "up", "down"];
        var colors = ["red", "pink", "blue", "yellow"];
        var count = 0;

        for ( var key in this.players.client ) {

            var player = this.players.get(key); 
            
            var randomColorPos = getRandomInt(0, colors.length-1);
            var randomColor = colors[ randomColorPos ];
            colors.splice(randomColorPos, 1);

            player.data.color = randomColor;

            for (var i = 0; i < 3; i++) {
                var piece = {
                                type: 'player',
                                playerId: key,
                                playerName: player.data.name,
                                color: randomColor,
                                lookingAt: lookingAtArray[getRandomInt(0, lookingAtArray.length-1)]
                            }
                
                var position = {};

                if(count == 0)
                    position = this.getRandomIntEmptyCell(0, 3, 0, 3);
                if(count == 1)
                    position = this.getRandomIntEmptyCell(0, 3, 4, 7);
                if(count == 2)
                    position = this.getRandomIntEmptyCell(4, 7, 0, 3);
                if(count == 3)
                    position = this.getRandomIntEmptyCell(4, 7, 4, 7);

                 this.data.table[position.x][position.y].push(piece);     
            } //end if 3 pieces creation
            count++;
        }//end players array
    } //end function
    
     this.randomizeBlocksPositions = function(){   

        /*  xy xy xy xy     xy xy xy xy
            00 01 02 03     04 05 06 07
            10 11 12 13     14 15 16 17
            20 21 22 23     24 25 26 27
            30 31 32 33     34 35 36 37
        
        
            40 41 42 43     44 45 46 47
            50 51 52 53     54 55 56 57
            60 61 62 63     64 65 66 67
            70 71 72 73     74 75 76 77
        */
        
        var position = this.getRandomIntEmptyCell(0, 3, 0, 3);
        this.data.table[position.x][position.y].push( {type:"block"} ); 
        position = this.getRandomIntEmptyCell(0, 3, 0, 3);
        this.data.table[position.x][position.y].push( {type:"block"} );

        position = this.getRandomIntEmptyCell(0, 3, 4, 7);
        this.data.table[position.x][position.y].push( {type:"block"} );
        position = this.getRandomIntEmptyCell(0, 3, 4, 7);
        this.data.table[position.x][position.y].push( {type:"block"} );

        position = this.getRandomIntEmptyCell(4, 7, 0, 3);
        this.data.table[position.x][position.y].push( {type:"block"} );
        position = this.getRandomIntEmptyCell(4, 7, 0, 3);
        this.data.table[position.x][position.y].push( {type:"block"} );

        position = this.getRandomIntEmptyCell(4, 3, 4, 7);
        this.data.table[position.x][position.y].push( {type:"block"} );
        position = this.getRandomIntEmptyCell(4, 7, 4, 7);
        this.data.table[position.x][position.y].push( {type:"block"} );       

    }
    
    this.solveConflicts = function(){
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){            
                if( this.data.table[i][j].length > 1 )
                    this.solveConflictRandomly(i, j);
            }
        }
    }

    this.solveConflictRandomly = function (i, j){

        var piecesArray = this.data.table[i][j];
        var random = getRandomInt(0, piecesArray.length-1)
        var piece = piecesArray.splice(random, 1)[0];

        this.data.table[i][j] = [];
        this.data.table[i][j].push(piece);

    }

     this.applyTurnActions = function(){  
        // execute 3 actions per turn
        for( var k = 0; k < 3; k++ ) {
             
            for ( var playerId in this.playerTurnActions.client ) {              
                
                var playerActions = this.playerTurnActions.get(playerId);

                if( playerActions != undefined ){

                    var action = playerActions[k]; 
                    if( action != undefined )
                        this.findPlayerPiece( playerId, action );

                }
            }
            this.solveConflicts();
        } 
        this.cleanTurnActions();
    } 

    this.cleanTurnActions = function(){
        this.playerTurnActions.clear();
    }

    this.findPlayerPiece = function(playerId, action){
        for( var i = 0; i < 8; i++ ){
            for( var j = 0; j < 8; j++ ){
                // verifica se foi uma peça movida pra frente
                if( !this.isMovedPiece(i, j) ){
                    var piece = this.getPiece(i, j);
                    if( piece && piece.playerId == playerId )
                        this.tryMovePiece(i, j, action);
                }
            }
        }
        // remove da lista todas as peças movidas, porque já pegamos todas.
        this.ignoreMovedPiecesArray = [];
    }

    this.isMovedPiece = function(x, y){
        for (var i = 0; i < this.ignoreMovedPiecesArray.length; i++) {
            var element = this.ignoreMovedPiecesArray[i];
            if( (element.x == x) && ( element.y == y ) )
                return true;
        }    
        return false;
    }

    function isOutOfTable(i, j){
        if(i < 0 || i > 7 || j < 0 || j > 7)
            return true;
        return false;    
    }

    this.getPiece = function(i, j){
        var cell = this.data.table[i][j];

        if( cell.length == 1 )
            return cell[0];
        else
            return null;    
    }

    this.tryMovePiece = function(i, j, action){

        var piece = this.getPiece(i, j);

        // se é uma rotação, apenas muda a variável da peça
        if( action.type == "rotate"){
            if( action.value == "right" ){
                if( piece.lookingAt == "right" )
                    piece.lookingAt = "down";

                else if( piece.lookingAt == "down" )
                    piece.lookingAt = "left";

                else if( piece.lookingAt == "left" )
                    piece.lookingAt = "up";

                else if( piece.lookingAt == "up" )
                    piece.lookingAt = "right";            
            } else if (action.value == "left"){
                if( piece.lookingAt == "right" )
                    piece.lookingAt = "up";

                else if( piece.lookingAt == "up" )
                    piece.lookingAt = "left";

                else if( piece.lookingAt == "left" )
                    piece.lookingAt = "down";

                else if( piece.lookingAt == "down" )
                    piece.lookingAt = "right";  
            }

            this.data.table[i][j] = [];
            this.data.table[i][j].push( piece );

        } else { // se é um movimento, calcula qual a posicão.

            var next_i;
            var next_j;

            if( action.value == "left"){
                next_i = i;
                next_j = j-1;    
            }
            if( action.value == "right"){
                next_i = i;
                next_j = j+1;
            }
            if( action.value == "down"){
                next_i = i+1;
                next_j = j;
            }
            if( action.value == "up"){
                next_i = i-1;
                next_j = j;
            }

            // se a posição de movimento desejada não é fora do tabuleiro
            if( !isOutOfTable(next_i, next_j) ){

                piece.lastPosition_x = i;
                piece.lastPosition_y = j;

                var next_piece = this.getPiece(next_i, next_j);

                // se é nulo bloco é nulo
                if( (!next_piece) || ( (next_piece.type != "block") && (piece.playerId != next_piece.playerId) ) ){
                    this.data.table[next_i][next_j].push( piece );
                    this.data.table[i][j] = [];
                    this.ignoreMovedPiecesArray.push( {x:next_i, y:next_j} );    
                }
                        
            }

        }
    }

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

    var gameCoordinatorSocket = this.gameCoordinator.socket;
    
    var loginObj = { ack: "server",
                     data: this.data }

    this.gameCoordinator.socket.on('connect', function( socket ){
          
          this.emit("LOGIN", JSON.stringify( loginObj ) ); 
          // SAVING GAME STATE
          setInterval( function(){
                                    gameCoordinatorSocket.emit("SAVE_SERVER_STATE", JSON.stringify( matches.getAllData() ));
                                 }, 15000 );   
    });

    this.gameCoordinator.socket.on( 'RESTORE_SERVER_STATE', function( msg ){
            var matchesBackup = JSON.parse(msg);
            matchCount = -1;

            for (var i = 0; i < matchesBackup.length; i++) {
                var matchBck = matchesBackup[i];
                
                if( matchBck.id > matchCount)
                    matchCount = matchBck.id;

                var match = new Match( matchBck.id );
                match.data.table = matchBck.table;
                match.data.playersList = matchBck.playersList;
                match.data.turn = matchBck.turn;

                matches.add( matchBck.id, match );
            
                updateMatch( matchCount );

                console.log("Retomando partida N: " + matchBck.id );    
            
            }
   
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

                var matchId = findPlayerMatchId( playerGcId );

                if( matchId ){

                    var match = matches.get(matchId);
                    match.addPlayerTurnCommand( playerGcId, turnCommand);
                    match.players.broadcast( "PLAYER_READY", playerGcId );

                    if( match.playerTurnActions.length() == 4 ){
                        clearTimeout( match.nextTurn );
                        updateMatch( matchId );
                    }

                }
                //else
                  //  throw("fudeu, nao achou um MATCH_ID referente a esse playerGcId");
            } 
            //else
              //  throw("fudeu, nao achou um ID do GC referente a esse GS ID do player");
            
        });
        

        function findPlayerMatchId( playerId ){
            var matchsArray = matches.getAll();

            for (var i = 0; i < matchsArray.length; i++) {
                var playerListLocal = matchsArray[i].data.playersList;
                if( playerListLocal[playerId] != undefined )
                        return matchsArray[i].data.id;
            }
            return false;
            //throw ("ERROR: getPlayerMatchId() - Não existe nenhuma partida rolando que tenha o jogador-id: "+ playerId);     
        }

        function getPlayerMatchId( playerId ){
            var matchsArray = matches.getAll();

            for (var i = 0; i < matchsArray.length; i++) {
                var match = matchsArray[i];
                if( match.players.find( playerId ) )
                    return match.data.id;
            }

            return false;

            //throw ("ERROR: getPlayerMatchId() - Não existe nenhuma partida rolando que tenha o jogador-id: "+ playerId);     
        }
        
        socket.on('REGISTER', function( msg ){

            var playerObj = JSON.parse( msg );
            playerObj.data.gs_id = socket.id;
            playerObj.socket = socket;

            clientList.add( playerObj.data.gc_id, playerObj );

            console.log("client: [ " + playerObj.data.gc_id + " ] conectado. total clientes: " + clientList.length() ); 
            
            // Verifica se tem jogo ativo
            var matchFoundedId =  findPlayerMatchId( playerObj.data.gc_id ); //getPlayerMatchId
            
            if( matchFoundedId ) {

                var match = matches.get(matchFoundedId);
                match.players.add( playerObj.data.gc_id, playerObj );
                playerObj.socket.emit("RETURN_TO_MATCH", JSON.stringify( match.data)) ;

            }

            else { // se nao tem jogo em aberto
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
            }
        });   

    });  
    
    function updateMatch( matchId ){

        //backup de partidas
        

        var match   = matches.get( matchId );  
        
        match.execute();
        
        if(match.players)
            match.players.broadcast( "UPDATE_MATCH", JSON.stringify( match.data ) /* MATCH DATA */);
        
        match.data.turn++;  

        if( match.data.turn < 11 && match.stats != "finished" )
            match.nextTurn = setTimeout( updateMatch.bind(this, matchId), match.data.playerTurnTimeOut );
        else
            endMatch( match );
               
    }

    function endMatch( match ){

        match.players.broadcast( "END_MATCH", JSON.stringify( match.data ) /* MATCH DATA */); 
        console.log("match [ " + match.data.id + " ] ended.");
        matches.remove( match.data.id );
        
    }

    function startMatch(){

        matchCount++;

        for (var key in waitingList.client) {
            clientList.get(key).data.currentMatch = matchCount;
        }

        var match = new Match( matchCount, waitingList.clone() );
        match.initialize();
        matches.add( matchCount, match );

        waitingList.broadcast( "START_MATCH", JSON.stringify( match.data ) /* MATCH DATA */ );
      
        updateMatch( matchCount );

        console.log("Começando partida N: " + matchCount );

    }

    http.listen(3001, function(){  
        console.log('servidor rodando em localhost:3001');
    });

    
    
}   

//var ip = "127.0.0.1";
var ip = "127.0.0.1";
var port = "3001";

var adress = ip + ":" + port;

var gameServer = new GameServer("server01Rhuan", adress, "America", "http://127.0.0.1:3000");



