"use strict";

gameCode.updateAndRender = function (memory, backBuffer, input) {
    if (!memory.isInitialized) {
        memory.isInitialized = true;
        memory.gameState = {            
            playerX: backBuffer.width/2,
            playerY: backBuffer.height/2,
            tJump: 0,
            tDash: 0
        }
    }

    var i, gameState = memory.gameState;

    for (i = 0; i < input.controllers.length; i++) {
        if (input.controllers[i].isConnected) {
            gameCode.handleController(input.controllers[i], gameState);
        }
    }
    
    if (gameState.tJump > 0) {
        gameState.tJump -= 3;
    } else {
        gameState.tJump = 0;
    }

    gameState.playerX += gameState.tDash;
    if (Math.abs(gameState.tDash) < 1) {
        gameState.tDash = 0;
    } else {
        gameState.tDash *= 0.9;
    }
    
    drawRectangle(backBuffer, 0, 0, backBuffer.width, backBuffer.height, 1, 0, 1);
    var jump = 200 * Math.sin(gameState.tJump / 100.0 * Math.PI);
    drawRectangle(backBuffer, gameState.playerX, gameState.playerY-jump, gameState.playerX+10, gameState.playerY+10-jump, 1, 1, 0);

    if (DEBUG_MOUSE) {
        drawRectangle(backBuffer, input.mouseX, input.mouseY, input.mouseX+10, input.mouseY+10, 1, 1, 0);
        for (var i = 0; i < input.mouseButtons.length; i++) {
            if (input.mouseButtons[i].endedDown) {
                drawRectangle(backBuffer, 10 + 25 * i, 10, 20 + 25 * i, 20, 1, 0, 0);
            }  else {
                drawRectangle(backBuffer, 10 + 25 * i, 10, 20 + 25 * i, 20, 0, 0, 1);
            }
        }
    }
};

gameCode.handleController = function (controller, state) {
    if (controller.actionDown.endedDown) {
        if (state.tJump === 0 && !controller.actionDown.startedDown) {
            state.playerY += 50;
        }
    }
    if (controller.actionRight.endedDown) {
        if (state.tDash <= 0 && !controller.actionRight.startedDown) {
            state.tDash = +40;
        }
    }
    if (controller.actionLeft.endedDown) {
        if (state.tDash >= 0 && !controller.actionLeft.startedDown) {
            state.tDash = -40;
        }
    }
    if (controller.actionUp.endedDown) {
        if (state.tJump === 0 && !controller.actionUp.startedDown) {
            state.tJump = 100;
        }
    }

    state.playerX += controller.lStickX * 10;
    state.playerY += controller.lStickY * 10;
};

function drawRectangle(buffer, minX, minY, maxX, maxY, r, g, b) {
    var x, y, rowOffset, columnOffset;
    var h = buffer.height, w = buffer.width;
    minX = Math.round(minX);
    maxX = Math.round(maxX);
    minY = Math.round(minY);
    maxY = Math.round(maxY);
    minX = utils.clamp(minX, 0, w);
    minY = utils.clamp(minY, 0, h);
    maxX = utils.clamp(maxX, 0, w);
    maxY = utils.clamp(maxY, 0, h);
    for (y = minY; y < maxY; y++) {
        rowOffset = y * w * buffer.bytesPerPixel;
        for (x = minX; x < maxX; x++) {
            columnOffset = rowOffset + x * buffer.bytesPerPixel;
            buffer.bitmap.data[columnOffset + 0] = Math.floor(r * 255);
            buffer.bitmap.data[columnOffset + 1] = Math.floor(g * 255);
            buffer.bitmap.data[columnOffset + 2] = Math.floor(b * 255);
            buffer.bitmap.data[columnOffset + 3] = 255;
        }
    }    
}

gameCode.getSoundSamples = function (memory, output) {
    var i, offset, sample;

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
    output.lastWriteCursor = endWriteCursor;

    for (i = 0; i < writeCount; i++) {
        offset = (i + startWriteCursor) % output.bufferLength;
        sample = 0;
        output.left[offset] = sample;
        output.right[offset] = sample;
    }

};
