import { PIXEL_CANVAS_SIZE } from "./main";

const MIN_ZOOM = 1;

export type Camera = {
    x: number,
    y: number,
    zoom: number,
};

export type Position = {
    x: number,
    y: number,
};

export type Transform = {
    x: number,
    y: number,
    width: number,
    height: number,
};

export const getCanvasTransform = (cam: Camera): Transform => {
    return {
        x: cam.x * cam.zoom + window.innerWidth / 2 - PIXEL_CANVAS_SIZE * cam.zoom / 2,
        y: cam.y * cam.zoom + window.innerHeight / 2 - PIXEL_CANVAS_SIZE * cam.zoom / 2,
        width: PIXEL_CANVAS_SIZE * cam.zoom,
        height: PIXEL_CANVAS_SIZE * cam.zoom,
    };
}

export const getPixelPosition = (cam: Camera, clickX: number, clickY: number): Position => {
    let canvasTransform = getCanvasTransform(cam);

    return {
        x: Math.floor((clickX - canvasTransform.x) / cam.zoom),
        y: Math.floor((clickY - canvasTransform.y) / cam.zoom),
    };
}

export const adjustZoom = (cam: Camera, delta: number) => {
    cam.zoom -= delta;
    if (cam.zoom < MIN_ZOOM) cam.zoom = MIN_ZOOM;
};

export const pan = (cam: Camera, deltaX: number, deltaY: number) => {
    cam.x += deltaX / cam.zoom;
    cam.y += deltaY / cam.zoom;
};