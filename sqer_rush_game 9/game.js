(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const W = canvas.width;
  const H = canvas.height;
  canvas.setAttribute('tabindex', '0');
  setTimeout(() => canvas.focus(), 50);

  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
      if (w < 2 * r) r = w / 2;
      if (h < 2 * r) r = h / 2;
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
      return this;
    };
  }

  const FOOD = [
    ['burger', 'Бургер'], ['pizza', 'Пицца'], ['steak', 'Стейк'], ['sushi', 'Роллы'],
    ['salad', 'Салат'], ['soup', 'Суп'], ['pasta', 'Паста'], ['ribs', 'Рёбра'],
    ['cake', 'Десерт'], ['cocktail', 'Коктейль'], ['coffee', 'Кофе'], ['fries', 'Фри'],
    ['taco', 'Тако'], ['ramen', 'Рамен'], ['lemonade', 'Лимонад'], ['fish', 'Рыба'],
  ].map(([id, name]) => ({ id, name, src: `assets/food/${id}.png` }));
  const FOOD_BY_ID = Object.fromEntries(FOOD.map(f => [f.id, f]));
  const HALL_MENU = ['burger', 'pizza', 'steak', 'sushi', 'salad', 'soup', 'pasta', 'ribs', 'cake', 'fries', 'taco', 'ramen', 'fish'];
  const BAR_MENU = ['cocktail', 'coffee', 'lemonade', 'cake', 'fries'];

  const TABLES = [
    { id: 1, name: '01', x: 712, y: 405, r: 116 },
    { id: 2, name: '02', x: 970, y: 405, r: 116 },
    { id: 3, name: '03', x: 705, y: 575, r: 116 },
    { id: 4, name: '04', x: 972, y: 575, r: 116 },
    { id: 5, name: '05', x: 735, y: 740, r: 132 },
    { id: 6, name: '06', x: 982, y: 740, r: 132 },
    { id: 7, name: '07', x: 1255, y: 555, r: 132 },
    { id: 8, name: '08', x: 1255, y: 715, r: 136 },
  ];

  const BAR_GUESTS = [
    { id: 101, name: 'B1', x: 162, y: 756, r: 165, sprite: 'phone_customer', drawX: 162, drawY: 862, h: 112 },
    { id: 102, name: 'B2', x: 274, y: 756, r: 165, sprite: 'impatient_customer', drawX: 274, drawY: 862, h: 112 },
    { id: 103, name: 'B3', x: 392, y: 756, r: 165, sprite: 'elder_customer', drawX: 392, drawY: 862, h: 116 },
    { id: 104, name: 'B4', x: 493, y: 444, r: 145, sprite: 'seated_man', drawX: 550, drawY: 470, h: 104 },
    { id: 105, name: 'B5', x: 493, y: 602, r: 145, sprite: 'phone_customer', drawX: 550, drawY: 628, h: 104 },
  ];

  const PASS_INTERACT_ZONE = { x: 525, y: 300, w: 670, h: 112 };
  const BAR_PREP_ZONE = { x: 105, y: 505, w: 350, h: 164 };
  const WORLD_BOUNDS = { x: 70, y: 70, w: 1305, h: 925 };
  const BAR_WORK_BOUNDS = { x: 95, y: 255, w: 365, h: 430 };
  const OBSTACLES = [
    { x: 72, y: 80, w: 420, h: 610 },
    { x: 618, y: 105, w: 500, h: 190 },
    { x: 1148, y: 420, w: 260, h: 438 },
    { x: 792, y: 475, w: 70, h: 185 },
  ];

  const BASE_FRAME_PATHS = {
    idle_down: 'idle_down.png', idle_up: 'idle_up.png', idle_left: 'idle_left.png', idle_right: 'idle_right.png',
    walk_down_0: 'walk_down_0.png', walk_down_1: 'walk_down_1.png', walk_down_2: 'walk_down_2.png',
    walk_up_0: 'walk_up_0.png', walk_up_1: 'walk_up_1.png', walk_up_2: 'walk_up_2.png',
    walk_left_0: 'walk_left_0.png', walk_left_1: 'walk_left_1.png', walk_left_2: 'walk_left_2.png',
    walk_right_0: 'walk_right_0.png', walk_right_1: 'walk_right_1.png', walk_right_2: 'walk_right_2.png',
    carry_down: 'carry_down.png', carry_up: 'carry_up.png', carry_left: 'carry_left.png', carry_right: 'carry_right.png',
  };

  const CUSTOMER_PATHS = {
    seated_man: 'assets/sprites/customers/seated_man.png',
    impatient_customer: 'assets/sprites/customers/impatient_customer.png',
    phone_customer: 'assets/sprites/customers/phone_customer.png',
    elder_customer: 'assets/sprites/customers/elder_customer.png',
  };

  const NPC_PATHS = {
    lyuba: 'assets/sprites/npcs/lyuba.png',
    mikhail: 'assets/sprites/npcs/mikhail.png',
    runner: 'assets/sprites/npcs/runner.png',
  };

  const HALL_CUSTOMER_PLACEMENTS = {
    1: [{ sprite: 'seated_man', x: 617, y: 455, h: 106 }],
    2: [{ sprite: 'phone_customer', x: 1075, y: 455, h: 104 }],
    3: [{ sprite: 'impatient_customer', x: 612, y: 628, h: 104 }],
    4: [{ sprite: 'seated_man', x: 1072, y: 628, h: 104 }],
    5: [{ sprite: 'phone_customer', x: 620, y: 815, h: 108 }],
    6: [{ sprite: 'elder_customer', x: 1088, y: 815, h: 110 }],
    7: [{ sprite: 'phone_customer', x: 1194, y: 568, h: 102 }],
    8: [{ sprite: 'impatient_customer', x: 1192, y: 748, h: 104 }],
  };

  const CAST = [
    { id: 'waitress', title: 'Официант', desc: 'Главный герой первой смены. Носит блюда и держится молодцом.' },
    { id: 'bartender', title: 'Бармен', desc: 'Закрывает заказы у стойки. Работает быстро, думает редко.' },
    { id: 'lyuba', title: 'Люба · Администратор', desc: 'Вернулась из отпуска и снова громче всех в зале.' },
    { id: 'mikhail', title: 'Михаил · Менеджер', desc: 'Сидит с ноутбуком, иногда обходит зал и злостно анализирует.' },
    { id: 'runner', title: 'Раннер', desc: '2 раза за вторую смену закрывает самый горящий стол.' },
  ];

  const CUTSCENES = {
    day1Intro: [
      { who: 'SQER', text: 'Первая смена. Спокойное начало. Пока что.' },
      { who: 'Шеф', text: 'Сначала освоишь зал и бар. Неси заказы, не паникуй раньше времени.' },
      { who: 'SQER', text: 'Раздача пустая в начале. Кухня готовит постепенно — как в реальном ресторане.' },
    ],
    day2Intro: [
      { who: 'SQER', text: 'Вторая смена. Из отпуска возвращаются Люба и Михаил.' },
      { who: 'Люба', text: 'Так. Кто тут работал, пока меня не было? Не отвечайте, я и так всё вижу.' },
      { who: 'Михаил', text: 'Я просто посижу с ноутбуком. Спокойно. Пока что.' },
      { who: 'SQER', text: 'Со второй смены доступен раннер: нажми R, чтобы срочно закрыть самый горящий стол.' },
    ],
    banquetIntro: [
      { who: 'SQER', text: 'Финал. Большой банкет. Тут проверяется уже не беготня, а сервис.' },
      { who: 'Люба', text: 'Сначала грамотно поговори с гостями. Потом уже носись с подносом.' },
      { who: 'Михаил', text: 'Оценю ответы, скорость и маршрут. Да, у меня для этого даже таблица есть.' },
    ],
  };

  const BANQUET_QUIZ = [
    {
      q: 'Гость спрашивает: «Что посоветуете на компанию из 8 человек?»',
      options: [
        'Ну, меню большое, выбирайте сами.',
        'Могу предложить закуски на центр стола, горячее порционно и напитки под формат вечера.',
        'Я позже подойду, сейчас некогда.'
      ],
      correct: 1,
    },
    {
      q: 'Гость уточняет: «А если среди нас есть те, кто не ест острое?»',
      options: [
        'Тогда берите всё неострое, я не знаю.',
        'Можем разделить блюда и подать острые позиции отдельно, а мягкие варианты — отдельно.',
        'Ну это уже на кухне как получится.'
      ],
      correct: 1,
    },
    {
      q: 'Гость спрашивает про напитки к горячему.',
      options: [
        'Могу предложить лимонады и коктейли на старт, а к горячему — воду, чай или кофе в финале.',
        'Берите колу.',
        'Напитки вообще неважны, главное еда.'
      ],
      correct: 0,
    },
    {
      q: 'Гость задаёт вопрос: «Когда лучше подать десерт?»',
      options: [
        'Сразу принесём всё вместе, так удобнее.',
        'После горячего и небольшой паузы, чтобы сохранить ритм банкета и впечатление от подачи.',
        'Как кухня успеет, так и вынесем.'
      ],
      correct: 1,
    },
  ];

  const BANQUET_WAVES = [
    {
      name: 'Волна 1 · Напитки',
      orders: [
        { targetId: 1, items: ['lemonade', 'lemonade'], patience: 80 },
        { targetId: 2, items: ['cocktail', 'coffee'], patience: 80 },
        { targetId: 3, items: ['lemonade', 'coffee'], patience: 80 },
      ],
    },
    {
      name: 'Волна 2 · Закуски',
      orders: [
        { targetId: 1, items: ['salad', 'sushi'], patience: 82 },
        { targetId: 2, items: ['salad', 'fish'], patience: 82 },
        { targetId: 3, items: ['fries', 'sushi'], patience: 82 },
      ],
    },
    {
      name: 'Волна 3 · Горячее',
      orders: [
        { targetId: 4, items: ['steak', 'pasta'], patience: 75 },
        { targetId: 5, items: ['fish', 'pasta'], patience: 75 },
        { targetId: 6, items: ['ribs', 'steak'], patience: 75 },
      ],
    },
    {
      name: 'Волна 4 · Десерт',
      orders: [
        { targetId: 4, items: ['cake'], patience: 70 },
        { targetId: 5, items: ['cake'], patience: 70 },
        { targetId: 6, items: ['cake', 'coffee'], patience: 70 },
      ],
    },
  ];

  const LEVELS = [
    { shift: 1, name: 'Первый столик', phase: 'hall', time: 75, targetIds: [1], fixedOrders: [{ targetId: 1, items: ['burger'], patience: 58 }], cook: { min: 2, max: 3 }, description: 'Обучение: один стол, одно блюдо.', preScene: CUTSCENES.day1Intro },
    { shift: 1, name: 'Два стола', phase: 'hall', time: 100, targetIds: [1, 2], counts: [1, 1], menu: ['burger', 'pizza', 'salad', 'soup'], patience: 70, cook: { min: 2.5, max: 7, targetStep: 2 }, description: 'Блюда появляются не сразу.' },
    { shift: 1, name: 'Полный поднос', phase: 'hall', time: 130, targetIds: [1, 2, 3], counts: [2, 2, 2], menu: ['burger', 'pizza', 'salad', 'soup', 'pasta', 'fries'], patience: 90, cook: { min: 2, max: 7, itemStep: 2.2, targetStep: 1.2 }, description: 'Поднос на 4 слота. 3 блюда — медленнее. 4 — прям телега.' },
    { shift: 1, name: 'Торопливый гость', phase: 'hall', time: 95, fixedOrders: [
      { targetId: 1, items: ['burger', 'salad', 'coffee'], patience: 18, guestType: 'rush', cookTimes: [2, 3.2, 4.4] },
      { targetId: 2, items: ['pizza'], patience: 62 },
      { targetId: 3, items: ['soup'], patience: 62 },
    ], menu: ['burger', 'salad', 'coffee', 'pizza', 'soup'], description: 'Стол 01 очень торопится.' },
    { shift: 1, name: 'Кухня живёт своей жизнью', phase: 'hall', time: 160, targetIds: [1, 2, 3, 4], counts: [2, 2, 3, 2], menu: ['steak', 'sushi', 'salad', 'soup', 'pasta', 'ribs', 'cake', 'fish'], patience: 105, cook: { min: 2.5, max: 11, itemStep: 2.8, targetStep: 1.4 }, description: 'Раздача выдаёт блюда волнами.' },
    { shift: 1, name: 'Пятница: зал', phase: 'hall', time: 205, targetIds: [1, 2, 3, 4, 5, 6], counts: [2, 2, 2, 3, 3, 2], menu: HALL_MENU, patience: 120, rushTargets: [3, 5], rushPatience: 42, cook: { min: 2, max: 12, itemStep: 2.1, targetStep: 1.1, rushMin: 2, rushMax: 5 }, description: 'Зал уже шумит. Нормально, живём.' },
    { shift: 1, name: 'Бар: первые напитки', phase: 'bar', time: 85, targetIds: [101, 102, 103], counts: [1, 1, 1], menu: ['cocktail', 'coffee', 'lemonade'], patience: 52, cook: { min: 1.5, max: 4, itemStep: 0.8 }, description: 'Переходим за бар.' },
    { shift: 1, name: 'Бар: очередь растёт', phase: 'bar', time: 120, targetIds: [101, 102, 103, 104], counts: [1, 2, 1, 2], menu: BAR_MENU, patience: 70, rushTargets: [102], rushPatience: 24, cook: { min: 1.2, max: 5.5, itemStep: 1.2 }, description: 'Один гость уже хочет писать отзыв.' },
    { shift: 1, name: 'Бар: вечерний замес', phase: 'bar', time: 155, targetIds: [101, 102, 103, 104, 105], counts: [2, 2, 2, 2, 3], menu: BAR_MENU, patience: 82, rushTargets: [102, 105], rushPatience: 36, cook: { min: 1.1, max: 6.8, itemStep: 1.4 }, description: 'Финал первой смены.' },

    { shift: 2, name: 'Они вернулись', phase: 'hall', time: 115, targetIds: [1, 2, 3], counts: [2, 1, 2], menu: ['burger', 'pizza', 'salad', 'soup', 'coffee'], patience: 84, cook: { min: 2, max: 8, itemStep: 1.5, targetStep: 1 }, description: 'Люба и Михаил снова в зале.', preScene: CUTSCENES.day2Intro },
    { shift: 2, name: 'Обеденный пик', phase: 'hall', time: 155, targetIds: [1, 2, 3, 4], counts: [2, 2, 2, 2], menu: ['burger', 'pizza', 'salad', 'soup', 'pasta', 'fish', 'coffee'], patience: 95, cook: { min: 2, max: 9, itemStep: 1.8, targetStep: 1.1 }, description: 'Обед пошёл всерьёз.' },
    { shift: 2, name: 'VIP у окна', phase: 'hall', time: 180, fixedOrders: [
      { targetId: 7, items: ['steak', 'fish', 'coffee'], patience: 80, guestType: 'vip', cookTimes: [3, 5, 2.5] },
      { targetId: 1, items: ['salad', 'soup'], patience: 96 },
      { targetId: 4, items: ['pasta', 'cake'], patience: 96 },
      { targetId: 6, items: ['ribs', 'salad'], patience: 96 },
    ], menu: HALL_MENU, description: 'VIP-гость у окна любит, когда всё красиво.' },
    { shift: 2, name: 'Бар: вторая волна', phase: 'bar', time: 125, targetIds: [101, 102, 103, 104], counts: [2, 2, 1, 2], menu: BAR_MENU, patience: 72, rushTargets: [102], rushPatience: 26, cook: { min: 1.2, max: 5.8, itemStep: 1 }, description: 'У бара снова жарко.' },
    { shift: 2, name: 'Бар: сложные напитки', phase: 'bar', time: 150, targetIds: [101, 102, 103, 104, 105], counts: [2, 2, 2, 2, 2], menu: BAR_MENU, patience: 80, rushTargets: [101, 105], rushPatience: 34, cook: { min: 1.1, max: 6.6, itemStep: 1.2 }, description: 'Напитков больше, гости терпеливее не стали.' },
    { shift: 2, name: 'Проверка Михаила', phase: 'hall', time: 190, targetIds: [2, 3, 4, 5, 6, 7], counts: [2, 2, 2, 2, 2, 3], menu: HALL_MENU, patience: 108, rushTargets: [3, 7], rushPatience: 40, cook: { min: 2, max: 10.5, itemStep: 1.7, targetStep: 1.2 }, description: 'Менеджер встал из-за ноутбука. Обычно это плохой знак.' },
    { shift: 2, name: 'Смешанная смена', phase: 'hall', time: 210, targetIds: [1, 2, 3, 4, 5, 6, 8], counts: [2, 2, 2, 3, 2, 2, 3], menu: HALL_MENU, patience: 115, rushTargets: [2, 5, 8], rushPatience: 42, cook: { min: 1.8, max: 11.5, itemStep: 1.8, targetStep: 1.05 }, description: 'Зал шумит, начальство комментирует.' },
    { shift: 2, name: 'Банкет', phase: 'hall', time: 290, isBanquet: true, hasQuiz: true, preScene: CUTSCENES.banquetIntro, description: 'Финальный уровень: сервис, волны подачи и итоговая оценка.' },
  ];

  const SAVE_KEY = 'sqer_rush_v1_progress';

  const images = {};
  const keys = new Set();
  let audioCtx = null;

  const state = {
    mode: 'loading',
    phase: 'hall',
    selectedShift: 1,
    selectedMenuLevel: 0,
    levelIndex: 0,
    level: null,
    player: { x: 725, y: 930, dir: 'up', speed: 245, moving: false, stepTime: 0 },
    inventory: [],
    maxTray: 4,
    selectedSource: 0,
    orders: [],
    timeLeft: 0,
    levelTime: 0,
    score: 0,
    combo: 0,
    mistakes: 0,
    delivered: 0,
    levelMistakes: 0,
    levelDelivered: 0,
    levelElapsed: 0,
    completedStars: Array(LEVELS.length).fill(0),
    lastResult: null,
    failReason: '',
    message: '',
    messageTime: 0,
    readyFlash: 0,
    castShift: 1,
    cutscene: null,
    pendingLevelIndex: null,
    quiz: null,
    quizScore: 0,
    banquetDialogScore: 0,
    banquetWave: 0,
    routeDistance: 0,
    runnerUses: 0,
    runnerEffect: null,
    bark: null,
    npcs: null,
    muted: false,
    paused: false,
    progressLoaded: false,
  };

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  async function loadAssets() {
    images.map = await loadImage('assets/map.png');
    for (const f of FOOD) images[f.id] = await loadImage(f.src);
    for (const [key, file] of Object.entries(BASE_FRAME_PATHS)) {
      images[`waitress_${key}`] = await loadImage(`assets/sprites/waitress/${file}`);
      images[`bartender_${key}`] = await loadImage(`assets/sprites/bartender/${file}`);
    }
    for (const [k, path] of Object.entries(CUSTOMER_PATHS)) images[k] = await loadImage(path);
    for (const [k, path] of Object.entries(NPC_PATHS)) images[k] = await loadImage(path);
    loadProgress();
    state.mode = 'shiftSelect';
    requestAnimationFrame(loop);
  }

  const rndInt = (n) => Math.floor(Math.random() * n);
  const randomRange = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const dist = (a, b, c, d) => Math.hypot(a - c, b - d);
  const pick = (arr) => arr[rndInt(arr.length)];
  function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = rndInt(i + 1); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
  const foodName = (id) => FOOD_BY_ID[id]?.name || id;
  const targetKindName = () => state.phase === 'hall' ? 'Стол' : 'Бар';
  const phaseName = () => state.phase === 'hall' ? 'зал' : 'бар';
  const roleName = () => state.phase === 'hall' ? 'официант' : 'бармен';
  const sourceName = () => state.phase === 'hall' ? 'раздаче' : 'барной станции';
  const currentTargets = () => state.phase === 'hall' ? TABLES : BAR_GUESTS;
  const currentSourceZone = () => state.phase === 'hall' ? PASS_INTERACT_ZONE : BAR_PREP_ZONE;
  const shiftBounds = (shift) => shift === 1 ? { start: 0, end: 8 } : { start: 9, end: LEVELS.length - 1 };

  function playTone(freq = 440, dur = 0.07, type = 'square', gain = 0.05) {
    if (state.muted || !audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain; o.connect(g); g.connect(audioCtx.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur); o.stop(audioCtx.currentTime + dur + 0.02);
  }
  function startAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); }
  function message(text, seconds = 1.15) { state.message = text; state.messageTime = seconds; }

  function resetStats() {
    state.score = 0; state.combo = 0; state.mistakes = 0; state.delivered = 0;
  }

  function beginShift(shift, levelIndex = null) {
    state.selectedShift = shift;
    state.runnerUses = shift === 2 ? 2 : 0;
    resetStats();
    startLevel(levelIndex == null ? shiftBounds(shift).start : levelIndex);
  }

  function showCastScreen(shift) {
    state.castShift = shift;
    state.mode = 'cast';
  }

  function openLevelSelect(shift) {
    state.selectedShift = shift;
    const b = shiftBounds(shift);
    if (state.selectedMenuLevel < b.start || state.selectedMenuLevel > b.end) state.selectedMenuLevel = b.start;
    state.mode = 'levelSelect';
  }

  function launchSelectedLevel() {
    const b = shiftBounds(state.selectedShift);
    state.selectedMenuLevel = clamp(state.selectedMenuLevel, b.start, b.end);
    beginShift(state.selectedShift, state.selectedMenuLevel);
  }

  function saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        completedStars: state.completedStars,
        lastShift: state.selectedShift,
        lastLevel: state.levelIndex,
        muted: state.muted,
      }));
    } catch (e) {}
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.completedStars)) {
        for (let i = 0; i < Math.min(data.completedStars.length, state.completedStars.length); i++) {
          state.completedStars[i] = Number(data.completedStars[i]) || 0;
        }
      }
      if (data.lastShift === 1 || data.lastShift === 2) state.selectedShift = data.lastShift;
      if (Number.isFinite(data.lastLevel)) state.selectedMenuLevel = clamp(data.lastLevel, shiftBounds(state.selectedShift).start, shiftBounds(state.selectedShift).end);
      state.muted = !!data.muted;
      state.progressLoaded = true;
    } catch (e) {}
  }

  function startLevel(index, skipScene = false) {
    index = clamp(index, 0, LEVELS.length - 1);
    const level = LEVELS[index];
    state.levelIndex = index;
    state.level = level;
    if (!skipScene && level.preScene) {
      openCutscene(level.preScene, index);
      return;
    }
    if (!skipScene && level.hasQuiz) {
      openQuiz(index);
      return;
    }
    beginGameplay(index);
  }

  function openCutscene(lines, pendingIndex) {
    state.mode = 'cutscene';
    state.cutscene = { lines, idx: 0 };
    state.pendingLevelIndex = pendingIndex;
  }

  function openQuiz(pendingIndex) {
    state.mode = 'quiz';
    state.pendingLevelIndex = pendingIndex;
    state.quizScore = 0;
    state.quiz = { questions: BANQUET_QUIZ, idx: 0, answered: false, lastCorrect: false };
  }

  function beginGameplay(index) {
    state.levelIndex = index;
    state.level = LEVELS[index];
    state.phase = state.level.phase;
    state.mode = 'playing';
    state.inventory = [];
    state.selectedSource = 0;
    state.maxTray = 4;
    state.timeLeft = state.level.time;
    state.levelTime = state.level.time;
    state.levelElapsed = 0;
    state.levelMistakes = 0;
    state.levelDelivered = 0;
    state.lastResult = null;
    state.failReason = '';
    state.readyFlash = 0;
    state.message = '';
    state.messageTime = 0;
    state.routeDistance = 0;
    state.runnerEffect = null;
    state.bark = null;
    state.paused = false;
    state.banquetWave = 0;

    state.player = state.phase === 'bar'
      ? { x: 285, y: 625, dir: 'down', speed: 230, moving: false, stepTime: 0 }
      : { x: 725, y: 930, dir: 'up', speed: 245, moving: false, stepTime: 0 };

    if (state.level.isBanquet) {
      state.orders = buildBanquetWave(0);
      message(`Банкет: ${BANQUET_WAVES[0].name}`, 2.1);
    } else {
      state.orders = buildOrdersForLevel(state.level);
      message(`Уровень ${state.levelIndex + 1}: ${state.level.name}`, 2.0);
    }

    initNPCs();
    playTone(560, 0.08, 'square', 0.04);
    setTimeout(() => playTone(740, 0.08, 'square', 0.035), 90);
  }

  function initNPCs() {
    if (state.level.shift !== 2 || state.phase !== 'hall') { state.npcs = null; return; }
    state.npcs = {
      lyuba: {
        x: 1220, y: 290, speed: 92, timer: 0, barkTimer: 10,
        path: [{x:1220,y:290},{x:930,y:350},{x:730,y:520},{x:890,y:770},{x:1180,y:710},{x:1260,y:520}],
        pathIndex: 0,
        barks: ['Где улыбка?', 'Стол семь уже нервничает.', 'Поднос ровнее держим.', 'Сервис, а не квест на выживание.'],
        speech: '', speechTime: 0,
      },
      mikhail: {
        x: 1180, y: 855, home: {x:1180,y:855}, speed: 78, timer: 0, patrol: false, patrolIndex: 0, barkTimer: 18,
        path: [{x:1180,y:855},{x:1030,y:770},{x:900,y:620},{x:1080,y:470}],
        barks: ['Я сейчас табличку по ошибкам открою.', 'Кухня быстрее тебя. Интересное наблюдение.', 'Я не злюсь. Я анализирую. Злостно.', 'Работаем собраннее. Это не пожелание.'],
        speech: '', speechTime: 0,
      }
    };
  }

  function buildOrdersForLevel(level) {
    const targets = level.phase === 'hall' ? TABLES : BAR_GUESTS;
    const menu = level.menu || (level.phase === 'hall' ? HALL_MENU : BAR_MENU);
    let targetIds = level.targetIds;
    if (!targetIds) targetIds = shuffle([...targets]).slice(0, level.targets || 3).map(t => t.id);
    const orders = [];
    if (level.fixedOrders) {
      for (let i = 0; i < level.fixedOrders.length; i++) orders.push(makeOrder(level, level.fixedOrders[i].targetId, level.fixedOrders[i].items, i, level.fixedOrders[i]));
      return orders;
    }
    for (let i = 0; i < targetIds.length; i++) {
      const targetId = targetIds[i];
      const count = Array.isArray(level.counts) ? level.counts[i] : (level.count || 2);
      const picked = [];
      while (picked.length < count) {
        const id = pick(menu);
        if (!picked.includes(id) || menu.length < count) picked.push(id);
      }
      const guestType = (level.rushTargets || []).includes(targetId) ? 'rush' : 'normal';
      orders.push(makeOrder(level, targetId, picked, i, { guestType, patience: guestType === 'rush' ? (level.rushPatience || 35) : (level.patience || 80) }));
    }
    return orders;
  }

  function buildBanquetWave(waveIndex) {
    const level = state.level || LEVELS[state.levelIndex];
    const wave = BANQUET_WAVES[waveIndex];
    if (!wave) return [];
    return wave.orders.map((spec, i) => makeOrder(level, spec.targetId, spec.items, i + waveIndex * 10, { patience: spec.patience, guestType: 'banquet', cookTimes: spec.items.map((_, idx) => 1.8 + idx * 1.2 + Math.random()) }));
  }

  function makeOrder(level, targetId, itemIds, orderIndex, spec = {}) {
    const target = (level.phase === 'hall' ? TABLES : BAR_GUESTS).find(t => t.id === targetId);
    const guestType = spec.guestType || 'normal';
    const uid = `${level.phase}_${state.levelIndex}_${targetId}_${orderIndex}_${Math.random().toString(36).slice(2, 7)}`;
    const patienceMax = spec.patience || 80;
    const items = itemIds.map((id, itemIndex) => {
      const cookLeft = Array.isArray(spec.cookTimes) ? spec.cookTimes[itemIndex] : computeCookTime(level, orderIndex, itemIndex, guestType);
      return { uid: `${uid}_${itemIndex}`, orderUid: uid, targetId, targetName: target?.name || String(targetId), id, done: false, ready: false, picked: false, cookLeft, cookTotal: cookLeft, readyAt: 0, guestType };
    });
    return { uid, targetId, targetName: target?.name || String(targetId), phase: level.phase, guestType, patience: patienceMax, patienceMax, rewardMult: guestType === 'rush' ? 1.65 : guestType === 'vip' ? 1.4 : 1, items, done: false };
  }

  function computeCookTime(level, orderIndex, itemIndex, guestType) {
    const c = level.cook || { min: 2, max: 8, itemStep: 1.5, targetStep: 1 };
    const min = guestType === 'rush' && c.rushMin != null ? c.rushMin : c.min;
    const max = guestType === 'rush' && c.rushMax != null ? c.rushMax : c.max;
    return Math.max(0.7, randomRange(min, max) + itemIndex * (c.itemStep || 0) + orderIndex * (c.targetStep || 0));
  }

  function availableSourceItems() {
    const items = [];
    for (const order of state.orders) for (const item of order.items) if (item.ready && !item.picked && !item.done) items.push(item);
    items.sort((a, b) => a.readyAt - b.readyAt);
    return items;
  }
  const activeSourceItems = () => availableSourceItems().slice(0, 5);
  function cookingCount() { let n = 0; for (const order of state.orders) for (const item of order.items) if (!item.done && !item.picked && !item.ready) n++; return n; }
  const orderByTarget = (targetId) => state.orders.find(o => o.targetId === targetId);
  const targetById = (id) => currentTargets().find(t => t.id === id);
  const insideRect = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  const nearSource = () => insideRect(state.player.x, state.player.y, currentSourceZone());

  function nearTarget() {
    let best = null; let bestD = Infinity;
    for (const target of currentTargets()) {
      const order = orderByTarget(target.id);
      if (!order) continue;
      const d = dist(state.player.x, state.player.y, target.x, target.y);
      if (d < target.r && d < bestD) { best = target; bestD = d; }
    }
    return best;
  }

  function blocked(px, py) {
    const foot = { x: px - 18, y: py - 14, w: 36, h: 28 };
    if (state.phase === 'bar') {
      const b = BAR_WORK_BOUNDS;
      return foot.x < b.x || foot.y < b.y || foot.x + foot.w > b.x + b.w || foot.y + foot.h > b.y + b.h;
    }
    const b = WORLD_BOUNDS;
    if (foot.x < b.x || foot.y < b.y || foot.x + foot.w > b.x + b.w || foot.y + foot.h > b.y + b.h) return true;
    for (const o of OBSTACLES) if (foot.x < o.x + o.w && foot.x + foot.w > o.x && foot.y < o.y + o.h && foot.y + foot.h > o.y) return true;
    return false;
  }

  function traySpeedMultiplier() {
    const n = state.inventory.length;
    if (n <= 2) return 1;
    if (n === 3) return 0.82;
    return 0.67;
  }

  function pickFromSource(index = 0) {
    if (state.mode !== 'playing') return;
    if (!nearSource()) { message(`Подойди к ${sourceName()}.`, 0.9); playTone(180, 0.05); return; }
    const visible = activeSourceItems();
    if (!visible.length) { message(cookingCount() ? `Пока пусто. Готовится ещё ${cookingCount()} поз.` : 'На станции пусто.', 1.0); playTone(200, 0.05); return; }
    if (state.inventory.length >= state.maxTray) { message('На подносе уже 4 позиции.', 1.0); playTone(160, 0.08); return; }
    const item = visible[clamp(index, 0, visible.length - 1)] || visible[0];
    item.picked = true; state.inventory.push(item); state.selectedSource = clamp(state.selectedSource, 0, Math.max(0, activeSourceItems().length - 1));
    playTone(state.phase === 'hall' ? 360 : 430, 0.06, 'square', 0.035);
    message(`Взято: ${foodName(item.id)} → ${targetKindName()} ${item.targetName}`, 0.8);
  }

  function dropLast() {
    if (state.mode !== 'playing' || !state.inventory.length) return;
    const item = state.inventory.pop();
    item.picked = false; item.ready = false; item.cookLeft = state.phase === 'hall' ? 7 : 4; item.cookTotal = item.cookLeft;
    state.score = Math.max(0, state.score - 15); state.combo = 0;
    message(`Переделываем: ${foodName(item.id)}.`, 1.0); playTone(210, 0.07, 'sawtooth', 0.025);
  }

  function useRunner() {
    if (state.mode !== 'playing' || state.selectedShift !== 2) return;
    if (state.runnerUses <= 0) { message('Раннер уже отработал свои две жизни.', 1); playTone(160, 0.05); return; }
    if (state.phase !== 'hall') { message('Раннер помогает по залу, не за баром.', 1); playTone(160, 0.05); return; }
    const candidates = state.orders.filter(o => !o.done);
    if (!candidates.length) return;
    candidates.sort((a, b) => (a.patience / a.patienceMax) - (b.patience / b.patienceMax));
    const order = candidates[0];
    state.runnerUses -= 1;
    const t = targetById(order.targetId);
    for (const item of order.items) {
      item.done = true; item.picked = false; item.ready = false;
    }
    state.inventory = state.inventory.filter(it => it.orderUid !== order.uid);
    order.done = true;
    state.score += 180;
    state.delivered += order.items.length;
    state.levelDelivered += order.items.length;
    state.runnerEffect = { x: t.x, y: t.y, time: 1.2, targetName: t.name };
    message(`Раннер закрыл ${targetKindName()} ${t.name}. Красиво, быстро, чужими руками.`, 1.25);
    playTone(820, 0.08, 'square', 0.05);
    if (state.level.isBanquet && state.orders.every(o => o.done)) advanceBanquetOrFinish();
    else if (state.orders.every(o => o.done)) finishLevel();
  }

  function interact() {
    if (state.mode === 'shiftSelect') { showCastScreen(state.selectedShift); return; }
    if (state.mode === 'howToPlay') { state.mode = state.level ? 'playing' : 'shiftSelect'; return; }
    if (state.mode === 'cast') { openLevelSelect(state.castShift); return; }
    if (state.mode === 'levelSelect') { launchSelectedLevel(); return; }
    if (state.mode === 'cutscene') { advanceCutscene(); return; }
    if (state.mode === 'levelComplete') { startNextLevel(); return; }
    if (state.mode === 'lose') { startLevel(state.levelIndex, true); return; }
    if (state.mode === 'shiftComplete') { state.mode = 'shiftSelect'; return; }
    if (state.mode === 'banquetResult') { state.mode = 'win'; return; }
    if (state.mode === 'win') { state.mode = 'shiftSelect'; return; }
    if (state.mode !== 'playing') return;
    if (state.paused) return;

    const target = nearTarget();
    if (target && state.inventory.length > 0) { deliverToTarget(target); return; }
    if (nearSource()) { pickFromSource(state.selectedSource); return; }
    if (target) deliverToTarget(target);
    else { message('Тут никому ничего не надо.', 0.85); playTone(170, 0.05, 'square', 0.025); }
  }

  function advanceCutscene() {
    if (state.mode !== 'cutscene') return;
    state.cutscene.idx += 1;
    if (state.cutscene.idx >= state.cutscene.lines.length) {
      const i = state.pendingLevelIndex;
      state.cutscene = null;
      if (LEVELS[i].hasQuiz) openQuiz(i); else beginGameplay(i);
    }
  }

  function answerQuiz(option) {
    if (state.mode !== 'quiz') return;
    const q = state.quiz.questions[state.quiz.idx];
    if (option === q.correct) state.quizScore += 1;
    state.quiz.idx += 1;
    if (state.quiz.idx >= state.quiz.questions.length) {
      state.banquetDialogScore = Math.round((state.quizScore / state.quiz.questions.length) * 100);
      beginGameplay(state.pendingLevelIndex);
    }
  }

  function deliverToTarget(target) {
    const order = orderByTarget(target.id);
    if (!order || order.done) return;
    if (!state.inventory.length) { message(`${targetKindName()} ${target.name}: сначала возьми позицию с ${sourceName()}.`, 0.95); playTone(210, 0.06); return; }
    const invIndex = state.inventory.findIndex(item => item.orderUid === order.uid && !item.done);
    if (invIndex === -1) {
      state.mistakes += 1; state.levelMistakes += 1; state.combo = 0; state.timeLeft = Math.max(0, state.timeLeft - 4); state.score = Math.max(0, state.score - 35);
      message(`${targetKindName()} ${target.name}: не тот заказ. −4 сек.`, 1.1); playTone(120, 0.12, 'sawtooth', 0.06); return;
    }
    const item = state.inventory[invIndex];
    item.done = true; item.picked = false; state.inventory.splice(invIndex, 1); state.combo += 1; state.delivered += 1; state.levelDelivered += 1;
    const patienceRatio = order.patience / order.patienceMax;
    const base = state.phase === 'hall' ? 95 : 120;
    const comboBonus = Math.min(12, state.combo) * (state.phase === 'hall' ? 14 : 17);
    const hurryBonus = order.guestType === 'rush' ? 70 : order.guestType === 'vip' ? 90 : 0;
    const patienceBonus = Math.round(50 * patienceRatio);
    const add = Math.round((base + comboBonus + hurryBonus + patienceBonus) * order.rewardMult);
    state.score += add;
    playTone((state.phase === 'hall' ? 640 : 700) + Math.min(state.combo, 6) * 22, 0.055, 'square', 0.04);

    if (order.items.every(it => it.done)) {
      order.done = true;
      const closeBonus = order.guestType === 'rush' ? 360 : order.guestType === 'vip' ? 420 : (state.phase === 'hall' ? 230 : 280);
      state.score += closeBonus;
      message(`${targetKindName()} ${target.name} закрыт. +${closeBonus}`, 1.0);
      playTone(880, 0.06, 'square', 0.045);
    } else {
      message(`${targetKindName()} ${target.name}: ${foodName(item.id)} отдан. +${add}`, 0.8);
    }

    if (state.orders.every(o => o.done)) {
      if (state.level.isBanquet) advanceBanquetOrFinish(); else finishLevel();
    }
  }

  function advanceBanquetOrFinish() {
    if (!state.level.isBanquet) { finishLevel(); return; }
    if (state.banquetWave < BANQUET_WAVES.length - 1) {
      state.banquetWave += 1;
      state.inventory = [];
      state.orders = buildBanquetWave(state.banquetWave);
      message(`Банкет: ${BANQUET_WAVES[state.banquetWave].name}`, 2.0);
      playTone(520, 0.08, 'square', 0.04);
      return;
    }
    finishLevel();
  }

  function computeBanquetRating() {
    const dialog = state.banquetDialogScore;
    const speed = clamp(Math.round((state.timeLeft / state.levelTime) * 100 + 35 - state.levelMistakes * 8), 0, 100);
    const ideal = Math.max(600, state.levelDelivered * 175);
    const route = clamp(Math.round((ideal / Math.max(ideal, state.routeDistance)) * 100), 0, 100);
    const total = Math.round(dialog * 0.4 + speed * 0.35 + route * 0.25);
    const grade = total < 50 ? 'ПЛОХО' : total < 80 ? 'СРЕДНЕ' : 'ХОРОШО';
    return { dialog, speed, route, total, grade };
  }

  function finishLevel() {
    if (state.mode !== 'playing') return;
    if (state.level.isBanquet) {
      state.completedStars[state.levelIndex] = 3;
      saveProgress();
      state.lastResult = computeBanquetRating();
      state.mode = 'banquetResult';
      playTone(720, 0.08, 'square', 0.05);
      setTimeout(() => playTone(960, 0.08, 'square', 0.05), 90);
      setTimeout(() => playTone(1200, 0.10, 'square', 0.05), 190);
      return;
    }
    const timeRatio = state.timeLeft / Math.max(1, state.levelTime);
    const avgPatience = state.orders.reduce((s, o) => s + Math.max(0, o.patience / o.patienceMax), 0) / Math.max(1, state.orders.length);
    let stars = 1;
    if (state.levelMistakes <= 1 && avgPatience > 0.35) stars += 1;
    if (state.levelMistakes === 0 && timeRatio > 0.20 && avgPatience > 0.55) stars += 1;
    stars = clamp(stars, 1, 3);
    state.completedStars[state.levelIndex] = Math.max(state.completedStars[state.levelIndex], stars);
    saveProgress();
    const timeBonus = Math.ceil(state.timeLeft) * (state.phase === 'hall' ? 16 : 18);
    const starBonus = stars * 250;
    state.score += timeBonus + starBonus;
    state.lastResult = { stars, timeBonus, starBonus, avgPatience, mistakes: state.levelMistakes, delivered: state.levelDelivered };
    state.mode = 'levelComplete';
    playTone(720, 0.08, 'square', 0.05);
    setTimeout(() => playTone(960, 0.08, 'square', 0.05), 90);
    setTimeout(() => playTone(1200, 0.10, 'square', 0.05), 190);
  }

  function failLevel(reason) {
    if (state.mode !== 'playing') return;
    state.failReason = reason; state.mode = 'lose'; state.combo = 0; message(reason, 2); playTone(100, 0.16, 'sawtooth', 0.06);
  }

  function startNextLevel() {
    const next = state.levelIndex + 1;
    const bounds = shiftBounds(state.selectedShift);
    if (next > bounds.end) {
      state.mode = state.selectedShift === 1 ? 'shiftComplete' : 'win';
      return;
    }
    startLevel(next);
  }

  function update(dt) {
    if (state.messageTime > 0) state.messageTime -= dt;
    if (state.mode !== 'playing') return;
    if (state.paused) return;
    state.levelElapsed += dt; state.timeLeft -= dt;
    if (state.timeLeft <= 0) { state.timeLeft = 0; failLevel(state.phase === 'hall' ? 'Зал не дождался.' : 'Бар не вывез.'); return; }
    if (state.readyFlash > 0) state.readyFlash -= dt;
    if (state.runnerEffect) { state.runnerEffect.time -= dt; if (state.runnerEffect.time <= 0) state.runnerEffect = null; }
    updateKitchen(dt); updatePatience(dt); updateMovement(dt); updateNPCs(dt);
  }

  function updateKitchen(dt) {
    let becameReady = 0;
    for (const order of state.orders) {
      for (const item of order.items) {
        if (item.done || item.picked || item.ready) continue;
        item.cookLeft -= dt;
        if (item.cookLeft <= 0) { item.cookLeft = 0; item.ready = true; item.readyAt = state.levelElapsed + Math.random() * 0.01; becameReady += 1; }
      }
    }
    if (becameReady > 0) {
      state.readyFlash = 0.8; playTone(state.phase === 'hall' ? 510 : 580, 0.06, 'square', 0.035);
      if (state.messageTime <= 0) message(`Готово на ${sourceName()}: +${becameReady}`, 0.9);
    }
    state.selectedSource = clamp(state.selectedSource, 0, Math.max(0, activeSourceItems().length - 1));
  }

  function updatePatience(dt) {
    for (const order of state.orders) {
      if (order.done) continue;
      const pressure = order.guestType === 'rush' ? 1.35 : order.guestType === 'vip' ? 1.08 : 1;
      order.patience -= dt * pressure;
      if (order.patience <= 0) {
        const target = targetById(order.targetId); const name = target?.name || order.targetName;
        failLevel(`${targetKindName()} ${name} не дождался.`); return;
      }
    }
  }

  function updateMovement(dt) {
    let vx = 0, vy = 0;
    if (keys.has('arrowleft') || keys.has('keya')) vx -= 1;
    if (keys.has('arrowright') || keys.has('keyd')) vx += 1;
    if (keys.has('arrowup') || keys.has('keyw')) vy -= 1;
    if (keys.has('arrowdown') || keys.has('keys')) vy += 1;
    state.player.moving = vx !== 0 || vy !== 0;
    if (state.player.moving) {
      const len = Math.hypot(vx, vy) || 1; vx /= len; vy /= len; const speed = state.player.speed * traySpeedMultiplier();
      const nx = state.player.x + vx * speed * dt; const ny = state.player.y + vy * speed * dt;
      const ox = state.player.x, oy = state.player.y;
      if (!blocked(nx, state.player.y)) state.player.x = nx;
      if (!blocked(state.player.x, ny)) state.player.y = ny;
      state.routeDistance += Math.hypot(state.player.x - ox, state.player.y - oy);
      if (Math.abs(vx) > Math.abs(vy)) state.player.dir = vx > 0 ? 'right' : 'left'; else state.player.dir = vy > 0 ? 'down' : 'up';
      state.player.stepTime += dt;
    } else state.player.stepTime = 0;
  }

  function updateNPCs(dt) {
    if (!state.npcs) return;
    const lyuba = state.npcs.lyuba;
    const targetL = lyuba.path[lyuba.pathIndex];
    moveNpcToward(lyuba, targetL, dt);
    if (dist(lyuba.x, lyuba.y, targetL.x, targetL.y) < 14) lyuba.pathIndex = (lyuba.pathIndex + 1) % lyuba.path.length;
    lyuba.barkTimer -= dt;
    if (lyuba.speechTime > 0) lyuba.speechTime -= dt;
    if (lyuba.barkTimer <= 0) { npcSpeak(lyuba, pick(lyuba.barks)); lyuba.barkTimer = 30; }

    const mikhail = state.npcs.mikhail;
    mikhail.timer += dt;
    if (!mikhail.patrol && mikhail.timer > 32) { mikhail.patrol = true; mikhail.timer = 0; mikhail.patrolIndex = 1; npcSpeak(mikhail, pick(mikhail.barks)); }
    if (mikhail.speechTime > 0) mikhail.speechTime -= dt;
    if (mikhail.patrol) {
      const targetM = mikhail.path[mikhail.patrolIndex];
      moveNpcToward(mikhail, targetM, dt);
      if (dist(mikhail.x, mikhail.y, targetM.x, targetM.y) < 12) {
        mikhail.patrolIndex += 1;
        if (mikhail.patrolIndex >= mikhail.path.length) { mikhail.patrol = false; mikhail.timer = 0; }
      }
    } else moveNpcToward(mikhail, mikhail.home, dt);
  }

  function moveNpcToward(npc, target, dt) {
    if (!target) { if (npc) npc.moving = false; return; }
    const dx = target.x - npc.x, dy = target.y - npc.y;
    const len = Math.hypot(dx, dy);
    if (len < 1.5) { npc.moving = false; return; }
    npc.moving = true;
    npc.walkTime = (npc.walkTime || 0) + dt;
    npc.x += (dx / len) * npc.speed * dt;
    npc.y += (dy / len) * npc.speed * dt;
  }
  function npcSpeak(npc, text) { npc.speech = text; npc.speechTime = 3.2; }

  function draw() {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#050605'; ctx.fillRect(0, 0, W, H);
    if (images.map) ctx.drawImage(images.map, 0, 0, W, H);
    const gameLikeModes = ['playing', 'levelComplete', 'lose', 'banquetResult', 'win', 'shiftComplete'];
    if (gameLikeModes.includes(state.mode)) {
      drawGuests(); drawTableBadges(); drawNPCs(); drawRunnerEffect(); drawPlayer(); drawHUD();
    }
    if (state.mode === 'loading') drawOverlay('ЗАГРУЗКА', 'Пиксели собираются…');
    if (state.mode === 'shiftSelect') drawShiftSelect();
    if (state.mode === 'howToPlay') drawHowToPlayOverlay();
    if (state.mode === 'cast') drawCastOverlay();
    if (state.mode === 'levelSelect') drawLevelSelectOverlay();
    if (state.mode === 'cutscene') drawCutsceneOverlay();
    if (state.mode === 'quiz') drawQuizOverlay();
    if (state.mode === 'levelComplete') drawLevelCompleteOverlay();
    if (state.mode === 'shiftComplete') drawShiftCompleteOverlay();
    if (state.mode === 'banquetResult') drawBanquetResultOverlay();
    if (state.mode === 'win') drawWinOverlay();
    if (state.mode === 'lose') drawLoseOverlay();
    if (state.mode === 'playing' && state.paused) drawPauseOverlay();
  }

  function drawGuests() {
    if (!state.orders?.length) return;
    if (state.phase === 'hall') {
      for (const order of state.orders) {
        const placements = HALL_CUSTOMER_PLACEMENTS[order.targetId] || [];
        for (const pl of placements) {
          const sprite = order.guestType === 'rush' ? 'impatient_customer' : pl.sprite;
          drawCustomer({ ...pl, sprite }, order);
        }
      }
    } else {
      for (const order of state.orders) {
        const guest = BAR_GUESTS.find(g => g.id === order.targetId); if (!guest) continue;
        const sprite = order.guestType === 'rush' ? 'impatient_customer' : guest.sprite;
        drawCustomer({ sprite, x: guest.drawX, y: guest.drawY, h: guest.h }, order);
      }
    }
  }

  function drawCustomer(pl, order) {
    const img = images[pl.sprite]; if (!img) return;
    ctx.save(); ctx.globalAlpha = order.done ? 0.55 : 1; ctx.shadowColor = 'rgba(0,0,0,.58)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 5;
    const targetH = pl.h, targetW = img.width * (targetH / img.height);
    ctx.drawImage(img, pl.x - targetW / 2, pl.y - targetH, targetW, targetH); ctx.restore();
    if (!order.done) {
      const mood = order.guestType === 'rush' ? '!' : order.guestType === 'vip' ? 'VIP' : '';
      if (mood) { roundRect(pl.x + 14, pl.y - targetH - 8, 42, 20, 6, 'rgba(0,0,0,.7)', 'rgba(243,189,82,.35)', 1); drawText(mood, pl.x + 35, pl.y - targetH + 2, 11, mood === '!' ? '#ff665f' : '#f3bd52', 'center'); }
    }
  }

  function drawTableBadges() {
    if (!state.orders?.length) return;
    for (const order of state.orders) {
      const target = targetById(order.targetId);
      if (!target) continue;
      const total = order.items.length;
      const doneCount = order.items.filter(it => it.done).length;
      const remaining = Math.max(0, total - doneCount);
      const badgeText = state.phase === 'hall' ? `Стол ${target.name}` : `Гость ${target.name}`;
      const subText = order.done ? 'готово ✓' : `${remaining}/${total} блюд`;
      const bx = target.x - 48;
      const by = state.phase === 'hall' ? target.y - 105 : target.y - 88;
      const urgent = order.guestType === 'rush' || (order.patience / order.patienceMax) < 0.33;
      roundRect(bx, by, 96, 44, 10,
        order.done ? 'rgba(27,68,34,.78)' : 'rgba(7,10,8,.88)',
        order.done ? 'rgba(79,209,94,.55)' : urgent ? 'rgba(255,102,95,.65)' : 'rgba(243,189,82,.44)', 2);
      drawText(badgeText, bx + 48, by + 15, 12, '#f3e7c6', 'center');
      drawText(subText, bx + 48, by + 32, 11, order.done ? '#9cff83' : urgent ? '#ff9a8f' : '#f3bd52', 'center');
    }
  }

  function drawNPCs() {
    if (!state.npcs) return;
    drawSingleNPC(images.lyuba, state.npcs.lyuba, 120, 'Люба', false);
    drawSingleNPC(images.mikhail, state.npcs.mikhail, 118, 'Михаил', true);
  }

  function drawSingleNPC(img, npc, h, label, laptop = false) {
    if (!img || !npc) return;
    const x = npc.x;
    const y = npc.y;
    const speech = npc.speech;
    const speechTime = npc.speechTime;
    const moving = !!npc.moving;
    const bob = moving ? Math.sin((npc.walkTime || 0) * 12) * 3 : 0;
    const sway = moving ? Math.sin((npc.walkTime || 0) * 9) * 0.035 : 0;
    const w = img.width * (h / img.height);

    if (moving) {
      const step = Math.sin((npc.walkTime || 0) * 12);
      roundRect(x - 34, y - 10, 24, 8, 4, `rgba(0,0,0,${step > 0 ? .34 : .18})`, null, 0);
      roundRect(x + 10, y - 10, 24, 8, 4, `rgba(0,0,0,${step < 0 ? .34 : .18})`, null, 0);
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.55)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 6;
    ctx.translate(x, y - h / 2 + bob);
    ctx.rotate(sway);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();

    drawText(label, x, y - h - 16 + bob, 12, '#f3e7c6', 'center');
    if (laptop && !moving) {
      roundRect(x - 36, y - 18, 42, 20, 4, 'rgba(25,28,31,.95)', '#8bbcff', 1);
      drawText('</>', x - 15, y - 8, 10, '#9fd0ff', 'center');
    }
    if (speech && speechTime > 0) {
      const bw = Math.min(250, speech.length * 7 + 20);
      roundRect(x - bw / 2, y - h - 54 + bob, bw, 28, 8, 'rgba(10,14,11,.94)', 'rgba(243,189,82,.35)', 2);
      drawText(speech, x, y - h - 40 + bob, 12, '#f3e7c6', 'center');
    }
  }

  function drawRunnerEffect() {
    if (!state.runnerEffect || !images.runner) return;
    const e = state.runnerEffect; const h = 92, w = images.runner.width * (h / images.runner.height);
    ctx.save(); ctx.globalAlpha = clamp(e.time / 1.2, 0, 1); ctx.drawImage(images.runner, e.x - w / 2, e.y - h - 4, w, h); ctx.restore();
    roundRect(e.x - 82, e.y - h - 36, 164, 24, 8, 'rgba(10,14,11,.88)', 'rgba(79,209,94,.45)', 2);
    drawText(`Раннер → ${e.targetName}`, e.x, e.y - h - 22, 12, '#9cff83', 'center');
  }

  function drawPlayer() {
    const p = state.player;
    const visualDir = p.dir; // v1.2: направление берём напрямую; сами right-спрайты уже зеркалированы правильно
    let suffix = `idle_${visualDir}`;
    if (state.inventory.length > 0) suffix = `carry_${visualDir}`;
    else if (p.moving) suffix = `walk_${visualDir}_${Math.floor(p.stepTime * 8) % 3}`;
    const prefix = state.phase === 'bar' ? 'bartender' : 'waitress';
    const img = images[`${prefix}_${suffix}`] || images[`waitress_idle_down`];
    if (!img) { ctx.fillStyle = state.phase === 'bar' ? '#111' : '#efe4bf'; ctx.fillRect(p.x - 14, p.y - 54, 28, 54); return; }
    const targetH = state.inventory.length > 0 ? 128 : 115; const scale = targetH / img.height; const targetW = img.width * scale;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.65)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 8; ctx.drawImage(img, p.x - targetW / 2, p.y - targetH, targetW, targetH); ctx.restore();
  }

  function drawHUD() {
    const level = state.level || LEVELS[state.levelIndex] || LEVELS[0];

    // Top compact status bar — no more UI lasagna.
    roundRect(14, 14, 610, 74, 12, 'rgba(7,10,8,.82)', 'rgba(243,189,82,.25)', 2);
    drawText('SQER RUSH', 32, 38, 22, '#f3bd52', 'left');
    drawText(`День ${state.selectedShift} · ${level.name}`, 32, 66, 15, '#f3e7c6', 'left');
    drawText(formatTime(state.timeLeft), 500, 38, 26, state.timeLeft < 12 ? '#ff665f' : '#4fd15e', 'right');
    drawText(`счёт ${state.score}`, 500, 66, 15, '#f6d17c', 'right');
    if (state.selectedShift === 2) drawText(`раннер ${state.runnerUses} · R`, 522, 66, 15, '#9fd0ff', 'left');

    // Tray panel tucked left.
    roundRect(14, 98, 390, 88, 12, 'rgba(7,10,8,.80)', 'rgba(243,189,82,.22)', 2);
    drawText(state.phase === 'hall' ? 'Поднос' : 'Барный поднос', 32, 122, 16, '#f3e7c6', 'left');
    const speedText = state.inventory.length <= 2 ? '100%' : state.inventory.length === 3 ? '82%' : '67%';
    drawText(`скорость ${speedText}`, 315, 122, 13, state.inventory.length > 2 ? '#ffcf73' : 'rgba(243,231,198,.70)', 'right');
    for (let i = 0; i < state.maxTray; i++) {
      const x = 32 + i * 82;
      roundRect(x, 137, 62, 38, 8, 'rgba(20,24,20,.84)', 'rgba(160,130,70,.35)', 2);
      const item = state.inventory[i];
      if (item && images[item.id]) {
        drawIcon(images[item.id], x + 7, 139, 48, 29);
        drawText(item.targetName, x + 31, 173, 9, '#f3bd52', 'center');
      }
    }

    // Compact order panel on the right, shorter rows.
    const panelW = 422;
    const x = W - panelW - 14;
    const y = 14;
    const rowH = 46;
    const orderPanelH = Math.min(H - 140, 58 + state.orders.length * rowH);
    roundRect(x, y, panelW, orderPanelH, 12, 'rgba(7,10,8,.84)', 'rgba(243,189,82,.22)', 2);
    let title = state.phase === 'hall' ? 'Заказы' : 'Бар';
    if (state.level?.isBanquet) title = BANQUET_WAVES[state.banquetWave].name;
    drawText(title, x + 18, y + 28, 18, '#f3bd52', 'left');
    drawText(`комбо x${state.combo}`, x + panelW - 18, y + 28, 14, '#9cff83', 'right');

    let rowY = y + 46;
    const maxRows = Math.floor((orderPanelH - 58) / rowH);
    for (let oi = 0; oi < Math.min(state.orders.length, maxRows); oi++) {
      const order = state.orders[oi];
      const target = targetById(order.targetId); if (!target) continue;
      const done = order.done;
      const fill = done ? 'rgba(44,92,45,.42)' : (order.guestType === 'rush' ? 'rgba(80,25,24,.82)' : order.guestType === 'vip' ? 'rgba(79,62,20,.82)' : 'rgba(16,18,16,.84)');
      const stroke = done ? 'rgba(79,209,94,.35)' : (order.guestType === 'rush' ? 'rgba(255,102,95,.42)' : order.guestType === 'vip' ? 'rgba(243,189,82,.52)' : 'rgba(160,130,70,.28)');
      roundRect(x + 14, rowY, panelW - 28, rowH - 6, 8, fill, stroke, 1.5);
      drawText(`${targetKindName()} ${target.name} · ${Math.max(0, order.items.length - order.items.filter(it => it.done).length)}/${order.items.length}`, x + 26, rowY + 17, 14, done ? '#8eea8e' : '#f3e7c6', 'left');
      drawPatienceBar(x + 26, rowY + 29, 68, 7, order.patience / order.patienceMax, order.guestType === 'rush');
      if (order.guestType === 'rush' && !done) drawText('fast', x + 100, rowY + 31, 10, '#ff9a8f', 'left');
      if (order.guestType === 'vip' && !done) drawText('VIP', x + 100, rowY + 31, 10, '#f3bd52', 'left');
      let iconX = x + 136;
      for (const it of order.items.slice(0, 6)) { drawOrderItemIcon(it, iconX, rowY + 5, 30); iconX += 38; }
      rowY += rowH;
    }

    drawSourceOptions();

    if (state.mode === 'playing') {
      const nTarget = nearTarget(); let hint = '';
      if (nearSource()) hint = `${state.phase === 'hall' ? 'Раздача' : 'Барная станция'}: E / 1–5 — взять`;
      else if (nTarget) hint = `${targetKindName()} ${nTarget.name}: E — отдать`;
      else hint = 'WASD/стрелки — движение · H — помощь · P — пауза';
      roundRect(W / 2 - 310, H - 58, 620, 38, 12, 'rgba(7,10,8,.84)', 'rgba(79,209,94,.28)', 2);
      drawText(hint, W / 2, H - 36, 15, '#d7ffd2', 'center');
      if (state.message && state.messageTime > 0) {
        roundRect(W / 2 - 380, 205, 760, 42, 10, 'rgba(6,8,6,.86)', 'rgba(243,189,82,.24)', 2);
        drawText(state.message, W / 2, 229, 15, '#f3e7c6', 'center');
      }
    }
  }

  function drawSourceOptions() {
    const pass = nearSource();
    const items = activeSourceItems();
    const x0 = state.phase === 'hall' ? 520 : 88;
    const y0 = state.phase === 'hall' ? 306 : 546;
    const title = state.phase === 'hall' ? 'Раздача' : 'Барная станция';
    const w = items.length ? Math.max(246, items.length * 70 + 20) : 210;
    roundRect(x0 - 10, y0 - 30, w, 102, 12, 'rgba(7,10,8,.72)', pass ? 'rgba(79,209,94,.42)' : 'rgba(243,189,82,.22)', 2);
    drawText(title, x0 + 4, y0 - 12, 13, pass ? '#9cff83' : '#f3e7c6', 'left');
    if (!items.length) {
      const txt = cookingCount() ? 'готовится…' : 'пусто';
      drawText(txt, x0 + 86, y0 + 30, 15, cookingCount() ? '#f3e7c6' : '#8a887a', 'center');
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const x = x0 + i * 70;
      const selected = i === state.selectedSource && pass;
      roundRect(x, y0, 56, 56, 8, selected ? 'rgba(79,209,94,.34)' : 'rgba(10,12,10,.78)', selected ? '#4fd15e' : 'rgba(243,189,82,.34)', 2);
      drawText(String(i + 1), x + 6, y0 + 12, 11, '#f3bd52', 'left');
      const img = images[item.id]; if (img) drawIcon(img, x + 10, y0 + 12, 38, 29);
      roundRect(x + 13, y0 + 40, 30, 14, 6, item.guestType === 'rush' ? 'rgba(255,102,95,.55)' : 'rgba(7,10,8,.78)', item.guestType === 'rush' ? '#ff665f' : 'rgba(243,189,82,.4)', 1);
      drawText(item.targetName, x + 28, y0 + 48, 10, '#f3e7c6', 'center');
    }
  }

  function drawOrderItemIcon(item, x, y, size = 34) {
    const img = images[item.id]; const isCooking = !item.ready && !item.picked && !item.done; const isReady = item.ready && !item.picked && !item.done; const isPicked = item.picked && !item.done;
    roundRect(x - 3, y - 2, size + 6, size + 6, 7, isReady ? 'rgba(79,209,94,.14)' : isPicked ? 'rgba(243,189,82,.14)' : 'rgba(0,0,0,.12)', isReady ? 'rgba(79,209,94,.55)' : isPicked ? 'rgba(243,189,82,.45)' : 'rgba(160,130,70,.20)', 1);
    ctx.save(); ctx.globalAlpha = item.done ? 0.25 : isCooking ? 0.36 : 1; if (img) drawIcon(img, x, y, size, Math.max(24, size - 4)); ctx.restore();
    if (item.done) drawMiniCheck(x + 1, y + 2);
    else if (isCooking) { const pct = 1 - (item.cookLeft / Math.max(0.1, item.cookTotal)); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y + size - 2, size, 4); ctx.fillStyle = '#f3bd52'; ctx.fillRect(x, y + size - 2, size * clamp(pct, 0, 1), 4); ctx.restore(); }
    else if (isPicked) drawText('→', x + size / 2, y + size + 3, 11, '#f3bd52', 'center');
    else if (isReady) drawText('✓', x + size / 2, y + size + 3, 11, '#4fd15e', 'center');
  }

  function drawMiniCheck(x, y) { ctx.save(); ctx.strokeStyle = 'rgba(79,209,94,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + 13); ctx.lineTo(x + 13, y + 24); ctx.lineTo(x + 33, y); ctx.stroke(); ctx.restore(); }

  function drawShiftSelect() {
    drawOverlay('SQER RUSH', `Выбор смены: ${state.selectedShift === 1 ? 'ДЕНЬ 1' : 'ДЕНЬ 2'}`, [
      '1 / 2 или ← / → — выбрать смену',
      'ENTER / E / пробел — продолжить · H — как играть'
    ], 880, 300);
    const cardY = 545;
    drawShiftCard(W / 2 - 330, cardY, 270, 160, 'ДЕНЬ 1', 'база: зал + бар', state.selectedShift === 1);
    drawShiftCard(W / 2 + 60, cardY, 270, 160, 'ДЕНЬ 2', 'сюжет + банкет', state.selectedShift === 2);
  }

  function drawShiftCard(x, y, w, h, title, subtitle, selected) {
    roundRect(x, y, w, h, 16, selected ? 'rgba(79,209,94,.18)' : 'rgba(10,14,11,.92)', selected ? '#4fd15e' : 'rgba(243,189,82,.3)', 3);
    drawText(title, x + w / 2, y + 48, 32, selected ? '#9cff83' : '#f3bd52', 'center');
    drawText(subtitle, x + w / 2, y + 94, 17, '#f3e7c6', 'center');
    drawText(selected ? 'выбрано' : 'доступно', x + w / 2, y + 130, 13, selected ? '#9cff83' : 'rgba(243,231,198,.72)', 'center');
  }

  function drawCastOverlay() {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.68)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    roundRect(72, 70, W - 144, H - 140, 20, 'rgba(10,14,11,.96)', 'rgba(243,189,82,.42)', 3);
    drawText(`День ${state.castShift}: персонажи`, W / 2, 126, 34, '#f3bd52', 'center');
    drawText('ENTER / E / пробел — к выбору уровня', W / 2, 166, 17, '#9cff83', 'center');
    const startX = 116, topY = 230, colW = 242;
    for (let i = 0; i < CAST.length; i++) {
      const c = CAST[i]; const x = startX + i * colW; const y = topY; const img = getCastImage(c.id);
      if (img) {
        const h = c.id === 'waitress' || c.id === 'bartender' ? 112 : 126;
        const w = img.width * (h / img.height);
        ctx.drawImage(img, x + 70 - w / 2, y, w, h);
      }
      drawText(c.title, x + 70, y + 152, 14, '#f3bd52', 'center');
      drawMultiline(c.desc, x, y + 174, 150, 12, '#f3e7c6', 17);
    }
  }

  function getCastImage(id) {
    if (id === 'waitress') return images.waitress_idle_down;
    if (id === 'bartender') return images.bartender_idle_down;
    return images[id];
  }

  function drawLevelSelectOverlay() {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.70)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    const b = shiftBounds(state.selectedShift);
    roundRect(130, 78, W - 260, H - 156, 20, 'rgba(10,14,11,.96)', 'rgba(243,189,82,.42)', 3);
    drawText(`ДЕНЬ ${state.selectedShift} · уровни`, W / 2, 132, 34, '#f3bd52', 'center');
    drawText('↑/↓ или W/S — выбрать · ENTER / E / пробел — старт · ESC — назад', W / 2, 174, 16, '#f3e7c6', 'center');
    const listX = 190, listY = 220, rowH = 42, listW = W - 380;
    for (let i = b.start; i <= b.end; i++) {
      const selected = i === state.selectedMenuLevel;
      const level = LEVELS[i];
      const stars = state.completedStars[i] || 0;
      const y = listY + (i - b.start) * rowH;
      roundRect(listX, y, listW, 34, 8, selected ? 'rgba(79,209,94,.22)' : 'rgba(16,18,16,.88)', selected ? '#4fd15e' : 'rgba(243,189,82,.22)', selected ? 2.5 : 1);
      drawText(`${String(i - b.start + 1).padStart(2, '0')}. ${level.name}`, listX + 18, y + 18, 15, selected ? '#9cff83' : '#f3e7c6', 'left');
      drawText(level.isBanquet ? 'банкет' : level.phase === 'hall' ? 'зал' : 'бар', listX + listW - 230, y + 18, 13, 'rgba(243,231,198,.72)', 'left');
      drawText(stars ? starsText(stars) : '—', listX + listW - 24, y + 18, 14, stars ? '#f3bd52' : 'rgba(243,231,198,.45)', 'right');
    }
    const lvl = LEVELS[state.selectedMenuLevel];
    if (lvl) {
      roundRect(190, H - 190, W - 380, 78, 12, 'rgba(16,18,16,.90)', 'rgba(243,189,82,.22)', 1);
      drawText(lvl.name, 214, H - 166, 18, '#f3bd52', 'left');
      drawMultiline(lvl.description || '', 214, H - 146, W - 430, 13, '#f3e7c6', 18);
    }
  }

  function drawHowToPlayOverlay() {
    const lines = [
      'WASD / стрелки — движение · E — взять/отдать · 1–5 — взять позицию',
      'Q — переделать последнюю позицию · R — раннер во второй смене',
      'P — пауза · M — звук · ESC — назад/рестарт в паузе',
      'Поднос: 1–2 позиции быстро, 3 медленнее, 4 — почти грузовой лифт.',
      'ENTER / E / H / ESC — назад.'
    ];
    drawOverlay('КАК ИГРАТЬ', 'Сервис, логистика и немного паники.', lines, 1000, 420);
  }

  function drawPauseOverlay() {
    drawOverlay('ПАУЗА', 'P — продолжить · ESC — рестарт уровня', ['Да, даже пиксельному официанту иногда нужен вдох.'], 700, 260);
  }

  function drawCutsceneOverlay() {
    const cs = state.cutscene; const current = cs.lines[cs.idx];
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.74)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    roundRect(120, 150, W - 240, H - 300, 20, 'rgba(10,14,11,.96)', 'rgba(243,189,82,.42)', 3);
    drawText(current.who, 180, 235, 30, '#f3bd52', 'left');
    drawMultiline(current.text, 180, 300, W - 360, 26, '#f3e7c6', 28);
    drawText(`${cs.idx + 1}/${cs.lines.length}`, W - 180, 235, 18, 'rgba(243,231,198,.68)', 'right');
    drawText('ENTER / E / клик — дальше', W / 2, H - 190, 18, '#9cff83', 'center');
    const img = current.who === 'Люба' ? images.lyuba : current.who === 'Михаил' ? images.mikhail : images.waitress_idle_down;
    if (img) { const h = 250; const w = img.width * (h / img.height); ctx.drawImage(img, W - 330, 285, w, h); }
  }

  function drawQuizOverlay() {
    const q = state.quiz.questions[state.quiz.idx];
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.74)'; ctx.fillRect(0, 0, W, H); ctx.restore();
    roundRect(100, 110, W - 200, H - 220, 20, 'rgba(10,14,11,.96)', 'rgba(243,189,82,.42)', 3);
    drawText('БАНКЕТ · Принятие заказа', W / 2, 180, 34, '#f3bd52', 'center');
    drawText(`Вопрос ${state.quiz.idx + 1}/${state.quiz.questions.length}`, W / 2, 220, 18, '#f3e7c6', 'center');
    drawMultiline(q.q, 150, 290, W - 300, 24, '#f3e7c6', 30);
    for (let i = 0; i < q.options.length; i++) {
      const y = 430 + i * 120;
      roundRect(160, y, W - 320, 86, 14, 'rgba(16,18,16,.92)', 'rgba(243,189,82,.28)', 2);
      drawText(`${i + 1}.`, 195, y + 43, 24, '#f3bd52', 'left');
      drawMultiline(q.options[i], 240, y + 18, W - 410, 16, '#f3e7c6', 22);
    }
    drawText('Нажми 1 / 2 / 3, чтобы выбрать ответ', W / 2, H - 150, 18, '#9cff83', 'center');
  }

  function drawLevelCompleteOverlay() {
    const r = state.lastResult || { stars: 1, timeBonus: 0, starBonus: 0, mistakes: 0, delivered: 0 };
    const next = state.levelIndex + 1 <= shiftBounds(state.selectedShift).end ? `Дальше: ${LEVELS[state.levelIndex + 1].name}` : 'Дальше: завершение смены';
    const lines = [
      `Доставлено: ${r.delivered} · Ошибки: ${r.mistakes} · Осталось времени: ${formatTime(state.timeLeft)}`,
      `Бонус времени: +${r.timeBonus} · Бонус звёзд: +${r.starBonus}`,
      next,
      'ENTER / E / клик — продолжить.'
    ];
    drawOverlay(`УРОВЕНЬ ${state.levelIndex + 1} ЗАКРЫТ`, `${starsText(r.stars)} · Счёт: ${state.score}`, lines, 820, 390);
  }

  function drawShiftCompleteOverlay() {
    const lines = [
      `Первая смена пройдена. Счёт: ${state.score}`,
      'Вторая смена уже доступна из главного меню — без перепрохождения первой.',
      'ENTER / E / клик — вернуться к выбору смен.'
    ];
    drawOverlay('ДЕНЬ 1 ЗАКРЫТ', 'Небольшая победа. Дальше будет шумнее.', lines, 860, 330);
  }

  function drawBanquetResultOverlay() {
    const r = state.lastResult || { dialog: 0, speed: 0, route: 0, total: 0, grade: 'СРЕДНЕ' };
    const lines = [
      `Качество ответов: ${r.dialog}%`,
      `Скорость подачи: ${r.speed}%`,
      `Маршрут: ${r.route}%`,
      `Итог: ${r.total}% · Оценка: ${r.grade}`,
      r.grade === 'ХОРОШО' ? 'Люба: «Ну вот можешь же, когда хочешь.»' : r.grade === 'СРЕДНЕ' ? 'Михаил: «Работать можно. Но осторожно.»' : 'Люба: «Это был не банкет. Это было расследование.»',
      'ENTER / E / клик — финальный экран.'
    ];
    drawOverlay('ИТОГ БАНКЕТА', 'Финальный экзамен по сервису закрыт.', lines, 860, 420);
  }

  function drawWinOverlay() {
    const lines = [
      `Итоговый счёт: ${state.score} · Всего доставлено: ${state.delivered} · Ошибки: ${state.mistakes}`,
      'Люба довольна примерно на 17%. Для неё это уже аплодисменты.',
      'Михаил закрыл ноутбук. Это почти комплимент.',
      'ENTER / E / клик — к выбору смен.'
    ];
    drawOverlay('СМЕНА SQER ЗАКРЫТА', 'Вторая смена и банкет пройдены.', lines, 900, 360);
  }

  function drawLoseOverlay() {
    const lines = [state.failReason || 'Что-то пошло не так.', `Уровень ${state.levelIndex + 1}: ${state.level?.name || ''}`, `Счёт: ${state.score} · Доставлено: ${state.delivered} · Ошибки: ${state.mistakes}`, 'ENTER / E / клик — переиграть уровень.'];
    drawOverlay('ПРОВАЛ СМЕНЫ', 'Гости ушли. Чаевые тоже.', lines, 820, 360);
  }

  function drawOverlay(title, subtitle, lines = [], boxW = 800, boxH = null) {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.64)'; ctx.fillRect(0, 0, W, H); const h = boxH || (lines.length ? 390 : 230); const x = W / 2 - boxW / 2; const y = H / 2 - h / 2;
    roundRect(x, y, boxW, h, 18, 'rgba(10,14,11,.94)', 'rgba(243,189,82,.42)', 3);
    drawText(title, W / 2, y + 70, 42, '#f3bd52', 'center'); drawText(subtitle, W / 2, y + 122, 21, '#f3e7c6', 'center');
    let yy = y + 172; for (const line of lines) { drawText(line, W / 2, yy, 17, 'rgba(243,231,198,.86)', 'center'); yy += 34; }
    ctx.restore();
  }

  const starsText = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);
  function formatTime(t) { const sec = Math.max(0, Math.ceil(t)); const m = Math.floor(sec / 60); const s = sec % 60; return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
  function drawPatienceBar(x, y, w, h, ratio, urgent = false) { const r = clamp(ratio, 0, 1); ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = urgent || r < 0.25 ? '#ff665f' : r < 0.5 ? '#f3bd52' : '#4fd15e'; ctx.fillRect(x, y, w * r, h); ctx.strokeStyle = 'rgba(243,231,198,.20)'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h); ctx.restore(); }
  function roundRect(x, y, w, h, r, fill, stroke, line = 1) { ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); } ctx.restore(); }
  function drawText(text, x, y, size = 16, color = '#fff', align = 'left') { ctx.save(); ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 3; ctx.fillText(text, x, y); ctx.restore(); }
  function drawMultiline(text, x, y, maxW, size, color, lineH = 24) {
    ctx.save(); ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`; ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 3;
    const words = text.split(' '); let line = ''; let yy = y;
    for (let n = 0; n < words.length; n++) {
      const test = line + words[n] + ' '; const w = ctx.measureText(test).width;
      if (w > maxW && n > 0) { ctx.fillText(line, x, yy); line = words[n] + ' '; yy += lineH; }
      else line = test;
    }
    ctx.fillText(line, x, yy); ctx.restore();
  }
  function drawIcon(img, x, y, w, h) { const ratio = Math.min(w / img.width, h / img.height); const tw = img.width * ratio; const th = img.height * ratio; ctx.drawImage(img, x + (w - tw) / 2, y + (h - th) / 2, tw, th); }


  function normalizedCode(e) {
    const c = (e.code || '').toLowerCase();
    const k = (e.key || '').toLowerCase();
    const keyMap = {
      'ц':'keyw','ф':'keya','ы':'keys','в':'keyd','у':'keye','й':'keyq','к':'keyr','з':'keyp','р':'keyh','ь':'keym',
      'w':'keyw','a':'keya','s':'keys','d':'keyd','e':'keye','q':'keyq','r':'keyr','p':'keyp','h':'keyh','m':'keym',
      ' ':'space','spacebar':'space','enter':'enter','escape':'escape','tab':'tab',
      'arrowup':'arrowup','arrowdown':'arrowdown','arrowleft':'arrowleft','arrowright':'arrowright'
    };
    if (/^[12345]$/.test(k)) return 'digit' + k;
    return keyMap[k] || c;
  }

  let last = performance.now();
  function loop(now = performance.now()) { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }

  function handleStartAction() { startAudio(); interact(); }

  window.addEventListener('keydown', (e) => {
    const code = normalizedCode(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(code)) e.preventDefault();
    keys.add(code); startAudio();

    if (code === 'keym') { state.muted = !state.muted; saveProgress(); message(state.muted ? 'Звук выключен' : 'Звук включен', 0.8); return; }
    if (state.mode === 'playing' && code === 'keyh') { state.mode = 'howToPlay'; return; }

    if (state.mode === 'shiftSelect') {
      if (code === 'arrowleft' || code === 'digit1') state.selectedShift = 1;
      if (code === 'arrowright' || code === 'digit2') state.selectedShift = 2;
      if (code === 'keyh') { state.mode = 'howToPlay'; return; }
      if (code === 'enter' || code === 'keye' || code === 'space') handleStartAction();
      return;
    }
    if (state.mode === 'howToPlay') { if (code === 'enter' || code === 'keye' || code === 'keyh' || code === 'escape' || code === 'space') state.mode = state.level ? 'playing' : 'shiftSelect'; return; }
    if (state.mode === 'levelSelect') {
      const b = shiftBounds(state.selectedShift);
      if (code === 'arrowup' || code === 'keyw') state.selectedMenuLevel = state.selectedMenuLevel <= b.start ? b.end : state.selectedMenuLevel - 1;
      if (code === 'arrowdown' || code === 'keys') state.selectedMenuLevel = state.selectedMenuLevel >= b.end ? b.start : state.selectedMenuLevel + 1;
      if (code === 'escape') { state.mode = 'shiftSelect'; return; }
      if (code === 'enter' || code === 'keye' || code === 'space') handleStartAction();
      return;
    }
    if (state.mode === 'quiz') {
      if (code.startsWith('digit') || code.startsWith('numpad')) {
        const n = Number(code.replace('digit', '').replace('numpad', ''));
        if (n >= 1 && n <= 3) answerQuiz(n - 1);
      }
      return;
    }

    if (state.mode === 'playing' && code === 'keyp') { state.paused = !state.paused; return; }
    if (state.mode === 'playing' && state.paused && code === 'escape') { startLevel(state.levelIndex, true); return; }
    if (code === 'enter' || code === 'keye' || code === 'space') { handleStartAction(); return; }
    if (code === 'keyq') { dropLast(); return; }
    if (code === 'keyr') { useRunner(); return; }
    if (code === 'tab') { e.preventDefault(); const items = activeSourceItems(); if (state.mode === 'playing' && items.length) state.selectedSource = (state.selectedSource + 1) % items.length; return; }
    if (code.startsWith('digit') || code.startsWith('numpad')) {
      const n = Number(code.replace('digit', '').replace('numpad', ''));
      if (n >= 1 && n <= 5) pickFromSource(n - 1);
    }
  });

  window.addEventListener('keyup', (e) => keys.delete(normalizedCode(e)));
  document.addEventListener('visibilitychange', () => keys.clear());
  canvas.addEventListener('click', () => { canvas.focus(); handleStartAction(); });
  window.addEventListener('blur', () => keys.clear());

  loadAssets();
})();
