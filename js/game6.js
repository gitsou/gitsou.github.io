"use strict";

/* ------------------------------------------------------------------
 * Sudoku – plain JavaScript, DOM board.
 *
 * Sections:
 *   1. Board geometry and helpers
 *   2. Seeded random numbers
 *   3. Solver (solution counting) and simple-technique checker
 *   4. Puzzle generator
 *   5. Game state, saving and loading
 *   6. Rendering
 *   7. Actions and input
 * ------------------------------------------------------------------ */

/* 1. Board geometry and helpers ----------------------------------- */

const SIZE = 9;
const CELLS = 81;
const ALL_DIGITS = 0x3fe; // bits 1..9

const rowOf = (index) => Math.floor(index / SIZE);
const colOf = (index) => index % SIZE;
const boxOf = (index) => Math.floor(rowOf(index) / 3) * 3 + Math.floor(colOf(index) / 3);

const UNITS = (() => {
    const units = [];
    for (let i = 0; i < SIZE; i += 1) {
        const row = [];
        const col = [];
        const box = [];
        for (let j = 0; j < SIZE; j += 1) {
            row.push(i * SIZE + j);
            col.push(j * SIZE + i);
            box.push((Math.floor(i / 3) * 3 + Math.floor(j / 3)) * SIZE + (i % 3) * 3 + (j % 3));
        }
        units.push(row, col, box);
    }
    return units;
})();

const PEERS = Array.from({ length: CELLS }, (_, index) => {
    const peers = new Set();
    for (const unit of UNITS) {
        if (unit.includes(index)) {
            unit.forEach((other) => {
                if (other !== index) {
                    peers.add(other);
                }
            });
        }
    }
    return [...peers];
});

const bitCount = (mask) => {
    let count = 0;
    let rest = mask;
    while (rest) {
        rest &= rest - 1;
        count += 1;
    }
    return count;
};

const digitsOf = (mask) => {
    const digits = [];
    for (let digit = 1; digit <= SIZE; digit += 1) {
        if (mask & (1 << digit)) {
            digits.push(digit);
        }
    }
    return digits;
};

/* 2. Seeded random numbers ---------------------------------------- */

// mulberry32: tiny, fast, good enough for shuffling puzzles.
const createRandom = (seed) => {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
};

const shuffle = (items, random) => {
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

/* 3. Solver ------------------------------------------------------- */

// Counts solutions up to `limit`. With `random`, digits are tried in random
// order, which is how a full random grid is produced.
const solve = (grid, limit = 2, random = null) => {
    const cells = grid.slice();
    const rows = new Array(SIZE).fill(0);
    const cols = new Array(SIZE).fill(0);
    const boxes = new Array(SIZE).fill(0);

    for (let index = 0; index < CELLS; index += 1) {
        const digit = cells[index];
        if (!digit) {
            continue;
        }
        const bit = 1 << digit;
        const r = rowOf(index);
        const c = colOf(index);
        const b = boxOf(index);
        if ((rows[r] | cols[c] | boxes[b]) & bit) {
            return { count: 0, solution: null };
        }
        rows[r] |= bit;
        cols[c] |= bit;
        boxes[b] |= bit;
    }

    let count = 0;
    let solution = null;

    const search = () => {
        let best = -1;
        let bestMask = 0;
        let bestCount = SIZE + 1;

        for (let index = 0; index < CELLS; index += 1) {
            if (cells[index]) {
                continue;
            }
            const mask = ALL_DIGITS & ~(rows[rowOf(index)] | cols[colOf(index)] | boxes[boxOf(index)]);
            const options = bitCount(mask);
            if (options === 0) {
                return false;
            }
            if (options < bestCount) {
                best = index;
                bestMask = mask;
                bestCount = options;
                if (options === 1) {
                    break;
                }
            }
        }

        if (best === -1) {
            count += 1;
            if (!solution) {
                solution = cells.slice();
            }
            return count >= limit;
        }

        const r = rowOf(best);
        const c = colOf(best);
        const b = boxOf(best);
        const digits = random ? shuffle(digitsOf(bestMask), random) : digitsOf(bestMask);

        for (const digit of digits) {
            const bit = 1 << digit;
            cells[best] = digit;
            rows[r] |= bit;
            cols[c] |= bit;
            boxes[b] |= bit;
            if (search()) {
                return true;
            }
            rows[r] &= ~bit;
            cols[c] &= ~bit;
            boxes[b] &= ~bit;
        }
        cells[best] = 0;
        return false;
    };

    search();
    return { count, solution };
};

// True when the puzzle can be finished with naked and hidden singles only.
const solvableWithSingles = (grid) => {
    const cells = grid.slice();
    const candidates = (index) => {
        let used = 0;
        PEERS[index].forEach((peer) => {
            used |= 1 << cells[peer];
        });
        return ALL_DIGITS & ~used;
    };

    let progress = true;
    while (progress) {
        progress = false;

        for (let index = 0; index < CELLS; index += 1) {
            if (!cells[index]) {
                const mask = candidates(index);
                if (bitCount(mask) === 1) {
                    cells[index] = digitsOf(mask)[0];
                    progress = true;
                }
            }
        }

        for (const unit of UNITS) {
            for (let digit = 1; digit <= SIZE; digit += 1) {
                if (unit.some((index) => cells[index] === digit)) {
                    continue;
                }
                const places = unit.filter((index) => !cells[index] && (candidates(index) & (1 << digit)));
                if (places.length === 1) {
                    cells[places[0]] = digit;
                    progress = true;
                }
            }
        }
    }

    return cells.every(Boolean);
};

/* 4. Puzzle generator --------------------------------------------- */

const LEVELS = {
    easy: { label: "Easy", clues: 40, salt: 1 },
    medium: { label: "Medium", clues: 32, salt: 2 },
    hard: { label: "Hard", clues: 26, salt: 3 },
};
const DAILY_LEVEL = "medium";
const MAX_SEED = 999999;
const MAX_ATTEMPTS = 12;

// Same level and seed always give the same puzzle.
const generatePuzzle = (level, seed) => {
    const config = LEVELS[level];
    const random = createRandom(Math.imul(seed, 2654435761) ^ config.salt);
    let best = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const { solution } = solve(new Array(CELLS).fill(0), 1, random);
        const puzzle = solution.slice();
        let clues = CELLS;

        // Remove cells in symmetric pairs while the solution stays unique.
        for (const index of shuffle([...Array(41).keys()], random)) {
            const mirror = CELLS - 1 - index;
            const pair = index === mirror ? [index] : [index, mirror];
            if (clues - pair.length < config.clues) {
                continue;
            }
            pair.forEach((cell) => {
                puzzle[cell] = 0;
            });
            if (solve(puzzle, 2).count === 1) {
                clues -= pair.length;
            } else {
                pair.forEach((cell) => {
                    puzzle[cell] = solution[cell];
                });
            }
        }

        if (level === "easy" && !solvableWithSingles(puzzle)) {
            continue;
        }

        if (!best || clues < best.clues) {
            best = { puzzle, solution, clues };
        }
        if (clues <= config.clues + 1) {
            break;
        }
    }

    return best;
};

/* 5. Game state, saving and loading ------------------------------- */

const STORAGE_KEY = "sudoku-state";
const SAVE_VERSION = 1;
const MAX_HISTORY = 300;
const MAX_SECONDS = 99 * 3600;

const todayString = () => {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const isValidDate = (text) => {
    if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        return false;
    }
    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return year >= 2000 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

const isValidSeed = (seed) => Number.isInteger(seed) && seed >= 1 && seed <= MAX_SEED;

const dailySeed = (date) => Number(date.replaceAll("-", ""));

const formatDate = (date) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const createGame = ({ level, seed, daily = null }) => {
    const { puzzle, solution } = generatePuzzle(level, seed);
    return {
        version: SAVE_VERSION,
        level,
        seed,
        daily,
        puzzle,
        solution,
        values: puzzle.slice(),
        notes: new Array(CELLS).fill(0),
        selected: puzzle.indexOf(0),
        notesMode: false,
        elapsedSeconds: 0,
        hints: 0,
        status: "playing",
        history: [],
    };
};

const createRandomGame = (level) => createGame({
    level,
    seed: Math.floor(Math.random() * MAX_SEED) + 1,
});

const createDailyGame = (date) => createGame({
    level: DAILY_LEVEL,
    seed: dailySeed(date),
    daily: date,
});

const digitString = (values) => values.join("");
const parseDigits = (text) => (
    typeof text === "string" && /^[0-9]{81}$/.test(text) ? [...text].map(Number) : null
);

const serialize = (state) => ({
    version: SAVE_VERSION,
    level: state.level,
    seed: state.seed,
    daily: state.daily,
    puzzle: digitString(state.puzzle),
    solution: digitString(state.solution),
    values: digitString(state.values),
    notes: state.notes,
    selected: state.selected,
    notesMode: state.notesMode,
    elapsedSeconds: state.elapsedSeconds,
    hints: state.hints,
    status: state.status,
    history: state.history.slice(-MAX_HISTORY),
});

const deserialize = (data) => {
    if (!data || data.version !== SAVE_VERSION || !LEVELS[data.level]) {
        return null;
    }
    const puzzle = parseDigits(data.puzzle);
    const solution = parseDigits(data.solution);
    const values = parseDigits(data.values);
    if (!puzzle || !solution || !values || solution.includes(0)) {
        return null;
    }
    const consistent = puzzle.every((digit, index) => !digit || (digit === solution[index] && values[index] === digit));
    if (!consistent) {
        return null;
    }
    const notes = Array.isArray(data.notes) && data.notes.length === CELLS
        ? data.notes.map((mask) => (Number(mask) & ALL_DIGITS))
        : new Array(CELLS).fill(0);
    const history = Array.isArray(data.history)
        ? data.history.filter((entry) => Array.isArray(entry) && entry.every((change) => (
            Array.isArray(change) && change.length === 3 && Number.isInteger(change[0])
            && change[0] >= 0 && change[0] < CELLS
        )))
        : [];
    const selected = Number.isInteger(data.selected) && data.selected >= 0 && data.selected < CELLS ? data.selected : 0;

    return {
        version: SAVE_VERSION,
        level: data.level,
        seed: Number(data.seed) || 0,
        daily: isValidDate(data.daily) ? data.daily : null,
        puzzle,
        solution,
        values,
        notes,
        selected,
        notesMode: Boolean(data.notesMode),
        elapsedSeconds: Math.min(MAX_SECONDS, Math.max(0, Math.floor(Number(data.elapsedSeconds) || 0))),
        hints: Math.max(0, Math.floor(Number(data.hints) || 0)),
        status: data.status === "won" ? "won" : "playing",
        history,
    };
};

const conflictsOf = (values) => {
    const conflicts = new Set();
    for (let index = 0; index < CELLS; index += 1) {
        const digit = values[index];
        if (digit && PEERS[index].some((peer) => values[peer] === digit)) {
            conflicts.add(index);
        }
    }
    return conflicts;
};

const isSolved = (state) => state.values.every((digit, index) => digit === state.solution[index]);

const hasProgress = (state) => state.status === "playing" && state.history.length > 0;

/* Node export for the generator test script; the browser skips it. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = { solve, solvableWithSingles, generatePuzzle, LEVELS, PEERS, createRandom };
}

/* 6–7. Browser game ----------------------------------------------- */

if (typeof document !== "undefined") {
    const elements = {
        board: document.getElementById("sudokuBoard"),
        pad: document.getElementById("numberPad"),
        levelButtons: [...document.querySelectorAll("[data-level]")],
        dailyButton: document.getElementById("dailyButton"),
        copyLinkButton: document.getElementById("copyLinkButton"),
        undoButton: document.getElementById("undoButton"),
        eraseButton: document.getElementById("eraseButton"),
        notesButton: document.getElementById("notesButton"),
        hintButton: document.getElementById("hintButton"),
        puzzleLabel: document.getElementById("puzzleLabel"),
        timer: document.getElementById("timeCounter"),
        hintCounter: document.getElementById("hintCounter"),
        statusLine: document.getElementById("statusLine"),
        winPanel: document.getElementById("winPanel"),
        winSummary: document.getElementById("winSummary"),
    };

    const game = {
        state: null,
        timerId: null,
        startedAt: 0,
        cells: [],
        padButtons: [],
    };

    /* Storage */

    const saveState = () => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serialize(game.state)));
        } catch (error) {
            window.console.warn("Could not save Sudoku state.", error);
        }
    };

    const loadState = () => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            return saved ? deserialize(JSON.parse(saved)) : null;
        } catch (error) {
            window.console.warn("Could not load Sudoku state.", error);
            return null;
        }
    };

    /* Timer */

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const rest = seconds % 60;
        const mm = String(minutes).padStart(2, "0");
        const ss = String(rest).padStart(2, "0");
        return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
    };

    const updateTimer = () => {
        elements.timer.textContent = formatTime(game.state.elapsedSeconds);
    };

    const stopTimer = () => {
        if (game.timerId !== null) {
            window.clearInterval(game.timerId);
            game.timerId = null;
        }
    };

    const startTimer = () => {
        if (game.timerId !== null || game.state.status !== "playing" || document.hidden) {
            return;
        }
        game.startedAt = Date.now() - game.state.elapsedSeconds * 1000;
        game.timerId = window.setInterval(() => {
            game.state.elapsedSeconds = Math.min(MAX_SECONDS, Math.floor((Date.now() - game.startedAt) / 1000));
            updateTimer();
            if (game.state.elapsedSeconds % 5 === 0) {
                saveState();
            }
        }, 1000);
    };

    /* Labels and links */

    const puzzleName = (state) => (
        state.daily ? `Daily · ${formatDate(state.daily)}` : `${LEVELS[state.level].label} #${state.seed}`
    );

    const shareUrl = (state) => {
        const url = new URL(window.location.href);
        url.search = "";
        url.hash = "";
        if (state.daily) {
            url.searchParams.set("daily", state.daily);
        } else {
            url.searchParams.set("level", state.level);
            url.searchParams.set("seed", String(state.seed));
        }
        return url.toString();
    };

    const setStatus = (text) => {
        elements.statusLine.textContent = text;
    };

    /* 6. Rendering */

    const buildBoard = () => {
        const fragment = document.createDocumentFragment();
        for (let index = 0; index < CELLS; index += 1) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "sudoku-cell";
            cell.dataset.index = String(index);
            if (colOf(index) % 3 === 2 && colOf(index) !== SIZE - 1) {
                cell.classList.add("box-right");
            }
            if (rowOf(index) % 3 === 2 && rowOf(index) !== SIZE - 1) {
                cell.classList.add("box-bottom");
            }
            game.cells.push(cell);
            fragment.append(cell);
        }
        elements.board.append(fragment);

        for (let digit = 1; digit <= SIZE; digit += 1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "pad-button";
            button.dataset.digit = String(digit);
            button.textContent = String(digit);
            game.padButtons.push(button);
            elements.pad.append(button);
        }
    };

    const renderCell = (index, context) => {
        const { state } = game;
        const cell = game.cells[index];
        const digit = state.values[index];
        const given = Boolean(state.puzzle[index]);
        const selected = state.selected;
        const selectedDigit = state.values[selected];

        cell.classList.toggle("given", given);
        cell.classList.toggle("selected", index === selected);
        cell.classList.toggle("same-digit", Boolean(digit) && digit === selectedDigit && index !== selected);
        cell.classList.toggle("conflict", context.conflicts.has(index));
        cell.tabIndex = index === selected ? 0 : -1;

        const position = `Row ${rowOf(index) + 1}, column ${colOf(index) + 1}`;
        if (digit) {
            cell.textContent = String(digit);
            const kind = given ? "given" : "entered";
            const warning = context.conflicts.has(index) ? ", conflict" : "";
            cell.setAttribute("aria-label", `${position}: ${digit}, ${kind}${warning}`);
        } else if (state.notes[index]) {
            const noteDigits = digitsOf(state.notes[index]);
            cell.innerHTML = `<span class="notes">${Array.from({ length: SIZE }, (_, i) => (
                `<span>${noteDigits.includes(i + 1) ? i + 1 : ""}</span>`
            )).join("")}</span>`;
            cell.setAttribute("aria-label", `${position}: empty, notes ${noteDigits.join(" ")}`);
        } else {
            cell.textContent = "";
            cell.setAttribute("aria-label", `${position}: empty`);
        }
    };

    const render = () => {
        const { state } = game;
        const context = { conflicts: conflictsOf(state.values) };
        for (let index = 0; index < CELLS; index += 1) {
            renderCell(index, context);
        }

        const counts = new Array(SIZE + 1).fill(0);
        state.values.forEach((digit) => {
            counts[digit] += 1;
        });
        game.padButtons.forEach((button, i) => {
            const digit = i + 1;
            const left = Math.max(0, SIZE - counts[digit]);
            button.classList.toggle("complete", left === 0);
            button.setAttribute("aria-label", `${digit}, ${left} left`);
        });

        const won = state.status === "won";
        elements.board.classList.toggle("is-won", won);
        elements.board.classList.toggle("notes-mode", state.notesMode);
        elements.notesButton.setAttribute("aria-pressed", String(state.notesMode));
        elements.undoButton.disabled = won || state.history.length === 0;
        elements.eraseButton.disabled = won;
        elements.hintButton.disabled = won;
        elements.notesButton.disabled = won;
        game.padButtons.forEach((button) => {
            button.disabled = won;
        });

        elements.levelButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(!state.daily && button.dataset.level === state.level));
        });
        elements.dailyButton.setAttribute("aria-pressed", String(Boolean(state.daily)));

        elements.puzzleLabel.textContent = puzzleName(state);
        elements.hintCounter.hidden = state.hints === 0;
        elements.hintCounter.textContent = state.hints === 1 ? "1 hint" : `${state.hints} hints`;
        updateTimer();

        elements.winPanel.hidden = !won;
        if (won) {
            const hintText = state.hints === 1 ? "1 hint" : `${state.hints} hints`;
            elements.winSummary.textContent = `${puzzleName(state)} solved in ${formatTime(state.elapsedSeconds)} with ${hintText}.`;
        }
    };

    /* 7. Actions */

    const startGame = (state, message) => {
        stopTimer();
        game.state = state;
        render();
        setStatus(message);
        saveState();
        startTimer();
    };

    const confirmReplace = () => (
        !hasProgress(game.state) || window.confirm("End the current game and start a new one?")
    );

    const newRandomGame = (level) => {
        if (!confirmReplace()) {
            return;
        }
        const state = createRandomGame(level);
        startGame(state, `New ${LEVELS[level].label.toLowerCase()} puzzle. Select a cell, then a number.`);
    };

    const newDailyGame = () => {
        const date = todayString();
        if (game.state.daily === date) {
            setStatus(game.state.status === "won"
                ? "You have already solved today's puzzle. Come back tomorrow."
                : "You are already playing today's puzzle.");
            return;
        }
        if (!confirmReplace()) {
            return;
        }
        startGame(createDailyGame(date), "Today's puzzle. Everyone gets the same one.");
    };

    // Applies a list of [index, value, notes] changes and records the old
    // values so the whole action can be undone in one step.
    const commit = (changes) => {
        const { state } = game;
        const undo = changes.map(([index]) => [index, state.values[index], state.notes[index]]);
        changes.forEach(([index, value, notes]) => {
            state.values[index] = value;
            state.notes[index] = notes;
        });
        state.history.push(undo);
        if (state.history.length > MAX_HISTORY) {
            state.history.shift();
        }
    };

    // Placing a digit also removes it from the notes of related cells.
    const placementChanges = (index, digit) => {
        const { state } = game;
        const changes = [[index, digit, 0]];
        const bit = 1 << digit;
        PEERS[index].forEach((peer) => {
            if (!state.values[peer] && (state.notes[peer] & bit)) {
                changes.push([peer, 0, state.notes[peer] & ~bit]);
            }
        });
        return changes;
    };

    const afterMove = () => {
        const { state } = game;
        if (state.values.every(Boolean) && isSolved(state)) {
            state.status = "won";
            stopTimer();
            setStatus("Solved! Pick a level to play a new puzzle.");
        } else if (conflictsOf(state.values).has(state.selected)) {
            setStatus("That number clashes with another one in the same row, column, or box.");
        } else {
            setStatus("");
        }
        render();
        saveState();
    };

    const canEditSelected = () => {
        const { state } = game;
        if (state.status !== "playing") {
            return false;
        }
        if (state.puzzle[state.selected]) {
            setStatus("That number is part of the puzzle.");
            return false;
        }
        return true;
    };

    const inputDigit = (digit) => {
        if (!canEditSelected()) {
            return;
        }
        const { state } = game;
        const index = state.selected;

        if (state.notesMode) {
            if (state.values[index]) {
                setStatus("Erase the number first to add notes.");
                return;
            }
            commit([[index, 0, state.notes[index] ^ (1 << digit)]]);
        } else if (state.values[index] === digit) {
            commit([[index, 0, 0]]);
        } else {
            commit(placementChanges(index, digit));
        }
        afterMove();
    };

    const erase = () => {
        if (!canEditSelected()) {
            return;
        }
        const { state } = game;
        const index = state.selected;
        if (!state.values[index] && !state.notes[index]) {
            return;
        }
        commit([[index, 0, 0]]);
        afterMove();
    };

    const undo = () => {
        const { state } = game;
        if (state.status !== "playing" || state.history.length === 0) {
            return;
        }
        const changes = state.history.pop();
        changes.forEach(([index, value, notes]) => {
            if (!state.puzzle[index]) {
                state.values[index] = Number(value) || 0;
                state.notes[index] = Number(notes) & ALL_DIGITS;
            }
        });
        state.selected = changes[0][0];
        setStatus("");
        render();
        saveState();
    };

    const hint = () => {
        const { state } = game;
        if (state.status !== "playing") {
            return;
        }
        const needsHelp = (index) => state.values[index] !== state.solution[index];
        let index = state.selected;
        if (!needsHelp(index)) {
            const open = [...Array(CELLS).keys()].filter(needsHelp);
            if (open.length === 0) {
                return;
            }
            index = open[Math.floor(Math.random() * open.length)];
        }
        state.selected = index;
        commit(placementChanges(index, state.solution[index]));
        state.hints += 1;
        afterMove();
        if (state.status === "playing") {
            setStatus(`Hint: row ${rowOf(index) + 1}, column ${colOf(index) + 1} is ${state.solution[index]}.`);
        }
    };

    const toggleNotes = () => {
        if (game.state.status !== "playing") {
            return;
        }
        game.state.notesMode = !game.state.notesMode;
        render();
        saveState();
    };

    const select = (index, focus = false) => {
        game.state.selected = index;
        render();
        if (focus) {
            game.cells[index].focus();
        }
    };

    const copyLink = async () => {
        const url = shareUrl(game.state);
        if (navigator.share) {
            try {
                await navigator.share({ title: `Sudoku – ${puzzleName(game.state)}`, url });
                return;
            } catch (error) {
                if (error.name === "AbortError") {
                    return;
                }
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setStatus("Link copied. Anyone who opens it gets this puzzle.");
        } catch (error) {
            window.prompt("Copy this link to share the puzzle:", url);
        }
    };

    /* Input */

    elements.board.addEventListener("click", (event) => {
        const cell = event.target.closest(".sudoku-cell");
        if (cell) {
            select(Number(cell.dataset.index));
        }
    });

    elements.board.addEventListener("keydown", (event) => {
        const moves = { ArrowUp: -SIZE, ArrowDown: SIZE, ArrowLeft: -1, ArrowRight: 1 };
        if (!(event.key in moves)) {
            return;
        }
        event.preventDefault();
        const { selected } = game.state;
        const row = rowOf(selected);
        const col = colOf(selected);
        const next = {
            ArrowUp: row > 0 ? selected - SIZE : selected,
            ArrowDown: row < SIZE - 1 ? selected + SIZE : selected,
            ArrowLeft: col > 0 ? selected - 1 : selected,
            ArrowRight: col < SIZE - 1 ? selected + 1 : selected,
        }[event.key];
        select(next, true);
    });

    document.addEventListener("keydown", (event) => {
        if (event.altKey || event.target.closest("input, textarea, select")) {
            return;
        }
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
            event.preventDefault();
            undo();
            return;
        }
        if (event.ctrlKey || event.metaKey) {
            return;
        }
        if (/^[1-9]$/.test(event.key)) {
            event.preventDefault();
            inputDigit(Number(event.key));
        } else if (["0", "Backspace", "Delete"].includes(event.key)) {
            event.preventDefault();
            erase();
        } else if (event.key.toLowerCase() === "n") {
            toggleNotes();
        }
    });

    elements.pad.addEventListener("click", (event) => {
        const button = event.target.closest("[data-digit]");
        if (button) {
            inputDigit(Number(button.dataset.digit));
        }
    });

    elements.levelButtons.forEach((button) => {
        button.addEventListener("click", () => newRandomGame(button.dataset.level));
    });
    elements.dailyButton.addEventListener("click", newDailyGame);
    elements.copyLinkButton.addEventListener("click", copyLink);
    elements.undoButton.addEventListener("click", undo);
    elements.eraseButton.addEventListener("click", erase);
    elements.notesButton.addEventListener("click", toggleNotes);
    elements.hintButton.addEventListener("click", hint);

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopTimer();
            saveState();
        } else {
            startTimer();
        }
    });
    window.addEventListener("pagehide", saveState);

    /* Start: a shared link wins over the saved game, after a confirmation. */

    const gameFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const daily = params.get("daily");
        if (daily !== null) {
            return isValidDate(daily) ? { level: DAILY_LEVEL, seed: dailySeed(daily), daily } : null;
        }
        const level = params.get("level");
        const seed = Number(params.get("seed"));
        return LEVELS[level] && isValidSeed(seed) ? { level, seed, daily: null } : null;
    };

    const init = () => {
        buildBoard();
        const saved = loadState();
        const linked = gameFromUrl();
        const hadParams = window.location.search !== "";

        if (hadParams) {
            window.history.replaceState(null, "", window.location.pathname + window.location.hash);
        }

        const sameAsSaved = saved && linked
            && saved.level === linked.level && saved.seed === linked.seed && saved.daily === linked.daily;

        if (linked && !sameAsSaved && (!saved || !hasProgress(saved)
            || window.confirm("Open the shared puzzle? Your current game will be replaced."))) {
            startGame(createGame(linked), "Shared puzzle loaded. Select a cell, then a number.");
            return;
        }

        if (saved) {
            game.state = saved;
            render();
            setStatus(saved.status === "won" ? "Solved! Pick a level to play a new puzzle." : "Welcome back. Your game was restored.");
            startTimer();
            return;
        }

        startGame(createRandomGame(DAILY_LEVEL), "Select a cell, then a number.");
    };

    init();
}
