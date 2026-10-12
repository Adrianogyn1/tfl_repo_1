
function formatarBRL(valor) {
    // força 2 casas decimais
    let partes = valor.toFixed(2).split('.'); // ["1234", "56"]
    let inteiro = partes[0];
    let decimal = partes[1];

    // adiciona separador de milhar
    inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    return `${inteiro},${decimal}`;
}

/*/ exemplos
console.log(formatarBRL(1234.5));    // R$ 1.234,50
console.log(formatarBRL(1234567.89));// R$ 1.234.567,89
console.log(formatarBRL(50));        // R$ 50,00

*/


// salvar dados do usuário
function salvarUser(nome, saldo)
{
    localStorage.setItem("userNome", nome);
    salvarSaldo(saldo);
}

function salvarSaldo(saldo){
  localStorage.setItem("userSaldo", saldo);
}

// recuperar dados
function carregarUser() {
    const nome = localStorage.getItem("userNome");
    const saldo = localStorage.getItem("userSaldo");

    if (nome && saldo) {
        console.log("Usuário:", nome, "Saldo:", saldo);
        return { nome, saldo: parseFloat(saldo) };
    } else {
        console.log("Nenhum usuário salvo");
        return null;
    }
}

// limpar dados
function limparUser() {
    localStorage.removeItem("userNome");
    localStorage.removeItem("userSaldo");
}

