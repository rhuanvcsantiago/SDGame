var io = require("socket.io-client");

function ClientSimulator(max_clients, serverAdress){
    this.maxClients = max_clients || 200;
    this.arrayClients = [];
    this.serverAdress = serverAdress || "http://127.0.0.1:3000";
    
    this.fill = function(){
        var length = this.arrayClients.length;
        for (var i = length; i < this.maxClients; i++) {
         //   this.interval();
         setTimeout( this.addClient.bind(this), 100 );
        }
    }

  //  this.interval = function(){
   //     setTimeout(this.addClient(this.serverAdresss), 100);
   // }

    this.clean = function(){
        var length = this.arrayClients.length;
        for (var i = 0; i < length; i++) {
            client =  this.arrayClients.pop();
            client.close(); 
        }
    }

    this.addClient = function(){
        var client =  io(this.serverAdress);

        client.on("message", function(msg){
            console.log("who received?: " + this.id + ' msgm: ' + msg);
        });

        this.arrayClients.push(client);
        console.log("total of clients: " + this.arrayClients.length);
    }

    this.getClient = function(clientId){
        var client = this.searchClient(clientId);

        if( client )
            return client.object;

        return false;

    };

    this.searchClient = function(clientId){
        for (var i = 0; i < this.maxClients; i++) {
            
            var client = this.arrayClients[i]

            if(client.id == clientId)
                return {"object": client, "position": i} ;
        }

        return false;
    }

    this.getClientAt = function(index){
        return this.arrayClients[index];
    };

    this.removeClientAt = function(index){
        
        var client = searchClient(clientId);

        if( client )
            this.arrayClients.splice( client.index , 1);

    }
    
} 

var cs = new ClientSimulator();