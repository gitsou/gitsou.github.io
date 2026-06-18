const STORAGE_KEY = "jacek-minesweeper-v1";
const CELL_SIZE = 28;
const MAX_TIMER = 999;

const difficulties = {
    beginner: {
        label: "Beginner",
        columns: 9,
        rows: 9,
        mines: 10,
    },
    intermediate: {
        label: "Intermediate",
        columns: 16,
        rows: 16,
        mines: 40,
    },
    expert: {
        label: "Expert",
        columns: 30,
        rows: 16,
        mines: 99,
    },
};

const game = {
    canvas: null,
    ctx: null,
    mineCounter: null,
    timeCounter: null,
    statusLine: null,
    newGameButton: null,
    difficultyButtons: [],
    modeButtons: [],
    timerId: null,
    state: null,
};

const isDarkMode = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const numberColorsLight = {
    1: "#2563eb",
    2: "#15803d",
    3: "#dc2626",
    4: "#4338ca",
    5: "#9f1239",
    6: "#0f766e",
    7: "#111827",
    8: "#64748b",
};

const numberColorsDark = {
    1: "#60a5fa",
    2: "#4ade80",
    3: "#f87171",
    4: "#818cf8",
    5: "#fb7185",
    6: "#2dd4bf",
    7: "#f3f4f6",
    8: "#9ca3af",
};

const getNumberColor = (num) => {
    return isDarkMode() ? numberColorsDark[num] : numberColorsLight[num];
};

const getIndex = (x, y) => y * game.state.columns + x;

const clampTimer = (seconds) => Math.min(MAX_TIMER, Math.max(0, seconds));

const formatCounter = (value) => {
    const normalized = Math.max(-99, Math.min(999, value));
    if (normalized < 0) {
        return `-${String(Math.abs(normalized)).padStart(2, "0")}`;
    }

    return String(normalized).padStart(3, "0");
};

const createEmptyCells = (columns, rows) => Array.from(
    { length: columns * rows },
    () => ({
        mine: false,
        revealed: false,
        flagged: false,
        adjacent: 0,
        exploded: false,
    })
);

const createNewState = (difficultyName) => {
    const difficulty = difficulties[difficultyName] || difficulties.beginner;
    const state = {
        difficulty: difficultyName in difficulties ? difficultyName : "beginner",
        columns: difficulty.columns,
        rows: difficulty.rows,
        mines: difficulty.mines,
        mode: "reveal",
        status: "ready",
        elapsedSeconds: 0,
        startedAt: null,
        cells: createEmptyCells(difficulty.columns, difficulty.rows),
    };

    placeMines(state);
    calculateAdjacency(state);

    return state;
};

const placeMines = (state) => {
    let placed = 0;

    while (placed < state.mines) {
        const index = Math.floor(Math.random() * state.cells.length);
        if (state.cells[index].mine) {
            continue;
        }

        state.cells[index].mine = true;
        placed += 1;
    }
};

const forEachNeighbor = (state, x, y, callback) => {
    for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
            if (dx === 0 && dy === 0) {
                continue;
            }

            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || nx >= state.columns || ny < 0 || ny >= state.rows) {
                continue;
            }

            callback(nx, ny, getStateIndex(state, nx, ny));
        }
    }
};

const getStateIndex = (state, x, y) => y * state.columns + x;

const calculateAdjacency = (state) => {
    for (let x = 0; x < state.columns; x += 1) {
        for (let y = 0; y < state.rows; y += 1) {
            const index = getStateIndex(state, x, y);
            if (state.cells[index].mine) {
                continue;
            }

            let adjacent = 0;
            forEachNeighbor(state, x, y, (nx, ny, neighborIndex) => {
                if (state.cells[neighborIndex].mine) {
                    adjacent += 1;
                }
            });
            state.cells[index].adjacent = adjacent;
        }
    }
};

const loadState = () => {
    try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            return null;
        }

        const parsed = JSON.parse(saved);
        const difficulty = difficulties[parsed.difficulty];
        if (!difficulty || !Array.isArray(parsed.cells)) {
            return null;
        }

        if (parsed.cells.length !== difficulty.columns * difficulty.rows) {
            return null;
        }

        return {
            difficulty: parsed.difficulty,
            columns: difficulty.columns,
            rows: difficulty.rows,
            mines: difficulty.mines,
            mode: parsed.mode === "flag" ? "flag" : "reveal",
            status: ["ready", "playing", "won", "lost"].includes(parsed.status) ? parsed.status : "ready",
            elapsedSeconds: clampTimer(Number(parsed.elapsedSeconds) || 0),
            startedAt: null,
            cells: parsed.cells.map((cell) => ({
                mine: Boolean(cell.mine),
                revealed: Boolean(cell.revealed),
                flagged: Boolean(cell.flagged),
                adjacent: Number(cell.adjacent) || 0,
                exploded: Boolean(cell.exploded),
            })),
        };
    } catch (error) {
        window.console.warn("Could not load Minesweeper state.", error);
        return null;
    }
};

const saveState = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        difficulty: game.state.difficulty,
        mode: game.state.mode,
        status: game.state.status,
        elapsedSeconds: game.state.elapsedSeconds,
        cells: game.state.cells,
    }));
};

const startTimer = () => {
    if (game.timerId !== null) {
        return;
    }

    game.state.startedAt = Date.now() - game.state.elapsedSeconds * 1000;
    game.timerId = window.setInterval(() => {
        game.state.elapsedSeconds = clampTimer(Math.floor((Date.now() - game.state.startedAt) / 1000));
        updateDisplay();
        saveState();
    }, 1000);
};

const stopTimer = () => {
    if (game.timerId === null) {
        return;
    }

    window.clearInterval(game.timerId);
    game.timerId = null;
};

const confirmRestartIfPlaying = () => (
    game.state.status !== "playing"
    || window.confirm("End the current game and start over?")
);

const setDifficulty = (difficultyName) => {
    stopTimer();
    game.state = createNewState(difficultyName);
    saveState();
    drawBoard();
    updateDisplay();
};

const setMode = (mode) => {
    game.state.mode = mode === "flag" ? "flag" : "reveal";
    saveState();
    updateDisplay();
};

const beginIfNeeded = () => {
    if (game.state.status !== "ready") {
        return;
    }

    game.state.status = "playing";
    startTimer();
};

const toggleFlag = (x, y) => {
    if (game.state.status === "won" || game.state.status === "lost") {
        return;
    }

    const cell = game.state.cells[getIndex(x, y)];
    if (cell.revealed) {
        return;
    }

    cell.flagged = !cell.flagged;
    saveState();
    drawBoard();
    updateDisplay();
};

const revealCell = (x, y) => {
    if (game.state.status === "won" || game.state.status === "lost") {
        return;
    }

    const cell = game.state.cells[getIndex(x, y)];
    if (cell.revealed || cell.flagged) {
        return;
    }

    beginIfNeeded();

    if (cell.mine) {
        cell.revealed = true;
        cell.exploded = true;
        game.state.status = "lost";
        revealMines();
        stopTimer();
        saveState();
        drawBoard();
        updateDisplay();
        return;
    }

    revealSafeArea(x, y);
    checkWin();
    saveState();
    drawBoard();
    updateDisplay();
};

const revealSafeArea = (startX, startY) => {
    const stack = [[startX, startY]];

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const cell = game.state.cells[getIndex(x, y)];

        if (cell.revealed || cell.flagged || cell.mine) {
            continue;
        }

        cell.revealed = true;

        if (cell.adjacent !== 0) {
            continue;
        }

        forEachNeighbor(game.state, x, y, (nx, ny, neighborIndex) => {
            const neighbor = game.state.cells[neighborIndex];
            if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                stack.push([nx, ny]);
            }
        });
    }
};

const revealMines = () => {
    game.state.cells.forEach((cell) => {
        if (cell.mine) {
            cell.revealed = true;
        }
    });
};

const checkWin = () => {
    const revealedSafeCells = game.state.cells.filter((cell) => cell.revealed && !cell.mine).length;
    const safeCells = game.state.cells.length - game.state.mines;

    if (revealedSafeCells !== safeCells) {
        return;
    }

    game.state.status = "won";
    game.state.cells.forEach((cell) => {
        if (cell.mine) {
            cell.flagged = true;
        }
    });
    stopTimer();
};

const getFlagsUsed = () => game.state.cells.filter((cell) => cell.flagged).length;

const getStatusMessage = () => {
    if (game.state.status === "ready") {
        return game.state.mode === "flag"
            ? "Flag mode. Place flags without starting the timer."
            : "Reveal a square to start.";
    }

    if (game.state.status === "playing") {
        return game.state.mode === "flag"
            ? "Flag mode. Tap a hidden square or right-click to mark a mine."
            : "Reveal mode. Tap a square, or right-click to place a flag.";
    }

    if (game.state.status === "won") {
        return "You cleared the board.";
    }

    return "Mine hit. Start a new game.";
};

const updateDisplay = () => {
    game.mineCounter.textContent = formatCounter(game.state.mines - getFlagsUsed());
    game.timeCounter.textContent = formatCounter(game.state.elapsedSeconds);
    game.statusLine.textContent = getStatusMessage();
    game.newGameButton.textContent = "New";

    game.difficultyButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.difficulty === game.state.difficulty));
    });

    game.modeButtons.forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.mode === game.state.mode));
    });
};

const resizeCanvas = () => {
    const cssWidth = game.state.columns * CELL_SIZE;
    const cssHeight = game.state.rows * CELL_SIZE;
    const scale = window.devicePixelRatio || 1;

    game.canvas.style.width = `${cssWidth}px`;
    game.canvas.style.height = `${cssHeight}px`;
    game.canvas.width = Math.round(cssWidth * scale);
    game.canvas.height = Math.round(cssHeight * scale);
    game.ctx.setTransform(scale, 0, 0, scale, 0, 0);

    return {
        width: cssWidth,
        height: cssHeight,
    };
};

const drawBoard = () => {
    const { width, height } = resizeCanvas();
    game.ctx.clearRect(0, 0, width, height);

    for (let x = 0; x < game.state.columns; x += 1) {
        for (let y = 0; y < game.state.rows; y += 1) {
            drawCell(x, y);
        }
    }
};

const drawCell = (x, y) => {
    const cell = game.state.cells[getIndex(x, y)];
    const left = x * CELL_SIZE;
    const top = y * CELL_SIZE;

    if (cell.revealed) {
        drawRevealedCell(cell, left, top);
        return;
    }

    drawCoveredCell(left, top);

    if (cell.flagged) {
        drawFlag(left, top);
    }
};

const drawCoveredCell = (left, top) => {
    const isDark = isDarkMode();
    game.ctx.fillStyle = isDark ? "#222c2a" : "#d8e0db";
    game.ctx.fillRect(left, top, CELL_SIZE, CELL_SIZE);
    game.ctx.strokeStyle = isDark ? "#2d3b37" : "#b8c4bd";
    game.ctx.lineWidth = 1;
    game.ctx.strokeRect(left + 0.5, top + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    game.ctx.fillStyle = isDark ? "#2d3b37" : "#c4d0c8";
    game.ctx.fillRect(left + 4, top + 4, CELL_SIZE - 8, CELL_SIZE - 8);
};

const drawRevealedCell = (cell, left, top) => {
    const isDark = isDarkMode();
    game.ctx.fillStyle = cell.exploded
        ? (isDark ? "#5c2c25" : "#ffd6d6")
        : (isDark ? "#19211f" : "#edf1ea");
    game.ctx.fillRect(left, top, CELL_SIZE, CELL_SIZE);
    game.ctx.strokeStyle = isDark ? "#2d3b37" : "#cbd3ce";
    game.ctx.lineWidth = 1;
    game.ctx.strokeRect(left + 0.5, top + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

    if (cell.mine) {
        drawMine(left, top);
        return;
    }

    if (cell.adjacent > 0) {
        game.ctx.fillStyle = getNumberColor(cell.adjacent) || (isDark ? "#f3f4f6" : "#111111");
        game.ctx.font = "700 18px Arial, Helvetica, sans-serif";
        game.ctx.textAlign = "center";
        game.ctx.textBaseline = "middle";
        game.ctx.fillText(String(cell.adjacent), left + CELL_SIZE / 2, top + CELL_SIZE / 2 + 1);
    }
};

const drawFlag = (left, top) => {
    const isDark = isDarkMode();
    game.ctx.fillStyle = isDark ? "#8fa29a" : "#33403b";
    game.ctx.fillRect(left + 11, top + 7, 2, 15);
    game.ctx.fillRect(left + 8, top + 21, 12, 2);
    game.ctx.fillStyle = isDark ? "#ff5252" : "#dc2626";
    game.ctx.beginPath();
    game.ctx.moveTo(left + 12, top + 7);
    game.ctx.lineTo(left + 22, top + 11);
    game.ctx.lineTo(left + 12, top + 15);
    game.ctx.closePath();
    game.ctx.fill();
};

const drawMine = (left, top) => {
    const centerX = left + CELL_SIZE / 2;
    const centerY = top + CELL_SIZE / 2;
    const isDark = isDarkMode();
    const mineColor = isDark ? "#ff8a80" : "#202927";

    game.ctx.strokeStyle = mineColor;
    game.ctx.lineWidth = 2;
    for (let angle = 0; angle < Math.PI; angle += Math.PI / 4) {
        const dx = Math.cos(angle) * 9;
        const dy = Math.sin(angle) * 9;
        game.ctx.beginPath();
        game.ctx.moveTo(centerX - dx, centerY - dy);
        game.ctx.lineTo(centerX + dx, centerY + dy);
        game.ctx.stroke();
    }

    game.ctx.fillStyle = mineColor;
    game.ctx.beginPath();
    game.ctx.arc(centerX, centerY, 7, 0, Math.PI * 2);
    game.ctx.fill();

    game.ctx.fillStyle = isDark ? "#2c1b18" : "#ffffff";
    game.ctx.beginPath();
    game.ctx.arc(centerX - 3, centerY - 3, 2, 0, Math.PI * 2);
    game.ctx.fill();
};

const getBoardPosition = (event) => {
    const rect = game.canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);

    if (x < 0 || x >= game.state.columns || y < 0 || y >= game.state.rows) {
        return null;
    }

    return { x, y };
};

const handleCanvasClick = (event) => {
    const position = getBoardPosition(event);
    if (!position) {
        return;
    }

    if (game.state.mode === "flag") {
        toggleFlag(position.x, position.y);
        return;
    }

    revealCell(position.x, position.y);
};

const handleContextMenu = (event) => {
    event.preventDefault();
    const position = getBoardPosition(event);
    if (!position) {
        return;
    }

    toggleFlag(position.x, position.y);
};

const setupControls = () => {
    game.difficultyButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (button.dataset.difficulty === game.state.difficulty) {
                return;
            }

            if (confirmRestartIfPlaying()) {
                setDifficulty(button.dataset.difficulty);
            }
        });
    });

    game.modeButtons.forEach((button) => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    game.newGameButton.addEventListener("click", () => {
        if (confirmRestartIfPlaying()) {
            setDifficulty(game.state.difficulty);
        }
    });
    game.canvas.addEventListener("click", handleCanvasClick);
    game.canvas.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("resize", drawBoard);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", () => {
            drawBoard();
        });
    }
};

const init = () => {
    game.canvas = document.getElementById("minesweeperBoard");
    if (!game.canvas.getContext) {
        window.console.log("Error: canvas-unsupported");
        return;
    }

    game.ctx = game.canvas.getContext("2d");
    game.mineCounter = document.getElementById("mineCounter");
    game.timeCounter = document.getElementById("timeCounter");
    game.statusLine = document.getElementById("statusLine");
    game.newGameButton = document.getElementById("newGameButton");
    game.difficultyButtons = Array.from(document.querySelectorAll("[data-difficulty]"));
    game.modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
    game.state = loadState() || createNewState("beginner");

    setupControls();

    if (game.state.status === "playing") {
        startTimer();
    }

    drawBoard();
    updateDisplay();
};

init();
