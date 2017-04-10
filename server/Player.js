function Player(){
    this.name        = "";
    this.sessionId   = "";
    this.databaseId  = "";
    this.connections = {
                            gameCoordinatorSocket: {},
                            gameServerSocket: {}
                       }
    this.matchId = "";

    this.isAlive = function(){}
    
    this.addConnection = function(){

    }
}