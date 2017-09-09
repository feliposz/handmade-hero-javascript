"use strict";

function gameUpdateAndRender(backBuffer, soundOutput, gameState) {
    gameOutputSound(soundOutput, gameState.tone, gameState.volume, gameState.waveType);
    renderGreenBlueGradient(backBuffer, gameState.greenOffset, gameState.blueOffset);
}

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

function gameOutputSound(output, tone, volume, waveType) {
    var wavePeriod = output.sampleRate / tone;
    var i, sample, PI2 = Math.PI * 2, increment = PI2 / wavePeriod;
    for (i = 0; i < output.bufferLength; i++) {
        if (waveType === "sine") {
            sample = Math.sin(output.tSine);
        } else if (waveType === "square") {
            sample = Math.sign(Math.sin(output.tSine));
        } else if (waveType === "triangle") {
            sample = Math.abs((output.tSine % PI2) - Math.PI) - Math.PI / 2;
        } else if (waveType === "saw") {
            sample = ((output.tSine % PI2) - Math.PI) / Math.PI;
        }
        output.left[i] = sample * volume;
        output.right[i] = sample * volume;
        output.tSine += increment;
    }
    while (output.tSine > PI2) {
        output.tSine -= PI2;
    }
}
