function List(){
    
    var list    = [];

    this.add        = function(){}
    this.remove     = function(i){}
    this.clear      = function(){}
    this.length     = function(){}
    this.get        = function(i){}
    this.all        = function(){}
}

function Hash(){
    
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

}

