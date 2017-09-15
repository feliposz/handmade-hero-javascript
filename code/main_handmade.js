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

function platformHandleGamepad(oldInput, newInput) {
    var i, pad, pads = navigator.getGamepads();
    var DEADZONE = 0.25;
    var oldController, newController;
    for (i = 0; i < pads.length; i++) {
        pad = pads[i];
        if (pad) {
            oldController = oldInput.controllers[pad.index+1];
            newController = newInput.controllers[pad.index+1];
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
                processDigitalButton(oldController.lStickThumb, newController.lStickThumb, pad.buttons[10].pressed);
                processDigitalButton(oldController.rStickThumb, newController.rStickThumb, pad.buttons[11].pressed);
                processDigitalButton(oldController.dPadUp, newController.dPadUp, pad.buttons[12].pressed);
                processDigitalButton(oldController.dPadDown, newController.dPadDown, pad.buttons[13].pressed);
                processDigitalButton(oldController.dPadLeft, newController.dPadLeft, pad.buttons[14].pressed);
                processDigitalButton(oldController.dPadRight, newController.dPadRight, pad.buttons[15].pressed);
                processDigitalButton(oldController.start, newController.start, pad.buttons[9].pressed);
                processDigitalButton(oldController.back, newController.back, pad.buttons[8].pressed);
                processDigitalButton(oldController.lShoulder, newController.lShoulder, pad.buttons[4].pressed);
                processDigitalButton(oldController.rShoulder, newController.rShoulder, pad.buttons[5].pressed);
                processDigitalButton(oldController.lTriggerButton, newController.lTriggerButton, pad.buttons[6].pressed);
                processDigitalButton(oldController.rTriggerButton, newController.rTriggerButton, pad.buttons[7].pressed);
                processDigitalButton(oldController.actionDown, newController.actionDown, pad.buttons[0].pressed);
                processDigitalButton(oldController.actionRight, newController.actionRight, pad.buttons[1].pressed);
                processDigitalButton(oldController.actionLeft, newController.actionLeft, pad.buttons[2].pressed);
                processDigitalButton(oldController.actionUp, newController.actionUp, pad.buttons[3].pressed);
            }
        }
    }
}

function platformHandleKeyboard(oldInput, newInput, pressed, keyCode) {
    var oldKb = oldInput.controllers[0];
    var newKb = newInput.controllers[0];
    //console.log(pressed, keyCode);
    switch (keyCode) {
        case 87: newKb.lStickY = pressed ? -1 : 0; newKb.isLStickAnalog = false; break; // W
        case 65: newKb.lStickX = pressed ? -1 : 0; newKb.isLStickAnalog = false; break; // A
        case 83: newKb.lStickY = pressed ? +1 : 0; newKb.isLStickAnalog = false; break; // S
        case 68: newKb.lStickX = pressed ? +1 : 0; newKb.isLStickAnalog = false; break; // D
        case 73: newKb.rStickY = pressed ? -1 : 0; newKb.isRStickAnalog = false; break; // I
        case 74: newKb.rStickX = pressed ? -1 : 0; newKb.isRStickAnalog = false; break; // J
        case 75: newKb.rStickY = pressed ? +1 : 0; newKb.isRStickAnalog = false; break; // K
        case 76: newKb.rStickX = pressed ? +1 : 0; newKb.isRStickAnalog = false; break; // L
        case 188: newKb.lTriggerValue = pressed ? +1 : 0; processDigitalButton(oldKb.lTriggerButton, newKb.lTriggerButton, pressed); break; // .
        case 190: newKb.rTriggerValue = pressed ? +1 : 0; processDigitalButton(oldKb.rTriggerButton, newKb.rTriggerButton, pressed);break; // ,
        case 82: processDigitalButton(oldKb.lStickThumb, newKb.lStickThumb, pressed); break; // R
        case 70: processDigitalButton(oldKb.rStickThumb, newKb.rStickThumb, pressed); break; // F
        case 38: processDigitalButton(oldKb.dPadUp, newKb.dPadUp, pressed); break; // up arrow
        case 40: processDigitalButton(oldKb.dPadDown, newKb.dPadDown, pressed); break; // down arrow
        case 37: processDigitalButton(oldKb.dPadLeft, newKb.dPadLeft, pressed); break; // left arrow
        case 39: processDigitalButton(oldKb.dPadRight, newKb.dPadRight, pressed); break; // right arrow
        case 32: processDigitalButton(oldKb.start, newKb.start, pressed); break; // space
        case 27: processDigitalButton(oldKb.back, newKb.back, pressed); break; // escape
        case 81: processDigitalButton(oldKb.lShoulder, newKb.lShoulder, pressed); break; // Q
        case 69: processDigitalButton(oldKb.rShoulder, newKb.rShoulder, pressed); break; // E
        case 90: processDigitalButton(oldKb.actionDown, newKb.actionDown, pressed); break; // Z
        case 88: processDigitalButton(oldKb.actionRight, newKb.actionRight, pressed); break; // X
        case 67: processDigitalButton(oldKb.actionLeft, newKb.actionLeft, pressed); break; // C
        case 86: processDigitalButton(oldKb.actionUp, newKb.actionUp, pressed); break; // V
    }
    // TODO: Find a better way to deal with transition from old to new while simulating analog...
    oldKb.lStickX = newKb.lStickX;
    oldKb.lStickY = newKb.lStickY;
    oldKb.rStickX = newKb.rStickX;
    oldKb.rStickY = newKb.rStickY;
    oldKb.lTriggerValue = newKb.lTriggerValue;
    oldKb.rTriggerValue = newKb.rTriggerValue;
    oldKb.isLStickAnalog = newKb.isLStickAnalog;
    oldKb.isRStickAnalog = newKb.isRStickAnalog;    
}

function SoundOutput() {
    this.sampleRate = 48000;
    this.duration = 2;
    this.bufferLength = this.sampleRate * this.duration;
    this.tSine = 0;
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

    audio.buffer = buffer;
}

function platformFillSoundBuffer(audio, output) {
    audio.buffer.copyToChannel(output.left, 0);
    audio.buffer.copyToChannel(output.right, 1);
}

var input = {};

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

    var oldInput = platformCreateInput(5);
    var newInput = platformCreateInput(5);

    var soundOutput = new SoundOutput();
    var i, sample;

    platformInitAudioOutput(audio, soundOutput);

    resizeBuffer(backBuffer, 480, 270);
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
        platformHandleKeyboard(oldInput, newInput, true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        platformHandleKeyboard(oldInput, newInput, false, evt.keyCode);
    };

    var lastT = performance.now();
    var totalT = 0;
    var frameCount = 0;

    var loop = function () {
        platformHandleGamepad(oldInput, newInput);
        gameUpdateAndRender(memory, backBuffer, soundOutput, newInput);
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
