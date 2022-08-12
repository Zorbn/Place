import express from "express";
import * as Socket from "socket.io";
import * as Http from "http";
import path from "path";
import * as Fs from "fs";

const PIXEL_CANVAS_SIZE = 256;
const AUTOSAVE_PATH = 'autosave.place';
const AUTOSAVE_DELAY_MS = 5000;

let pixelData: number[] = [];
let loadedData = false;

const getTimestamp = (): string => {
    let date = new Date();
    let h = date.getHours().toString().padStart(2, '0');
    let m = date.getMinutes().toString().padStart(2, '0');
    let s = date.getSeconds().toString().padStart(2, '0');
    let ms = date.getMilliseconds().toString().padStart(3, '0');
    return `[${h}:${m}:${s}:${ms}]`;
};

const logMsg = (msg: string) => {
    console.log(`${getTimestamp()} ${msg}`);
};

const logErr = (err: string) => {
    console.log(`${getTimestamp()} ${err}`);
};

if (Fs.existsSync('autosave.place')) {
    Fs.readFile(AUTOSAVE_PATH, 'utf8', (err, data) => {
        if (err) {
            logErr(`Error loading '${AUTOSAVE_PATH}': ${err}`);
            return;
        }

        logMsg(`Loaded save from '${AUTOSAVE_PATH}'`);

        pixelData = JSON.parse(data);
        loadedData = true;
    });
}

if (!loadedData) {
    for (let i = 0; i < PIXEL_CANVAS_SIZE * PIXEL_CANVAS_SIZE * 4; ++i) {
        pixelData.push(255);
    }
}

const autosave = () => {
    Fs.writeFile(AUTOSAVE_PATH, JSON.stringify(pixelData), (err) => {
        if (err) {
            logErr(`Error saving '${AUTOSAVE_PATH}': ${err}`);
        } else {
            logMsg(`Autosaved to '${AUTOSAVE_PATH}'`)
        }
    });
};

setInterval(autosave, AUTOSAVE_DELAY_MS);

const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
    let pixelI = (x + y * PIXEL_CANVAS_SIZE) * 4;
    pixelData[pixelI] = r;
    pixelData[pixelI + 1] = g;
    pixelData[pixelI + 2] = b;
};

const app = express();
const server = Http.createServer(app);
const io = new Socket.Server(server);

app.use(express.static(path.join(__dirname, '../place-client/dist')))

io.on('connection', (socket) => {
    logMsg('A user connected.');
    socket.emit('init', pixelData);

    socket.on('disconnect', () => {
        logMsg('A user disconnected.');
    });

    socket.on('click', (x: number, y: number, r: number, g: number, b: number) => {
        if (r < 0 || r > 255) return;
        if (g < 0 || g > 255) return;
        if (b < 0 || b > 255) return;

        setPixel(x, y, r, g, b);
        io.emit('setPixel', x, y, r, g, b);
    });
});

server.listen(3000, () => {
    logMsg('Listening on *:3000...');
});