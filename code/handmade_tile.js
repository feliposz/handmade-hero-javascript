function WorldPosition(tileX, tileY, x, y) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = x;
    this.y = y;
}

function getTileChunk(world, tileChunkX, tileChunkY) {
    if (tileChunkX >= 0 && tileChunkX < world.tileChunkCountX && tileChunkY >= 0 && tileChunkY <= world.tileChunkCountY) {
        return world.tileChunks[tileChunkX + tileChunkY * world.tileChunkCountX];
    }
    return undefined;
}

function getTileValue(world, absTileX, absTileY) {
    var tileChunkPosition = getTileChunkPosition(world, absTileX, absTileY);
    var tileChunk = getTileChunk(world, tileChunkPosition.tileChunkX, tileChunkPosition.tileChunkY);
    return getTileChunkValue(tileChunk, tileChunkPosition.relTileX, tileChunkPosition.relTileY);
}

function setTileValue(world, absTileX, absTileY, value) {
    var tileChunkPosition = getTileChunkPosition(world, absTileX, absTileY);
    var tileChunk = getTileChunk(world, tileChunkPosition.tileChunkX, tileChunkPosition.tileChunkY);
    return setTileChunkValue(tileChunk, tileChunkPosition.relTileX, tileChunkPosition.relTileY, value);
}

function getTileChunkValue(tileChunk, tileX, tileY) {
    if (tileChunk && tileY >= 0 && tileY < tileChunk.length && tileX >= 0 && tileX < tileChunk[tileY].length) {
        return tileChunk[tileY][tileX];
    }
    return -1;
}

function setTileChunkValue(tileChunk, tileX, tileY, value) {
    if (tileChunk === undefined) debugger;
    if (tileY >= 0 && tileY < tileChunk.length && tileX >= 0 && tileX < tileChunk[tileY].length) {
        tileChunk[tileY][tileX] = value;
    }
}

function isTileChunkTileEmpty(tileChunk, tileX, tileY) {
    return getTileChunkValue(tileChunk, tileX, tileY) === 0;
}

function getTileChunkPosition(world, absTileX, absTileY) {
    var tileChunkPosition = {};
    tileChunkPosition.tileChunkX = Math.floor(absTileX / world.tileChunkDim);
    tileChunkPosition.tileChunkY = Math.floor(absTileY / world.tileChunkDim);
    tileChunkPosition.relTileX = absTileX % world.tileChunkDim;
    tileChunkPosition.relTileY = absTileY % world.tileChunkDim;
    return tileChunkPosition;
}

function isWorldPointEmpty(world, pos) {
    var tileChunkPosition = getTileChunkPosition(world, pos.tileX, pos.tileY);
    var tileChunk = getTileChunk(world, tileChunkPosition.tileChunkX, tileChunkPosition.tileChunkY);
    return isTileChunkTileEmpty(tileChunk, tileChunkPosition.relTileX, tileChunkPosition.relTileY);
}

function recanonicalizePosition(world, pos) {
    var offsetX = Math.round(pos.x / world.tileSideInMeters);
    var offsetY = Math.round(pos.y / world.tileSideInMeters);
    pos.tileX += offsetX;
    pos.tileY += offsetY;
    pos.x -= offsetX * world.tileSideInMeters;
    pos.y -= offsetY * world.tileSideInMeters;
}
