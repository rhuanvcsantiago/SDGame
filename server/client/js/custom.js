function Player(){
    this.name = "";
    this.socket = {
                    gameCoordinator: {},
                    gameServer: {}
                  }       
}

var _PLAYER;
var _SCENE_PLAY = "#login";
var _SCENE_SERVER_LIST = "#start";
var _SCENE_MATCH = "#match";
var _SCENE_MATCH_RUNNING = "#matchrunning";


function showInfo(type, msg){
    
    $("#showInfo").empty();
    //var string = '<div class="alert alert-'+type+'">'+msg+'</div>';
    var string = '<div class="alert alert-'+type+' alert-dismissable"><a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>'+msg+'</div>';

    $("#showInfo").append(string);
    console.log(msg);

}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function initialize(){

    _PLAYER = new Player();  
    _PLAYER.socket.gameCoordinator = io();
    
    setPlayer_GameCoodinator_SocketsEvents();

    //setScene( _SCENE_SPLASH_SCREEN );
    setScene( _SCENE_PLAY );

}

function setPlayer_GameCoodinator_SocketsEvents(){


    _PLAYER.socket.gameCoordinator.on('LOGIN_ACK', function(msg){
        
        var serverResponse = JSON.parse( msg );

        if( serverResponse.ack == 1 ) {
            setScene( _SCENE_SERVER_LIST );
            showInfo("success", "logado com sucesso player-id: " + serverResponse.data );
        } 

        if( serverResponse.ack == 0 ) {
            showInfo("error", "Login Error: " + serverResponse.data );
        }   
        
    });  

    _PLAYER.socket.gameCoordinator.on('reconnect', function(msg){
        
        //setScene( _SCENE_SERVER_LIST );
        //showInfo("info", "Reconnectado. Voltando pra lista de servidores");

    });

    _PLAYER.socket.gameCoordinator.on('SERVER_LIST_UPDATE', function(msg){
        
        var serverList = JSON.parse( msg );
        updateServerList(serverList);
        
    });  

    _PLAYER.socket.gameCoordinator.on('connect', function(msg){
        
        showInfo("info", "Game coordinator is <strong>ONLINE!</strong>");
        $("#buttonPlay").removeAttr("disabled");

    });

    _PLAYER.socket.gameCoordinator.on('connect_error', function(msg){
        
        //setScene( _SCENE_PLAY );
        showInfo("warning", "Erro de conexão com o servidor. Tipo de erro: " + msg);

    });  

    _PLAYER.socket.gameCoordinator.on('disconnect', function(msg){
        
        setScene( _SCENE_PLAY );
        showInfo("danger", "Desconnectado. Sua internet caiu ou o Servidor está offline?");
        $("#buttonPlay").attr("disabled","disabled");

    });

    

    _PLAYER.socket.gameCoordinator.on('reconnect_attempt', function(msg){
        
        showInfo("info","Tentativas de reconexão: " + msg);

    });

}

function updateServerList(serverList){

    $("#serverList").empty();
  
    for(var i=0; i<serverList.length; i++){
        $("#serverList").append('<div id="'+serverList[i].name+'" class="serverBox"> <ul><li>'+serverList[i].name+'</li><li>'+serverList[i].location+'</li><li class="serverIp">'+serverList[i].ip+'</li></ul> <button type="button" class="BOTAO_ENTRAR btn btn-danger btn-sm" value="' + serverList[i].name + '"> ENTRAR </button></div>');        
    }
  
    
}

function setScene(sceneName, vel){

    var velocity = vel || "slow";

    $( _SCENE_PLAY ).hide();
    $( _SCENE_SERVER_LIST ).hide();
    $( _SCENE_MATCH ).hide();
    $( _SCENE_MATCH_RUNNING ).hide();

    $( sceneName ).show( velocity );

}

$(_SCENE_SERVER_LIST).on("click", ".BOTAO_ENTRAR", function(){

    var gameServerIp = $(this).parent().children().children("li.serverIp").text();
    //var gameServerIp = serverBox

    console.log(gameServerIp);
    $(this).attr("disabled","disabled");
    _PLAYER.socket.gameServer = io( gameServerIp );
    setPlayer_GameServer_SocketsEvents();
                
});

function setPlayer_GameServer_SocketsEvents(){

    _PLAYER.socket.gameServer.on('connect', function(msg){
        
        setScene( _SCENE_MATCH );
        //envia dados do game coodinator
        showInfo("info", "Connectado com servidor e esperando jogadores...");
        
        var playerObj =  {
                            data:{
                                name: _PLAYER.name,
                                gc_id: _PLAYER.socket.gameCoordinator.id,
                                gs_id: this.id,
                                currentMatch: null
                            },
                            socket: {}  
                         }

        this.emit( "REGISTER", JSON.stringify(playerObj) );

        $(".BOTAO_ENTRAR").removeAttr("disabled"); 

    });

    // implementar no server
    _PLAYER.socket.gameServer.on('QUEUE_LIST', function(msg){

        var msgObj = JSON.parse(msg);
        console.log( msgObj );
        //msgObj.arrayPlayersId;
        $("#queue_list").empty();

        for (var key in msgObj) {
            if (msgObj.hasOwnProperty(key)) {
                var element = msgObj[key];
                $("#queue_list").append( "<li>" + element.name + "</li>" );
            }
        }
        
        
    });

    _PLAYER.socket.gameServer.on('REMOVED_FROM_QUEUE', function(msg){

        showInfo("danger","Você foi removida da lista de espera por <strong>INATIVIDADE</strong>");
        setScene( _SCENE_SERVER_LIST );  
        _PLAYER.socket.gameServer.close();

    });
    
    _PLAYER.socket.gameServer.on('connect_error', function(msg){
         setScene( _SCENE_SERVER_LIST );
         showInfo("danger", "Erro de conexão com servidor, voltando a tela de escolha de servidores.");
         _PLAYER.socket.gameServer.close();
    });  


    _PLAYER.socket.gameServer.on('disconnect', function(msg){
         setScene( _SCENE_SERVER_LIST );
         showInfo("danger", "Servidor <strong>desconectado</strong>, voltando a tela de escolha de servidores.");
         _PLAYER.socket.gameServer.close();
         // fazer tratamento de erro de desconecao
    });

    // implementar no server
    _PLAYER.socket.gameServer.on('START_MATCH', function(msg){

        var matchData = JSON.parse(msg);
        //msgObj.matchId;
        setScene( _SCENE_MATCH_RUNNING );
        showInfo("success", "Partida <strong> [ " + matchData.id + " ] </strong> iniciada");
        createPlayerReadyMenu( matchData.playersList );

    });

    _PLAYER.socket.gameServer.on('UPDATE_MATCH', function(msg){
        var matchData = JSON.parse(msg);
        _matchData = matchData; 

        $(".move_button").removeAttr("disabled"); 
        $("#commitCommandsButton").removeAttr("disabled"); 
        
        $("#playerListReady .col-2").css("background-color", "white"); 
       
        $("#turnoNumber").text(matchData.turn);

        cleanCommands();
        $("#playerCommands").css( "color", "red" );
        $("#playerCommands").text( "nenhum comando enviado nesse turno ainda." );

        console.log("TURNO [" + matchData.turn + "] Iniciado. 30 segundos para jogar"); 
        console.log(matchData);
        printTable(matchData.table);
        drawTable(matchData.table);
        refreshCountDown();

    });

    _PLAYER.socket.gameServer.on('PLAYER_READY', function(playerId){

        var id = "#waitingPlayer" + playerId;
        $(id).css("background-color", "green");

    });

    _PLAYER.socket.gameServer.on('END_MATCH', function(msg){
        var matchData = JSON.parse(msg);
        console.log("PARTIDA " + matchData.id + " ENCERRADA endData");
        
        refreshCountDown(10);

        setTimeout( function(){ 
            setScene( _SCENE_SERVER_LIST ); 
        }, 10000 );
    });

}

$(_SCENE_PLAY).on("click", "#buttonPlay", function(){

    var loginObj =  {
                        ack: "player",
                        data: { 
                                name: $("#nameLabel").val()
                              }
                    };
    _PLAYER.name = $("#nameLabel").val();
    if ( loginObj.data != "" ) 
        _PLAYER.socket.gameCoordinator.emit("LOGIN", JSON.stringify(loginObj) );
    else {
        showMessage("Preencha algum nick", "danger");
    }    
});

function eval2(code){
    _PLAYER.socket.gameCoordinator.emit("EVAL", code );
}

function showMessage(msg, type){

    var type = type || "";
    var msg  = msg  || "";

    if(type == "danger"){ 
        $("#wrapper").append("<div class='alert alert-danger'>"+ msg +"</div>");
    }
    else if (type == "warning") {
        $("#wrapper").append("<div class='alert alert-warning'>"+ msg +"</div>");
    } else {
        $("#wrapper").append("<div class='alert alert-info'>"+ msg +"</div>");
    }   
            
        
}

var _playerCommands = [];

function addCommand(type, value){
    
    var command = {
                    type: type,
                    value: value
                  }

    if( _playerCommands.length < 3 ){
        _playerCommands.push( command );

        if( _playerCommands.length == 3 ){
            $(".move_button").attr("disabled","disabled");
        }

    } 

    showCommands();   

}

function cleanCommands(){
    $(".move_button").removeAttr("disabled");  
    _playerCommands = []; 
    $("#playerCommands").css( "color", "red" );
    $("#playerCommands").text( "nenhum comando enviado nesse turno ainda." );
    //showCommands();
}

function showCommands(){

    var string = "";

    for (var index = 0; index < _playerCommands.length; index++) {
        var element = _playerCommands[index];
        string += " ("+ (index+1) + ") " + element.type + "->" + element.value + " ";
    }

    $("#playerCommands").css( "color", "gray" );
    $("#playerCommands").text( string );

}

function commitCommands(){

    _PLAYER.socket.gameServer.emit("TURN_COMMANDS", JSON.stringify( _playerCommands ) );
    
    $("#playerCommands").css( "color", "green" );
    $("#playerCommands").text( "comandos enviados" );
    
    $(".move_button").attr("disabled","disabled");
    $("#commitCommandsButton").attr("disabled","disabled");

}

var _countDownTime = 30;
var _lastInterval;
function refreshCountDown(time){
    clearInterval(_lastInterval);
    _countDownTime = time || 30;
    _lastInterval = setInterval(function() {
        
        $("#countDown").text(_countDownTime);
        _countDownTime--;
        if( _countDownTime < 0 )
            _countDownTime = 0

    }, 1000 );
}

function createPlayerReadyMenu(playerList){
    
    $("#playerListReady").empty();

    for (var key in playerList) {
        if (playerList.hasOwnProperty(key)) {
            var player = playerList[key];
            var id = "#waitingPlayerName" + key;
              
            var x = "";
                x += '<div class="col-3">';
                x +=    '<div class="row">';
                x +=    '    <div id="waitingPlayer' + key + '" class="col-2" style="background-color:white">';
                x +=    '        X';
                x +=    '    </div>';
                x +=    '    <div id="waitingPlayerName' + key + '" class="col-9">';
                x +=            player.name.substring(0, 6);
                x +=     '    </div>' ;
                x +=    '</div>';
                x += '</div>';

          $("#playerListReady").append(x); 
          $(id).css("background-color", player.color);    

        }
    }

}

var _matchData;

function printTable(table){
    console.log(" === begin print === \n");
    for( var i = 0; i < 8; i++ ){
        var row = "";
        for( var j = 0; j < 8; j++ ){            
            var cell = table[i][j];
            if( cell.length == 0 )
                row += "[    ] ";
            else {
                var piece = cell[0];

                if(piece.type == "block")
                    row += "[XXXX] ";
                else
                    row += "[" + _matchData.playersList[piece.playerId].name.substr(0,4) + "] ";                    
            }
                
        }
        console.log(row+"\n");
        row = "";
    }    
    console.log(" === end print === \n");
}

function cleanTable(){

    var cellTextId;
    for( var i = 0; i < 8; i++ ){
        for( var j = 0; j < 8; j++ ){
            cellTextId = "#cell" + (i+1) + (j+1);
            $(cellTextId).css("background-color", "gray"); 
            $(cellTextId).css("color", "black"); 
            $(cellTextId).html("&nbsp");
        }   
    }

}

function drawTable(table){
    
    cleanTable();

    for( var i = 0; i < 8; i++ ){
        for( var j = 0; j < 8; j++ ){            
            
            var cell = table[i][j];
            var cellTextId = "#cell" + (i+1) + (j+1);

            if( cell.length < 1 ) {
                $(cellTextId).css("color", "black"); 
                $(cellTextId).html("&nbsp");
            }
            else if (cell.length == 1 ){
                
                var piece = cell[0];
                
                if(piece.type == "block")
                    $(cellTextId).css("background-color", "black");

                else {
                    var pieceText = "";
                    if(piece.lookingAt == "right")
                        pieceText = "►";
                    if(piece.lookingAt == "left")
                        pieceText = "◀";
                    if(piece.lookingAt == "down")
                        pieceText = "▼";
                    if(piece.lookingAt == "up")
                        pieceText = "▲";

                    $(cellTextId).css("color", piece.color);    
                    $(cellTextId).text(pieceText);
                }     
            } else {
                $(cellTextId).text(cell.length);
            }
        }
    }    
}


initialize();