"use strict";

var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

var borderColor = "red";

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = "black";
    ctx.strokeStyle = borderColor;
    borderColor = borderColor === "red" ? "blue" : "red";
    ctx.lineWidth = 5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.moveTo(canvas.width, 0);
    ctx.lineTo(0, canvas.height);
    ctx.stroke();
    ctx.closePath();
    console.log("resize");
}

function focus() {
    console.log("focus");
}

function load() {
    document.body.appendChild(canvas);
    window.onresize = resize;
    window.onfocus = focus;
    resize();
}

window.onload = load;
