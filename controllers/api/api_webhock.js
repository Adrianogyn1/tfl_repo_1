const router = require("express").Router();
const repo = require("../../repository");
const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const site = (process.env.SERVER_URL || "localhost:5000").endsWith("/") ? process.env.SERVER_URL : `${process.env.SERVER_URL}/`;
const auth = require("../auth").CheckLogin;

const currency_register = require('../game/currencyRegister_controller');


router.get("/", (req, res) =>
{
    const result = {
        pushinpay: `${site}/webhook/pushinpay`,
        git: `${site}/webhook/git`,
        pagbank: `${site}/webhook/pagbank`
    };
    // res.json(result);
    res.json({ "status": "ok" });
});



let payouts = [];


router.post("/pagbank/result/:uid", async (req, res) =>
{
    const payout = await repo.PagBank.findOne({ where: { id: req.params.uid, status: "PENDING" } });

    if (!payout)
        return res.sendStatus(404);

    console.log("Webhook PagBank:", JSON.stringify(req.body, null, 2));

    //atualiza no banco e cria as moedas
    if (req.body?.charges?.[0]?.status === "PAID")
    {
        await repo.sequelize.transaction(async (t) =>
        {
            await repo.PagBank.update({ status: "PAID" }, { where: { id: req.params.uid }, transaction: t });
            //cria as moedas
            const charges = req.body.charges[0];
            const items = req.body.items[0];
            var coins = items.quantity;

            currency_register.CreateCurrencyRegister({
                ownerId: payout.avatarId,
                userId: payout.userId,
                type: "Coins",
                value: coins,
                description: payout.description,
                transactionType: "Buy"
            }, payout.userId, t);
        });
    }
    res.sendStatus(200);
});



router.get("/pagbank/pix/:value", auth, async (req, res) =>
{
    try
    {
        const coinsValue = parseInt(req.params.value);
        const apiUrl = (process.env.PAGBANK_API_URL || "https://sandbox.api.pagseguro.com").replace(/\/+$/, "");
        const token = process.env.PAGBANK_TOKEN?.trim();



        const userId = req.userId;
        const user = await repo.User.findByPk(userId);
        if (!user) throw new Error("User not found");

        const extractPhone = (phone) =>
        {
            let retVal = {
                country: phone.substring(0, 2),
                area: phone.substring(2, 4),
                number: phone.substring(4, 9),
                type: "MOBILE"
            };
            //limpa o numero
            const num = phone.replace(/[^0-9]/g, "");

            //extrai o ddd e o telefone
            if (num.length === 10)
            {
                retVal.area = phone.substring(0, 2);
                retVal.number = phone.substring(2, 10);
                return retVal;
            }
            //se tiver vazio
            if (num.length == 0)
            {
                retVal.area = '62';
                retVal.number = '999999999';
                return retVal;
            }
            return retVal;
        };
        const phone = extractPhone(user.phone);
        const client = {
            name: user.name || "Sem nome",
            email: user.email || "sem_email@email.com",
            tax_id: user.cpf || "12345678909",
            phones: [{ country: "55", area: phone.area, number: phone.number, type: "MOBILE" }]
        };


        const brl = await currency_register.ConvertCoinToMoney(coinsValue);
        //usd to BRL cents valor unitario
        const value = brl / coinsValue;
        const unitInCents = parseInt(value * 100);
        const valueInCents = parseInt(brl * 100);

        //criando o pedido
        const pagBankData = await repo.PagBank.create({
            userId: userId,
            description: `compra de ${coinsValue} moedas valor em BRL ${brl.toFixed(2)}`,
            value: valueInCents,
            status: "PENDING"
        });

        const uid = pagBankData.id;


        const produto =
        {
            reference_id: "1",
            name: "compra de moedas",
            quantity: coinsValue,
            unit_amount: unitInCents
        }
        const response = await axios.post(
            `${apiUrl}/orders`,
            {
                reference_id: `pedido_${uid}`,
                customer: client,                       // não { client }
                items: [produto],
                qr_codes: [{
                    amount: { value: valueInCents, currency: "BRL" },
                    expiration_date: new Date(Date.now() + 3600 * 1000).toISOString()
                }],
                notification_urls: [`${site}webhook/pagbank/result/${uid}`], // com https://
            },
            { headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" } }
        );
        //atualiza no banco de dados
        await repo.PagBank.update({ status: "PENDING", pagbankId: response.id }, { where: { id: uid } });

        return res.json(response.data);
    } catch (error)
    {
        const details = error.response?.data || error.message;
        console.error("Erro PagBank:", error.response?.status, details);
        return res.status(500).json({ error: "Erro ao gerar Pix", details }); // não retorne o objeto `error` inteiro: ele vaza o token
    }
});

router.get("/donate", async (req, res) =>
{
    //cria um qrcode statico
    const { QrCodePix } = require('qrcode-pix');

    const qrCodePix = QrCodePix({
        version: '01',
        key: 'b73e1128-b80b-4058-903a-5ec11a67e5a8', // chave Pix (CPF, CNPJ, email, telefone ou aleatória)
        name: 'THE FANTASY LIFE',
        city: 'GOIANIA',
        transactionId: 'donate',   // opcional, até 25 caracteres
        message: 'Obrigado por nos ajudar!',  // opcional
        // value: 10.5,                  // opcional
    });

   return res.json({ "status": "ok",payload: qrCodePix.payload(), image: await qrCodePix.base64() });
});





router.post("/git", (req, res) =>
{
    res.json({ "status": "ok" });
});
router.get("/git", (req, res) =>
{
    res.json({ "status": "ok" });
});




module.exports = {
    router
}