function Match(matchId, playersList){

    this.id = matchId;
    this.players = playersList;
    this.turn = 0;
    this.maxTurns = 10;
    this.clientTurnTimeOut = 30; // segundos
    this.clientActions = [];
    this.pieces = [];
    this.invalidCells = [];

    var colors = ['blue', 'red', 'green', 'yellow'];

    var invalidCell = {
        x: '',
        y: ''
    }

    var piece = {
        player: '',
        color: '',
        x: '',
        y: '',
        front: ''
    };

    // preencher o array de clientsActions de acordo com a quantidade de turnos definidos.
    function initializeClientActionsArray(){};

    var table = [
                    [], [], [], [], [], [], [], []


                ]

    //Gera o tabuleiro aleatoriamente
    loadMatch();

    // INICIALIZAR CLIENTE        
        // MANDA MENSAGEM PROS CLIENTES COM O PEÇAS NO TABULEIRO, ESPAÇOS INDISPONÍVEIS E TURNO. 
    io.emit(this.id, this.pieces, this.invalidCells, this.turn);

    // SERVIDOR CONTAR 30 SEGUNTOS E EXECUTAR OS TURNOS
    this.timeOut = setTimeout(function(){
        //Se o turno não for além do último ele executa normalmente
        if (this.turn <= this.maxTurns) {
            //Servidor conta 30 segundos e executa o turno caso todos não tenham declarado todas as jogadas
            //Caso todos tenham terminado as jogadas o servidor executa o turno
            if(this.clientTurnTimeOut == 0 || this.clientActions.length == this.players.length * 3){
                // EXECUCAO DO TURNO (Comandos em clientActions)
                playTurn();

                //Avança o turno e reseta o contador do timer de turno 
                this.turn ++;
                this.clientTurnTimeOut = 30;
            }
            else{
                this.clientTurnTimeOut --;
                //io.sockets.emit(this.id, turno: this.turn, remainingTime: this.clientTurnTimeOut);
            }
        }
        else{
            clearTimeout(timeOut);
        }
    },1000);


    // IGNORAR SE CLIENTE CAIU.

    // EVENTOS -> 
        // AO RECEBER MENSSAGEM DO CLIENTE 
            // GUARDAR ACOES ENVIADAS NO ARRAY.
    socket.on('MOVE', function(data){
        //this.clientsActions.push({playerId : data.playerId, playerName : data.name, playerPlay : data:move})
    })

    this.createRawTable = function(){

    }


    //Prepara o tabuleiro aleatorializando quadrantes iniciais dos jogadores, posição das peças, cor dos jogadores e células inativas
    function loadMatch(){
        //gera coordenadas dos espaços inválidos

        //TODO -> for(i=0; i< playerList.length() * something; i++){
        for(i = 0; i < 4; i++){
            invalidCell.x = getRandomInt(1, Math.pow(players.length, 2));
            invalidCell.y = getRandomInt(1, Math.pow(players.length, 2));

            if(invalidCells.includes(invalidCell)){
                i--;
            }
            else{
                invalidCells.push(invalidCell);
            }
        }

        //gera valores das peças
        for(i = 0; i<players.length(); i++){
            //seta jogador, cor e direção da peça
            piece.player = players[i].id;
            piece.color = colors[i];
            piece.front = getRandomInt(1, 5);
            
            //gera três peças para o jogador
            for(j = 0; j < 3; j++){
                //gera as coordenadas da peça aleatóriamente
                piece.x = getRandomInt(1, Math.pow(players.length, 2));
                piece.y = getRandomInt(1, Math.pow(players.length, 2));

                //verifica se o espaço que a peça gerada quer preencher já está ocupado
                //se estiver ocupado ele tenta gerar de novo a peça
                if(ocupiedSpace(piece)){
                    j--;
                }
                //senão ele adiciona a peça ao array de peças
                else{
                    pieces.push(piece);
                }
            }
        }
    }


    //Executa as ações do turno
    //Usa os comandos armazenados em clientActions
    function playTurn(){
        //percorre o array de comandos
        for(i = 0; i < clientsActions; i++){
            //percorre o array de peças
            for(j = 0; j < pieces.length; j++){
                //verifica se a peça é do mesmo jogador que deu o comando
                if(pieces[j].player == clientsActions.playerId){
                    //executa o movimento da peça
                    movePiece(pieces[j], clientsActions[i]);
                }
            }

            //envia aos clientes as novas posições das peças
            io.sockets.emit('NEW POSITIONS', pieces);
        }

    }


    //verifica se o espaço que a peça vai está disponível
        //se não estiver disponível verifica se é peça adversaria
        //se for adversário a peça não se move e toma a peça do adversário
        //senão a peça só não se move
    function movePiece(p, cA){
        var aux = p;
        var aux2;
        switch(cA.playerPlay){
            case 'TUP':
                p.front = 'up';
                break;
            case 'TDW':
                p.front = 'down';
                break;
            case 'TLF':
                p.front = 'left';
                break;
            case 'TRG':
                p.front = 'right';
                break;
            case 'GUP':
                aux.y++;
                if(!ocupiedSpace(aux) && aux.y < Math.pow(players.length, 2)){
                    p.y++;
                }
                else{
                    for(i = 0; i < pieces.length; i++){
                        if(pieces[i].x == aux.x && pieces[i].y == aux.y){
                            stealPiece(p, pieces[i], ca.PlayerPlay);
                            break;
                        }
                    }
                }
                break;
            case 'GDW':
                aux.y--;
                if(!ocupiedSpace(aux) && aux.y >= 0){
                    p.y--;
                }
                else{
                    for(i = 0; i < pieces.length; i++){
                        if(pieces[i].x == aux.x && pieces[i].y == aux.y){
                            stealPiece(p, pieces[i]);
                            break;
                        }
                    }
                }
                break;
            case 'GLF':
                aux.x--;
                if(!ocupiedSpace(aux) && aux.y >= 0){
                    p.x--;
                }
                else{
                    for(i = 0; i < pieces.length; i++){
                        if(pieces[i].x == aux.x && pieces[i].y == aux.y){
                            stealPiece(p, pieces[i]);
                            break;
                        }
                    }
                }
                break;
            case 'GRG':
                aux.x++;
                if(!ocupiedSpace(aux) && aux.x < Math.pow(players.length, 2)){
                    p.x++;
                }
                else{
                    for(i = 0; i < pieces.length; i++){
                        if(pieces[i].x == aux.x && pieces[i].y == aux.y){
                            stealPiece(p, pieces[i]);
                            break;
                        }
                    }
                }
                break;
            default:
                console.log('ERRO ao receber comando do jogador');
        }
    }        
    }



    //recebe uma peça como parâmetro
    //Verifica se o espaço que ela quer entrar já está ocupado
    function ocupiedSpaces(p){
        //verifica se as coordenadas dessa peça não coincide com a de um espaço inválido
        for(i = 0; i<invalidCells.length; i++){
            if(p.x == invalidCells[i].x && p.y == invalidCells[i].y){
                return true;
            }
        }

        //verifica se as coordenadas dessa peça não coincide com a de alguma outra peça
        for(i = 0; i< pieces.length; i++){
            if(p.x == pieces[i].x && p.y == pieces[i].y){
                return true;
            }
        }
        return false;
    }

//gera número aleatório entre os intervalos min e max
//o min é incluso entres os números, mas não o máximo
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Rouba peça do adversário ou entrar na mesma casa
function stealPiece(p1, p2, comand){
    //front -> 1 == north, 2 == east, 3 == south, 4 == west
    switch(comand){
        case 'GUP':
            if(p1.front == 1 && p2.front != 3){
                p2.player = p1.player;
                p2.color = p1.color; 
            }
        break;
        case 'GDW':
            if(p1.front == 3 && p2.front != 1){
                p2.player = p1.player;
                p2.color = p1.color; 
            }
        break;
        case 'GLF':
            if(p1.front == 4 && p2.front != 2){
                p2.player = p1.player;
                p2.color = p1.color; 
            }
        break;
        case 'GRG':
            if(p1.front == 2 && p2.front != 4){
                p2.player = p1.player;
                p2.color = p1.color; 
            }
        break;
    }
}



function Cell(){
    this.type = "nothing";
    this.value = {};
}