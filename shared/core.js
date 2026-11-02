// 人生可视化套件 —— 共享核心库（全部工具页共用）
// LGF：Life-visualization Gloval Framework 的缩写（历史拼写，保留）
// 公共配置（生日 / 预期寿命）全站共用同一份 localStorage，一处设置处处生效
(function (root) {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  var STAGES = [
    { name: '童年', min: 0, max: 6, color: '#FFD60A' },
    { name: '求学', min: 7, max: 18, color: '#30D158' },
    { name: '奋斗', min: 19, max: 35, color: '#64D2FF' },
    { name: '中年', min: 36, max: 59, color: '#BF5AF2' },
    { name: '暮年', min: 60, max: 200, color: '#FF375F' }
  ];

  var GRANULARITY = [
    { key: 'week', name: '1 周', cols: 52, rowLabel: '每行一岁，每格一周' },
    { key: 'month', name: '1 月', cols: 12, rowLabel: '每行一岁，每格一月' },
    { key: 'year', name: '1 年', cols: 10, rowLabel: '每行十年，每格一年' }
  ];

  function fmt(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function parseDate(s) {
    var p = s.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / DAY_MS);
  }

  function maxDayOf(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function stageIndexForAge(age) {
    for (var i = 0; i < STAGES.length; i++) {
      if (age >= STAGES[i].min && age <= STAGES[i].max) return i;
    }
    return STAGES.length - 1;
  }

  // ---------- localStorage 封装（lv- 前缀） ----------
  function get(key, fallback) {
    try {
      var v = localStorage.getItem('lv-' + key);
      return v === null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function getJSON(key, fallback) {
    try {
      var v = localStorage.getItem('lv-' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }

  function set(key, value) {
    try { localStorage.setItem('lv-' + key, value); } catch (e) { /* 忽略 */ }
  }

  function setJSON(key, value) {
    try { localStorage.setItem('lv-' + key, JSON.stringify(value)); } catch (e) { /* 忽略 */ }
  }

  // ---------- 全站公共配置 ----------
  function sanitizeBirthday(v) {
    return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(v) && +v.slice(0, 4) >= 1900
      ? v : '1995-06-15';
  }

  function getBirthday() {
    return sanitizeBirthday(get('birthday'));
  }

  function setBirthday(v) {
    set('birthday', sanitizeBirthday(v));
  }

  function getLifespan() {
    var n = parseInt(get('lifespan', '78'), 10);
    return n >= 60 && n <= 100 ? n : 78;
  }

  function setLifespan(n) {
    set('lifespan', String(Math.max(60, Math.min(100, n))));
  }

  // ---------- 人生核心计算（多工具共用） ----------
  function computeLife(birthdayStr, lifespan) {
    var birth = parseDate(birthdayStr);
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var end = new Date(birth.getFullYear() + lifespan, birth.getMonth(), birth.getDate());

    var totalDays = daysBetween(birth, end);
    var daysLived = Math.max(0, Math.min(totalDays, daysBetween(birth, today)));
    var remainingDays = totalDays - daysLived;
    var percent = totalDays ? (daysLived / totalDays) * 100 : 0;

    var weeksLived = Math.floor(daysLived / 7);
    var totalWeeks = Math.floor(totalDays / 7);

    var age = today.getFullYear() - birth.getFullYear();
    if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age -= 1;

    var monthsLived = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
    if (today.getDate() < birth.getDate()) monthsLived -= 1;
    monthsLived = Math.max(0, Math.min(lifespan * 12, monthsLived));

    var nextDecadeAge = (Math.floor(Math.max(age, 0) / 10) + 1) * 10;
    var nextDecadeDate = new Date(birth.getFullYear() + nextDecadeAge, birth.getMonth(), birth.getDate());
    var nextDecadeDays = Math.max(0, daysBetween(today, nextDecadeDate));

    return {
      daysLived: daysLived,
      remainingDays: remainingDays,
      totalDays: totalDays,
      weeksLived: weeksLived,
      totalWeeks: totalWeeks,
      remainingWeeks: totalWeeks - weeksLived,
      monthsLived: monthsLived,
      remainingMonths: lifespan * 12 - monthsLived,
      age: age,
      percent: percent,
      percentText: percent.toFixed(1),
      daysLivedText: fmt(daysLived),
      remainingDaysText: fmt(remainingDays),
      remainingWeeksText: fmt(totalWeeks - weeksLived),
      remainingMonthsText: fmt(lifespan * 12 - monthsLived),
      remainingYearsText: fmt(Math.max(0, lifespan - age)),
      lifeDayText: fmt(daysLived + 1),
      nextDecadeAge: nextDecadeAge,
      nextDecadeDaysText: fmt(nextDecadeDays),
      birthdaysLeft: Math.max(0, lifespan - age)
    };
  }

  // 实足年龄（给父母等工具用：任意生日）
  function exactAge(birthdayStr) {
    return computeLife(birthdayStr, 100).age;
  }

  root.LGF = {
    DAY_MS: DAY_MS,
    STAGES: STAGES,
    GRANULARITY: GRANULARITY,
    fmt: fmt,
    pad2: pad2,
    parseDate: parseDate,
    todayStr: todayStr,
    daysBetween: daysBetween,
    maxDayOf: maxDayOf,
    stageIndexForAge: stageIndexForAge,
    get: get,
    getJSON: getJSON,
    set: set,
    setJSON: setJSON,
    getBirthday: getBirthday,
    setBirthday: setBirthday,
    getLifespan: getLifespan,
    setLifespan: setLifespan,
    computeLife: computeLife,
    exactAge: exactAge
  };
})(window);
