function Match(){

    this.id;
    this.players = [];

    var table = [
                    [], [], [], [], [], [], [], []


                ]

    
    this.createRawTable = function(){

    } 


}

function Cell(){
    this.type = "nothing";
    this.value = {};
}

function Player(){
    this.name   = "";
    this.socket = {};
}

function Server(){
    this.matches = [];
    this.database = new Database();

    //clients sockets
    this.waitingList = new WaitingList();
    
    /*
        
        Verifica a quantidade de clientes na lista de espera.
            Se for menor que 3
                Sdiciona cliente que esta se conectando na lista de espera
            Se for igual a 3, significa que o ultimo cliente esta se conectando.
                Verifica se os anteirores estao vivos.
                    Se tiver.
                        Cria partida com os jogadores.
                        Limpa a lista.
                    Senão.
                        Limpa cliente morto.
                        Adiciona cliente novo na lista de espera.    

    */
    this.onConnection = function(client) {

        if( this.waitingList.length < 3 ){
            this.waitingList.add(client);
        } else {
            if( this.waitingList.length == 3){
                
                //VERIFY IF EVERYONE IS ALIVE
                var readyToPlay = 0;
                for(var i=0; i< his.waitingList.length; i++){
                    var waitingClient = this.waitingList[i];
                    
                    if ( waitingClient.isAlive() )
                        readyToPlay++;
                    else {
                        //remove cliente da lista
                        this.waitingList.remove(i);
                        this.waitingList.add(client);
                        break;
                    }
                }

                if( readyToPlay == 3 ) {
                    //pega no banco de dados o ultimo id
                    var lastMatchId = database.getLastMatchId();
                    this.matches.add( new Match(lastMatchId, this.waitingList) );
                    this.waitingList.clear();
                }       
            }
        }

    }  //ON CONNECTION
} // SERVER 

function Database(){}
function WaitingList(){
    
    this.clientsList = [];
    this.add    = function(){}
    this.remove = function(){}
    this.clear  = function(){}
}
