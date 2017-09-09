"use strict";

function renderGreenBlueGradient(buffer, greenOffset, blueOffset) {
    var x, y, r, g, b, a, rowOffset, columnOffset;
    for (y = 0; y < buffer.height; y++) {
        rowOffset = y * buffer.width * buffer.bytesPerPixel;
        for (x = 0; x < buffer.width; x++) {
            columnOffset = rowOffset + x * buffer.bytesPerPixel;
            r = Math.floor(y * 255 / buffer.height);
            g = (x + greenOffset) % 256;
            b = (y + blueOffset) % 256;
            a = 255;
            buffer.bitmap.data[columnOffset + 0] = r;
            buffer.bitmap.data[columnOffset + 1] = g;
            buffer.bitmap.data[columnOffset + 2] = b;
            buffer.bitmap.data[columnOffset + 3] = a;
        }
    }
}

function gameUpdateAndRender(buffer, state) {
    renderGreenBlueGradient(buffer, state.greenOffset, state.blueOffset);
}
