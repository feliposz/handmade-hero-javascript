"use strict";

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var bitmap;
var BPP = 4; // Bytes per pixel

function renderGreenBlueGradient(greenOffset, blueOffset) {
    var x, y, r, g, b, a;
    for (y = 0; y < bitmap.height; y++) {
        for (x = 0; x < bitmap.width; x++) {
            r = Math.floor(y * 255 / bitmap.height);
            g = (x + greenOffset) % 256;
            b = (y + blueOffset) % 256;
            a = 255;
            bitmap.data[y*bitmap.width*BPP + x*BPP + 0] = r;
            bitmap.data[y*bitmap.width*BPP + x*BPP + 1] = g;
            bitmap.data[y*bitmap.width*BPP + x*BPP + 2] = b;
            bitmap.data[y*bitmap.width*BPP + x*BPP + 3] = a;
        }
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bitmap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log("resize");
}

function focus() {
    console.log("focus");
}

function main() {
    var greenOffset = 0, blueOffset = 0;
    var loop = function () {
        renderGreenBlueGradient(greenOffset++, blueOffset++);
        ctx.putImageData(bitmap, 0, 0, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

function load() {
    document.body.appendChild(canvas);
    window.onresize = resize;
    window.onfocus = focus;
    resize();
    main();
}

window.onload = load;
