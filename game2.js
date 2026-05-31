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
    incomeElem: null,
    lastGainElem: null,
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
    showGain("Progress reset.");
    updateView();
}

const getAutoIncome = () => gameStates.work.reduce((total, work) => {
    if (!work.auto) {
        return total;
    }

    return total + work.amount;
}, 0);

const showGain = (message, isActive = false) => {
    if (!gameStates.lastGainElem) {
        return;
    }

    gameStates.lastGainElem.textContent = message;
    gameStates.lastGainElem.classList.toggle("is-active", isActive);
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
        workButton.title = `Earn $${work.amount}`;
    } else if (work.price <= gameStates.totalMoney){
        setButtonState(workButton, "yellow-btn");
        workButton.title = `Buy ${work.name} for $${work.price}`;
    } else {
        setButtonState(workButton, "red-btn");
        workButton.title = `Need $${work.price} to unlock`;
    }

    const infoElem = document.getElementById(`info${index}`);
    if (infoElem) {
        infoElem.textContent = work.bought ? `+$${work.amount}/click` : "Locked";
    }

    const buyLink = document.getElementById(`buy${index}`);
    if (buyLink) {
        buyLink.hidden = work.bought;
        buyLink.textContent = `Buy: $${work.price}`;
        buyLink.classList.toggle("is-available", !work.bought && work.price <= gameStates.totalMoney);
        buyLink.title = work.price <= gameStates.totalMoney ? `Unlock ${work.name}` : `Need $${work.price}`;
    }

    const autoLink = document.getElementById(`auto${index}`);
    if (autoLink) {
        autoLink.hidden = work.auto;
        autoLink.textContent = `Auto: $${work.autoPrice}`;
        autoLink.classList.toggle("is-available", work.bought && work.autoPrice <= gameStates.totalMoney);
        autoLink.classList.toggle("is-disabled", !work.bought);
        autoLink.setAttribute("aria-disabled", String(!work.bought));
        autoLink.title = work.bought ? `Automate for $${work.autoPrice}` : "Unlock this work first";
    }
}

const updateView = () => {
    gameStates.totalMoneyElem.textContent = gameStates.totalMoney;
    gameStates.incomeElem.textContent = getAutoIncome();

    gameStates.work.forEach((work, index) => {
        updateButtons(work, index);
    });
}

const doWork = (work) => {
    gameStates.totalMoney += work.amount;
}

const work = (index) => {
    doWork(gameStates.work[index]);
    showGain(`+$${gameStates.work[index].amount} from ${gameStates.work[index].name}`, true);
    saveGame();
    updateView();
}

const buyWork = (index) => {
    if (gameStates.totalMoney >= gameStates.work[index].price){
        gameStates.work[index].bought = true;
        gameStates.totalMoney -= gameStates.work[index].price;
        showGain(`${gameStates.work[index].name} unlocked.`);
        saveGame();
        updateView();
    }
}

const buyAuto = (index) => {
    const work = gameStates.work[index];
    if (work.bought && !work.auto && gameStates.totalMoney >= work.autoPrice){
        work.auto = true;
        gameStates.totalMoney -= work.autoPrice;
        showGain(`${work.name} automated.`);
        saveGame();
        updateView();
    }
}

const clickerLoop = () => {
    let earnedMoney = 0;
    gameStates.work.forEach((w) => {
        if (w.auto){
            doWork(w);
            earnedMoney += w.amount;
        }
    });
    if (earnedMoney > 0) {
        showGain(`+$${earnedMoney} from automation`, true);
        saveGame();
    }
    updateView();
    setTimeout(clickerLoop, 1000);
}

const main = () => {
    gameStates.totalMoneyElem = document.getElementsByClassName("money")[0];
    gameStates.incomeElem = document.getElementsByClassName("income")[0];
    gameStates.lastGainElem = document.getElementsByClassName("last-gain")[0];
    loadGame();
    updateView();
    clickerLoop();
}

main();
