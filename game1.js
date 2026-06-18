const board = {
    columns: 16,
    rows: 16,
    canvas: null,
    ctx: null,
    fieldsCovered: [],
    fieldsValue: [],
};

const getFieldIndex = (x, y) => y + x * board.rows;

const setupBoardState = () => {
    board.fieldsCovered = new Array(board.columns * board.rows).fill(1);
    board.fieldsValue = new Array(board.columns * board.rows).fill(0);
    board.fieldsValue[getFieldIndex(0, 0)] = 1;
}

const resizeCanvas = () => {
    const rect = board.canvas.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    board.canvas.width = Math.round(rect.width * scale);
    board.canvas.height = Math.round(rect.height * scale);
    board.ctx.setTransform(scale, 0, 0, scale, 0, 0);

    return rect;
}

const drawCoveredField = (x, y, cellWidth, cellHeight) => {
    const rgbX = 256 / board.columns;
    const rgbY = 256 / board.rows;
    board.ctx.fillStyle = `rgb(${x * rgbX}, ${y * rgbY}, 0)`;
    board.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
}

const drawRevealedField = (x, y, cellWidth, cellHeight) => {
    const fieldIndex = getFieldIndex(x, y);
    if (board.fieldsValue[fieldIndex] === 0) {
        board.ctx.clearRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
        return;
    }

    board.ctx.fillStyle = "rgb(0,0,128)";
    board.ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
}

const drawBoard = () => {
    const { width, height } = resizeCanvas();
    const cellWidth = width / board.columns;
    const cellHeight = height / board.rows;

    board.ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < board.columns; x++) {
        for (let y = 0; y < board.rows; y++) {
            if (board.fieldsCovered[getFieldIndex(x, y)] === 1) {
                drawCoveredField(x, y, cellWidth, cellHeight);
            } else {
                drawRevealedField(x, y, cellWidth, cellHeight);
            }
        }
    }
}

const onCanvasClick = (ev) => {
    const rect = board.canvas.getBoundingClientRect();
    const cellWidth = rect.width / board.columns;
    const cellHeight = rect.height / board.rows;
    const x = Math.floor((ev.clientX - rect.left) / cellWidth);
    const y = Math.floor((ev.clientY - rect.top) / cellHeight);

    if (x < 0 || x >= board.columns || y < 0 || y >= board.rows) {
        return;
    }

    const fieldIndex = getFieldIndex(x, y);
    if (board.fieldsCovered[fieldIndex] !== 1) {
        return;
    }

    board.fieldsCovered[fieldIndex] = 0;
    drawBoard();
}

const game = () => {
    board.canvas = document.getElementById("game1");
    if (!board.canvas.getContext) {
        window.console.log("Error: canvas-unsupported");
        return;
    }

    board.ctx = board.canvas.getContext("2d");
    setupBoardState();
    drawBoard();

    board.canvas.addEventListener("click", onCanvasClick, false);
    window.addEventListener("resize", drawBoard);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", drawBoard);
    }
}

game();
