/*
 * Definicje pomieszczeń i poziomów. Tylko dane: bez logiki i bez rysowania.
 * Opis projektowy poziomów: design/rozdzial-1.md.
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
    minCuts: (n, label) => ({ check: 'minCuts', arg: n, label }),
    secondWay: (label) => ({ check: 'secondWay', label }),
  };

  const rozsadnik = [
    {
      id: '1-1',
      title: 'Brudne okno',
      successText: 'Słońce wpada przez czyste szyby. Połowa okna lśni!',
      stars: [
        star.noFail,
        star.secondWay('Połowa umyta inaczej niż poprzednio'),
        { check: 'diagonal', label: 'Połowa po skosie' },
      ],
      stages: [{
        type: 'window', rows: 2, cols: 2, target: '1/2',
        intro: 'Ale tu ciemno! Umyj połowę okna, żeby wpuścić trochę słońca. Dotknij szybki, żeby ją umyć, a potem naciśnij „Gotowe”.',
        shortText: 'Połowa to dwie równe części. Czy czystych i brudnych szybek jest tyle samo?',
        overText: 'Czystych szybek jest więcej niż brudnych. Połowa to dwie równe części — ma ich być tyle samo.',
        hints: [
          { text: 'Policz wszystkie szybki w oknie.', show: ['window'] },
          { text: 'Podzielmy okno na dwie równe części.', show: ['half-line'] },
          { text: 'Umyj te dwie szybki.', show: ['pane-0', 'pane-2'] },
        ],
      }],
    },
    {
      id: '1-2',
      title: 'Cieknąca rura',
      successText: 'Rura cała! Woda płynie do zbiornika.',
      stars: [star.noFail, star.secondWay('Łata inna niż poprzednio'), star.noHint],
      stages: [{
        type: 'pipe', gapStart: '1/4', gap: '1/2', rulerParts: 4, labels: false,
        pieces: ['1/2', '1/4', '3/4', '1/4'],
        intro: 'Rura do zbiornika cieknie! Załataj dziurę kawałkami ze skrzynki. Miarka nad rurą pokazuje całą rurę.',
        tooLongText: 'Ten kawałek jest za długi — nie mieści się w dziurze.',
        shortText: 'Woda ucieka przez szparę! Brakuje jeszcze kawałka.',
        hints: [
          { text: 'Porównaj kawałki ze skrzynki z dziurą w rurze.', show: ['gap'] },
          { text: 'Spójrz na miarkę: jaką część całej rury zajmuje dziura?', show: ['gap-span', 'ruler'] },
          { text: 'Ten kawałek pasuje idealnie.', show: ['piece-0'] },
        ],
      }],
    },
    {
      id: '1-3',
      title: 'Dwie równe grządki',
      successText: 'Każda grządka dostała połowę zbiornika. Po równo!',
      stars: [star.noFail, star.minCuts(1, 'Jedno cięcie'), { check: 'gesture', label: 'Cięcie palcem' }],
      stages: [{
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
      }],
    },
    {
      id: '1-4',
      title: 'Duża i mała',
      successText: 'Trzy ćwiartki i jedna ćwiartka to cały zbiornik!',
      stars: [star.noFail, star.minCuts(1, 'Jedno cięcie'), star.secondWay('Cięcie z drugiej strony zbiornika')],
      stages: [{
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
      }],
    },
    {
      id: '1-5',
      title: 'Pierwsze podlewanie',
      successText: 'Połowę przecięliśmy na pół, więc każda część to ćwiartka całego zbiornika.',
      stars: [star.noFail, star.minCuts(2, 'Tylko dwa cięcia'), star.noHint],
      stages: [{
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
      }],
    },
    {
      id: '1-6',
      title: 'Różne pragnienie',
      successText: 'Każda roślina dostała tyle, ile lubi.',
      stars: [star.noFail, star.minCuts(2, 'Tylko dwa cięcia'), { check: 'noReassign', label: 'Bez zmieniania zaworów' }],
      stages: [{
        type: 'water', parts: 4, cue: 'icon', notation: 'after',
        targets: [
          { id: 'a', kind: 'bed', need: '1/4', plant: 'lettuce' },
          { id: 'b', kind: 'bed', need: '1/2', plant: 'fern' },
          { id: 'c', kind: 'bed', need: '1/4', plant: 'cactus', overText: 'Kaktus nie lubi mokrych stóp! Dostał za dużo wody.' },
        ],
        intro: 'Te grządki są takie same, ale rośliny piją różnie. Obrazki nad grządkami pokazują, ile wody potrzebuje każda.',
        hints: [
          { text: 'Patrz na obrazki zbiorników, nie na grządki.', show: ['cue'] },
          { text: 'Porównaj obrazek z prawdziwym zbiornikiem. Ile części jest zaznaczonych?', show: ['cue-b', 'line-1', 'line-2', 'line-3'] },
          { text: 'Przetnij na pół, a potem jedną połówkę jeszcze raz. Połówka idzie do paprotki.', show: ['line-2', 'target-b'] },
        ],
      }],
    },
    {
      id: '1-7',
      title: 'Tabliczki',
      successText: 'Dwie ćwiartki dla grządek i połowa w beczce. Razem cały zbiornik!',
      stars: [star.noFail, star.minCuts(2, 'Tylko dwa cięcia'), star.noHint],
      stages: [{
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
      }],
    },
    {
      id: '1-8',
      title: 'Beczka na zapas',
      successText: 'Grządka dostała 1/4, a w beczce zostały 3/4. Razem cały zbiornik!',
      stars: [star.noFail, star.minCuts(1, 'Jedno cięcie'), { check: 'firstAnswer', label: 'Dobra odpowiedź za pierwszym razem' }],
      stages: [{
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
      }],
    },
    {
      id: '1-9',
      title: 'Cztery sadzonki',
      successText: 'Cztery ćwiartki to cały zbiornik!',
      stars: [star.noFail, star.minCuts(3, 'Tylko trzy cięcia'), { check: 'firstCut', arg: 2, label: 'Pierwsze cięcie w połowie' }],
      stages: [{
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
      }],
    },
    {
      id: '1-10',
      title: 'Wielka grządka Rozsadnika',
      successText: 'Rozsadnik odżył! Wszystkie rośliny rosną.',
      stars: [star.noFail, { check: 'pieces', arg: 2, label: 'Łata z dwóch kawałków' }, star.secondWay('Łata inna niż poprzednio')],
      stages: [
        {
          type: 'pipe', gapStart: '1/4', gap: '3/4', rulerParts: 4, labels: true,
          pieces: ['1/2', '1/4', '1/4', '1/4'],
          intro: 'Wielki finał w dwóch etapach. Etap 1: naprawa. Rura do grządek ma długą dziurę. Tym razem kawałki mają podpisy.',
          tooLongText: 'Ten kawałek jest za długi — nie mieści się w dziurze.',
          shortText: 'Woda ucieka przez szparę! Brakuje jeszcze kawałka.',
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
      ],
    },
  ];

  return {
    chapters: [{ id: 'rozsadnik', name: 'Rozsadnik', levels: rozsadnik }],
    rooms: [
      { id: 'rozsadnik', name: 'Rozsadnik', chapter: 'rozsadnik' },
      { id: 'warzywa', name: 'Grządki warzywne' },
      { id: 'pomidory', name: 'Pomidorownia' },
      { id: 'palmiarnia', name: 'Palmiarnia' },
      { id: 'nasiona', name: 'Magazyn nasion' },
      { id: 'kopula', name: 'Wielka kopuła' },
    ],
  };
});
