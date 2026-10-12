const nodemailer = require('nodemailer');
const {i18n} = require("i18n");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true para porta 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendMail({ to, subject, html }) {
    const info = await transporter.sendMail({
        from: `"${process.env.SMTP_NAME}"" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });
    return { success: true, messageId: info.messageId };
}

async function SendEmailRegister(user) {
    return sendMail({
        to: user.email,
        subject: 'Bem-vindo!',
        html: `<p>Olá ${user.name}, seu cadastro foi concluído.</p>`
    });
}

async function SendEmailForgot(user) {
    return sendMail({
        to: user.email,
        subject: 'Recuperação de senha',
        html: `<p>Clique para redefinir sua senha: ...</p>`
    });
}

async function SendEmailCode(email) {
    return sendMail({
        to: email,
        subject: 'Seu código de verificação',
        html: `<p>Seu código: 123456</p>`
    });
}

module.exports = {
    SendEmailRegister,
    SendEmailForgot,
    SendEmailCode
};