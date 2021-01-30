const canvas = document.querySelector('#screen') as HTMLCanvasElement
const context = canvas.getContext('2d')!  // TODO

const radii = [10, 50, 100]
const points = [10, 5, 1]
const innerColor = 'red'
const outerColor = 'yellow'
const screenMargin = radii[radii.length - 1]

// State
let goalX = 0
let goalY = 0
let score = 0
let protect = true
let paused = true
let missedLast = false

let missTask = -1
let protectTask = -1

// Parameters
let goalTime = 1000
let protectionTime = 200

// Statistics
let hits = 0
let misses = 0
let ignored = 0
let headshots = 0

function setup(): void {
    window.onresize = updateCanvasSize
    updateCanvasSize()
}

function interpolateColor(index: number): string {
    const innerRgb = tinycolor(innerColor).toRgb()
    const outerRgb = tinycolor(outerColor).toRgb()
    const multiplier = index / (radii.length - 1)
    const components = {
        r: innerRgb.r + (outerRgb.r - innerRgb.r) * multiplier,
        g: innerRgb.g + (outerRgb.g - innerRgb.g) * multiplier,
        b: innerRgb.b + (outerRgb.b - innerRgb.b) * multiplier,
        a: 0.8,
    }
    return tinycolor(components).toString()
}

function updateCanvasSize(): void {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    // TODO: set new goal without penalty
    nextGoal()
}

function clearScreen(): void {
    context.fillStyle = missedLast ? '#ffcccc' : '#ddffdd'
    context.fillRect(0, 0, canvas.width, canvas.height)
}

function randomizeGoal(): void {
    goalX = screenMargin + Math.random() * (canvas.width - screenMargin * 2)
    goalY = screenMargin + Math.random() * (canvas.height - screenMargin * 2)
}

function unprotect(): void {
    protect = false
}

function nextGoal(): void {
    clearTimeout(missTask)
    clearTimeout(protectTask)

    clearScreen()
    randomizeGoal()

    protect = true

    if (paused) {
        drawStatus()
        drawParameters()
        drawHelp()
    } else {
        drawGoal()
        drawStatus()

        missTask = setTimeout(missGoal, goalTime)
        protectTask = setTimeout(unprotect, protectionTime)
    }
}

function missGoal(): void {
    ++misses
    missedLast = true
    nextGoal()
}

function resetStats(): void {
    hits = 0
    misses = 0
    ignored = 0
    headshots = 0
}

function drawGoal(): void {
    for (let index = radii.length - 1; index >= 0; --index) {
        const radius = radii[index]

        context.beginPath()
        context.arc(goalX, goalY, radius, 0, Math.PI * 2)
        context.stroke()
        context.fillStyle = interpolateColor(index)
        context.fill()
    }
}

function drawStatus(): void {
    const left = 5
    const bottom = canvas.height - 5
    const height = 18

    const rounds = hits + misses
    const accuracy = Math.round(10 * 100 * hits / rounds) / 10
    const performance = Math.floor(1000 * score / rounds) / 1000

    context.fillStyle = 'black'
    context.font = '18px Arial'
    context.textAlign = 'left'

    context.fillText(`Acertos: ${hits}`, left, bottom - height * 6)
    context.fillText(`Erros: ${misses}`, left, bottom - height * 5)
    context.fillText(`Rounds: ${rounds}`, left, bottom - height * 4)

    context.fillText(`Certeiros: ${headshots}`, left, bottom - height * 3)
    context.fillText(`Precisão: ${accuracy}%`, left, bottom - height * 2)

    context.fillText(`Pontuação: ${score}`, left, bottom - height * 1)
    context.fillText(`Performance: ${performance} /round`, left, bottom - height * 0)
}

function drawParameters(): void {
    const right = canvas.width - 5
    const bottom = canvas.height - 5
    const height = 18

    context.fillStyle = 'black'
    context.font = '18px Arial'
    context.textAlign = 'right'

    context.fillText(`Radii: ${radii.length}`, right, bottom - height * 6)

    context.fillText(`Cor interna: ${innerColor}`, right, bottom - height * 5)
    context.fillText(`Cor externa: ${outerColor}`, right, bottom - height * 4)

    context.fillText(`Tempo por alvo: ${goalTime} ms`, right, bottom - height * 3)
    context.fillText(`Tolerância: ${protectionTime} ms`, right, bottom - height * 2)

    context.fillText(`Largura da tela: ${canvas.width} px`, right, bottom - height * 1)
    context.fillText(`Altura da tela: ${canvas.height} px`, right, bottom - height * 0)
}

function drawHelp(): void {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const height = 30

    context.fillStyle = 'black'
    context.font = '20px Arial'
    context.textAlign = 'center'

    context.fillText('C A M P O    D E    T I R O', centerX, centerY - height * 3)
    context.fillText('Clique em qualquer lugar para começar o treino.', centerX, centerY - height)
    context.fillText('Você deve clicar em cada alvo o mais rápido possível.', centerX, centerY)
    context.fillText('Pressione ESPAÇO a qualquer momento para pausar.', centerX, centerY + height)
    context.fillText('Pressione - ou = para ajustar o tempo por alvo.', centerX, centerY + height * 3)
}

function clickCanvas(event: MouseEvent): void {
    const clickX = event.clientX
    const clickY = event.clientY

    const deltaX = clickX - goalX
    const deltaY = clickY - goalY
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)

    if (!paused) {
        missedLast = true

        for (let index = 0; index < radii.length; index++) {
            const radius = radii[index]
            if (distance < radius) {
                ++hits
                score += points[index]
                missedLast = false
                break
            }
        }
        if (missedLast) {
            if (protect) {
                return
            }
            ++misses
        }
        if (radii.length > 1 && distance < radii[0]) {
            ++headshots
        }
    }

    paused = false

    nextGoal()
}

function pressKey(event: KeyboardEvent): void {
    switch (event.key) {
        case ' ': {
            paused = !paused

            if (paused) {
                missedLast = false

                clearTimeout(missTask)
                clearTimeout(protectTask)
            } else {
                resetStats()
            }

            nextGoal()

            break
        }

        case '-': {
            if (!paused || goalTime <= 200) {
                return
            }
            goalTime -= 100
            protectionTime = goalTime <= 600 ? 100 : 200
            nextGoal()
            break
        }

        case '=': {
            if (!paused) {
                return
            }
            goalTime += 100
            protectionTime = goalTime <= 600 ? 100 : 200
            nextGoal()
            break
        }
    }
}

setup()