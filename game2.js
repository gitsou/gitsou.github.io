const gameStates = {
    totalMoneyElem: null,
    totalMoney: 0,
    work: [
        { name: "Work 1", amount: 1, auto: true, bought: true },
        { name: "Work 2", amount: 2, auto: false, bought: false },
        { name: "Work 3", amount: 3, auto: false, bought: false },
        { name: "Work 4", amount: 4, auto: false, bought: false },
        { name: "Work 5", amount: 5, auto: false, bought: false },
    ]
};

displayTotalMoney = () => {
    gameStates.totalMoneyElem.textContent = gameStates.totalMoney;
}

doWork = (work) => {
    gameStates.totalMoney += work.amount;
    displayTotalMoney();
}

work1 = () => {
    doWork(gameStates.work[0]);
}

work2 = () => {
    doWork(gameStates.work[1]);
}

work3 = () => {
    doWork(gameStates.work[2]);
}

work4 = () => {
    doWork(gameStates.work[3]);
}

work5 = () => {
    doWork(gameStates.work[4]);
}

toggleAuto = (index) => {
    const checkbox = document.getElementById(`auto${index}`);
    gameStates.work[index].auto = checkbox.checked;
}

buyWork = (index) => {
    gameStates.work[index].auto = true;
    gameStates.work[index].bought = true;
    const buyLink = document.getElementById(`buy${index}`);
    if (buyLink) {
        buyLink.style.display = 'none';
    }
}

clickerLoop = () => {
    gameStates.work.forEach((w) => {
        if (w.auto){
            doWork(w);
        }
    });
    setTimeout(clickerLoop, 1000);
}

main = () => {
    gameStates.totalMoneyElem = document.getElementsByClassName("money")[0];
    displayTotalMoney();
    
    // Hide buy links for already bought works
    gameStates.work.forEach((work, index) => {
        if (work.bought) {
            const buyLink = document.getElementById(`buy${index}`);
            if (buyLink) {
                buyLink.style.display = 'none';
            }
        }
    });
    
    clickerLoop();
}

main();
