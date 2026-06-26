const express = require('express');
const axios = require('axios');
const cors = require('cors'); // <-- ¡Nuevo! Para que abra en la web
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

// Habilitamos CORS para cualquier página web / reproductor web
app.use(cors());
app.use(express.json());

// NUEVA RUTA: Soporta el formato clásico (?id=...) y el formato web (...channelId.m3u8)
app.get('/media/series/hls/:channelFile?', async (req, res) => {
    let channelId = req.query.id;
    
    // Si viene en formato web (ej: 3ef8d0e5d07664ff.m3u8), le quitamos el ".m3u8" para extraer el ID
    if (req.params.channelFile) {
        channelId = req.params.channelFile.replace('.m3u8', '');
    }

    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando el primer token del celular...");
    }
    if (!channelId) {
        return res.status(400).send("Error: Falta el ID del canal");
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

        // Forzamos cabeceras correctas de streaming HLS para el navegador web
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        response.data.pipe(res);
    } catch (error) {
        console.error("Error al transmitir el canal:", error.message);
        res.status(500).send("Error al conectar con el flujo del proveedor");
    }
});

app.post('/actualizar-token', (req, res) => {
    const { token } = req.body;
    if (token) {
        TOKEN_GLOBAL = token;
        console.log(`🔑 ¡Token actualizado!: ${TOKEN_GLOBAL}`);
        return res.json({ status: "ok", token: TOKEN_GLOBAL });
    }
    res.status(400).json({ error: "Token inválido" });
});

app.get('/', (req, res) => res.send("Link Mágico Activo en modo Proxy Universal 🚀"));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
