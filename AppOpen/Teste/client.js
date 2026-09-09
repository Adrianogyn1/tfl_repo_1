const dgram = require('dgram');

const PORT = 10022;
const HOST = '83.147.39.33'; // Mude para o IP da sua VPS se estiver testando de fora
const TOTAL_CLIENTS = 1;  // Quantidade de clientes simultâneos
const tempo = 1;
function iniciarCliente(id) {
  const client = dgram.createSocket('udp4');
  let contador = 0;

  setInterval(() => {
    contador++;
    const mensagem = Buffer.from(`Mensagem ${contador} do Cliente ${id}`);
    
    client.send(mensagem, PORT, HOST, (err) => {
      if (err) {
        console.error(`Cliente ${id} erro:`, err);
      } else {
        console.log(`[Cliente ${id}] Enviou a mensagem ${contador}`);
      }
    });
  }, tempo*1000); 

  client.on('message', (msg) => {
    console.log(`[Cliente ${id}] Recebeu resposta -> ${msg}`);
  });
}

console.log(`Iniciando ${TOTAL_CLIENTS} clientes em loop...`);
for (let i = 1; i <= TOTAL_CLIENTS; i++) {
  iniciarCliente(i);
}