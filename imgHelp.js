const { createCanvas } = require('canvas');

function gerarPlaceholder(req, res) {
    const { username, w } = req.params;

    if (!username) {
        return res.status(400).send('O parâmetro username é obrigatório.');
    }

    // 1. Define o tamanho (usa o parâmetro 'w' ou o padrão 200)
    const tamanho = parseInt(w, 10) || 200;

    // 2. Extrai as iniciais
    const partes = username.trim().split(/\s+/);
    const iniciais = partes.length > 1 
        ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
        : partes[0][0].toUpperCase();

    // 3. Cria o canvas com o tamanho dinâmico
    const canvas = createCanvas(tamanho, tamanho);
    const ctx = canvas.getContext('2d');

    // 4. Fundo
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, tamanho, tamanho);

    // 5. Texto centralizado com fonte proporcional ao tamanho da imagem
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${tamanho * 0.4}px sans-serif`; // Fonte sempre ocupa ~40% do tamanho total
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iniciais, tamanho / 2, tamanho / 2);

    // 6. Retorna a imagem
    const buffer = canvas.toBuffer('image/png');
    res.set('Content-Type', 'image/png');
    res.send(buffer);
}