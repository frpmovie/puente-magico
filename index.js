const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

app.use(express.json());

// 1. El puente ahora actúa como Proxy directo de video
app.get('/media/series/hls', async (req, res) => {
    const channelId = req.query.id;
    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando el primer token del celular...");
    }
    if (!channelId) {
        return res.status(400).send("Error: Falta el ID del canal (?id=...)");
    }
    
    const urlReal = `http://${PROV_IP}/live/${TOKEN_GLOBAL}/${channelId}/index.m3u8`;
    
    try {
        // Le pedimos el video al proveedor simulando un reproductor oficial
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

        // Reenviamos las cabeceras de video a VLC
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/vnd.apple.mpegurl');
        
        // Transmitimos el flujo de video en tiempo real (Pipe)
        response.data.pipe(res);
    } catch (error) {
        console.error("Error al transmitir el canal:", error.message);
        res.status(500).send("Error al conectar con el flujo del proveedor");
    }
});

// 2. Ruta para actualizar el token
app.post('/actualizar-token', (req, res) => {
    const { token } = req.body;
    if (token) {
        TOKEN_GLOBAL = token;
        console.log(`🔑 ¡Token actualizado!: ${TOKEN_GLOBAL}`);
        return res.json({ status: "ok", token: TOKEN_GLOBAL });
    }
    res.status(400).json({ error: "Token inválido" });
});

app.get('/', (req, res) => res.send("Link Mágico Activo en modo Proxy 🚀"));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
