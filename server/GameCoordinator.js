
var hash     = require('./myLibs.js')
var player   = require('./Player.js')
var Database = require('./Database.js')

function GameCoordinator(){
    var app     = require('express')();  
    var http    = require('http').Server(app);  
    var io      = require('socket.io')(http);

    //global
    connectedClientsHash = new hash();
    connectedServersHash = new hash();

    connectedServersHash.add("kjkgSDggk3D124Asdasad", {
            name: "server01",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
    });

    connectedServersHash.add("kikkglko3334Asda3hfa", {
            name: "server02",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
    });

    connectedServersHash.add("ki234234kkglko3334Asda3hfa", {
            name: "server03",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
    });

    connectedServersHash.add("kik234234kglko3334Asda3hfa", {
            name: "server04",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
    });

    /*
        {
            name: "server01",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
        }

    */
    
    // TODO -> TENTAR E CRIAR OBJETOS CONEXOES COM OS SERVIDORES ATIVOS. DAR ERRO, E ENCERRAR CASO NAO CONSIGA COM PELO MENOS 1.

    io.on('connection', function( socket ){  

        console.log( "cliente [ " +  socket.id + " ] identificado. total: " + io.engine.clientsCount );        
        // DEFINICAO -> ENVIAR LOGMESSAGE: Evento para menssagens de log do sistema no cliente.

        // QUANDO CLIENTE SE CONECTAR
            // LOGMESSAGE-> AVISAR QUE CONEXAO FOI BEM SUCEDIDA.

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
            var response = {}
           
            if( msgObj.type == "player" ){                   
               
                connectedClientsHash.add( socket.id, new player( msgObj.data, this ) ); 
                console.log( "cliente [" +  socket.id + "][" +  msgObj.data + "] conectado. total: " +  connectedClientsHash.length() );
                
                response =  {
                                type: "1",
                                data:socket.id
                            }

                socket.emit("LOGIN_ACK", JSON.stringify(response) );
                socket.emit("SERVER_LIST_UPDATE", JSON.stringify( connectedServersHash.getList() ) );

            } else {
                if( msgObj.type == "server" ){
                    connectedServersHash.add( socket.id, this );  
                    console.log("servidor: [ " + msgObj.data + " ] connected." ); 
                    io.emit("SERVER_LIST_UPDATE", JSON.stringify( connectedServersHash.getList() ) );
                } else {
                    // error, nao eh nem cliente, nem servidor.
                    var errorMsgm = "EVENT: [ LOGIN ] MSGM: erro, tentativa de login sem ser cliente ou servidor. Favor verificar mensagem de envio";

                    response =  {
                                    type: "0",
                                    data: errorMsgm
                                }

                    socket.emit("LOGIN_ACK", response);
                    console.log(errorMsgm);
                }
            }

        });    

        socket.on('disconnect', function(){  
            // QUANDO O CLIENTE DESCONECTAR, VERIFICAR SE ERA SERVIDOR OU CLIENTE            
            if( connectedClientsHash.get(socket.id) ){
                // LANCAR FUNCAO QUE REMOVE CLIENTE APOS 30 segundos
                connectedClientsHash.remove(socket.id);
                console.log( "cliente [ " +  socket.id + " ] desconectado. total: " + io.engine.clientsCount );

            } else {
                if( connectedServersHash.get(socket.id) ){
                    connectedServersHash.remove(socket.id);
                    // TODO-> AVISAR CLIENTES CONECTADOS (BROADCAST) QUE SERVIDOR CAIU.
                }
            }
        });

         socket.on('EVAL', function(message){  
           console.log( eval(message) ); 
        });

    });

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



