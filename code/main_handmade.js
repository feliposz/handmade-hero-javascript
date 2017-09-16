"use strict";

var DEBUG_PERFORMANCE = false;
var DEBUG_TONE = false;

function displayBuffer(screen, buffer) {
    buffer.canvas.getContext("2d").putImageData(buffer.bitmap, 0, 0, 0, 0, buffer.width, buffer.height);
    var ctx = screen.canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer.canvas, 0, 0);
    ctx.restore();
}

function resizeBuffer(buffer, width, height) {
    buffer.width = width;
    buffer.height = height;
    buffer.canvas.width = width;
    buffer.canvas.height = height;
    buffer.pitch = width * buffer.bytesPerPixel;
    buffer.bitmap = buffer.canvas.getContext("2d").getImageData(0, 0, buffer.width, buffer.height);
}

function resizeScreen(screen, buffer) {
    screen.width = window.innerWidth;
    screen.height = window.innerHeight;
    screen.canvas.width = screen.width;
    screen.canvas.height = screen.height;
    screen.canvas.getContext("2d").scale(screen.width / buffer.width, screen.height / buffer.height);
    console.log("resize");
}

function debugDrawVertical(buffer, x, top, bottom, color) {
    var y;
    x = Math.floor(x);
    top = Math.floor(top);
    bottom = Math.floor(bottom);
    //top = top < 0 ? 0 : top > buffer.height ? buffer.height : top;
    //bottom = bottom < 0 ? 0 : bottom > buffer.height ? buffer.height : bottom;
    var offset = top * buffer.pitch + x * buffer.bytesPerPixel;
    for (y = top; y <= bottom; y++) {
        buffer.bitmap.data[offset + 0] = color.r;
        buffer.bitmap.data[offset + 1] = color.g;
        buffer.bitmap.data[offset + 2] = color.b;
        buffer.bitmap.data[offset + 3] = 255;
        offset += buffer.pitch;
    }
}

function GameButtonState() {
    this.halfTransitionCount = 0;
    this.startedDown = false;
    this.endedDown = false;
}

function Controller() {
    this.isConnected = false;
    this.isLStickAnalog = false;
    this.isRStickAnalog = false;
    this.lStickX = 0;
    this.lStickY = 0;
    this.rStickX = 0;
    this.rStickY = 0;
    this.lTriggerValue = 0;
    this.rTriggerValue = 0;
    this.lTriggerButton = new GameButtonState();
    this.rTriggerButton = new GameButtonState();
    this.lStickThumb = new GameButtonState();
    this.rStickThumb = new GameButtonState();
    this.dPadUp = new GameButtonState();
    this.dPadDown = new GameButtonState();
    this.dPadLeft = new GameButtonState();
    this.dPadRight = new GameButtonState();
    this.start = new GameButtonState();
    this.back = new GameButtonState();
    this.lShoulder = new GameButtonState();
    this.rShoulder = new GameButtonState();
    this.actionUp = new GameButtonState();
    this.actionDown = new GameButtonState();
    this.actionLeft = new GameButtonState();
    this.actionRight = new GameButtonState();
}

function platformCreateInput(numControllers) {
    var i;
    var input = {
        controllers: []
    };
    for (i = 0; i < numControllers; i++) {
        input.controllers[i] = new Controller();
        input.controllers[i].isConnected = (i === 0);
    }
    return input;
}

function processDigitalButton(oldButtonState, newButtonState, pressed) {
    newButtonState.startedDown = oldButtonState.endedDown;
    newButtonState.endedDown = pressed;
    if (newButtonState.startedDown !== newButtonState.endedDown) {
        newButtonState.halfTransitionCount++;
    } else {
        newButtonState.halfTransitionCount = 0;
    }
}

function platformHandleGamepads(oldInput, newInput) {
    var i, pad, pads = navigator.getGamepads();
    var oldController, newController;
    for (i = 0; i < pads.length; i++) {
        if (pads[i]) {
            platformHandleInput(pads[i], oldInput.controllers[pads[i].index + 1], newInput.controllers[pads[i].index + 1]);
        }
    }
}

function platformHandleInput(pad, oldController, newController) {
    var DEADZONE = 0.25;
    newController.isConnected = pad.connected;
    if (pad.connected) {
        newController.isLStickAnalog = Math.abs(pad.axes[0]) > DEADZONE || Math.abs(pad.axes[1]) > DEADZONE;
        newController.isRStickAnalog = Math.abs(pad.axes[2]) > DEADZONE || Math.abs(pad.axes[3]) > DEADZONE;
        newController.lStickX = newController.isLStickAnalog ? pad.axes[0] : 0;
        newController.lStickY = newController.isLStickAnalog ? pad.axes[1] : 0;
        newController.rStickX = newController.isRStickAnalog ? pad.axes[2] : 0;
        newController.rStickY = newController.isRStickAnalog ? pad.axes[3] : 0;
        newController.lTriggerValue = pad.buttons[6].value;
        newController.rTriggerValue = pad.buttons[7].value;
        processDigitalButton(oldController.actionDown, newController.actionDown, pad.buttons[0].pressed);
        processDigitalButton(oldController.actionRight, newController.actionRight, pad.buttons[1].pressed);
        processDigitalButton(oldController.actionLeft, newController.actionLeft, pad.buttons[2].pressed);
        processDigitalButton(oldController.actionUp, newController.actionUp, pad.buttons[3].pressed);
        processDigitalButton(oldController.lShoulder, newController.lShoulder, pad.buttons[4].pressed);
        processDigitalButton(oldController.rShoulder, newController.rShoulder, pad.buttons[5].pressed);
        processDigitalButton(oldController.lTriggerButton, newController.lTriggerButton, pad.buttons[6].pressed);
        processDigitalButton(oldController.rTriggerButton, newController.rTriggerButton, pad.buttons[7].pressed);
        processDigitalButton(oldController.back, newController.back, pad.buttons[8].pressed);
        processDigitalButton(oldController.start, newController.start, pad.buttons[9].pressed);
        processDigitalButton(oldController.lStickThumb, newController.lStickThumb, pad.buttons[10].pressed);
        processDigitalButton(oldController.rStickThumb, newController.rStickThumb, pad.buttons[11].pressed);
        processDigitalButton(oldController.dPadUp, newController.dPadUp, pad.buttons[12].pressed);
        processDigitalButton(oldController.dPadDown, newController.dPadDown, pad.buttons[13].pressed);
        processDigitalButton(oldController.dPadLeft, newController.dPadLeft, pad.buttons[14].pressed);
        processDigitalButton(oldController.dPadRight, newController.dPadRight, pad.buttons[15].pressed);
    }
}

function createKeyboadPad() {
    var pad = {
        id: "Keyboard",
        index: null,
        connected: true,
        timestamp: 0,
        mapping: "standard",
        axes: [0, 0, 0, 0],
        buttons: [
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 },
            { pressed: false, value: 0 }
        ]
    };
    return pad;
}

function platformHandleKeyboardPad(pad, pressed, keyCode) {
    pad.connected = true;
    switch (keyCode) {
        case 87: pad.axes[1] = pressed ? -1 : 0; break; // W
        case 65: pad.axes[0] = pressed ? -1 : 0; break; // A
        case 83: pad.axes[1] = pressed ? +1 : 0; break; // S
        case 68: pad.axes[0] = pressed ? +1 : 0; break; // D
        case 73: pad.axes[3] = pressed ? -1 : 0; break; // I
        case 74: pad.axes[2] = pressed ? -1 : 0; break; // J
        case 75: pad.axes[3] = pressed ? +1 : 0; break; // K
        case 76: pad.axes[2] = pressed ? +1 : 0; break; // L
        case 40: pad.buttons[0].pressed = pressed; pad.buttons[0].value = pressed ? +1 : 0; break; // down arrow
        case 39: pad.buttons[1].pressed = pressed; pad.buttons[1].value = pressed ? +1 : 0; break; // right arrow
        case 37: pad.buttons[2].pressed = pressed; pad.buttons[2].value = pressed ? +1 : 0; break; // left arrow
        case 38: pad.buttons[3].pressed = pressed; pad.buttons[3].value = pressed ? +1 : 0; break; // up arrow
        case 81: pad.buttons[4].pressed = pressed; pad.buttons[4].value = pressed ? +1 : 0; break; // Q
        case 69: pad.buttons[5].pressed = pressed; pad.buttons[5].value = pressed ? +1 : 0; break; // E
        case 90: pad.buttons[6].pressed = pressed; pad.buttons[6].value = pressed ? +1 : 0; break; // Z
        case 67: pad.buttons[7].pressed = pressed; pad.buttons[7].value = pressed ? +1 : 0; break; // C
        case 27: pad.buttons[8].pressed = pressed; pad.buttons[8].value = pressed ? +1 : 0; break; // escape
        case 32: pad.buttons[9].pressed = pressed; pad.buttons[9].value = pressed ? +1 : 0; break; // space
        case 88: pad.buttons[10].pressed = pressed; pad.buttons[10].value = pressed ? +1 : 0; break; // X
        case 86: pad.buttons[11].pressed = pressed; pad.buttons[11].value = pressed ? +1 : 0; break; // V
        case 104: pad.buttons[12].pressed = pressed; pad.buttons[12].value = pressed ? +1 : 0; break; // Numpad 8 up
        case 98: pad.buttons[13].pressed = pressed; pad.buttons[13].value = pressed ? +1 : 0; break; // Numpad 2 down
        case 100: pad.buttons[14].pressed = pressed; pad.buttons[14].value = pressed ? +1 : 0; break; // Numpad 4 left
        case 102: pad.buttons[15].pressed = pressed; pad.buttons[15].value = pressed ? +1 : 0; break; // Numpad 6 right
    }
}

function SoundOutput() {
    this.sampleRate = 48000; // samples per second
    this.duration = 2; // seconds
    this.bufferLength = this.sampleRate * this.duration;
    this.tSine = 0; // radians
    this.lastWriteCursor = 0; // index
    this.left = new Float32Array(this.bufferLength);
    this.right = new Float32Array(this.bufferLength);
}

function platformInitAudioOutput(audio, output) {
    var context = new AudioContext();
    var buffer = context.createBuffer(2, output.bufferLength, output.sampleRate);
    var source = context.createBufferSource();
    var gain = context.createGain();

    if (DEBUG_TONE) {
        // Debug Tone
        var osc = context.createOscillator();
        var panner = context.createPanner();
        osc.frequency.value = 256;
        osc.type = "triangle";
        panner.channelCount = 2;
        panner.positionX.value = -1;
        osc.connect(panner);
        panner.connect(gain);
        osc.start();
    }

    buffer.copyFromChannel(output.left, 0);
    buffer.copyFromChannel(output.right, 1);
    //output.left = buffer.getChannelData(0);
    //output.right = buffer.getChannelData(1);

    gain.gain.value = 0.2;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.loop = true;
    source.start();

    output.getCurrentTime = function () {
         return context.currentTime; 
    };
    output.getPlayCursor = function () { 
        return Math.floor(context.currentTime % output.duration / output.duration * output.bufferLength);
    };
    audio.buffer = buffer;
}

function platformFillSoundBuffer(audio, output) {
    audio.buffer.copyToChannel(output.left, 0);
    audio.buffer.copyToChannel(output.right, 1);
}

function main() {

    var screen = {};
    var backBuffer = {};
    var audio = {};
    var memory = {
        isInitialized: false
    }
    screen.canvas = document.createElement("canvas");
    backBuffer.canvas = document.createElement("canvas");
    backBuffer.bytesPerPixel = 4;

    var keyboardPad = createKeyboadPad();
    var oldInput = platformCreateInput(5);
    var newInput = platformCreateInput(5);

    var soundOutput = new SoundOutput();
    var i, sample;

    platformInitAudioOutput(audio, soundOutput);

    //resizeBuffer(backBuffer, 480, 270);
    //resizeBuffer(backBuffer, 960, 540);
    resizeBuffer(backBuffer, 1920, 1080);
    resizeScreen(screen, backBuffer);

    document.body.appendChild(screen.canvas);

    window.onresize = function () {
        resizeScreen(screen, backBuffer);
    };
    window.onfocus = function () {
        console.log("focus");
    };
    window.onblur = function () {
        console.log("blur");
    };
    window.onkeydown = function (evt) {
        platformHandleKeyboardPad(keyboardPad, true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        platformHandleKeyboardPad(keyboardPad, false, evt.keyCode);
    };

    var lastT = performance.now();
    var totalT = 0;
    var frameCount = 0;
    var debugMarkers = [];
    var currentDebugMaker = 0;
    
    var loop = function () {
        platformHandleInput(keyboardPad, oldInput.controllers[0], newInput.controllers[0]);
        platformHandleGamepads(oldInput, newInput);
        gameUpdateAndRender(memory, backBuffer, soundOutput, newInput);
        
        // playcursor markers
        debugMarkers[currentDebugMaker] = soundOutput.getPlayCursor() / soundOutput.bufferLength * backBuffer.width;
        for (var i = 0; i < debugMarkers.length; i++) {
            debugDrawVertical(backBuffer, debugMarkers[i], 10, backBuffer.height/2, i === currentDebugMaker ? {r: 255, g: 255, b: 255} : {r: 255, g: 0, b: 0});
        }
        currentDebugMaker = (currentDebugMaker + 1) % 10;
        
        // draw sound buffer samples
        var offset, sample, x;
        for (x = 0; x < backBuffer.width; x++) {
            offset = Math.floor(x / backBuffer.width * soundOutput.bufferLength);
            sample = soundOutput.left[offset] * backBuffer.height*0.05;
            if (sample < 0) {
                debugDrawVertical(backBuffer, x, backBuffer.height*.25 + sample, backBuffer.height*.25, {r: 255, g: 255, b: 0});
            } else if (sample > 0) {
                debugDrawVertical(backBuffer, x, backBuffer.height*.25, sample + backBuffer.height*.25, {r: 0, g: 255, b: 0});
            }
            sample = soundOutput.right[offset] * backBuffer.height*0.05;
            if (sample < 0) {
                debugDrawVertical(backBuffer, x, backBuffer.height*.5 + sample, backBuffer.height*.5, {r: 255, g: 0, b: 255});
            } else if (sample > 0) {
                debugDrawVertical(backBuffer, x, backBuffer.height*.5, sample + backBuffer.height*.5, {r: 0, g: 0, b: 255});
            }
        }

        platformFillSoundBuffer(audio, soundOutput);
        displayBuffer(screen, backBuffer);

        var tmp = newInput;
        newInput = oldInput;
        oldInput = tmp;

        var currentT = performance.now();
        var elapsedT = currentT - lastT;
        lastT = currentT;

        if (DEBUG_PERFORMANCE) {
            // Avoid spikes when focusing back on blurred tab
            if (elapsedT < 1000) {
                frameCount++;
                totalT += elapsedT;
                if (totalT > 1000) {
                    var avgFramesPerSec = frameCount / totalT * 1000;
                    var avgMsPerFrame = totalT / frameCount;
                    console.log("Avg: " + avgMsPerFrame + " ms/f, " + avgFramesPerSec + " f/s");
                    frameCount = 0;
                    totalT -= 1000;
                }
            }
        }
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = main;
