const STORAGE_KEY = "clicker-game-state";

const initialWork = [
    { name: "Work 1", basePrice: 2, baseAmount: 1, baseAutoPrice: 10, level: 1, auto: false, bought: true },
    { name: "Work 2", basePrice: 20, baseAmount: 8, baseAutoPrice: 120, level: 0, auto: false, bought: false },
    { name: "Work 3", basePrice: 180, baseAmount: 55, baseAutoPrice: 900, level: 0, auto: false, bought: false },
    { name: "Work 4", basePrice: 1400, baseAmount: 300, baseAutoPrice: 6500, level: 0, auto: false, bought: false },
    { name: "Work 5", basePrice: 9000, baseAmount: 1500, baseAutoPrice: 42000, level: 0, auto: false, bought: false },
];

const getWorkAmount = (work) => work.baseAmount * Math.max(work.level, 1);

const getWorkPrice = (work) => Math.ceil(work.basePrice * Math.pow(1.75, work.level));

const getAutoPrice = (work) => Math.ceil(work.baseAutoPrice * Math.pow(1.6, Math.max(work.level - 1, 0)));

const formatNumber = (value) => {
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"];
    let scaledValue = Math.abs(value);
    let suffixIndex = 0;

    while (scaledValue >= 1000 && suffixIndex < suffixes.length - 1) {
        scaledValue /= 1000;
        suffixIndex += 1;
    }

    const sign = value < 0 ? "-" : "";
    const formattedValue = scaledValue >= 100 || suffixIndex === 0
        ? Math.round(scaledValue).toString()
        : scaledValue.toFixed(1).replace(/\.0$/, "");

    return `${sign}${formattedValue}${suffixes[suffixIndex]}`;
}

const formatMoney = (value) => `$${formatNumber(value)}`;

const refreshWorkValues = (work) => {
    work.amount = getWorkAmount(work);
    work.price = getWorkPrice(work);
    work.autoPrice = getAutoPrice(work);
}

const createInitialWork = () => initialWork.map((work) => {
    const newWork = { ...work };
    refreshWorkValues(newWork);
    return newWork;
});

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
            auto: work.auto,
            level: work.level
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
                gameStates.work[index].level = Number.isInteger(savedWork.level)
                    ? Math.max(savedWork.level, 0)
                    : Number(gameStates.work[index].bought);
                refreshWorkValues(gameStates.work[index]);
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
        workButton.title = `Earn ${formatMoney(work.amount)}`;
    } else if (work.price <= gameStates.totalMoney){
        setButtonState(workButton, "yellow-btn");
        workButton.title = `Buy ${work.name} for ${formatMoney(work.price)}`;
    } else {
        setButtonState(workButton, "red-btn");
        workButton.title = `Need ${formatMoney(work.price)} to unlock`;
    }

    const infoElem = document.getElementById(`info${index}`);
    if (infoElem) {
        infoElem.textContent = work.bought ? `Lv ${work.level} +${formatMoney(work.amount)}/click` : "Locked";
    }

    const buyLink = document.getElementById(`buy${index}`);
    if (buyLink) {
        buyLink.hidden = false;
        buyLink.textContent = work.bought ? `Upgrade: ${formatMoney(work.price)}` : `Unlock: ${formatMoney(work.price)}`;
        buyLink.classList.toggle("is-available", work.price <= gameStates.totalMoney);
        buyLink.title = work.bought ? `Upgrade ${work.name} to level ${work.level + 1}` : `Unlock ${work.name}`;
    }

    const autoLink = document.getElementById(`auto${index}`);
    if (autoLink) {
        autoLink.hidden = false;
        autoLink.textContent = work.auto ? "Auto on" : `Auto: ${formatMoney(work.autoPrice)}`;
        autoLink.classList.toggle("is-available", work.bought && !work.auto && work.autoPrice <= gameStates.totalMoney);
        autoLink.classList.toggle("is-disabled", !work.bought || work.auto);
        autoLink.classList.toggle("is-owned", work.auto);
        autoLink.setAttribute("aria-disabled", String(!work.bought || work.auto));
        autoLink.title = work.auto ? `${work.name} earns automatically` : `Automate for ${formatMoney(work.autoPrice)}`;
    }
}

const updateView = () => {
    gameStates.totalMoneyElem.textContent = formatNumber(gameStates.totalMoney);
    gameStates.incomeElem.textContent = formatNumber(getAutoIncome());

    gameStates.work.forEach((work, index) => {
        updateButtons(work, index);
    });
}

const doWork = (work) => {
    gameStates.totalMoney += work.amount;
}

const work = (index) => {
    doWork(gameStates.work[index]);
    showGain(`+${formatMoney(gameStates.work[index].amount)} from ${gameStates.work[index].name}`, true);
    saveGame();
    updateView();
}

const buyWork = (index) => {
    const work = gameStates.work[index];
    if (gameStates.totalMoney >= work.price){
        gameStates.totalMoney -= work.price;
        if (work.bought) {
            work.level += 1;
            showGain(`${work.name} upgraded to level ${work.level}.`);
        } else {
            work.bought = true;
            work.level = 1;
            showGain(`${work.name} unlocked.`);
        }
        refreshWorkValues(work);
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
        showGain(`+${formatMoney(earnedMoney)} from automation`, true);
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
