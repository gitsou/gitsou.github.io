const STORAGE_KEY = "clicker-game-state";

const initialWork = [
    { name: "Work 1", price: 2, amount: 1, autoPrice: 10, auto: false, bought: true },
    { name: "Work 2", price: 20, amount: 10, autoPrice: 100, auto: false, bought: false },
    { name: "Work 3", price: 200, amount: 100, autoPrice: 1000, auto: false, bought: false },
    { name: "Work 4", price: 2000, amount: 1000, autoPrice: 10000, auto: false, bought: false },
    { name: "Work 5", price: 20000, amount: 10000, autoPrice: 100000, auto: false, bought: false },
];

const createInitialWork = () => initialWork.map((work) => ({ ...work }));

const gameStates = {
    totalMoneyElem: null,
    totalMoney: 0,
    work: createInitialWork()
};

const saveGame = () => {
    const saveState = {
        totalMoney: gameStates.totalMoney,
        work: gameStates.work.map((work) => ({
            bought: work.bought,
            auto: work.auto
        }))
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
}

const loadGame = () => {
    const saveState = localStorage.getItem(STORAGE_KEY);
    if (!saveState) {
        return;
    }

    try {
        const parsedState = JSON.parse(saveState);
        if (Number.isFinite(parsedState.totalMoney)) {
            gameStates.totalMoney = parsedState.totalMoney;
        }

        if (Array.isArray(parsedState.work)) {
            parsedState.work.forEach((savedWork, index) => {
                if (!gameStates.work[index]) {
                    return;
                }

                gameStates.work[index].bought = Boolean(savedWork.bought);
                gameStates.work[index].auto = Boolean(savedWork.auto);
            });
        }
    } catch {
        localStorage.removeItem(STORAGE_KEY);
    }
}

const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    gameStates.totalMoney = 0;
    gameStates.work = createInitialWork();
    updateView();
}

const updateState = (object, property, value) => {
    if (object[property] !== value) {
        object[property] = value;
    }
}

const setButtonState = (button, stateClass) => {
    button.classList.remove("red-btn", "yellow-btn", "green-btn");
    button.classList.add(stateClass);
}

const updateButtons = (work, index) => {
    const workButton = document.getElementById(`button${index}`);
    if (!workButton){
        return;
    }

    updateState(workButton, "disabled", !work.bought);

    if (work.bought) {
        setButtonState(workButton, "green-btn");
    } else if (work.price <= gameStates.totalMoney){
        setButtonState(workButton, "yellow-btn");
    } else {
        setButtonState(workButton, "red-btn");
    }

    const buyLink = document.getElementById(`buy${index}`);
    if (buyLink) {
        buyLink.hidden = work.bought;
        buyLink.textContent = `Buy: $${work.price}`;
        buyLink.classList.toggle("is-available", !work.bought && work.price <= gameStates.totalMoney);
    }

    const autoLink = document.getElementById(`auto${index}`);
    if (autoLink) {
        autoLink.hidden = work.auto;
        autoLink.textContent = `Auto: $${work.autoPrice}`;
        autoLink.classList.toggle("is-available", work.bought && work.autoPrice <= gameStates.totalMoney);
        autoLink.classList.toggle("is-disabled", !work.bought);
        autoLink.setAttribute("aria-disabled", String(!work.bought));
    }
}

const updateView = () => {
    gameStates.totalMoneyElem.textContent = gameStates.totalMoney;

    gameStates.work.forEach((work, index) => {
        updateButtons(work, index);
    });
}

const doWork = (work) => {
    gameStates.totalMoney += work.amount;
}

const work = (index) => {
    doWork(gameStates.work[index]);
    saveGame();
    updateView();
}

const buyWork = (index) => {
    if (gameStates.totalMoney >= gameStates.work[index].price){
        gameStates.work[index].bought = true;
        gameStates.totalMoney -= gameStates.work[index].price;
        saveGame();
        updateView();
    }
}

const buyAuto = (index) => {
    const work = gameStates.work[index];
    if (work.bought && !work.auto && gameStates.totalMoney >= work.autoPrice){
        work.auto = true;
        gameStates.totalMoney -= work.autoPrice;
        saveGame();
        updateView();
    }
}

const clickerLoop = () => {
    let earnedMoney = false;
    gameStates.work.forEach((w) => {
        if (w.auto){
            doWork(w);
            earnedMoney = true;
        }
    });
    if (earnedMoney) {
        saveGame();
    }
    updateView();
    setTimeout(clickerLoop, 1000);
}

const main = () => {
    gameStates.totalMoneyElem = document.getElementsByClassName("money")[0];
    loadGame();
    updateView();
    clickerLoop();
}

main();
