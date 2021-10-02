function draw(ctx, dx, dy, maxX, maxY){
    const rgbX = 256/maxX;
    const rgbY = 256/maxY;
    for (let x = 0; x < maxX; x++) {
        for (let y = 0; y < maxY; y++) {
            ctx.fillStyle = "rgb("+(x*rgbX)+", "+(y*rgbY)+", 0)";
            ctx.fillRect(x*dx, y*dy, dx, dy);
            // window.console.log(x*dx, y*dy, dx, dy);
        }
    }
}

function game(){
    const canvas = document.getElementById("game1");
    if (!canvas.getContext) {
        window.console.log("Error: canvas-unsupported");
    }
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    const { width, height } = canvas.getBoundingClientRect();
    const maxX = 16;
    const maxY = 16;
    const dx = Math.floor(width/maxX);
    const dy = Math.floor(height/maxY);
    const ctx = canvas.getContext("2d");

    window.console.log("canvas.width", canvas.width, "canvas.height", canvas.height);
    window.console.log("width", width, "height", height);

    draw(ctx, dx, dy, maxX, maxY);
    // window.console.log(ctx, dx, dy, maxX, maxY);

    const fieldsCovered = new Array(maxX*maxY);
    fieldsCovered.fill(1);

    const fieldsValue = new Array(maxX*maxY);
    fieldsValue.fill(0);
    fieldsValue[0 + 0 * maxY] = 1;

    function on_canvas_click(ev) {
        const x = Math.floor((ev.clientX - canvas.offsetLeft)/dx);
        const y = Math.floor((ev.clientY - canvas.offsetTop)/dy);
        if (fieldsCovered[y + x * maxY] === 1){
            fieldsCovered[y + x * maxY] = 0;
            if (fieldsValue[y + x * maxY] === 0){
                ctx.clearRect(x*dx, y*dy, dx, dy);
            } else {
                ctx.fillStyle = "rgb(0,0,128)";
                ctx.fillRect(x*dx, y*dy, dx, dy);
            }
        } else {
            window.console.log("0");
        }
    }
    canvas.addEventListener('click', on_canvas_click, false);
}

game();
