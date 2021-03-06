var ConnectionList  = require('./myLibs.js');
var app     = require('express')();  
var http    = require('http').Server(app);  
var io      = require('socket.io')(http);

function Player(name, socket){
    this.data = {
                    id: "",
                    name: name || "",
                    currentGameServerIp: ""
                }

    this.socket = socket;
    this.data.id = socket.id || "";
}

function GameServer(name, ip, location, socket){

    this.data = {
                    id: "",
                    name: name || "",
                    ip: ip || "",
                    location: location || ""
                }  

    this.socket = socket;
    this.data.id = socket.id || "";
}

function GameCoordinator(){
    
    var clientList = new ConnectionList();
    var serverList = new ConnectionList();
    var serverBackups = {};
    
    io.on('connection', function( socket ){  

        console.log("cliente [ " +  socket.id + " ] conectado. total connections: " + io.engine.clientsCount);       
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
            var gameServerData   = JSON.parse( msg );
            var gameServerSocket = serverList.get( gameServerData.id ).socket;

            var resObj = {
                            ack: "",
                            data: {}
                         }
            
            // preenche atributo do cliente
            var client = clientList.get(socket.id);           

            client.data.currentGameServerIp = gameServerData.ip;

            var clt = {
                        ack: "",
                        data: client.data
                      }

            gameServerSocket.emit("FINDGAME", JSON.stringify( clt ) );


        });

        // IDENTIFICA O SOCKET COMO UM SERVIDOR OU CLIENTE
        // FUTURAMENTE PODE EFETUAR AUTENTICACAO
        socket.on('LOGIN', function( msg ){  
           
           //console.log( msg); 
            var msgObj = JSON.parse(msg);
            var resObj = {}
           
            if( msgObj.ack == "player" ){                   
               
                clientList.add( socket.id, new Player( msgObj.data.name, this ) ); 
                console.log( "cliente [" +  socket.id + "] identificado como PLAYER: [" +  msgObj.data.name + "]. total players: " +  clientList.length() );
                
                resObj = {
                            ack: "1",
                            data: socket.id
                         }
                        
                //sending server list         
                socket.emit( "SERVER_LIST_UPDATE", JSON.stringify( serverList.getAllData() ) ); 
                sendClientListToAllPlayers();        

            } else if( msgObj.ack == "server" ) {

                serverList.add( socket.id, new GameServer(msgObj.data.name, msgObj.data.ip, msgObj.data.location, this) );  
                console.log( "cliente [" +  socket.id + "] identificado como SERVER: [" +  msgObj.data.location + "]. total servers: " +  serverList.length() );
                
                if( serverBackups[msgObj.data.name] )
                    socket.emit( "RESTORE_SERVER_STATE",  serverBackups[msgObj.data.name]); 

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
                sendClientListToAllPlayers();

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

        socket.on('CHAT_MESSAGE', function( msg ){

            var client = clientList.get(socket.id);
            
            if( client ){
                console.log("menssagem cifrada:=> "+ msg);
                msg = caesarShift(msg, -12);
                console.log("menssagem normal=> "+ msg);
                sendChatMessageToAllPlayers(client.data.name + ": " + msg);
            }

        });

        socket.on('SAVE_SERVER_STATE', function( msg ){

            var server = serverList.get(socket.id);
            serverBackups[server.data.name] = msg;
            console.log("Saving server ["+server.data.name+"] state.");
            //console.log("    server data: "+ msg);
            
        });

    });

    function sendServerListToAllPlayers(){
        clientList.broadcast( "SERVER_LIST_UPDATE", JSON.stringify( serverList.getAllData() ) );
    }   

    function sendChatMessageToAllPlayers(message){

        
        

        clientList.broadcast( "CHAT_MESSAGE_UPDATE", message );
    } 

    function sendClientListToAllPlayers(){
        clientList.broadcast( "CLIENT_LIST_UPDATE", JSON.stringify( clientList.getAllData() ) );
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

var caesarShift = function(str, amount) {

	// Wrap the amount
	if (amount < 0)
		return caesarShift(str, amount + 26);

	// Make an output variable
	var output = '';

	// Go through each character
	for (var i = 0; i < str.length; i ++) {

		// Get the character we'll be appending
		var c = str[i];

		// If it's a letter...
		if (c.match(/[a-z]/i)) {

			// Get its code
			var code = str.charCodeAt(i);

			// Uppercase letters
			if ((code >= 65) && (code <= 90))
				c = String.fromCharCode(((code - 65 + amount) % 26) + 65);

			// Lowercase letters
			else if ((code >= 97) && (code <= 122))
				c = String.fromCharCode(((code - 97 + amount) % 26) + 97);

		}

		// Append
		output += c;

	}

	// All done!
	return output;

};

var gc = new GameCoordinator();



