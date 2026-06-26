const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

app.use(cors());
app.use(express.json());

// Ruta ultra simple: /canal/ID.m3u8 o solo /canal/ID
app.get('/canal/:id', async (req, res) => {
    let channelId = req.params.id;
    
    // Si viene con .m3u8 se lo quitamos para limpiar el ID
    channelId = channelId.replace('.m3u8', '');

    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando token de Termux...");
    }
    
    const urlReal = `http://${PROV_IP}/live/${TOKEN_GLOBAL}/${channelId}/index.m3u8`;
    
    try {
        const response = await axios({
            method: 'get',
            url: urlReal,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        response.data.pipe(res);
    } catch (error) {
        console.error("Error en Proxy:", error.message);
        res.status(500).send("Error al conectar con el proveedor");
    }
});

app.post('/actualizar-token', (req, res) => {
    const { token } = req.body;
    if (token) {
        TOKEN_GLOBAL = token;
        return res.json({ status: "ok", token: TOKEN_GLOBAL });
    }
    res.status(400).json({ error: "Token inválido" });
});

app.get('/', (req, res) => res.send("Proxy Simplificado Funcionando 🚀"));

app.listen(PORT, () => console.log(`Servidor listo`));
