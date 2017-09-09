"use strict";

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

function handleGamepad(controller) {
    var i, pad, pads = navigator.getGamepads();
    var DEADZONE = 0.25;
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

function GameAudioOutput() {
    this.sampleRate = 48000;
    this.duration = 2;
    this.bufferLength = this.sampleRate * this.duration;
    this.left = undefined;
    this.right = undefined;

    var ctx = new AudioContext();
    var buffer = ctx.createBuffer(2, this.bufferLength, this.sampleRate);
    var source = ctx.createBufferSource();
    var gain = ctx.createGain();

    /*
    // Debug Tone
    var osc = ctx.createOscillator();
    var panner = ctx.createPanner();
    osc.frequency.value = 256;
    osc.type = "triangle";
    panner.channelCount = 2;
    panner.positionX.value = -1;
    osc.connect(panner);
    panner.connect(gain);
    osc.start();
    */

    this.left = buffer.getChannelData(0);
    this.right = buffer.getChannelData(1);
    this.volume = 0;
    this.tSine = 0;
    this.waveType = "sine";

    this.setTone = function (tone) {
        this.tone = tone;
        this.wavePeriod = this.sampleRate / tone;
    };

    this.setTone(256);

    this.getCurrentTime = function () {
        return ctx.currentTime;
    };

    gain.gain.value = 0.2;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.loop = true;
    source.start();
}

function fillSoundBuffer(output) {
    var t = output.getCurrentTime();
    var i, sample, PI2 = Math.PI * 2, increment = PI2 / output.wavePeriod;
    for (i = 0; i < output.bufferLength; i++) {
        if (output.waveType === "sine") {
            sample = Math.sin(output.tSine);
        } else if (output.waveType === "square") {
            sample = Math.sign(Math.sin(output.tSine));
        } else if (output.waveType === "triangle") {
            sample = Math.abs((output.tSine % PI2) - Math.PI) - Math.PI / 2;
        } else if (output.waveType === "saw") {
            sample = ((output.tSine % PI2) - Math.PI) / Math.PI;
        }
        output.left[i] = sample * output.volume;
        output.right[i] = sample * output.volume;
        output.tSine += increment;
    }
    while (output.tSine > PI2) {
        output.tSine -= PI2;
    }
}

function main() {

    var greenOffset = 0, blueOffset = 0;
    var gameState;

    var screen = {};
    var backBuffer = {};
    screen.canvas = document.createElement("canvas");
    backBuffer.canvas = document.createElement("canvas");
    backBuffer.bytesPerPixel = 4;

    var gameController = new Controller();
    var keyController = new Controller();
    var soundOutput = new GameAudioOutput();
    var i, sample;

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
        handleKeyboard(keyController, true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        handleKeyboard(keyController, false, evt.keyCode);
    };

    var lastT = performance.now();
    var totalT = 0;
    var frameCount = 0;

    var loop = function () {
        handleGamepad(gameController);
        fillSoundBuffer(soundOutput);

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
            soundOutput.setTone(261);
        }

        if (keyController.bButton) {
            soundOutput.setTone(293);
        }

        if (keyController.xButton) {
            soundOutput.setTone(329);
        }

        if (keyController.yButton) {
            soundOutput.setTone(349);
        }

        if (keyController.start) {
            soundOutput.volume = 1;
        }

        if (keyController.back) {
            soundOutput.volume = 0;
        }

        if (keyController.rShoulder) {
            soundOutput.waveType = "sine";
        }

        if (keyController.lShoulder) {
            soundOutput.waveType = "square";
        }

        if (keyController.lStickThumb) {
            soundOutput.waveType = "triangle";
        }

        if (keyController.rStickThumb) {
            soundOutput.waveType = "saw";
        }

        if (gameController.lStickX !== 0) {
            var tone = Math.floor(128 + (1 + gameController.lStickX) / 2 * 256);
            soundOutput.setTone(tone);
        }

        if (gameController.lStickY !== 0) {
            soundOutput.volume = 1 - gameController.lStickY;
        }

        greenOffset -= gameController.lStickX * 5;
        blueOffset -= gameController.lStickY * 5;

        // color offsets must be positives!
        while (greenOffset < 0) {
            greenOffset += 256;
        }
        while (blueOffset < 0) {
            blueOffset += 256;
        }

        gameState = {
            greenOffset: greenOffset,
            blueOffset: blueOffset
        };
        gameUpdateAndRender(backBuffer, gameState);
        displayBuffer(screen, backBuffer);

        var currentT = performance.now();
        var elapsedT = currentT - lastT;
        lastT = currentT;

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

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = main;
