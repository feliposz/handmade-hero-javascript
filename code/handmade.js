"use strict";

var gameState = {
    waveType: "sine",
    tone: 256,
    volume: 1,
    greenOffset: 0,
    blueOffset: 0
};

function gameUpdateAndRender(backBuffer, soundOutput, input) {
    var i;
    for (i = 0; i < input.controllers.length; i++) {
        if (input.controllers[i]) {
            handleController(input.controllers[i], gameState);
        }
    }
    gameOutputSound(soundOutput, gameState.tone, gameState.volume, gameState.waveType);
    renderGreenBlueGradient(backBuffer, gameState.greenOffset, gameState.blueOffset);
}

function handleController(controller, state) {
    if (controller.aButton) {
        state.tone = 261;
    }
    if (controller.bButton) {
        state.tone = 293;
    }
    if (controller.xButton) {
        state.tone = 329;
    }
    if (controller.yButton) {
        state.tone = 349;
    }

    if (controller.start) {
        state.volume = 1;
    }
    if (controller.back) {
        state.volume = 0;
    }

    if (controller.rShoulder) {
        state.waveType = "sine";
    }
    if (controller.lShoulder) {
        state.waveType = "square";
    }
    if (controller.lStickThumb) {
        state.waveType = "triangle";
    }
    if (controller.rStickThumb) {
        state.waveType = "saw";
    }

    if (controller.isLStickAnalog) {
        state.tone = Math.floor(128 + (1 + controller.lStickX) / 2 * 256);
    } else {
        state.tone += controller.lStickX * 2;
        if (state.tone < 128) { state.tone = 128; }
        if (state.tone > 384) { state.tone = 384; }
    }
    if (controller.isLStickAnalog) {
        state.volume = 1 - controller.lStickY;
    } else {
        state.volume -= controller.lStickY * 0.05;
        if (state.volume < 0) { state.volume = 0; }
        if (state.volume > 384) { state.volume = 1; }
    }

    state.greenOffset -= controller.rStickX * 5;
    state.blueOffset -= controller.rStickY * 5;

    // color offsets must be positives!
    while (state.greenOffset < 0) {
        state.greenOffset += 256;
    }
    while (state.blueOffset < 0) {
        state.blueOffset += 256;
    }
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
