var myLibs = require('myLibs.js')

function GameCoordinator(){
    var app     = require('express')();  
    var http    = require('http').Server(app);  
    var io      = require('socket.io')(http);

    //global
    connectedClientsHash = new Hash();
    connectedServersHash = new Hash();
    /*
        {
            name: "server01",
            adress: "127.0.0.1:3001",
            location: "brazil",
            connection: {}
        },

    */

    // TODO -> TENTAR E CRIAR OBJETOS CONEXOES COM OS SERVIDORES ATIVOS. DAR ERRO, E ENCERRAR CASO NAO CONSIGA COM PELO MENOS 1.

    //ENVIA CLIENTE                  
    app.get('/', function(req, res){  
        res.sendFile(__dirname + '/client/client.html');
    });

    io.on('connection', function( socket ){  

        console.log( "cliente [ " +  socket.id + " ] conectado. total: " + connectedClientsHash.length()+1 );
        socket.emit("info", 'totalClients: ' + i);
        
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
            
            if( msg.type == "player" ){
                // TODO-> Criar OBJ CLIENTE
                // TODO-> Adicionar msg.name
                connectedClientsHash.add( this.id, new Player(msg.name, this) ); 
            } else {
                if( msg.type == "server" ){
                    connectedServersHash.add( this.id, this );   
                    // TODO-> AVISAR CLIENTES CONECTADOS (BROADCAST) QUE EXISTE UM NOVO SERVIDOR DISPONIVEL. 
                } else {
                    // error, nao eh nem cliente, nem servidor.
                    console.log("EVENT: [ LOGIN ] MSGM: erro, tentativa de login sem ser cliente ou servidor. Favor verificar mensagem de envio");
                }
            }

        });    

        socket.on('disconnect', function(){  
            // QUANDO O CLIENTE DESCONECTAR, VERIFICAR SE ERA SERVIDOR OU CLIENTE            
            if( connectedClientsHash.get(socket.id) ){
                connectedClientsHash.remove(socket.id);
            } else {
                if( connectedServersHash.get(socket.id) ){
                    connectedServersHash.remove(socket.id);
                    // TODO-> AVISAR CLIENTES CONECTADOS (BROADCAST) QUE SERVIDOR CAIU.
                }
            }

        });

    });

    http.listen(3000, function(){  
        console.log('servidor rodando em localhost:3000');
    });
}

var gc = new GameCoordinator();

/*
        io.of('/chat').in('general').clients(function(error, clients){
        if (error) throw error;
        console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
        });

        socket.on('messageTo', function(sendToObject){
            var targetClientId = sendToObject.targetClientId;  
            var msgm = sendToObject.msgm;

            console.log('totalClients:');
        });
        
        socket.on('message', function(msg){  
            console.log("user: " + this.id + ' send: ' + msg);
        });

        socket.on("echo", function(msg){
            console.log("user: " + this.id + ' is sending a echo msgm: ' + msg);
            socket.emit("message", msg);
        });
        
        socket.on('totalClients', function(){  
            console.log('totalClients: ' + i);
            socket.emit("message", 'totalClients: ' + i);
        });

        socket.on('disconnect', function(){
            i--;
            console.log('user ' + this.id + ' has been desconnected... [ ' + i + ' ] users left.');
        });

        socket.on('clientsList', function(){    
            io.clients(function(error, clients){
            if (error) throw error;
            console.log(clients); 
            });
        
        });
    */

