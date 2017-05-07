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
    console.log( "lista de servers:" );
    console.log( serverList );

    for(var i=0; i< serverList.length; i++){
        $("#serverList").append('<div id="'+serverList[i].name+'" class="serverBox"> <ul><li>'+serverList[i].name+'</li><li>'+serverList[i].location+'</li><li class="serverIp">'+serverList[i].ip+'</li></ul> <button type="button" class="BOTAO_ENTRAR btn btn-danger btn-sm" value="' + serverList[i].name + '"> ENTRAR </button></div>');        
    }
  
    
}

function setScene(sceneName, vel){

    var velocity = vel || "slow";

    $( _SCENE_PLAY ).hide();
    $( _SCENE_SERVER_LIST ).hide();
    $( _SCENE_MATCH ).hide();

    $( sceneName ).show( velocity );

}

$(_SCENE_SERVER_LIST).on("click", ".BOTAO_ENTRAR", function(){

    
    var gameServerIp = $(this).parent().children().children("li.serverIp").text();
    //var gameServerIp = serverBox

    console.log(gameServerIp);
    //_PLAYER.socket.gameServer = io( gameServerIp );
    //setPlayer_GameServer_SocketsEvents();
                  
    /*
    var loginObj =  {
                        ack: "player",
                        data: { 
                                name: $("#nameLabel").val()
                              }
                    };
    
    if ( loginObj.data != "" ) 
        _PLAYER.socket.gameCoordinator.emit("LOGIN", JSON.stringify(loginObj) );
    else {
        showMessage("Preencha algum nick", "danger");
    }    */
});

function setPlayer_GameServer_SocketsEvents(){

    _PLAYER.socket.gameServer.on('connect', function(msg){
        
        setScene( _SCENE_MATCH );
        //envia dados do game coodinator
        showInfo("info", "Connectado com servidor e esperando jogadores...");

    });

    _PLAYER.socket.gameServer.on('connect_error', function(msg){
      
    });  


    _PLAYER.socket.gameServer.on('disconnect', function(msg){
         setScene( _SCENE_SERVER_LIST );
         showInfo("danger", "Servidor <strong>desconectado<;strong>, voltando a tela de escolha de servidores.");

         // fazer tratamento de erro de desconecao

    });


    _PLAYER.socket.gameServer.on('reconnect_attempt', function(msg){
    });

}

$(_SCENE_PLAY).on("click", "#buttonPlay", function(){

    var loginObj =  {
                        ack: "player",
                        data: { 
                                name: $("#nameLabel").val()
                              }
                    };
    
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

initialize();