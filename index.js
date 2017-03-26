var app = require('express')();  
var http = require('http').Server(app);  
var io = require('socket.io')(http);

var clientsArray = [];
var i = 0;

app.get('/', function(req, res){  
  res.sendFile(__dirname + '/client/index.html');
});

io.on('connection', function(socket){  

  console.log('number: ' + i + ' username ' + socket.id + ' connected');
  i++;

  socket.on('disconnect', function(){
    console.log('user ' + this.id + ' has been desconnected... [ ' + i + ' ] users left.');
    i--;
  });

  socket.on('clientsList', function(){    
    io.clients(function(error, clients){
      if (error) throw error;
      console.log(clients); 
    });
  
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

  /*
    socket.on('messageTo', function(sendToObject){
      var targetClientId = sendToObject.targetClientId;  
      var msgm = sendToObject.msgm;

      console.log('totalClients:');
    });
  */

});

/*
io.of('/chat').in('general').clients(function(error, clients){
  if (error) throw error;
  console.log(clients); // => [Anw2LatarvGVVXEIAAAD]
});
*/

http.listen(3000, function(){  
  console.log('servidor rodando em localhost:3000');
});