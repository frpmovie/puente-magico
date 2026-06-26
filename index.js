const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let TOKEN_GLOBAL = "";
const PROV_IP = "108.175.13.7";

app.use(express.json());

app.get('/media/series/hls', (req, res) => {
    const channelId = req.query.id;

    if (!TOKEN_GLOBAL) {
        return res.status(503).send("Error: Esperando el primer token del celular...");
    }
    if (!channelId) {
        return res.status(400).send("Error: Falta el ID del canal");
    }

    // Redirección directa original
    const urlReal = `http://${PROV_IP}/live/${TOKEN_GLOBAL}/${channelId}/index.m3u8`;
    res.redirect(urlReal);
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

app.get('/', (req, res) => res.send("Link Mágico Activo 🚀"));

app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
