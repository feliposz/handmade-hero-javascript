"use strict";

gameCode.updateAndRender = function (memory, backBuffer, input) {
    if (!memory.isInitialized) {
        memory.isInitialized = true;
        memory.gameState = {
            playerP: new CanonicalPosition(0, 0, 8, 5, 0, 0),
            tJump: 0
        };
        memory.world = createWorld()
    }

    var state = memory.gameState;
    var world = memory.world;
    var tileMap = getTileMap(world, state.playerP.tileMapX, state.playerP.tileMapY);
    var playerWidth = 0.75 * world.tileSideInMeters;
    var playerHeight = world.tileSideInMeters;

    for (var i = 0; i < input.controllers.length; i++) {
        if (input.controllers[i].isConnected) {
            var controller = input.controllers[i];
            var dt = input.dtForFrame;

            var playerSpeed = 10;

            if (controller.actionDown.endedDown) {
                playerSpeed = 30;
            }

            if (controller.actionUp.endedDown) {
                if (state.tJump === 0 && !controller.actionUp.startedDown) {
                    state.tJump = 1;
                }
            }

            var dPlayerX = controller.lStickX;
            var dPlayerY = controller.lStickY;

            dPlayerX *= playerSpeed;
            dPlayerY *= playerSpeed;

            var newPlayerP = utils.copyObject(state.playerP);
            newPlayerP.x = state.playerP.x + dt * dPlayerX;
            newPlayerP.y = state.playerP.y + dt * dPlayerY;

            var newPlayerLeft = utils.copyObject(newPlayerP);
            var newPlayerRight = utils.copyObject(newPlayerP);
            newPlayerLeft.x -= 0.5 * playerWidth;
            newPlayerRight.x += 0.5 * playerWidth;
            
            recanonicalizePosition(world, newPlayerP);
            recanonicalizePosition(world, newPlayerLeft);
            recanonicalizePosition(world, newPlayerRight);

            if (isWorldPointEmpty(world, newPlayerLeft) &&
                isWorldPointEmpty(world, newPlayerRight) && 
                isWorldPointEmpty(world, newPlayerP)) {
                state.playerP = newPlayerP;
            }
        }
    }

    if (state.tJump > 0) {
        state.tJump -= 0.03;
    } else {
        state.tJump = 0;
    }

    drawRectangle(backBuffer, 0, 0, backBuffer.width, backBuffer.height, 1, 0, 1);

    for (var row = 0; row < tileMap.length; row++) {
        for (var col = 0; col < tileMap[row].length; col++) {
            var minX = col * world.tileSideInPixels + world.offsetX;
            var minY = row * world.tileSideInPixels + world.offsetY;
            var maxX = minX + world.tileSideInPixels;
            var maxY = minY + world.tileSideInPixels;
            var tileId = tileMap[row][col];
            var gray = 0.5;
            if (tileId == 1) {
                gray = 1;
            }
            if (row === state.playerP.tileY && col === state.playerP.tileX) {
                gray = 0;
            }
            drawRectangle(backBuffer, minX, minY, maxX, maxY, gray, gray, gray);
        }
    }

    var jump = Math.sin(state.tJump * Math.PI) * world.tileSideInMeters;
    var playerLeft = state.playerP.tileX * world.tileSideInPixels + (state.playerP.x - 0.5 * playerWidth) * world.metersToPixels + world.offsetX;
    var playerTop = state.playerP.tileY * world.tileSideInPixels + (state.playerP.y - jump - playerHeight) * world.metersToPixels + world.offsetY;
    var playerRight = playerLeft + playerWidth * world.metersToPixels;
    var playerBottom = playerTop + playerHeight * world.metersToPixels;
    var playerR = 1;
    var playerG = 1;
    var playerB = 0;
    drawRectangle(backBuffer, playerLeft, playerTop, playerRight, playerBottom, playerR, playerG, playerB);

    if (DEBUG_MOUSE) {
        drawRectangle(backBuffer, input.mouseX, input.mouseY, input.mouseX + 10, input.mouseY + 10, 1, 1, 0);
        for (var i = 0; i < input.mouseButtons.length; i++) {
            if (input.mouseButtons[i].endedDown) {
                drawRectangle(backBuffer, 10 + 25 * i, 10, 20 + 25 * i, 20, 1, 0, 0);
            } else {
                drawRectangle(backBuffer, 10 + 25 * i, 10, 20 + 25 * i, 20, 0, 0, 1);
            }
        }
    }
};

function CanonicalPosition(tileMapX, tileMapY, tileX, tileY, x, y) {
    this.tileMapX = tileMapX;
    this.tileMapY = tileMapY;
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = x;
    this.y = y;
}

function createWorld() {
    var world = {};
    world.tileSideInPixels = 60;
    world.tileSideInMeters = 1.4;
    world.metersToPixels = world.tileSideInPixels / world.tileSideInMeters;
    world.tileMapCountX = 2;
    world.tileMapCountY = 2;
    world.tileCountX = 17;
    world.tileCountY = 9;
    world.offsetX = -0.5 * world.tileSideInPixels;
    world.offsetY = 0;
    world.tileMaps = [];

    // Upper left
    world.tileMaps.push([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    ]);

    // Upper right
    world.tileMaps.push([
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
        [0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    ]);

    // Lower left
    world.tileMaps.push([
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]);    

    // Lower right    
    world.tileMaps.push([
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 0, 1],
        [0, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
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

function isTileMapPointEmpty(world, tileMap, tileX, tileY) {
    if (tileX >= 0 && tileX < world.tileCountX && tileY >= 0 && tileY < world.tileCountY) {
        return tileMap[tileY][tileX] === 0;
    } else {
        return false;
    }
}

function isWorldPointEmpty(world, canPos) {
    var tileMap = getTileMap(world, canPos.tileMapX, canPos.tileMapY);
    return isTileMapPointEmpty(world, tileMap, canPos.tileX, canPos.tileY);
}

function recanonicalizePosition(world, canPos) {
    if (canPos.x < 0) {
        canPos.x += world.tileSideInMeters;
        canPos.tileX--;
    }
    if (canPos.y < 0) {
        canPos.y += world.tileSideInMeters;
        canPos.tileY--;
    }
    if (canPos.x >= world.tileSideInMeters) {
        canPos.x -= world.tileSideInMeters;
        canPos.tileX++;
    }
    if (canPos.y >= world.tileSideInMeters) {
        canPos.y -= world.tileSideInMeters;
        canPos.tileY++;
    }
    if (canPos.tileX < 0) {
        canPos.tileX += world.tileCountX;
        canPos.tileMapX--;
    }
    if (canPos.tileX >= world.tileCountX) {
        canPos.tileX -= world.tileCountX;
        canPos.tileMapX++;
    }
    if (canPos.tileY < 0) {
        canPos.tileY += world.tileCountY;
        canPos.tileMapY--;
    }
    if (canPos.tileY >= world.tileCountY) {
        canPos.tileY -= world.tileCountY;
        canPos.tileMapY++;
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
