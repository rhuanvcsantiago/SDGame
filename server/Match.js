function Match(playersList){

    this.id;
    this.players = playersList;
    this.turn = 0;
    this.maxTurns = 10;
    this.clientTurnTimeOut = 30; // segundos
    this.clientActions = [];

    // preencher o array de clientsActions de acordo com a quantidade de turnos definidos.
    function initializeClientActionsArray(){};

    var table = [
                    [], [], [], [], [], [], [], []


                ]

    // LOAD MATCH
        // GERA O TABULEIRO ALEATORIAMENTE;
            // ALEATORIZAR OS QUADRANTES DOS JOGADORES
            // ALEATORIZAR AS PEÇAS
            // ALEATORIZAR AS CELULAS INATIVAS

    // INICIALIZAR CLIENTE        
        // MANDAR MENSAGEM PROS CLIENTES COM O TABULEIRO E TURNO. 
        // PEDIR PRO CLIENTE ABRIR A TELA DE JOGO.       
        // ENVIAR TEMPO DO CLIENTE PARA RESPOSTA.

    // SERVIDOR CONTAR 30 SEGUNTOS E EXECUTAR O PRIMEIRO TURNO

    // EXECUCAO DO TURNO
        // CHAMAR FUNCAO DE EXECUCAO DE TURNO.
            // USA AS ACOES PREENCHIDAS NO ARRAY clientActions

    // IGNORAR SE CLIENTE CAIU.

    // EVENTOS -> 
        // AO RECEBER MENSSAGEM DO CLIENTE 
            // GUARDAR ACOES ENVIADAS NO ARRAY.

    this.createRawTable = function(){

    } 

}

function Cell(){
    this.type = "nothing";
    this.value = {};
}