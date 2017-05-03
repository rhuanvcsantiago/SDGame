function Player(){
    this.name = "";
    this.socket = {
                    gameCoordinator: {},
                    gameServer: {}
                  }       
}

var _PLAYER;
var _SCENE_LOGIN = "#login";
var _SCENE_START = "#start";
var _SCENE_MATCH = "#match";

function showInfo(info){
    
    console.log(info);

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
   
    try {
        _PLAYER.socket.gameCoordinator = io();
        
        _PLAYER.socket.gameCoordinator.on('LOGIN_ACK', function(msg){
            
            var msgObj = JSON.parse( msg );

            if( msgObj.type == 1 )
                setScene( _SCENE_START );

            console.log("logado com sucesso player: " + msg );
        });  

        _PLAYER.socket.gameCoordinator.on('SERVER_LIST_UPDATE', function(msg){
            var msgObj = JSON.parse( msg );

            updateServerList(msgObj.obj);
            
               // showMessage("Erro no UPDATE da SERVER LIST", "danger"); 
        });  
    }
    catch(err){
        showInfo(err + "\n Game coordinator offline."); 
    }  

    setScene( _SCENE_LOGIN );

}

function updateServerList(data){

    $("#serverList").empty();
    console.log( data );
    
    var arrayProperties = Object.getOwnPropertyNames(data);

    for(var i=0; i< arrayProperties.length; i++){
        var serverData = data[ arrayProperties[i] ];
        $("#serverList").append('<div id="'+serverData.name+'" class="serverBox"> <ul><li>'+serverData.name+'</li><li>'+serverData.location+'</li><li>'+serverData.adress+'</li><ul> </div>')        
    }
    // for ever element in array
    //$("#serverList").append('<div id="server01" class="serverBox"> </div>');

}

function setScene(sceneName, vel){

    var velocity = vel || "slow";

    $( _SCENE_LOGIN ).hide();
    $( _SCENE_START ).hide();
    $( _SCENE_MATCH ).hide();

    $( sceneName ).show( velocity );

}

$(_SCENE_LOGIN).on("click", "#buttonPlay", function(){

    var loginObj =  {
                        type: "player",
                        data: $("#nameLabel").val()
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