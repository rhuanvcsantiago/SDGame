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

        _PLAYER.socket.on('LOGIN_ACK', function(msg){
                //code
        });    
    }
    catch(err){
        showInfo(err + "\n Game coordinator offline."); 
    }  

    setScene(_SCENE_LOGIN);

}

function setScene(sceneName, vel){

    var velocity = vel || "slow";

    $( _SCENE_LOGIN ).hide();
    $( _SCENE_START ).hide();
    $( _SCENE_MATCH ).hide();

    $( sceneName ).show( velocity );

}

$(_SCENE_LOGIN).on("click", "#buttonPlay", function(){

    var loginObj = {
                        type: "player",
                        data: $("#nameLabel").val()
                    };
    
    if ( loginObj.data != "" ) 
        _PLAYER.socket.gameCoordinator.emit("LOGIN", JSON.stringify(loginObj) );
    else {
        $("#login").append("<div class='alert alert-danger'>preencha algum nick</div>");
    }    
});

function eval(code){
    _PLAYER.socket.gameCoordinator.emit("EVAL", code );
}

initialize();