"use strict";
var canvas = document.querySelector('#screen');
var context = canvas.getContext('2d'); // TODO
var radii = [10, 50, 100];
var points = [10, 5, 1];
var innerColor = 'red';
var outerColor = 'yellow';
var screenMargin = radii[radii.length - 1];
// State
var goalX = 0;
var goalY = 0;
var score = 0;
var protect = true;
var paused = true;
var missedLast = false;
var missTask = -1;
var protectTask = -1;
// Parameters
var goalTime = 1000;
var protectionTime = 200;
// Statistics
var hits = 0;
var misses = 0;
var ignored = 0;
var headshots = 0;
function setup() {
    window.onresize = updateCanvasSize;
    updateCanvasSize();
}
function interpolateColor(index) {
    var innerRgb = tinycolor(innerColor).toRgb();
    var outerRgb = tinycolor(outerColor).toRgb();
    var multiplier = index / (radii.length - 1);
    var components = {
        r: innerRgb.r + (outerRgb.r - innerRgb.r) * multiplier,
        g: innerRgb.g + (outerRgb.g - innerRgb.g) * multiplier,
        b: innerRgb.b + (outerRgb.b - innerRgb.b) * multiplier,
        a: 0.8,
    };
    return tinycolor(components).toString();
}
function updateCanvasSize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // TODO: set new goal without penalty
    nextGoal();
}
function clearScreen() {
    context.fillStyle = missedLast ? '#ffbbbb' : '#ddffdd'; // mistyrose
    context.fillRect(0, 0, canvas.width, canvas.height);
}
function randomizeGoal() {
    goalX = screenMargin + Math.random() * (canvas.width - screenMargin * 2);
    goalY = screenMargin + Math.random() * (canvas.height - screenMargin * 2);
}
function unprotect() {
    protect = false;
}
function nextGoal() {
    clearTimeout(missTask);
    clearTimeout(protectTask);
    clearScreen();
    randomizeGoal();
    protect = true;
    if (paused) {
        drawStatus();
        drawParameters();
        drawHelp();
    }
    else {
        drawGoal();
        drawStatus();
        missTask = setTimeout(missGoal, goalTime);
        protectTask = setTimeout(unprotect, protectionTime);
    }
}
function missGoal() {
    ++misses;
    missedLast = true;
    nextGoal();
}
function resetStats() {
    hits = 0;
    misses = 0;
    ignored = 0;
    headshots = 0;
}
function drawGoal() {
    for (var index = radii.length - 1; index >= 0; --index) {
        var radius = radii[index];
        context.beginPath();
        context.arc(goalX, goalY, radius, 0, Math.PI * 2);
        context.stroke();
        context.fillStyle = interpolateColor(index);
        context.fill();
    }
}
function drawStatus() {
    var left = 5;
    var bottom = canvas.height - 5;
    var height = 18;
    var rounds = hits + misses;
    var accuracy = Math.round(10 * 100 * hits / rounds) / 10;
    var performance = Math.floor(1000 * score / rounds) / 1000;
    context.fillStyle = 'black';
    context.font = '18px Arial';
    context.textAlign = 'left';
    context.fillText("Acertos: " + hits, left, bottom - height * 6);
    context.fillText("Erros: " + misses, left, bottom - height * 5);
    context.fillText("Rounds: " + rounds, left, bottom - height * 4);
    context.fillText("Certeiros: " + headshots, left, bottom - height * 3);
    context.fillText("Precis\u00E3o: " + accuracy + "%", left, bottom - height * 2);
    context.fillText("Pontua\u00E7\u00E3o: " + score, left, bottom - height * 1);
    context.fillText("Performance: " + performance + " /round", left, bottom - height * 0);
}
function drawParameters() {
    var right = canvas.width - 5;
    var bottom = canvas.height - 5;
    var height = 18;
    context.fillStyle = 'black';
    context.font = '18px Arial';
    context.textAlign = 'right';
    context.fillText("Radii: " + radii.length, right, bottom - height * 6);
    context.fillText("Cor interna: " + innerColor, right, bottom - height * 5);
    context.fillText("Cor externa: " + outerColor, right, bottom - height * 4);
    context.fillText("Tempo por alvo: " + goalTime + " ms", right, bottom - height * 3);
    context.fillText("Toler\u00E2ncia: " + protectionTime + " ms", right, bottom - height * 2);
    context.fillText("Largura da tela: " + canvas.width + " px", right, bottom - height * 1);
    context.fillText("Altura da tela: " + canvas.height + " px", right, bottom - height * 0);
}
function drawHelp() {
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var height = 30;
    context.fillStyle = 'black';
    context.font = '20px Arial';
    context.textAlign = 'center';
    context.fillText('C A M P O    D E    T I R O', centerX, centerY - height * 3);
    context.fillText('Clique em qualquer lugar para começar o treino.', centerX, centerY - height);
    context.fillText('Você deve clicar em cada alvo o mais rápido possível.', centerX, centerY);
    context.fillText('Pressione ESPAÇO a qualquer momento para pausar.', centerX, centerY + height);
    context.fillText('Pressione - ou = para ajustar o tempo por alvo.', centerX, centerY + height * 3);
}
function clickCanvas(event) {
    var clickX = event.clientX;
    var clickY = event.clientY;
    var deltaX = clickX - goalX;
    var deltaY = clickY - goalY;
    var distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    if (!paused) {
        missedLast = true;
        for (var index = 0; index < radii.length; index++) {
            var radius = radii[index];
            if (distance < radius) {
                ++hits;
                score += points[index];
                missedLast = false;
                break;
            }
        }
        if (missedLast) {
            if (protect) {
                return;
            }
            ++misses;
        }
        if (radii.length > 1 && distance < radii[0]) {
            ++headshots;
        }
    }
    paused = false;
    nextGoal();
}
function pressKey(event) {
    switch (event.key) {
        case ' ': {
            paused = !paused;
            if (paused) {
                missedLast = false;
                clearTimeout(missTask);
                clearTimeout(protectTask);
            }
            else {
                resetStats();
            }
            nextGoal();
            break;
        }
        case '-': {
            if (!paused || goalTime <= 200) {
                return;
            }
            goalTime -= 100;
            protectionTime = goalTime <= 600 ? 100 : 200;
            nextGoal();
            break;
        }
        case '=': {
            if (!paused) {
                return;
            }
            goalTime += 100;
            protectionTime = goalTime <= 600 ? 100 : 200;
            nextGoal();
            break;
        }
    }
}
setup();
