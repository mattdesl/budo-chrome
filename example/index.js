require('canvas-testbed')(render)

var time = 0

function render(ctx, width, height, dt) {
    time += dt/1000

    ctx.clearRect(0, 0, width, height)
    var x = Math.sin(time) * 50
    ctx.fillRect(150 + x, 50, 155, 250)
}