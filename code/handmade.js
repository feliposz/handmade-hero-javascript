"use strict";

gameCode.updateAndRender = function (memory, backBuffer, input) {
    if (!memory.isInitialized) {
        memory.isInitialized = true;
        memory.gameState = {
            waveType: "sine",
            tone: 256,
            volume: 0,
            hold: 0,
            greenOffset: 0,
            blueOffset: 0
        }
    }

    var i, gameState = memory.gameState;

    for (i = 0; i < input.controllers.length; i++) {
        if (input.controllers[i]) {
            gameCode.handleController(input.controllers[i], gameState);
        }
    }
    gameCode.renderGreenBlueGradient(backBuffer, gameState.greenOffset, gameState.blueOffset);
};

gameCode.handleController = function (controller, state) {
    if (state.hold > 0 && state.volume > 0) {
        state.volume -= 0.01;
        state.hold--;
    }
    if (controller.actionDown.endedDown) {
        state.tone = 261;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.actionRight.endedDown) {
        state.tone = 293;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.actionLeft.endedDown) {
        state.tone = 329;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.actionUp.endedDown) {
        state.tone = 349;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.dPadDown.endedDown) {
        state.tone = 392;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.dPadRight.endedDown) {
        state.tone = 440;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.dPadLeft.endedDown) {
        state.tone = 494;
        state.volume = 1;
        state.hold = 100;
    }
    if (controller.dPadUp.endedDown) {
        state.tone = 523;
        state.volume = 1;
        state.hold = 100;
    }

    if (controller.start.endedDown) {
        state.volume = 1;
        state.hold = 0;
    }
    if (controller.back.endedDown) {
        state.volume = 0;
    }

    if (controller.rShoulder.endedDown) {
        state.waveType = "sine";
    }
    if (controller.lShoulder.endedDown) {
        state.waveType = "square";
    }
    if (controller.lStickThumb.endedDown) {
        state.waveType = "triangle";
    }
    if (controller.rStickThumb.endedDown) {
        state.waveType = "saw";
    }

    if (controller.isLStickAnalog) {
        state.tone = Math.floor(128 + (1 + controller.lStickX) / 2 * 256);
    } else {
        state.tone += controller.lStickX * 2;
        if (state.tone < 27) { state.tone = 27; }
        if (state.tone > 4000) { state.tone = 4000; }
    }
    if (controller.isLStickAnalog) {
        state.volume = 1 - controller.lStickY;
        state.hold = 0;
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
};

gameCode.renderGreenBlueGradient = function (buffer, greenOffset, blueOffset) {
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
};

gameCode.getSoundSamples = function (memory, output) {
    var tone = memory.gameState.tone, volume = memory.gameState.volume, waveType = memory.gameState.waveType;
    var wavePeriod = output.sampleRate / tone;

    var i, offset, sample, PI2 = Math.PI * 2, increment = PI2 / wavePeriod;

    // TODO: should probably get average FPS instead of fixed 60
    var secondsPerFrame = 1 / 60;
    var frameLength = Math.floor(output.sampleRate * secondsPerFrame);
    var framesToWrite = 2;

    var playCursor = output.getPlayCursor();
    var latency = 1;
    var endWriteCursor = playCursor + frameLength * (latency + framesToWrite);
    var writeCount = 0;
    var startWriteCursor = 0;
    if (output.lastWriteCursor < endWriteCursor) {
        writeCount = endWriteCursor - output.lastWriteCursor;
        startWriteCursor = endWriteCursor - writeCount;
    } else {
        writeCount = endWriteCursor + output.bufferLength - output.lastWriteCursor;
        startWriteCursor = endWriteCursor - writeCount;
        if (startWriteCursor < 0) {
            startWriteCursor += output.bufferLength;
        }
    }
    //console.log(`Play: ${playCursor}, Last: ${output.lastWriteCursor}, Start: ${startWriteCursor}, End: ${endWriteCursor}, Count: ${writeCount}`);
    output.lastWriteCursor = endWriteCursor;

    for (i = 0; i < writeCount; i++) {
        if (waveType === "sine") {
            sample = Math.sin(output.tSine);
        } else if (waveType === "square") {
            sample = Math.sign(Math.sin(output.tSine));
        } else if (waveType === "triangle") {
            sample = Math.abs((output.tSine % PI2) - Math.PI) - Math.PI / 2;
        } else if (waveType === "saw") {
            sample = ((output.tSine % PI2) - Math.PI) / Math.PI;
        }
        offset = (i + startWriteCursor) % output.bufferLength;

        //output.left[offset] = sample * volume * (1-(offset / output.bufferLength));
        //output.right[offset] = sample * volume * (offset / output.bufferLength);
        output.left[offset] = sample * volume;
        output.right[offset] = sample * volume;

        output.tSine += increment;
    }

    while (output.tSine > PI2) {
        output.tSine -= PI2;
    }

};
