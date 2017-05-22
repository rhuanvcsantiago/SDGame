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

    this.find  = function(id){
        if (this.client[id] == undefined)
            return false
        else 
            return true;    
    }

    this.getAll = function(){        
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

    this.getAllDataObj = function(evt, msg){        
        var obj = {};
        
        for (var key in this.client) {
            obj[key] = this.client[key].data;         
        }

        return obj;
    } 

    this.clone = function(){
        var list = new ConnectionList();

        for (var key in this.client) {
            list.add( key, this.client[key] );         
        }

        return list;
    }

}

module.exports = ConnectionList;
