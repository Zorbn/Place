import * as Socket from "socket.io-client";
import * as Camera from "./camera";

export const PIXEL_CANVAS_SIZE = 256;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const pixelCanvas = document.createElement('canvas')! as HTMLCanvasElement;
pixelCanvas.width = PIXEL_CANVAS_SIZE;
pixelCanvas.height = PIXEL_CANVAS_SIZE;

const pixelCtx = pixelCanvas.getContext('2d')!;
pixelCtx.imageSmoothingEnabled = false;

const pixels = pixelCtx.createImageData(PIXEL_CANVAS_SIZE, PIXEL_CANVAS_SIZE);

const colorPicker = document.getElementById('pixel-color') as HTMLInputElement;

let isMouseDown = false;
let didDrag = false;
let mouseX = 0;
let mouseY = 0;

let camera = {
    x: 0,
    y: 0,
    zoom: Math.max(window.innerWidth / PIXEL_CANVAS_SIZE, window.innerHeight / PIXEL_CANVAS_SIZE),
};

const drawCrosshair = () => {
    let pixelPos = Camera.getPixelPosition(camera, mouseX, mouseY);
    let canvasTransform = Camera.getCanvasTransform(camera);
    let x = pixelPos.x * camera.zoom + canvasTransform.x;
    let y = pixelPos.y * camera.zoom + canvasTransform.y;

    const outlineRect = (width: number, color: string) => {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.strokeRect(x, y, camera.zoom, camera.zoom);
    };

    outlineRect(7, 'black');
    outlineRect(3, 'white');
};

const hexToRgb = (hex: string): [number, number, number] => {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    return [r, g, b];
};

const drawPixels = () => {
    pixelCtx.putImageData(pixels, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let canvasTransform = Camera.getCanvasTransform(camera);
    ctx.drawImage(pixelCanvas, canvasTransform.x, canvasTransform.y, canvasTransform.width, canvasTransform.height);
};

const drawWorld = () => {
    drawPixels();
    drawCrosshair();
};

const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;

    Camera.adjustZoom(camera, 0);
};

let socket = Socket.io();

const setPixel = (x: number, y: number, r: number, g: number, b: number) => {
    let pixelI = 4 * (x + y * pixels.width);
    pixels.data[pixelI] = r;
    pixels.data[pixelI + 1] = g;
    pixels.data[pixelI + 2] = b;
    pixels.data[pixelI + 3] = 255;
};

socket.on('init', (pixelData: number[]) => {
    for (let i = 0; i < pixelData.length; i++) {
        pixels.data[i] = pixelData[i];
    }
});

socket.on('setPixel', (x: number, y: number, r: number, g: number, b: number) => {
    setPixel(x, y, r, g, b);
});

window.addEventListener('resize', resize);
resize();

canvas.addEventListener('wheel', (event) => {
    Camera.adjustZoom(camera, event.deltaY * 0.01);
});

canvas.addEventListener('mousedown', () => {
    isMouseDown = true;
    didDrag = false;
});

canvas.addEventListener('mouseup', (event) => {
    isMouseDown = false;

    if (event.button != 0) return;
    if (didDrag) return;

    let pixelPos = Camera.getPixelPosition(camera, event.clientX, event.clientY);
    let color = hexToRgb(colorPicker.value);
    socket.emit('click', pixelPos.x, pixelPos.y, color[0], color[1], color[2]);
});

canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;

    if (!isMouseDown) return;

    if (event.movementX != 0 || event.movementY != 0) {
        didDrag = true;
        Camera.pan(camera, event.movementX, event.movementY);
    }
});

const update = () => {
    drawWorld();
    requestAnimationFrame(update);
};

window.requestAnimationFrame(update);