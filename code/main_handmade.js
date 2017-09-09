"use strict";

var screen = document.createElement("canvas");
var buffer = document.createElement("canvas");

var bitmap;
var BPP = 4; // Bytes per pixel

function renderGreenBlueGradient(greenOffset, blueOffset) {
    var x, y, r, g, b, a, rowOffset, columnOffset;
    for (y = 0; y < bitmap.height; y++) {
        rowOffset = y * bitmap.width * BPP;
        for (x = 0; x < bitmap.width; x++) {
            columnOffset = rowOffset + x * BPP;
            r = Math.floor(y * 255 / bitmap.height);
            g = (x + greenOffset) % 256;
            b = (y + blueOffset) % 256;
            a = 255;
            bitmap.data[columnOffset + 0] = r;
            bitmap.data[columnOffset + 1] = g;
            bitmap.data[columnOffset + 2] = b;
            bitmap.data[columnOffset + 3] = a;
        }
    }
}

function displayBuffer() {
    buffer.getContext("2d").putImageData(bitmap, 0, 0, 0, 0, buffer.width, buffer.height);
    var ctx = screen.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(buffer, 0, 0);
}

function resizeBuffer(width, height) {
    buffer.width = width;
    buffer.height = height;
    bitmap = buffer.getContext("2d").getImageData(0, 0, buffer.width, buffer.height);
}

function resizeWindow() {
    screen.width = window.innerWidth;
    screen.height = window.innerHeight;
    screen.getContext("2d").scale(screen.width / buffer.width, screen.height / buffer.height);
    console.log("resize");
}

function focus() {
    console.log("focus");
}

var DEADZONE = 0.25;

function handleGamepad(controller) {
    var i, pad, pads = navigator.getGamepads();
    for (i = 0; i < pads.length; i++) {
        pad = pads[i];
        if (pad && pad.connected) {
            controller.lStickX = Math.abs(pad.axes[0]) > DEADZONE ? pad.axes[0] : 0;
            controller.lStickY = Math.abs(pad.axes[1]) > DEADZONE ? pad.axes[1] : 0;
            controller.rStickX = Math.abs(pad.axes[2]) > DEADZONE ? pad.axes[2] : 0;
            controller.rStickY = Math.abs(pad.axes[3]) > DEADZONE ? pad.axes[3] : 0;
            controller.lTriggerValue = pad.buttons[6].value;
            controller.rTriggerValue = pad.buttons[7].value;
            controller.lStickThumb = pad.buttons[10].pressed;
            controller.rStickThumb = pad.buttons[11].pressed;
            controller.up = pad.buttons[12].pressed;
            controller.down = pad.buttons[13].pressed;
            controller.left = pad.buttons[14].pressed;
            controller.right = pad.buttons[15].pressed;
            controller.start = pad.buttons[8].pressed;
            controller.back = pad.buttons[9].pressed;
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

function handleKeyboard(controller, pressed, keyCode) {
    //console.log(pressed, keyCode);
    switch (keyCode) {
        case 65: controller.lStickX = pressed ? -1 : 0; break; // A
        case 68: controller.lStickX = pressed ? +1 : 0; break; // D
        case 83: controller.lStickY = pressed ? -1 : 0; break; // S
        case 87: controller.lStickY = pressed ? +1 : 0; break; // W
        case 74: controller.rStickX = pressed ? -1 : 0; break; // I
        case 76: controller.rStickY = pressed ? -1 : 0; break; // J
        case 75: controller.rStickX = pressed ? +1 : 0; break; // K
        case 73: controller.rStickY = pressed ? +1 : 0; break; // L
        case 188: controller.lTriggerValue = pressed ? +1 : 0; break; // .
        case 190: controller.rTriggerValue = pressed ? +1 : 0; break; // ,
        case 82: controller.lStickThumb = pressed; break; // 
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

function GameAudio() {
    this.sampleRate = 48000;
    this.duration = 2;
    this.bufferLength = this.sampleRate * this.duration;
    this.left = undefined;
    this.right = undefined;

    var ctx = new AudioContext();
    var buffer = ctx.createBuffer(2, this.bufferLength, this.sampleRate);
    var source = ctx.createBufferSource();
    var gain = ctx.createGain();

    this.left = buffer.getChannelData(0);
    this.right = buffer.getChannelData(1);

    gain.gain.value = 0.1;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.loop = true;
    source.start();
}

function main() {

    var greenOffset = 0, blueOffset = 0;

    var gameController = new Controller();
    var keyController = new Controller();
    var audio = new GameAudio();
    var i, sample;

    resizeBuffer(480, 270);
    resizeWindow();

    document.body.appendChild(screen);
    window.onresize = resizeWindow;
    window.onfocus = focus;

    window.onkeydown = function (evt) {
        handleKeyboard(keyController, true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        handleKeyboard(keyController, false, evt.keyCode);
    };

    var loop = function () {
        handleGamepad(gameController);

        if (keyController.up) {
            blueOffset += 5;
        }
        if (keyController.down) {
            blueOffset -= 5;
        }
        if (keyController.left) {
            greenOffset += 5;
        }
        if (keyController.right) {
            greenOffset -= 5;
        }

        if (keyController.aButton) {
            // white noise
            for (i = 0; i < audio.bufferLength; i++) {
                sample = Math.random() * 2 - 1;
                audio.left[i] = sample;
                audio.right[i] = sample;
            }
        }

        if (keyController.bButton) {
            // square wave
            var tone = 256;
            for (i = 0; i < audio.bufferLength; i++) {
                sample = Math.floor(i / audio.sampleRate * tone) % 2 ? -1 : 1;
                audio.left[i] = sample;
                audio.right[i] = sample;
            }
        }

        if (keyController.yButton) {
            // silence
            for (i = 0; i < audio.bufferLength; i++) {
                sample = 0;
                audio.left[i] = sample;
                audio.right[i] = sample;
            }
        }

        greenOffset -= gameController.lStickX * 5;
        blueOffset -= gameController.lStickY * 5;

        renderGreenBlueGradient(greenOffset, blueOffset);
        displayBuffer();
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = main;
