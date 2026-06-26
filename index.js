const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

app.use(cors());
app.use(express.json());

function proxyDirecto(channelId, res) {
    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando token de Termux...");
    }

    const urlReal = `http://${PROV_IP}/live/${TOKEN_GLOBAL}/${channelId}/index.m3u8`;

    // Usamos el módulo HTTP nativo para evitar que se dupliquen las conexiones de red
    http.get(urlReal, (provRes) => {
        // Copiamos las cabeceras originales del proveedor para máxima compatibilidad
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        
        // Conectamos la tubería directa sin almacenar nada en memoria
        provRes.pipe(res);
    }).on('error', (err) => {
        console.error(`Error en canal ${channelId}:`, err.message);
        res.status(500).send("Error de conexión");
    });
}

// ================= RUTAS DIRECTAS ULTRA-LIGERAS =================

app.get('/directv-sports.m3u8', (req, res) => proxyDirecto('3ef8d0e5d07664ff', res));
app.get('/dsport-plus.m3u8', (req, res) => proxyDirecto('3936a9999335e475', res));
app.get('/dsport-2.m3u8', (req, res) => proxyDirecto('eb8cb1c5d0dbb713', res));
app.get('/win-sports-plus.m3u8', (req, res) => proxyDirecto('a0fcca6b091455f8', res));
app.get('/tyc-sports.m3u8', (req, res) => proxyDirecto('9b03fb120b5853c8', res));
app.get('/caracol.m3u8', (req, res) => proxyDirecto('5142e7a023329225', res));
app.get('/rcn.m3u8', (req, res) => proxyDirecto('3518f48f89f6cd5f', res));
app.get('/univision.m3u8', (req, res) => proxyDirecto('863452dc5e84c9a9', res));
app.get('/telemundo-1.m3u8', (req, res) => proxyDirecto('1126c9f1d65a5751', res));
app.get('/telemundo-2.m3u8', (req, res) => proxyDirecto('993f3642fe296e38', res));

// ================================================================

app.post('/actualizar-token', (req, res) => {
    const { token } = req.body;
    if (token) {
        TOKEN_GLOBAL = token;
        return res.json({ status: "ok", token: TOKEN_GLOBAL });
    }
    res.status(400).json({ error: "Token inválido" });
});

app.get('/', (req, res) => res.send("Proxy de Tubería Directa Activo 🚀"));

app.listen(PORT, () => console.log(`Servidor en línea`));
