"use strict";

var DEBUG_PERFORMANCE = false;
var DEBUG_TONE = false;
var DEBUG_SOUND = false;
var DEBUG_MOUSE = false;

var gameCode = {};
gameCode.lastReload = null;
gameCode.autoReload = false;
gameCode.autoReloadCountDown = 0;

var utils = {};

utils.clamp = function (value, min, max) {
    return value < min ? min : value > max ? max : value;
}

utils.assert = function(expr, msg) {
    if (!expr) {
        throw new Error(msg);
    }
}

utils.copyObject = function(obj) {
    return JSON.parse(JSON.stringify(obj));
}

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

function resizeScreen(screen, buffer, width, height) {
    screen.width = width;
    screen.height = height;
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
    top = utils.clamp(top, 0, buffer.height);
    bottom = utils.clamp(bottom, 0, buffer.height);
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
    this.mouseX = 0;
    this.mouseY = 0;
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
        dtForFrame: 0,
        controllers: [],
        mouseX: 0,
        mouseY: 0,
        mouseButtons: [
            new GameButtonState(), 
            new GameButtonState(), 
            new GameButtonState(), 
            new GameButtonState(), 
            new GameButtonState()
        ]
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
        newController.lStickX = newController.isLStickAnalog ? utils.clamp(pad.axes[0], -1, 1) : 0;
        newController.lStickY = newController.isLStickAnalog ? utils.clamp(pad.axes[1], -1, 1) : 0;
        newController.rStickX = newController.isRStickAnalog ? utils.clamp(pad.axes[2], -1, 1) : 0;
        newController.rStickY = newController.isRStickAnalog ? utils.clamp(pad.axes[3], -1, 1) : 0;
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

function createMouse() {
    var mouse = {
        x: 0,
        y: 0,
        buttons: [false, false, false, false, false]
    };
    return mouse;
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

function platformHandleMouse(screen, mouse, evt) {
    var rect = screen.canvas.getBoundingClientRect();
    mouse.x = evt.clientX - rect.left;
    mouse.y = evt.clientY - rect.top;
    mouse.buttons[0] = (evt.buttons & 1) > 0;
    mouse.buttons[1] = (evt.buttons & 2) > 0;
    mouse.buttons[2] = (evt.buttons & 4) > 0;
    mouse.buttons[3] = (evt.buttons & 8) > 0;
    mouse.buttons[4] = (evt.buttons & 16) > 0;
}

function platformHandleMouseInput(mouse, oldInput, newInput) {
    newInput.mouseX = mouse.x;
    newInput.mouseY = mouse.y;
    processDigitalButton(oldInput.mouseButtons[0], newInput.mouseButtons[0], mouse.buttons[0]);
    processDigitalButton(oldInput.mouseButtons[1], newInput.mouseButtons[1], mouse.buttons[1]);
    processDigitalButton(oldInput.mouseButtons[2], newInput.mouseButtons[2], mouse.buttons[2]);
    processDigitalButton(oldInput.mouseButtons[3], newInput.mouseButtons[3], mouse.buttons[3]);
    processDigitalButton(oldInput.mouseButtons[4], newInput.mouseButtons[4], mouse.buttons[4]);
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

function loadGameCode(gameCode) {
    if (!("script" in gameCode)) {
        gameCode.script = {};
    }
    loadGameModule(gameCode, "code/handmade.js");
    loadGameModule(gameCode, "code/handmade_tile.js");
}

function loadGameModule(gameCode, url) {
    if (gameCode.script[url]) {
        document.body.removeChild(gameCode.script[url]);
        gameCode.script[url] = null;
    }
    gameCode.script[url] = document.createElement("script");
    gameCode.script[url].src = url;
    gameCode.script[url].type = "text/javascript";
    gameCode.script[url].lastReload = new Date();
    document.body.appendChild(gameCode.script[url]);
}

function setGameLoadInterval(gameCode, timeInterval) {
    if (gameCode.timer) {
        clearInterval(gameCode.timer);
        gameCode.timer = null;
    }
    if (timeInterval > 0) {
        gameCode.timer = setInterval(function () {
            loadGameCode(gameCode);
        }, timeInterval);    
    }
}

function toggleRecording(inputRecorder, memory) {
    if (inputRecorder.isPlaying) {
        console.log("Stopped playing");
        inputRecorder.isPlaying = false;
    } else if (inputRecorder.isRecording) {
        console.log("Started playing");
        inputRecorder.isRecording = false;
        inputRecorder.isPlaying = true;
        inputRecorder.playIndex = 0;
    } else {
        console.log("Started recording");
        inputRecorder.isRecording = true;
        inputRecorder.savedInput = [];
        saveMemory(inputRecorder, memory);        
    }    
}

function saveMemory(inputRecorder, memory) {
    inputRecorder.savedMemory = JSON.stringify(memory);
}

function restoreMemory(inputRecorder) {
    return JSON.parse(inputRecorder.savedMemory);
}

// TODO: reduce memory use when storing repeated input?
function playbackInput(inputRecorder)
{
    var currentInput = JSON.parse(inputRecorder.savedInput[inputRecorder.playIndex]);
    inputRecorder.playIndex = (inputRecorder.playIndex + 1) % inputRecorder.savedInput.length;
    return currentInput;
}

function recordInput(inputRecorder, newInput) {
    inputRecorder.savedInput.push(JSON.stringify(newInput));
}

// TODO: Declared as globals for easy debugging, will move inside main later
var inputRecorder, screen, backBuffer, audio, memory, keyboardPad, oldInput, newInput, soundOutput, mouse;

function main() {
   
    loadGameCode(gameCode);

    inputRecorder = {
        isPlaying: false,
        isRecording: false,
        savedState: null,        
        savedInput: [],
        playIndex: 0
    };
    mouse = createMouse();
    screen = {};
    backBuffer = {};
    audio = {};
    memory = {
        isInitialized: false
    };
    screen.canvas = document.createElement("canvas");
    backBuffer.canvas = document.createElement("canvas");
    backBuffer.bytesPerPixel = 4;

    keyboardPad = createKeyboadPad();
    oldInput = platformCreateInput(5);
    newInput = platformCreateInput(5);

    soundOutput = new SoundOutput();

    var i, sample;

    platformInitAudioOutput(audio, soundOutput);

    //resizeBuffer(backBuffer, 480, 270);
    resizeBuffer(backBuffer, 960, 540);
    //resizeBuffer(backBuffer, 1920, 1080);
    resizeScreen(screen, backBuffer, backBuffer.width, backBuffer.height);

    document.getElementById("gameDiv").appendChild(screen.canvas);

    window.onresize = function () {
        //resizeScreen(screen, backBuffer, window.innerWidth, window.innerHeight);
        resizeScreen(screen, backBuffer, backBuffer.width, backBuffer.height);
    };
    window.onfocus = function () {
        //console.log("focus");
    };
    window.onblur = function () {
        //console.log("blur");
    };
    var holdingKey = {};
    window.onkeydown = function (evt) {
        var firstPress = !(evt.keyCode in holdingKey) || !holdingKey[evt.keyCode];
        if (firstPress) {
            if (evt.keyCode === 112) {
                // F1 - Hot reload game code
                console.log("reloading");
                loadGameCode(gameCode);
                evt.preventDefault();
            } else if (evt.keyCode === 113) {
                // F2 - Toggle auto-reload
                gameCode.autoReload = !gameCode.autoReload;
                console.log("autoReload = " + gameCode.autoReload);
                evt.preventDefault();
            } else if (evt.keyCode === 114) {
                // F3 - Cycle record/play/stop
                toggleRecording(inputRecorder, memory);
                evt.preventDefault();
            }
        }
        holdingKey[evt.keyCode] = true;
        platformHandleKeyboardPad(keyboardPad, true, evt.keyCode);
    };
    window.onkeyup = function (evt) {
        var released = holdingKey[evt.keyCode];
        if (released) {
            // handle keys on release
        }
        holdingKey[evt.keyCode] = false;
        platformHandleKeyboardPad(keyboardPad, false, evt.keyCode);
    };

    screen.canvas.onmousedown = function(evt) { platformHandleMouse(screen, mouse, evt); };
    screen.canvas.onmouseup = function(evt) { platformHandleMouse(screen, mouse, evt); };
    screen.canvas.onmousemove = function(evt) { platformHandleMouse(screen, mouse, evt); };
    screen.canvas.onmousewheel = function(evt) { platformHandleMouse(screen, mouse, evt); };
    screen.canvas.oncontextmenu = function (evt) { evt.preventDefault(); }

    var lastT = performance.now();
    var totalT = 0;
    var frameCount = 0;
    var debugMarkers = [];
    var currentDebugMaker = 0;
    
    var loop = function () {

        platformHandleMouseInput(mouse, oldInput, newInput);
        platformHandleInput(keyboardPad, oldInput.controllers[0], newInput.controllers[0]);
        platformHandleGamepads(oldInput, newInput);

        if (inputRecorder.isPlaying) {
            if (inputRecorder.playIndex === 0) {
                memory = restoreMemory(inputRecorder);
            }
            newInput = playbackInput(inputRecorder);
        }

        if (inputRecorder.isRecording) {
            recordInput(inputRecorder, newInput);            
        }
        
        if ("updateAndRender" in gameCode) {
            gameCode.updateAndRender(memory, backBuffer, newInput);
        }

        if ("getSoundSamples" in gameCode) {
            gameCode.getSoundSamples(memory, soundOutput);
        }
        
        if (DEBUG_SOUND) {
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
        }

        platformFillSoundBuffer(audio, soundOutput);
        displayBuffer(screen, backBuffer);

        var tmp = newInput;
        newInput = oldInput;
        oldInput = tmp;

        var currentT = performance.now();
        var elapsedT = currentT - lastT;
        lastT = currentT;
        newInput.dtForFrame = elapsedT / 1000;
        
        // Avoid spikes when focusing back on blurred tab
        if (elapsedT < 1000) {
            frameCount++;
            totalT += elapsedT;
            if (totalT > 1000) {
                var avgFramesPerSec = frameCount / totalT * 1000;
                var avgMsPerFrame = totalT / frameCount;
                if (DEBUG_PERFORMANCE) {
                    console.log("Avg: " + avgMsPerFrame + " ms/f, " + avgFramesPerSec + " f/s");
                }
                frameCount = 0;
                totalT -= 1000;
            }
        }

        if (gameCode.autoReload) {
            if (gameCode.autoReloadCountDown <= 0) {
                loadGameCode(gameCode);
                gameCode.autoReloadCountDown = 30;
            } else {
                gameCode.autoReloadCountDown--;
            }
        }

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

window.onload = main;
