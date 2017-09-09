"use strict";

var screen = document.createElement("canvas");
var buffer = document.createElement("canvas");

var bitmap;
var BPP = 4; // Bytes per pixel

function renderGreenBlueGradient(greenOffset, blueOffset) {
    var x, y, r, g, b, a, rowOffset, columnOffset;
    for (y = 0; y < bitmap.height; y++) {
        rowOffset = y*bitmap.width*BPP;
        for (x = 0; x < bitmap.width; x++) {
            columnOffset = rowOffset + x*BPP;
            r = Math.floor(y*255/bitmap.height);
            g = (x + greenOffset) % 256;
            b = (y + blueOffset) % 256;
            a = 255;
            bitmap.data[columnOffset + 0] = r;
            bitmap.data[columnOffset + 1] = g;
            bitmap.data[columnOffset + 2] = b;
            bitmap.data[columnOffset + 3] = a;
        }
    }
}

function displayBuffer() {
    buffer.getContext("2d").putImageData(bitmap, 0, 0, 0, 0, buffer.width, buffer.height);
    screen.getContext("2d").drawImage(buffer, 0, 0);
}

function resizeBuffer(width, height) {
    buffer.width = width;
    buffer.height = height;
    bitmap = buffer.getContext("2d").getImageData(0, 0, buffer.width, buffer.height);
}

function resizeWindow() {
    screen.width = window.innerWidth;
    screen.height = window.innerHeight;    
    screen.getContext("2d").scale(screen.width/buffer.width, screen.height/buffer.height);
    console.log("resize");
}

function focus() {
    console.log("focus");
}

function main() {
    var greenOffset = 0, blueOffset = 0;
    var loop = function () {
        renderGreenBlueGradient(greenOffset, blueOffset);
        blueOffset++;
        greenOffset += 2;
        displayBuffer();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function load() {
    document.body.appendChild(screen);
    window.onresize = resizeWindow;
    window.onfocus = focus;
    resizeBuffer(480, 270);
    resizeWindow();
    main();
}

window.onload = load;
