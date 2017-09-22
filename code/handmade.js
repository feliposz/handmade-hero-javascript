"use strict";

gameCode.updateAndRender = function (memory, backBuffer, input) {
    if (!memory.isInitialized) {
        memory.isInitialized = true;
        memory.gameState = {            
            playerX: backBuffer.width/2,
            playerY: backBuffer.height/2+100,
            tJump: 0,
            tDash: 0            
        };
        memory.world = createWorld()
    }

    var state = memory.gameState;
    var world = memory.world;
    var tileMap = getTileMap(world, 0, 0);

    for (var i = 0; i < input.controllers.length; i++) {
        if (input.controllers[i].isConnected) {
            var controller = input.controllers[i];
            var dt = input.dtForFrame;
            if (controller.actionUp.endedDown) {
                if (state.tJump === 0 && !controller.actionUp.startedDown) {
                    state.tJump = 100;
                }
            }        

            var dPlayerX = controller.lStickX;
            var dPlayerY = controller.lStickY;
        
            dPlayerX *= 128;
            dPlayerY *= 128;
        
            var newPlayerX = state.playerX + dt * dPlayerX;
            var newPlayerY = state.playerY + dt * dPlayerY;
            
            if (isTileMapPointEmpty(world, tileMap, newPlayerX - 0.5 * playerWidth, newPlayerY) && 
                isTileMapPointEmpty(world, tileMap, newPlayerX + 0.5 * playerWidth, newPlayerY) && 
                isTileMapPointEmpty(world, tileMap, newPlayerX, newPlayerY)) {
                state.playerX = newPlayerX;
                state.playerY = newPlayerY;
            }            
        }
    }
    
    if (state.tJump > 0) {
        state.tJump -= 3;
    } else {
        state.tJump = 0;
    }

    state.playerX += state.tDash;
    if (Math.abs(state.tDash) < 1) {
        state.tDash = 0;
    } else {
        state.tDash *= 0.9;
    }
    
    drawRectangle(backBuffer, 0, 0, backBuffer.width, backBuffer.height, 1, 0, 1);
    
    for (var row = 0; row < tileMap.length; row++) {
        for (var col = 0; col < tileMap[row].length; col++) {
            var minX = col * world.tileSide + world.offsetX;
            var minY = row * world.tileSide + world.offsetY;
            var maxX = minX + world.tileSide;
            var maxY = minY + world.tileSide;
            var tileId = tileMap[row][col];
            var gray = 0.5;
            if (tileId == 1) {
                gray = 1;
            }
            drawRectangle(backBuffer, minX, minY, maxX, maxY, gray, gray, gray);
        }
    }

    var jump = 70 * Math.sin(state.tJump / 100.0 * Math.PI);
    var playerLeft = state.playerX - 0.5 * playerWidth + world.offsetX;
    var playerTop = state.playerY - jump - playerHeight + world.offsetY;
    var playerR = 1;
    var playerG = 1;
    var playerB = 0;    
    drawRectangle(backBuffer, playerLeft, playerTop, playerLeft + playerWidth, playerTop + playerHeight, playerR, playerG, playerB);   
    
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

// TODO: temporary for collision check below
var playerWidth = 50;
var playerHeight = 70;

gameCode.handleController = function (controller, state, dt, world, tileMap) {

};

function createWorld() {
    var world = {};
    world.tileSide = 60;
    world.tileMapCountX = 2;
    world.tileMapCountY = 2;
    world.tileCountX = 17;
    world.tileCountY = 9;
    world.offsetX = -30;
    world.offsetY = 0;
    world.tileMaps = [];

    // Upper left
    world.tileMaps.push([
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0 ],
        [ 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1 ],
    ]);

    // Lower left
    world.tileMaps.push([
        [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0 ],
        [ 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    ]);

    // Upper right
    world.tileMaps.push([
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1 ],
        [ 0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1 ],
        [ 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1 ],
    ]);

    // Lower right
    world.tileMaps.push([
        [ 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1 ],
        [ 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1 ],
        [ 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1 ],
        [ 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
        [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
    ]);
    
    return world;
}

function getTileMap(world, tileMapX, tileMapY) {
    if (tileMapX >= 0 && tileMapX < world.tileMapCountX && tileMapY >= 0 && tileMapY < world.tileMapCountY) {
        var i = tileMapX + tileMapY * world.tileMapCountX;
        return world.tileMaps[i];
    } else {
        return null;
    }
}

function isTileMapPointEmpty(world, tileMap, playerX, playerY) {
    var tileMapPointX = Math.trunc(playerX / world.tileSide);
    var tileMapPointY = Math.trunc(playerY / world.tileSide);
    if (tileMapPointX >= 0 && tileMapPointX < world.tileCountX && tileMapPointY >= 0 && tileMapPointY < world.tileCountY) {
        return tileMap[tileMapPointY][tileMapPointX] === 0;
    } else {
        return false;
    }
}

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
