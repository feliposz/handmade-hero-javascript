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

function platformHandleGamepad(input) {
    var i, pad, pads = navigator.getGamepads();
    var DEADZONE = 0.25;
    var controller;
    while (input.controllers.length + 1 < pads.length) {
        input.controllers.push(new Controller);
    }
    for (i = 0; i < pads.length; i++) {
        pad = pads[i];
        if (pad && pad.connected) {
            controller = input.controllers[i + 1]; // 0 is keyboard
            controller.isLStickAnalog = Math.abs(pad.axes[0]) > DEADZONE || Math.abs(pad.axes[1]) > DEADZONE;
            controller.isRStickAnalog = Math.abs(pad.axes[2]) > DEADZONE || Math.abs(pad.axes[3]) > DEADZONE;
            controller.lStickX = controller.isLStickAnalog ? pad.axes[0] : 0;
            controller.lStickY = controller.isLStickAnalog ? pad.axes[1] : 0;
            controller.rStickX = controller.isRStickAnalog ? pad.axes[2] : 0;
            controller.rStickY = controller.isRStickAnalog ? pad.axes[3] : 0;
            controller.lTriggerValue = pad.buttons[6].value;
            controller.rTriggerValue = pad.buttons[7].value;
            controller.lStickThumb = pad.buttons[10].pressed;
            controller.rStickThumb = pad.buttons[11].pressed;
            controller.up = pad.buttons[12].pressed;
            controller.down = pad.buttons[13].pressed;
            controller.left = pad.buttons[14].pressed;
            controller.right = pad.buttons[15].pressed;
            controller.start = pad.buttons[9].pressed;
            controller.back = pad.buttons[8].pressed;
            controller.lShoulder = pad.buttons[4].pressed;
            controller.rShoulder = pad.buttons[5].pressed;
            controller.lTriggerButton = pad.buttons[6].pressed;
            controller.rTriggerButton = pad.buttons[7].pressed;
            controller.aButton = pad.buttons[0].pressed;
            controller.bButton = pad.buttons[1].pressed;
            controller.xButton = pad.buttons[2].pressed;
            controller.yButton = pad.buttons[3].pressed;
        }
    }
}

function platformHandleKeyboard(controller, pressed, keyCode) {
    //console.log(pressed, keyCode);
    switch (keyCode) {
        case 87: controller.lStickY = pressed ? -1 : 0; controller.isLStickAnalog = false; break; // W
        case 65: controller.lStickX = pressed ? -1 : 0; controller.isLStickAnalog = false; break; // A
        case 83: controller.lStickY = pressed ? +1 : 0; controller.isLStickAnalog = false; break; // S
        case 68: controller.lStickX = pressed ? +1 : 0; controller.isLStickAnalog = false; break; // D
        case 73: controller.rStickY = pressed ? -1 : 0; controller.isRStickAnalog = false; break; // I
        case 74: controller.rStickX = pressed ? -1 : 0; controller.isRStickAnalog = false; break; // J
        case 75: controller.rStickY = pressed ? +1 : 0; controller.isRStickAnalog = false; break; // K
        case 76: controller.rStickX = pressed ? +1 : 0; controller.isRStickAnalog = false; break; // L
        case 188: controller.lTriggerValue = pressed ? +1 : 0; break; // .
        case 190: controller.rTriggerValue = pressed ? +1 : 0; break; // ,
        case 82: controller.lStickThumb = pressed; break; // R
        case 70: controller.rStickThumb = pressed; break; // F
        case 38: controller.up = pressed; break; // up arrow
        case 40: controller.down = pressed; break; // down arrow
        case 37: controller.left = pressed; break; // left arrow
        case 39: controller.right = pressed; break; // right arrow
        case 32: controller.start = pressed; break; // space
        case 27: controller.back = pressed; break; // escape
        case 81: controller.lShoulder = pressed; break; // Q
        case 69: controller.rShoulder = pressed; break; // E
        case 90: controller.aButton = pressed; break; // Z
        case 88: controller.bButton = pressed; break; // X
        case 67: controller.xButton = pressed; break; // C
        case 86: controller.yButton = pressed; break; // V
    }
}

function Controller() {
    this.isLStickAnalog = false;
    this.isRStickAnalog = false;
    this.lStickX = 0;
    this.lStickY = 0;
    this.rStickX = 0;
    this.rStickY = 0;
    this.lTriggerValue = 0;
    this.rTriggerValue = 0;
    this.lStickThumb = false;
    this.rStickThumb = false;
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.start = false;
    this.back = false;
    this.lShoulder = false;
    this.rShoulder = false;
    this.aButton = false;
    this.bButton = false;
    this.xButton = false;
    this.yButton = false;
};

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

    input.controllers = [
        new Controller() // Controller 0 will always be keyboard
    ];
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
        platformHandleKeyboard(input.controllers[0], true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        platformHandleKeyboard(input.controllers[0], false, evt.keyCode);
    };

    var lastT = performance.now();
    var totalT = 0;
    var frameCount = 0;

    var loop = function () {
        platformHandleGamepad(input);
        gameUpdateAndRender(memory, backBuffer, soundOutput, input);
        platformFillSoundBuffer(audio, soundOutput);
        displayBuffer(screen, backBuffer);

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
