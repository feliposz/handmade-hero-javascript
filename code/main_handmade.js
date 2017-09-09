"use strict";

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var BPP = 4; // Bytes per pixel

function resize() {
    var bitmap, x, y;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    bitmap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    for (y = 0; y < bitmap.height; y++) {
        for (x = 0; x < bitmap.width; x++) {
            bitmap.data[y*bitmap.width*BPP + x*BPP + 0] = canvas.width % 256; // Red
            bitmap.data[y*bitmap.width*BPP + x*BPP + 1] = canvas.height % 256; // Green
            bitmap.data[y*bitmap.width*BPP + x*BPP + 2] = 128; // Blue
            bitmap.data[y*bitmap.width*BPP + x*BPP + 3] = 255; // Alpha (transparency)
        }
    }

    ctx.putImageData(bitmap, 0, 0, 0, 0, canvas.width, canvas.height);

    console.log("resize");
}

function focus() {
    console.log("focus");
}

function load() {
    document.body.appendChild(canvas);
    window.onresize = resize;
    window.onfocus = focus;
    resize();
}

window.onload = load;
