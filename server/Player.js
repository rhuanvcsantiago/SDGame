function Player(name, gcSocket){
    this.name        = name;
    this.databaseId  = "";
    this.connections = {
                            gameCoordinatorSocket: gcSocket,
                            gameServerSocket: {}
                       }

    this.currentMatchId = "";

    this.isAlive = function(){}
    
}