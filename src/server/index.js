import express from 'express';
import morgan from 'morgan';
import WebSocket from 'ws';
import path from 'path';
import http from 'http';

const PORT = process.env.PORT || 9000;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(PORT);
app.use(
	morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] :response-time ms')
);
// Serve static assets
app.use(express.static(path.resolve('.', 'compiled/public')));
app.get('*', (req, res) => {
	res.sendFile(path.resolve('.', 'compiled/public', 'index.html'));
});