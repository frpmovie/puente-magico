const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

app.use(cors());
app.use(express.json());

// Objeto para guardar en caché los últimos segmentos de cada canal
const cacheCanales = {};

async function proxyStreamConCache(channelId, res) {
    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando token de Termux...");
    }

    const ahora = Date.now();
    // Si tenemos el canal en caché y pasaron menos de 3 segundos, respondemos con lo guardado
    if (cacheCanales[channelId] && (ahora - cacheCanales[channelId].timestamp < 3000)) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.send(cacheCanales[channelId].data);
    }

    const urlReal = `http://${PROV_IP}/live/${TOKEN_GLOBAL}/${channelId}/index.m3u8`;

    try {
        const response = await axios({
            method: 'get',
            url: urlReal,
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        // Guardamos el texto del .m3u8 en la caché local
        cacheCanales[channelId] = {
            data: response.data,
            timestamp: ahora
        };

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(response.data);

    } catch (error) {
        console.error(`Error en canal ${channelId}:`, error.message);
        
        // Si el proveedor falla pero tenemos algo viejo en caché, lo usamos para que no se caiga
        if (cacheCanales[channelId]) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(cacheCanales[channelId].data);
        }
        res.status(500).send("Error al conectar con el proveedor");
    }
}

// ================= RUTAS FIJAS ANTI-BLOQUEO =================

app.get('/directv-sports.m3u8', (req, res) => proxyStreamConCache('3ef8d0e5d07664ff', res));
app.get('/dsport-plus.m3u8', (req, res) => proxyStreamConCache('3936a9999335e475', res));
app.get('/dsport-2.m3u8', (req, res) => proxyStreamConCache('eb8cb1c5d0dbb713', res));
app.get('/win-sports-plus.m3u8', (req, res) => proxyStreamConCache('a0fcca6b091455f8', res));
app.get('/tyc-sports.m3u8', (req, res) => proxyStreamConCache('9b03fb120b5853c8', res));
app.get('/caracol.m3u8', (req, res) => proxyStreamConCache('5142e7a023329225', res));
app.get('/rcn.m3u8', (req, res) => proxyStreamConCache('3518f48f89f6cd5f', res));
app.get('/univision.m3u8', (req, res) => proxyStreamConCache('863452dc5e84c9a9', res));
app.get('/telemundo-1.m3u8', (req, res) => proxyStreamConCache('1126c9f1d65a5751', res));
app.get('/telemundo-2.m3u8', (req, res) => proxyStreamConCache('993f3642fe296e38', res));

// ============================================================

app.post('/actualizar-token', (req, res) => {
    const { token } = req.body;
    if (token) {
        TOKEN_GLOBAL = token;
        return res.json({ status: "ok", token: TOKEN_GLOBAL });
    }
    res.status(400).json({ error: "Token inválido" });
});

app.get('/', (req, res) => res.send("Proxy Anti-Bloqueo Activo 🚀"));

app.listen(PORT, () => console.log(`Servidor Protegido Corriendo`));
