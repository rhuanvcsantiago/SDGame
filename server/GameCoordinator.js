var app     = require('express')();  
var http    = require('http').Server(app);  
var io      = require('socket.io')(http);

function ConnectionList(){
    
    this.client = {};

    this.add = function(id, value){
        
        if( id ) 
            this.client[id] = value;
        else
            throw "Não da pra adicionar um valor [ " + id + " ] ao dicionario hash;";
    }

    this.remove = function(id){
        delete this.client[id];
    }
    
    this.clear = function(){
        delete this.client;
        this.client = {};
    }

    this.length = function(){
        return Object.keys( this.client ).length;
    }

    this.get  = function(id){
        return this.client[id];
    }

    this.getAll= function(){        
        return Object.values(this.client);  
    } 

    this.broadcast = function(evt, msg){        
        for (var key in this.client) {
            this.client[key].socket.emit(evt, msg);     
        }
    } 

    this.getData  = function(id){
        return this.client[id].data;
    }

    this.getAllData = function(evt, msg){        
        var array = [];
        
        for (var key in this.client) {
            array.push( this.client[key].data );         
        }

        return array;
    }   

}

function Player(name, socket){
    this.data = {
                    name: name || ""
                }
    this.socket = socket;
}

function GameServer(name, ip, location, socket){

    this.data = {
                    name: name || "",
                    ip: ip || "",
                    location: location || ""
                }  
    this.socket = socket;
}

function GameCoordinator(){
    
    var clientList = new ConnectionList();
    var serverList = new ConnectionList();

    // serverList.add( "kjlolDggk3D124Asdasad", new GameServer("server01", "177.1.8.1:3001", "brazil", {} ));
    // serverList.add( "o123SDggk3Drhfdg2asad", new GameServer("server02", "156.7.2.1:3001", "america", {} ));
    // serverList.add( "njkjftyhsgk3D1244asad", new GameServer("server14", "176.8.2.1:3001", "china", {} ));
    
    io.on('connection', function( socket ){  

        console.log( "cliente [ " +  socket.id + " ] conectado. total: " + io.engine.clientsCount );       
        // DEFINICAO -> ENVIAR LOGMESSAGE: Evento para menssagens de log do sistema no cliente.
    
        socket.on('FINDGAME', function( msg ){  
        /* EVENTO: FINDGAME

           - verifica lista de servidores.
           - manda o cliente abrir conexão com outro servidor. ENVIA o objeto Player. 
               - coloca o cliente na lista de PLAY-ACK dizendo que cliente está tentando se conectar com o gameServer. 
               - lança um código para ser executado depois de um tempo-timeout (10 segundos) para verificar se o cliente conseguiu se conectar.
                   - checa a variavel, senao da erro pro cliente.   
           - cliente deve retornar caso conexao seja vem sucedida. PLAY-ACK.
               - o game-coordinator ao receber o ACK do PLAY, retira o cliente da lista de PLAY-ACK;
        */
        });

        // IDENTIFICA O SOCKET COMO UM SERVIDOR OU CLIENTE
        // FUTURAMENTE PODE EFETUAR AUTENTICACAO
        socket.on('LOGIN', function(msg){  
           
            var msgObj = JSON.parse(msg);
            var resObj = {}
           
            if( msgObj.type == "player" ){                   
               
                clientList.add( socket.id, new Player( msgObj.data.name, this ) ); 
                console.log( "cliente [" +  socket.id + "] identificado como PLAYER: [" +  msgObj.data.name + "]. total players: " +  clientList.length() );
                
                resObj = {
                            ack: "1",
                            data: socket.id
                         }
                        
                //sending server list         
                socket.emit( "SERVER_LIST_UPDATE", JSON.stringify( serverList.getAllData() ) );         

            } else if( msgObj.type == "server" ) {

                serverList.add( socket.id, new GameServer(msgObj.data.name, msgObj.data.ip, msgObj.data.location, this) );  
                console.log( "cliente [" +  socket.id + "] identificado como SERVER: [" +  msgObj.data.location + "]. total servers: " +  serverList.length() );
                
                sendServerListToAllPlayers();

                resObj = {
                            ack: "1",
                            data: socket.id
                         }

            } else {
               
                var errorMsgm = "ERRO! cliente [" +  socket.id + "] tentou fazer login como: [" +  msgObj.data.name + "].";

                resObj =  {
                             ack: "0",
                             data: errorMsgm
                          }

                console.log(errorMsgm);
            }

            socket.emit("LOGIN_ACK", JSON.stringify(resObj) );

        });    

        socket.on('disconnect', function(){  
            // QUANDO O CLIENTE DESCONECTAR, VERIFICAR SE ERA SERVIDOR OU CLIENTE            
            if( clientList.get(socket.id) ){
                // LANCAR FUNCAO QUE REMOVE CLIENTE APOS 30 segundos
                clientList.remove(socket.id);
                console.log( "cliente [ " +  socket.id + " ] desconectado. total clients: " + clientList.length() );

            } else {
                if( serverList.get(socket.id) ){
                    serverList.remove(socket.id);
                    sendServerListToAllPlayers();
                    console.log( "server [ " +  socket.id + " ] desconectado. total servers: " + serverList.length() );
                }
            }
        });

        socket.on('EVAL', function(message){  
           console.log( eval(message) ); 
        });

    });

    function sendServerListToAllPlayers(){
        clientList.broadcast( "SERVER_LIST_UPDATE", JSON.stringify( serverList.getAllData() ) );
    }    

    http.listen(3000, function(){  
        console.log('servidor rodando em localhost:3000');
    });

    app.get('/', function(req, res){  
        res.sendFile(__dirname + '/client/client.html');
    });

    app.get('*.js', function(req, res){ 
        res.sendFile(__dirname + '/client/' + req.originalUrl );  
    });

    app.get('*.jpg', function(req, res){ 
        res.sendFile(__dirname + '/client/' + req.originalUrl );  
    });

    app.get('*.css', function(req, res){ 
        res.sendFile(__dirname + '/client/' + req.originalUrl );  
    });
}

var gc = new GameCoordinator();



