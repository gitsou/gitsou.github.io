/*
 * Definicje pomieszczeń i poziomów. Tylko dane: bez logiki i bez rysowania.
 * Opis projektowy poziomów: design/rozdzial-1.md i design/rozdzial-2.md.
 *
 * Etap (stage) ma typ mechaniki: 'window', 'pipe' albo 'water'.
 * Podpowiedź ma tekst i listę `show` — klucze elementów sceny (data-hint) do podświetlenia.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.GF = root.GF || {}; root.GF.levels = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const star = {
    noFail: { check: 'noFail', label: 'Bez nieudanej próby' },
    noHint: { check: 'noHint', label: 'Bez podpowiedzi' },
    firstAnswer: { check: 'firstAnswer', label: 'Dobre odpowiedzi za pierwszym razem' },
    minCuts: (n, label = 'Najmniej cięć') => ({ check: 'minCuts', arg: n, label }),
    secondWay: (label) => ({ check: 'secondWay', label }),
  };

  const pipeTexts = {
    tooLongText: 'Ten kawałek jest za długi — nie mieści się w dziurze.',
    shortText: 'Woda ucieka przez szparę! Brakuje jeszcze kawałka.',
  };
  const cactusOver = 'Kaktus nie lubi mokrych stóp! Dostał za dużo wody.';

  // --- Rozdział 1: połówki i ćwiartki -----------------------------------------------

  const rozsadnik = [
    {
      id: '1-1',
      title: 'Brudne okno',
      successText: 'Słońce wpada przez czyste szyby!',
      stars: [
        star.noFail,
        star.secondWay('Połowa umyta inaczej niż poprzednio'),
        { check: 'diagonal', label: 'Połowa po skosie' },
      ],
      stages: [
        {
          type: 'window', rows: 2, cols: 2, target: '1/2',
          intro: 'Ale tu ciemno! Umyj połowę okna, żeby wpuścić trochę słońca. Dotknij szybki albo przesuń po niej palcem, żeby ją umyć, a potem naciśnij „Gotowe”.',
          shortText: 'Połowa to dwie równe części. Czy czystych i brudnych szybek jest tyle samo?',
          overText: 'Czystych szybek jest więcej niż brudnych. Połowa to dwie równe części — ma ich być tyle samo.',
          hints: [
            { text: 'Policz wszystkie szybki w oknie.', show: ['window'] },
            { text: 'Podzielmy okno na dwie równe części.', show: ['half-line'] },
            { text: 'Umyj te dwie szybki.', show: ['pane-0', 'pane-2'] },
          ],
        },
        {
          type: 'window', rows: 2, cols: 4, target: '1/2', tablet: true,
          intro: 'To okno ma więcej szybek. Tabliczka obok mówi, jaką część okna umyć. Przesuń palcem po szybkach, żeby myć kilka naraz.',
          hints: [
            { text: 'Policz wszystkie szybki. Połowa to dwie równe części.', show: ['window'] },
            { text: 'Podzielmy okno na dwie równe części.', show: ['half-line'] },
            { text: 'Umyj te cztery szybki.', show: ['pane-0', 'pane-1', 'pane-4', 'pane-5'] },
          ],
        },
        {
          type: 'window', rows: 2, cols: 4, target: '3/4', tablet: true,
          intro: 'Na tabliczce jest ułamek. Dolna liczba mówi, na ile równych części dzielimy okno, a górna — ile takich części umyć.',
          shortText: 'Za mało! Podziel okno na cztery równe części i umyj trzy z nich.',
          overText: 'Za dużo! Jedna z czterech równych części okna ma zostać brudna.',
          hints: [
            { text: 'Dolna liczba to 4: podziel okno na cztery równe części. Ile szybek ma każda część?', show: ['cue', 'window'] },
            { text: 'Każda część to jedna kolumna, czyli dwie szybki. Umyj trzy takie części.', show: ['pane-0', 'pane-4'] },
            { text: 'Umyj te trzy kolumny.', show: ['pane-0', 'pane-1', 'pane-2', 'pane-4', 'pane-5', 'pane-6'] },
          ],
        },
      ],
    },
    {
      id: '1-2',
      title: 'Cieknąca rura',
      successText: 'Rura cała! Woda płynie do zbiornika.',
      stars: [star.noFail, star.secondWay('Łata inna niż poprzednio'), star.noHint],
      stages: [
        {
          type: 'pipe', gapStart: '1/4', gap: '1/2', rulerParts: 4, labels: false,
          pieces: ['1/2', '1/4', '3/4', '1/4'], ...pipeTexts,
          intro: 'Rura do zbiornika cieknie! Przeciągnij kawałek ze skrzynki do dziury. Miarka nad rurą pokazuje całą rurę.',
          hints: [
            { text: 'Porównaj kawałki ze skrzynki z dziurą w rurze.', show: ['gap'] },
            { text: 'Spójrz na miarkę: jaką część całej rury zajmuje dziura?', show: ['gap-span', 'ruler'] },
            { text: 'Ten kawałek pasuje idealnie.', show: ['piece-0'] },
          ],
        },
        {
          type: 'pipe', gapStart: '0', gap: '3/4', rulerParts: 4, labels: false,
          pieces: ['1/2', '1/2', '1/4', '1/4'], ...pipeTexts,
          intro: 'Kolejna rura, dłuższa dziura! Tym razem żaden kawałek sam nie wystarczy.',
          hints: [
            { text: 'Porównaj dziurę z miarką nad rurą.', show: ['gap', 'ruler'] },
            { text: 'Dziura zajmuje trzy z czterech części miarki.', show: ['gap-span', 'ruler'] },
            { text: 'Połówka i ćwiartka razem pasują idealnie.', show: ['piece-0', 'piece-2'] },
          ],
        },
        {
          type: 'pipe', gapStart: '0', gap: '1', rulerParts: 4, labels: false,
          pieces: ['3/4', '1/4', '1/2', '1/2'], ...pipeTexts,
          intro: 'Ojej, z tej rury nic nie zostało! Ułóż całą rurę z kawałków.',
          hints: [
            { text: 'Dziura jest tak długa jak cała miarka.', show: ['gap-span', 'ruler'] },
            { text: 'Które dwa kawałki razem są długie jak cała rura?', show: ['gap'] },
            { text: 'Trzy ćwiartki i jedna ćwiartka to cała rura.', show: ['piece-0', 'piece-1'] },
          ],
        },
      ],
    },
    {
      id: '1-3',
      title: 'Dwie równe grządki',
      successText: 'Każda grządka dostała połowę zbiornika. Po równo!',
      stars: [star.noFail, star.minCuts(3, 'Najmniej cięć: po jednym w etapie'), { check: 'gesture', label: 'Cięcie palcem' }],
      stages: [
        {
          type: 'water', parts: 4, cue: 'size', notation: 'after', pulseLine: 2, tutorial: true,
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'sprout' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'sprout' },
          ],
          intro: 'Obie grządki są takie same. Daj każdej tyle samo wody! Najpierw przetnij wodę: przeciągnij palcem w dół po linii na zbiorniku albo dotknij nożyczek.',
          hints: [
            { text: 'Grządki są równe, więc woda też musi być po równo.', show: ['target-a', 'target-b'] },
            { text: 'Przetnij zbiornik tutaj.', show: ['line-2'] },
            { text: 'Przeciągnij palcem z góry na dół, o tak.', show: ['gesture', 'line-2'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'lettuce' },
          ],
          intro: 'Ten zbiornik ma więcej kresek. Znowu daj obu grządkom tyle samo wody.',
          hints: [
            { text: 'Grządki są równe, więc woda też musi być po równo.', show: ['target-a', 'target-b'] },
            { text: 'Policz kawałki zbiornika. Ile ich jest w połowie?', show: ['line-2', 'line-4', 'line-6'] },
            { text: 'Przetnij dokładnie w środku.', show: ['line-4'] },
          ],
        },
        {
          type: 'water', parts: 6, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'fern' },
          ],
          intro: 'A ten zbiornik ma sześć kawałków. Po równo dla obu grządek!',
          hints: [
            { text: 'Grządki są równe, więc woda też musi być po równo.', show: ['target-a', 'target-b'] },
            { text: 'Sześć kawałków na dwie grządki: po ile dla każdej?', show: ['line-1', 'line-2', 'line-3', 'line-4', 'line-5'] },
            { text: 'Przetnij dokładnie w środku.', show: ['line-3'] },
          ],
        },
      ],
    },
    {
      id: '1-4',
      title: 'Duża i mała',
      successText: 'Trzy ćwiartki i jedna ćwiartka to cały zbiornik!',
      stars: [star.noFail, star.minCuts(3, 'Najmniej cięć: po jednym w etapie'), star.firstAnswer],
      stages: [
        {
          type: 'water', parts: 4, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '3/4', plant: 'tomato' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'sprout' },
          ],
          intro: 'Duża grządka pije dużo, a mała mało. Ile wody dać każdej?',
          hints: [
            { text: 'Ile razy duża grządka jest większa od małej?', show: ['target-a', 'target-b'] },
            { text: 'Zbiornik ma cztery równe części. Ile z nich dla małej grządki, a ile dla dużej?', show: ['line-1', 'line-2', 'line-3'] },
            { text: 'Przetnij tutaj: jedna część dla małej, trzy dla dużej.', show: ['line-1', 'target-b'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'b', kind: 'bed', need: '3/4', plant: 'tomato' },
          ],
          intro: 'Znowu duża i mała grządka, ale zbiornik ma osiem kawałków. Przyjrzyj się dokładnie!',
          hints: [
            { text: 'Porównaj szerokość grządek z kawałkami zbiornika.', show: ['target-a', 'target-b'] },
            { text: 'Mała grządka jest szeroka na dwa kawałki zbiornika. To ćwiartka.', show: ['target-a', 'line-2'] },
            { text: 'Przetnij tutaj: dwa kawałki dla małej, sześć dla dużej.', show: ['line-2'] },
          ],
        },
        {
          type: 'water', parts: 4, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '3/4', plant: 'fern' },
          ],
          question: {
            about: 'b',
            text: 'Ile wody dostała duża grządka?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Policz, ile ćwiartek zbiornika poszło do dużej grządki.',
          },
          intro: 'Podlej grządki, a potem odpowiedz na pytanie robota.',
          hints: [
            { text: 'Ile razy duża grządka jest większa od małej?', show: ['target-a', 'target-b'] },
            { text: 'Mała grządka chce jedną z czterech części.', show: ['target-a', 'line-1'] },
            { text: 'Przetnij tutaj.', show: ['line-1'] },
          ],
        },
      ],
    },
    {
      id: '1-5',
      title: 'Pierwsze podlewanie',
      successText: 'Połowę przecięliśmy na pół, więc każda część to ćwiartka całego zbiornika.',
      stars: [star.noFail, star.minCuts(6, 'Najmniej cięć: po dwa w etapie'), star.noHint],
      stages: [
        {
          type: 'water', parts: 4, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'tomato', shortText: 'Duża grządka potrzebuje jednej większej porcji.' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'sprout' },
          ],
          intro: 'Trzy grządki, jeden zbiornik. Podlej wszystkie!',
          hints: [
            { text: 'Która grządka jest największa? Ona potrzebuje najwięcej wody.', show: ['target-a'] },
            { text: 'Najpierw przetnij zbiornik na pół.', show: ['line-2'] },
            { text: 'Teraz przetnij jedną połówkę jeszcze raz na pół.', show: ['line-1', 'line-3'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'tomato' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'lettuce' },
          ],
          intro: 'Trzy grządki i zbiornik z ośmioma kawałkami. Duża grządka stoi w środku!',
          hints: [
            { text: 'Największa grządka chce połowę zbiornika.', show: ['target-b'] },
            { text: 'Każda mała grządka chce ćwiartkę: dwa kawałki zbiornika.', show: ['target-a', 'target-c', 'line-2'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-6'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'tomato' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'sprout' },
          ],
          question: {
            about: 'b',
            text: 'Ile wody dostał pomidor?',
            options: ['1/2', '1/4', '3/4'],
            wrongText: 'Ile takich porcji jak pomidora zmieściłoby się w całym zbiorniku?',
          },
          intro: 'Podlej wszystkie grządki, a potem odpowiedz na pytanie.',
          hints: [
            { text: 'Największa grządka chce połowę zbiornika.', show: ['target-a', 'line-4'] },
            { text: 'Przetnij na pół, a potem jedną połówkę jeszcze raz na pół.', show: ['line-4'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-4', 'line-6'] },
          ],
        },
      ],
    },
    {
      id: '1-6',
      title: 'Różne pragnienie',
      successText: 'Każda roślina dostała tyle, ile lubi.',
      stars: [star.noFail, star.minCuts(5), { check: 'noReassign', label: 'Bez zmieniania zaworów' }],
      stages: [
        {
          type: 'water', parts: 4, cue: 'icon', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'fern' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'cactus', overText: cactusOver },
          ],
          intro: 'Te grządki są takie same, ale rośliny piją różnie. Obrazki nad grządkami pokazują, ile wody potrzebuje każda.',
          hints: [
            { text: 'Patrz na obrazki zbiorników, nie na grządki.', show: ['cue'] },
            { text: 'Porównaj obrazek z prawdziwym zbiornikiem. Ile części jest zaznaczonych?', show: ['cue-b', 'line-1', 'line-2', 'line-3'] },
            { text: 'Przetnij na pół, a potem jedną połówkę jeszcze raz. Połówka idzie do paprotki.', show: ['line-2', 'target-b'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'icon', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'cactus', overText: cactusOver },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/2', plant: 'fern' },
          ],
          intro: 'Obrazki mają teraz osiem kawałków. Policz dokładnie, ile wody chce każda roślina.',
          hints: [
            { text: 'Policz zaznaczone kawałki na każdym obrazku.', show: ['cue'] },
            { text: 'Kaktus chce dwa kawałki z ośmiu. To ćwiartka.', show: ['cue-a', 'line-2'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-4'] },
          ],
        },
        {
          type: 'water', parts: 4, cue: 'icon', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '3/4', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'cactus', overText: cactusOver },
          ],
          question: {
            about: 'a',
            text: 'Jaką część zbiornika dostała paprotka?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Policz zaznaczone części na obrazku paprotki.',
          },
          intro: 'Podlej rośliny według obrazków, a potem odpowiedz na pytanie.',
          hints: [
            { text: 'Patrz na obrazki zbiorników, nie na grządki.', show: ['cue'] },
            { text: 'Kaktus chce jedną z czterech części.', show: ['cue-b', 'line-3'] },
            { text: 'Przetnij tutaj.', show: ['line-3'] },
          ],
        },
      ],
    },
    {
      id: '1-7',
      title: 'Tabliczki',
      successText: 'Grządki podlane, a reszta wody czeka w beczce!',
      stars: [star.noFail, star.minCuts(7), star.noHint],
      stages: [
        {
          type: 'water', parts: 4, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'tomato' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'barrel', kind: 'barrel' },
          ],
          intro: 'Ogrodnik zostawił tabliczki. Dolna liczba mówi, na ile równych części dzielimy zbiornik, a górna — ile takich części dać grządce. Resztę wody wlej do beczki na zapas.',
          hints: [
            { text: 'Na ile części jest podzielony zbiornik? Spójrz na dolną liczbę.', show: ['cue', 'line-1', 'line-2', 'line-3'] },
            { text: 'Każda grządka chce jedną z czterech części. Reszta idzie do beczki.', show: ['target-barrel'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-1', 'line-2'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'tomato' },
            { id: 'barrel', kind: 'barrel' },
          ],
          intro: 'Tabliczki mówią o ćwiartkach i połówkach, ale zbiornik ma osiem kawałków. Ile kawałków to ćwiartka?',
          hints: [
            { text: 'Ćwiartka to jedna z czterech równych części. Tu to dwa kawałki.', show: ['cue-b', 'line-2'] },
            { text: 'Połowa to cztery kawałki. Reszta idzie do beczki.', show: ['cue-a', 'line-4', 'target-barrel'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-4', 'line-6'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'cactus' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'fern' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody trafiło do beczki?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Porównaj wodę z beczki ze zbiornikiem. Jaka to część całości?',
          },
          intro: 'Trzy grządki i beczka. Podlej, a potem powiedz, ile wody jest w beczce.',
          hints: [
            { text: 'Każda grządka chce ćwiartkę: dwa kawałki zbiornika.', show: ['cue', 'line-2'] },
            { text: 'Trzy ćwiartki dla grządek, jedna do beczki.', show: ['target-barrel'] },
            { text: 'Przetnij tutaj, tutaj i tutaj.', show: ['line-2', 'line-4', 'line-6'] },
          ],
        },
      ],
    },
    {
      id: '1-8',
      title: 'Beczka na zapas',
      successText: 'Grządki podlane, a w beczce zapas na później!',
      stars: [star.noFail, star.minCuts(4), star.firstAnswer],
      stages: [
        {
          type: 'water', parts: 4, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody zostało w beczce?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Porównaj wodę z beczki ze zbiornikiem. Ile to części?',
          },
          intro: 'Sałata potrzebuje mało wody. Podlej ją, a całą resztę wlej do beczki na zapas.',
          hints: [
            { text: 'Sałata chce ćwiartkę. Wszystko inne pójdzie do beczki.', show: ['cue-a', 'target-barrel'] },
            { text: 'Wystarczy przeciąć zbiornik tylko raz.', show: ['line-1', 'line-3'] },
            { text: 'Przetnij tutaj.', show: ['line-1'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '3/4', plant: 'tomato' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody zostało w beczce?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Porównaj wodę z beczki ze zbiornikiem. Ile to ćwiartek?',
          },
          intro: 'Pomidor jest bardzo spragniony. Podlej go, a resztę wlej do beczki.',
          hints: [
            { text: 'Pomidor chce trzy ćwiartki. Jedna ćwiartka to dwa kawałki zbiornika.', show: ['cue-a', 'line-2'] },
            { text: 'Wystarczy przeciąć zbiornik tylko raz.', show: ['line-2', 'line-6'] },
            { text: 'Przetnij tutaj.', show: ['line-6'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody zostało w beczce?',
            options: ['1/4', '1/2', '3/4'],
            wrongText: 'Dwie grządki dostały po ćwiartce. Ile ćwiartek zostało?',
          },
          intro: 'Dwie grządki, każda chce ćwiartkę. Resztę wlej do beczki.',
          hints: [
            { text: 'Ćwiartka to dwa kawałki zbiornika.', show: ['cue', 'line-2'] },
            { text: 'Dwie ćwiartki dla grządek, reszta do beczki.', show: ['target-barrel'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-4'] },
          ],
        },
      ],
    },
    {
      id: '1-9',
      title: 'Cztery sadzonki',
      successText: 'Cztery ćwiartki to cały zbiornik!',
      stars: [star.noFail, star.minCuts(8), { check: 'firstCut', arg: 2, label: 'Pierwsze cięcie w połowie zbiornika' }],
      stages: [
        {
          type: 'water', parts: 4, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'tomato' },
            { id: 'd', kind: 'bed', need: '1/4', plant: 'fern' },
          ],
          intro: 'Cztery sadzonki, każda chce ćwiartkę zbiornika.',
          hints: [
            { text: 'Ile grządek, tyle porcji.', show: ['target-a', 'target-b', 'target-c', 'target-d'] },
            { text: 'Ćwiartka to połowa połowy.', show: ['line-2'] },
            { text: 'Przetnij na pół, a potem każdą połówkę jeszcze raz.', show: ['line-1', 'line-2', 'line-3'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'cactus' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'tomato' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'd', kind: 'bed', need: '1/4', plant: 'sprout' },
          ],
          intro: 'Znowu cztery ćwiartki, ale zbiornik ma osiem kawałków.',
          hints: [
            { text: 'Ile grządek, tyle porcji.', show: ['target-a', 'target-b', 'target-c', 'target-d'] },
            { text: 'Ćwiartka to dwa kawałki z ośmiu.', show: ['line-2'] },
            { text: 'Przetnij tutaj, tutaj i tutaj.', show: ['line-2', 'line-4', 'line-6'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'tomato' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'lettuce' },
          ],
          intro: 'Trzy grządki: ćwiartka, połowa i ćwiartka. Czytaj tabliczki!',
          hints: [
            { text: 'Połowa to tyle, co dwie ćwiartki.', show: ['cue-b'] },
            { text: 'Ćwiartka to dwa kawałki, połowa to cztery.', show: ['line-2', 'line-6'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-6'] },
          ],
        },
      ],
    },
    {
      id: '1-10',
      title: 'Wielka grządka Rozsadnika',
      successText: 'Rozsadnik odżył! Wszystkie rośliny rosną.',
      stars: [star.noFail, { check: 'pieces', arg: 2, label: 'Łata z dwóch kawałków' }, star.secondWay('Łata inna niż poprzednio')],
      stages: [
        {
          type: 'pipe', gapStart: '1/4', gap: '3/4', rulerParts: 4, labels: true,
          pieces: ['1/2', '1/4', '1/4', '1/4'], ...pipeTexts,
          intro: 'Wielki finał w trzech etapach. Etap 1: naprawa. Rura do grządek ma długą dziurę. Tym razem kawałki mają podpisy.',
          hints: [
            { text: 'Ile wynosi dziura? Sprawdź na miarce.', show: ['gap-span', 'ruler'] },
            { text: 'Dziura to trzy ćwiartki rury.', show: ['gap-span'] },
            { text: 'Połówka i ćwiartka razem dają trzy ćwiartki.', show: ['piece-0', 'piece-1'] },
          ],
        },
        {
          type: 'water', parts: 4, cue: 'label', notation: 'before',
          failText: 'Tabliczki mówią prawdę, nie wielkość grządki!',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'tomato', width: 300 },
            { id: 'b', kind: 'bed', need: '3/4', plant: 'lettuce', width: 120 },
          ],
          intro: 'Etap 2: podlewanie. Uwaga, haczyk! Grządki mają różne rozmiary, ale ile wody pije każda, mówi tylko tabliczka.',
          hints: [
            { text: 'Czytaj tabliczki, nie patrz na wielkość grządek.', show: ['cue'] },
            { text: 'Mała grządka potrzebuje dużo: aż trzy ćwiartki.', show: ['target-b', 'cue-b'] },
            { text: 'Przetnij tutaj: jedna ćwiartka dla dużej grządki, trzy dla małej.', show: ['line-1'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          failText: 'Tabliczki mówią prawdę, nie wielkość grządki!',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'tomato', width: 120 },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'lettuce', width: 280 },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'fern', width: 140 },
          ],
          intro: 'Etap 3: ostatnie podlewanie. Osiem kawałków i znowu haczyk z wielkością grządek!',
          hints: [
            { text: 'Czytaj tabliczki, nie patrz na wielkość grządek.', show: ['cue'] },
            { text: 'Najmniejsza grządka chce najwięcej: połowę.', show: ['target-a', 'cue-a'] },
            { text: 'Przetnij w połowie, a potem drugą połówkę jeszcze raz na pół.', show: ['line-4', 'line-6'] },
          ],
        },
      ],
    },
  ];

  // --- Rozdział 2: ósme, trzecie i szóste -------------------------------------------

  const warzywa = [
    {
      id: '2-1',
      title: 'Połowa ćwiartki',
      successText: 'Jedna szybka z ośmiu to jedna ósma okna!',
      stars: [star.noFail, star.noHint, star.secondWay('Okno umyte inaczej niż poprzednio')],
      stages: [
        {
          type: 'window', rows: 2, cols: 4, target: '1/4', tablet: true,
          intro: 'Nowy pokój, nowe okno! Na rozgrzewkę: umyj ćwiartkę okna.',
          hints: [
            { text: 'Podziel osiem szybek na cztery równe części.', show: ['window'] },
            { text: 'Jedna część to dwie szybki.', show: ['pane-0', 'pane-4'] },
            { text: 'Umyj te dwie szybki.', show: ['pane-0', 'pane-4'] },
          ],
        },
        {
          type: 'window', rows: 2, cols: 4, target: '1/8', tablet: true,
          intro: 'A teraz coś nowego! Jak przetniesz ćwiartkę na pół, dostaniesz jedną ósmą. Okno ma osiem równych szybek, więc jedna szybka to 1/8 okna.',
          overText: 'Za dużo! 1/8 to tylko jedna z ośmiu równych części.',
          hints: [
            { text: 'Dolna liczba to 8: okno ma osiem równych części.', show: ['cue', 'window'] },
            { text: 'Górna liczba to 1: umyj jedną część.', show: ['cue'] },
            { text: 'Umyj jedną szybkę, na przykład tę.', show: ['pane-0'] },
          ],
        },
        {
          type: 'window', rows: 2, cols: 4, target: '3/8', tablet: true,
          intro: 'Teraz 3/8 okna. Dolna liczba mówi, na ile części dzielimy okno, a górna — ile umyć.',
          hints: [
            { text: 'Dolna liczba to 8: każda szybka to jedna ósma.', show: ['cue', 'window'] },
            { text: 'Górna liczba to 3: umyj trzy szybki.', show: ['cue'] },
            { text: 'Umyj te trzy szybki.', show: ['pane-0', 'pane-1', 'pane-2'] },
          ],
        },
      ],
    },
    {
      id: '2-2',
      title: 'Ósemki w rurze',
      successText: 'Rura szczelna! Ósemki pasują jak ulał.',
      stars: [star.noFail, star.noHint, star.secondWay('Łata inna niż poprzednio')],
      stages: [
        {
          type: 'pipe', gapStart: '1/2', gap: '1/8', rulerParts: 8, labels: false,
          pieces: ['1/4', '1/8', '1/2'], ...pipeTexts,
          intro: 'Ta miarka dzieli rurę na osiem równych części. Dziura jest malutka — to jedna ósma rury.',
          hints: [
            { text: 'Ile kresek miarki zajmuje dziura?', show: ['gap-span', 'ruler'] },
            { text: 'Dziura to jedna ósma. Szukaj najkrótszego kawałka.', show: ['gap'] },
            { text: 'Ten kawałek pasuje.', show: ['piece-1'] },
          ],
        },
        {
          type: 'pipe', gapStart: '1/8', gap: '3/8', rulerParts: 8, labels: true,
          pieces: ['1/4', '1/2', '1/8', '1/8'], ...pipeTexts,
          intro: 'Kawałki mają podpisy. Dziura to 3/8 rury. Które kawałki razem dadzą trzy ósme?',
          hints: [
            { text: 'Policz na miarce: dziura to trzy ósme części rury.', show: ['gap-span', 'ruler'] },
            { text: 'Ćwiartka to tyle samo co dwie ósme.', show: ['piece-0'] },
            { text: 'Ćwiartka i jedna ósma razem dają trzy ósme.', show: ['piece-0', 'piece-2'] },
          ],
        },
        {
          type: 'pipe', gapStart: '1/8', gap: '5/8', rulerParts: 8, labels: true,
          pieces: ['1/2', '1/8', '1/4', '3/8', '1/8'], ...pipeTexts,
          intro: 'Długa dziura: 5/8 rury. Czytaj podpisy i szukaj łaty!',
          hints: [
            { text: 'Policz na miarce: ile ósmych części zajmuje dziura?', show: ['gap-span', 'ruler'] },
            { text: 'Dziura to 5/8 rury. Które kawałki razem dają pięć ósmych?', show: ['gap-span'] },
            { text: 'Połówka to tyle samo co 4/8. Dodaj jeszcze 1/8.', show: ['piece-0', 'piece-1'] },
          ],
        },
      ],
    },
    {
      id: '2-3',
      title: 'Osiem porcji',
      successText: 'Wszystkie rośliny dostały swoje ósemki!',
      stars: [star.noFail, star.minCuts(5), star.firstAnswer],
      stages: [
        {
          type: 'water', parts: 8, cue: 'icon', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/8', plant: 'cactus', overText: cactusOver },
            { id: 'b', kind: 'bed', need: '3/8', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/2', plant: 'fern' },
          ],
          intro: 'Zbiornik ma osiem równych kawałków. Każdy kawałek to jedna ósma. Obrazki pokazują, ile ósemek chce każda roślina.',
          hints: [
            { text: 'Policz zaznaczone kawałki na każdym obrazku.', show: ['cue'] },
            { text: 'Kaktus chce tylko jedną ósmą.', show: ['cue-a', 'line-1'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-1', 'line-4'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '3/8', plant: 'tomato' },
            { id: 'b', kind: 'bed', need: '1/8', plant: 'sprout' },
            { id: 'barrel', kind: 'barrel' },
          ],
          intro: 'Teraz zamiast obrazków są tabliczki. Ósemka na dole: zbiornik ma osiem kawałków. Resztę wlej do beczki.',
          hints: [
            { text: 'Dolna liczba to 8: zbiornik ma osiem równych kawałków.', show: ['cue', 'line-1', 'line-2', 'line-3', 'line-4', 'line-5', 'line-6', 'line-7'] },
            { text: 'Pomidor chce trzy kawałki, kiełek jeden. Reszta idzie do beczki.', show: ['cue-a', 'cue-b', 'target-barrel'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-3', 'line-4'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '3/8', plant: 'tomato' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody zostało w beczce?',
            options: ['3/8', '1/2', '5/8'],
            wrongText: 'Policz kawałki wody w beczce. Ile ich jest z ośmiu?',
          },
          intro: 'Pomidor chce 3/8 zbiornika. Resztę wlej do beczki.',
          hints: [
            { text: 'Pomidor chce trzy z ośmiu kawałków. Wszystko inne do beczki.', show: ['cue-a', 'target-barrel'] },
            { text: 'Wystarczy przeciąć zbiornik tylko raz.', show: ['line-3', 'line-5'] },
            { text: 'Przetnij tutaj.', show: ['line-3'] },
          ],
        },
      ],
    },
    {
      id: '2-4',
      title: 'Ósemki i ćwiartki',
      successText: 'Ćwiartka to dwie ósme, a połowa to cztery ósme!',
      stars: [star.noFail, star.minCuts(6), star.firstAnswer],
      stages: [
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '1/8', plant: 'cactus' },
            { id: 'c', kind: 'bed', need: '5/8', plant: 'tomato' },
          ],
          intro: 'Uwaga, na tabliczkach są ósme i ćwiartki naraz! Ile kawałków zbiornika to ćwiartka?',
          hints: [
            { text: 'Ćwiartka to połowa połowy: dwa kawałki z ośmiu.', show: ['cue-a', 'line-2'] },
            { text: 'Kaktus chce jeden kawałek, a pomidor pięć.', show: ['cue-b', 'cue-c'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-3'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          failText: 'Tabliczki mówią prawdę, nie wielkość grządki!',
          targets: [
            { id: 'a', kind: 'bed', need: '1/2', plant: 'tomato', width: 120 },
            { id: 'b', kind: 'bed', need: '1/8', plant: 'lettuce', width: 280 },
            { id: 'c', kind: 'bed', need: '3/8', plant: 'fern', width: 140 },
          ],
          intro: 'Haczyk z wielkością grządek wrócił! Czytaj tylko tabliczki.',
          hints: [
            { text: 'Czytaj tabliczki, nie patrz na wielkość grządek.', show: ['cue'] },
            { text: 'Najszersza grządka chce najmniej: tylko 1/8.', show: ['target-b', 'cue-b'] },
            { text: 'Przetnij w połowie, a potem trzy kawałki dalej.', show: ['line-4', 'line-7'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '3/8', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/4', plant: 'sprout' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody trafiło do beczki?',
            options: ['1/4', '3/8', '1/2'],
            wrongText: 'Policz kawałki w beczce. Ile ich jest z ośmiu?',
          },
          intro: 'Podlej grządki, resztę wlej do beczki i powiedz, ile jej tam jest.',
          hints: [
            { text: 'Paprotka chce trzy kawałki, a kiełek ćwiartkę, czyli dwa kawałki.', show: ['cue-a', 'cue-b'] },
            { text: 'Reszta idzie do beczki.', show: ['target-barrel'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-3', 'line-5'] },
          ],
        },
      ],
    },
    {
      id: '2-5',
      title: 'Trzy szybki',
      successText: 'Trzy równe części: każda to jedna trzecia!',
      stars: [star.noFail, star.noHint, star.secondWay('Okno umyte inaczej niż poprzednio')],
      stages: [
        {
          type: 'window', rows: 1, cols: 3, target: '1/3', tablet: true,
          intro: 'To okno ma trzy równe szybki. Każda to jedna trzecia okna: 1/3. Umyj jedną trzecią.',
          overText: 'Za dużo! 1/3 to tylko jedna z trzech równych części.',
          hints: [
            { text: 'Dolna liczba to 3: okno ma trzy równe części.', show: ['cue', 'window'] },
            { text: 'Górna liczba to 1: umyj jedną część.', show: ['cue'] },
            { text: 'Umyj tę szybkę.', show: ['pane-0'] },
          ],
        },
        {
          type: 'window', rows: 1, cols: 3, target: '2/3', tablet: true,
          intro: 'A teraz dwie trzecie okna.',
          hints: [
            { text: 'Dolna liczba to 3: okno ma trzy równe części.', show: ['cue', 'window'] },
            { text: 'Górna liczba to 2: umyj dwie części.', show: ['cue'] },
            { text: 'Umyj te dwie szybki.', show: ['pane-0', 'pane-1'] },
          ],
        },
        {
          type: 'window', rows: 2, cols: 3, target: '2/3', tablet: true,
          intro: 'Znowu 2/3, ale to okno ma sześć szybek. Podziel je najpierw na trzy równe części.',
          shortText: 'Za mało! Podziel okno na trzy równe części i umyj dwie z nich.',
          overText: 'Za dużo! Jedna z trzech równych części ma zostać brudna.',
          hints: [
            { text: 'Podziel sześć szybek na trzy równe części. Ile szybek ma każda?', show: ['cue', 'window'] },
            { text: 'Jedna część to jedna kolumna: dwie szybki.', show: ['pane-0', 'pane-3'] },
            { text: 'Umyj te dwie kolumny.', show: ['pane-0', 'pane-1', 'pane-3', 'pane-4'] },
          ],
        },
      ],
    },
    {
      id: '2-6',
      title: 'Zbiornik na trzy',
      successText: 'Trzy trzecie to cały zbiornik!',
      stars: [star.noFail, star.minCuts(5), star.noHint],
      stages: [
        {
          type: 'water', parts: 3, cue: 'size', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/3', plant: 'sprout' },
            { id: 'b', kind: 'bed', need: '1/3', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/3', plant: 'tomato' },
          ],
          intro: 'Ten zbiornik ma trzy równe części. Trzy takie same grządki — daj każdej po równo.',
          hints: [
            { text: 'Ile grządek, tyle porcji.', show: ['target-a', 'target-b', 'target-c'] },
            { text: 'Każda grządka chce jedną z trzech części.', show: ['line-1'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-1', 'line-2'] },
          ],
        },
        {
          type: 'water', parts: 3, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '2/3', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/3', plant: 'cactus' },
          ],
          intro: 'Tabliczki z trójką na dole. Ile części zbiornika dla każdej grządki?',
          hints: [
            { text: 'Dolna liczba to 3: zbiornik ma trzy równe części.', show: ['cue', 'line-1', 'line-2'] },
            { text: 'Paprotka chce dwie części, a kaktus jedną.', show: ['cue-a', 'cue-b'] },
            { text: 'Przetnij tutaj.', show: ['line-2'] },
          ],
        },
        {
          type: 'water', parts: 6, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/3', plant: 'fern' },
            { id: 'b', kind: 'bed', need: '1/3', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/3', plant: 'tomato' },
          ],
          intro: 'Znowu trzy trzecie, ale zbiornik ma sześć kawałków. Ile kawałków to jedna trzecia?',
          hints: [
            { text: 'Dolna liczba to 3: dzielimy zbiornik na trzy równe części.', show: ['cue'] },
            { text: 'Jedna trzecia to dwa kawałki zbiornika.', show: ['line-2'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-4'] },
          ],
        },
      ],
    },
    {
      id: '2-7',
      title: 'Szóste części',
      successText: 'Połowa trzeciej części to jedna szósta!',
      stars: [star.noFail, star.minCuts(4), star.firstAnswer],
      stages: [
        {
          type: 'window', rows: 2, cols: 3, target: '1/6', tablet: true,
          intro: 'Jak przetniesz jedną trzecią na pół, dostaniesz jedną szóstą. Okno ma sześć równych szybek. Umyj 1/6 okna.',
          overText: 'Za dużo! 1/6 to tylko jedna z sześciu równych części.',
          hints: [
            { text: 'Dolna liczba to 6: okno ma sześć równych części.', show: ['cue', 'window'] },
            { text: 'Górna liczba to 1: umyj jedną część.', show: ['cue'] },
            { text: 'Umyj tę szybkę.', show: ['pane-0'] },
          ],
        },
        {
          type: 'water', parts: 6, cue: 'icon', notation: 'after',
          targets: [
            { id: 'a', kind: 'bed', need: '1/6', plant: 'cactus', overText: cactusOver },
            { id: 'b', kind: 'bed', need: '1/3', plant: 'lettuce' },
            { id: 'c', kind: 'bed', need: '1/2', plant: 'fern' },
          ],
          question: {
            about: 'b',
            text: 'Jaką część zbiornika dostała sałata?',
            options: ['1/6', '1/3', '1/2'],
            wrongText: 'Ile porcji takich jak sałaty zmieści się w całym zbiorniku?',
          },
          intro: 'Sześć kawałków na obrazkach. Podlej rośliny, a potem odpowiedz na pytanie.',
          hints: [
            { text: 'Policz zaznaczone kawałki na każdym obrazku.', show: ['cue'] },
            { text: 'Sałata chce dwa kawałki z sześciu.', show: ['cue-b', 'line-2'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-1', 'line-3'] },
          ],
        },
        {
          type: 'water', parts: 6, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/3', plant: 'lettuce' },
            { id: 'b', kind: 'bed', need: '1/6', plant: 'cactus' },
            { id: 'barrel', kind: 'barrel' },
          ],
          question: {
            text: 'Ile wody trafiło do beczki?',
            options: ['1/3', '1/2', '2/3'],
            wrongText: 'Porównaj wodę z beczki ze zbiornikiem. Jaka to część całości?',
          },
          intro: 'Uwaga, różne liczby na dole tabliczek! Zbiornik ma sześć kawałków. Resztę wlej do beczki.',
          hints: [
            { text: '1/3 to jedna z trzech równych części. W tym zbiorniku to dwa kawałki.', show: ['cue-a', 'line-2'] },
            { text: '1/6 to jeden kawałek z sześciu.', show: ['cue-b', 'line-1'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-2', 'line-3'] },
          ],
        },
      ],
    },
    {
      id: '2-8',
      title: 'Warzywny finał',
      successText: 'Grządki warzywne odżyły! Ósme, trzecie i szóste nie mają przed tobą tajemnic.',
      stars: [star.noFail, { check: 'pieces', arg: 2, label: 'Łata z dwóch kawałków' }, star.noHint],
      stages: [
        {
          type: 'pipe', gapStart: '1/8', gap: '3/4', rulerParts: 8, labels: true,
          pieces: ['3/8', '1/8', '1/2', '1/4', '3/8'], ...pipeTexts,
          intro: 'Wielki finał w trzech etapach. Etap 1: rura z dziurą 3/4. Miarka ma osiem części.',
          hints: [
            { text: 'Ile ósmych części miarki zajmuje dziura?', show: ['gap-span', 'ruler'] },
            { text: 'Trzy ćwiartki to tyle samo co sześć ósmych.', show: ['gap-span'] },
            { text: 'Dwa kawałki po 3/8 razem dają 6/8.', show: ['piece-0', 'piece-4'] },
          ],
        },
        {
          type: 'water', parts: 6, cue: 'label', notation: 'before',
          failText: 'Tabliczki mówią prawdę, nie wielkość grządki!',
          targets: [
            { id: 'a', kind: 'bed', need: '1/6', plant: 'tomato', width: 260 },
            { id: 'b', kind: 'bed', need: '1/2', plant: 'lettuce', width: 110 },
            { id: 'c', kind: 'bed', need: '1/3', plant: 'fern', width: 160 },
          ],
          intro: 'Etap 2: szóste, trzecie i połowa naraz. I uwaga na wielkość grządek!',
          hints: [
            { text: 'Czytaj tabliczki, nie patrz na wielkość grządek.', show: ['cue'] },
            { text: 'Połowa to trzy kawałki, jedna trzecia to dwa, a jedna szósta to jeden.', show: ['cue-a', 'cue-b', 'cue-c'] },
            { text: 'Przetnij tutaj i tutaj.', show: ['line-1', 'line-4'] },
          ],
        },
        {
          type: 'water', parts: 8, cue: 'label', notation: 'before',
          targets: [
            { id: 'a', kind: 'bed', need: '1/8', plant: 'cactus' },
            { id: 'b', kind: 'bed', need: '3/8', plant: 'tomato' },
            { id: 'c', kind: 'bed', need: '1/4', plant: 'lettuce' },
            { id: 'd', kind: 'bed', need: '1/4', plant: 'fern' },
          ],
          intro: 'Etap 3: cztery grządki i ósemki z ćwiartkami. Ostatni wysiłek!',
          hints: [
            { text: 'Ćwiartka to dwa kawałki z ośmiu.', show: ['cue-c', 'cue-d'] },
            { text: 'Kaktus chce jeden kawałek, a pomidor trzy.', show: ['cue-a', 'cue-b'] },
            { text: 'Przetnij tutaj, tutaj i tutaj.', show: ['line-1', 'line-4', 'line-6'] },
          ],
        },
      ],
    },
  ];

  return {
    chapters: [
      { id: 'rozsadnik', name: 'Rozsadnik', levels: rozsadnik },
      { id: 'warzywa', name: 'Grządki warzywne', levels: warzywa },
    ],
    rooms: [
      { id: 'rozsadnik', name: 'Rozsadnik', chapter: 'rozsadnik' },
      { id: 'warzywa', name: 'Grządki warzywne', chapter: 'warzywa' },
      { id: 'pomidory', name: 'Pomidorownia' },
      { id: 'palmiarnia', name: 'Palmiarnia' },
      { id: 'nasiona', name: 'Magazyn nasion' },
      { id: 'kopula', name: 'Wielka kopuła' },
    ],
  };
});
