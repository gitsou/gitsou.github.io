const gameStates = {
    totalMoneyElem: null,
    totalMoney: 0,
    work: [
        { name: "Work 1", price: 2, amount: 1, auto: false, bought: true },
        { name: "Work 2", price: 20, amount: 10, auto: false, bought: false },
        { name: "Work 3", price: 200, amount: 100, auto: false, bought: false },
        { name: "Work 4", price: 2000, amount: 1000, auto: false, bought: false },
        { name: "Work 5", price: 20000, amount: 10000, auto: false, bought: false },
    ]
};


const updateState = (object, property, value) => {
    if (object[property] != value) {
        object[property] = value;
    }
}

const updateButtons = (work, index) => {
    const workButton = document.getElementById(`button${index}`);
    if (!workButton){
        return;
    }

    // disable/enable
    if (work.bought) {
        updateState(workButton, "disabled", false);
    }
    else {
        updateState(workButton, "disabled", true);
    }

    // set correct style
    if (work.bought) {
        if (workButton.classList.contains('red-btn')) {
            workButton.classList.remove('red-btn');
        }
        if (workButton.classList.contains('green-btn')) {
            workButton.classList.remove('green-btn');
        }
        if (!workButton.classList.contains('green-btn')) {
            workButton.classList.add('green-btn');
        }
    }
    else {
        if (work.price < gameStates.totalMoney){
            if (workButton.classList.contains('green-btn')) {
                workButton.classList.remove('green-btn');
            }
            if (workButton.classList.contains('red-btn')) {
                workButton.classList.remove('red-btn');
            }
            if (!workButton.classList.contains('yellow-btn')) {
                workButton.classList.add('yellow-btn');
            }
        }
        else {
            if (workButton.classList.contains('green-btn')) {
                workButton.classList.remove('green-btn');
            }
            if (workButton.classList.contains('yellow-btn')) {
                workButton.classList.remove('yellow-btn');
            }
            if (!workButton.classList.contains('red-btn')) {
                workButton.classList.add('red-btn');
            }
        }
    }
}

const updateView = () => {
    gameStates.totalMoneyElem.textContent = gameStates.totalMoney;

    gameStates.work.forEach((work, index) => {
        if (work.bought) {
            const buyLink = document.getElementById(`buy${index}`);
            if (buyLink) {
                buyLink.style.display = 'none';
            }
        }
        updateButtons(work, index);
    });
}

const doWork = (work) => {
    gameStates.totalMoney += work.amount;
}

const work = (index) => {
    doWork(gameStates.work[index]);
    updateView();
}

const buyWork = (index) => {
    if (gameStates.totalMoney >= gameStates.work[index].price){
        gameStates.work[index].bought = true;
        gameStates.totalMoney -= gameStates.work[index].price;
        updateView();
    }
}

const clickerLoop = () => {
    gameStates.work.forEach((w) => {
        if (w.auto){
            doWork(w);
        }
    });
    updateView();
    setTimeout(clickerLoop, 1000);
}

const main = () => {
    gameStates.totalMoneyElem = document.getElementsByClassName("money")[0];
    updateView();
    clickerLoop();
}

main();
