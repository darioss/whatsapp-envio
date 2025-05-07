const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http');
const socketIo = require('socket.io');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const qrcode = require('qrcode'); // ✅ Adicionado para gerar o QR corretamente

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;
let client;
let isConnected = false;

app.use(express.static('public'));
app.use(fileUpload());

function initializeClient() {
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', async (qr) => {
        console.log('QR RECEBIDO');
        try {
            const qrCodeDataUrl = await qrcode.toDataURL(qr); // ✅ Geração do QR em base64 com prefixo
            io.emit('qr', qrCodeDataUrl);
        } catch (err) {
            console.error('Erro ao gerar QR Code:', err.message);
        }
        isConnected = false;
    });

    client.on('ready', async () => {
        console.log('WhatsApp pronto!');
        isConnected = true;
        io.emit('ready');

        try {
            const version = await client.getWWebVersion();
            console.log('Versão do WhatsApp Web:', version);
        } catch (error) {
            console.error('Erro ao obter versão do WhatsApp Web:', error.message);
        }
    });

    client.on('disconnected', (reason) => {
        console.log('Cliente desconectado:', reason);
        isConnected = false;
        io.emit('reconnecting', true);
    });

    client.initialize().catch(err => {
        console.error('Erro ao inicializar o cliente:', err.message);
    });
}

// Inicializa pela primeira vez
initializeClient();

// Verificação periódica de status a cada 60 segundos
setInterval(() => {
    if (!isConnected) {
        console.log('Verificação: cliente desconectado, reinicializando...');
        try {
            client.destroy().then(() => {
                initializeClient();
            }).catch((err) => {
                console.error('Erro ao destruir o cliente:', err.message);
            });
        } catch (err) {
            console.error('Erro durante a reinicialização forçada:', err.message);
        }
    }
}, 60000);

// Rota de envio de mensagens
app.post('/send', async (req, res) => {
    const number = req.body.number?.replace(/\D/g, '');
    const message = req.body.message;

    if (!number || !message) {
        return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
    }

    const chatId = `${number}@c.us`;

    try {
        if (req.files && req.files.file) {
            const file = req.files.file;
            const media = {
                mimetype: file.mimetype,
                data: file.data,
                filename: file.name
            };

            await client.sendMessage(chatId, media, { caption: message });
        } else {
            await client.sendMessage(chatId, message);
        }

        res.json({ status: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.message);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Inicia servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
