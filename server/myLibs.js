function ClientList(){
    
    this.obj = {};

    this.add = function(hash, value){
        
        if( hash ) 
            this.obj[hash] = value;
        else
            throw "não da pra adicionar um valor [ " + hash + " ] ao dicionario hash;";
    }

    this.remove = function(hash){
        delete this.obj[hash];
    }
    
    this.clear = function(){
        delete this.obj;
        this.obj = {};
    }

    this.length = function(){
        return Object.keys( this.obj ).length;
    }

    this.get  = function(hash){
        return this.obj[hash];
    }

    this.getAll= function(){
        return Object.keys( this.obj );    
    }

    this.getAllAsList= function(){
        
        var list = [];

        for (var key in this.object) {

        }

        return list;    
    }

}

module.exports = Hash;
