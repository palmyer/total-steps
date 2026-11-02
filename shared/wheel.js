// iOS 风格多列滚轮选择器（web/index.html 与 preview.html 共用；小程序端用原生 picker）
// 页面需提供固定 DOM：#sheetMask .sheet-mask / #sheet .sheet / #sheetTitle /
//   #sheetDone .done-btn / #wheelRow .wheel-row，并先加载本文件再调用 WheelUI.init()
(function (root) {
  'use strict';

  var ITEM_H = 48;   // 与 wheel.css .wheel-item 高度一致
  var VIEW_H = 216;  // 与 wheel.css .wheel-wrap 高度一致
  var SPACER_H = (VIEW_H - ITEM_H) / 2;
  var state = null;  // { cols, onDone, onSettle, onCancel }

  function $(id) { return document.getElementById(id); }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }
  function maxDayOf(y, m) { return new Date(y, m, 0).getDate(); }

  function indexes() {
    return state ? state.cols.map(function (c) { return c.index; }) : [];
  }

  function paintCol(col) {
    var s = Math.round(col.el.scrollTop);
    var items = col.el.querySelectorAll('.wheel-item');
    for (var i = 0; i < items.length; i++) {
      var dist = (i * ITEM_H - s) / ITEM_H;
      var abs = Math.min(Math.abs(dist), 3);
      items[i].style.transform = 'scale(' + (1 - abs * 0.12) + ')';
      items[i].style.opacity = String(1 - abs * 0.28);
    }
  }

  function settleCol(col) {
    var idx = Math.max(0, Math.min(Math.round(col.el.scrollTop / ITEM_H), col.items.length - 1));
    if (col.el.scrollTop !== idx * ITEM_H) col.el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
    col.index = idx;
    if (state && state.onSettle) state.onSettle(indexes());
  }

  // cols: [{ items: [str], index: n }]
  // onDone(idxArray) 点完成；onSettle(idxArray) 滚动落定实时预览；onCancel() 点遮罩取消（还原显示）
  function open(title, cols, onDone, onSettle, onCancel) {
    var row = $('wheelRow');
    $('sheetTitle').textContent = title;
    row.innerHTML = '';

    cols.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'wheel-col';
      var html = '<div class="wheel-spacer" style="height:' + SPACER_H + 'px"></div>';
      for (var i = 0; i < c.items.length; i++) {
        html += '<div class="wheel-item" data-i="' + i + '">' + c.items[i] + '</div>';
      }
      html += '<div class="wheel-spacer" style="height:' + SPACER_H + 'px"></div>';
      el.innerHTML = html;
      row.appendChild(el);
      c.el = el;
      c.index = Math.max(0, Math.min(c.index, c.items.length - 1));
      el.scrollTop = c.index * ITEM_H;
    });

    state = { cols: cols, onDone: onDone, onSettle: onSettle, onCancel: onCancel };
    cols.forEach(paintCol);

    $('sheetMask').classList.add('show');
    $('sheet').classList.add('show');
  }

  function close(apply) {
    if (!state) return;
    var st = state;
    state = null;
    $('sheetMask').classList.remove('show');
    $('sheet').classList.remove('show');
    if (apply) {
      st.onDone(st.cols.map(function (c) { return c.index; }));
    } else if (st.onCancel) {
      st.onCancel();
    }
  }

  // 三列日期滚轮：年 / 月 / 日，天数随年月自动钳制
  // current: 'YYYY-MM-DD'；onDone(dateStr) 完成；onLive(dateStr) 实时预览
  function openDate(current, onDone, onLive, onCancel) {
    var parts = current.split('-').map(Number);
    var nowY = new Date().getFullYear();
    var years = [], months = [], days = [];
    for (var y = 1900; y <= nowY; y++) years.push(y + ' 年');
    for (var m = 1; m <= 12; m++) months.push(m + ' 月');
    for (var d = 1; d <= 31; d++) days.push(d + ' 日');

    open('生日',
      [
        { items: years, index: Math.min(Math.max(parts[0], 1900), nowY) - 1900 },
        { items: months, index: parts[1] - 1 },
        { items: days, index: parts[2] - 1 }
      ],
      function (idx) {
        var y = 1900 + idx[0];
        var m = idx[1] + 1;
        var d = Math.min(idx[2] + 1, maxDayOf(y, m));
        onDone(y + '-' + pad2(m) + '-' + pad2(d));
      },
      function (idx) {
        var y = 1900 + idx[0];
        var maxD = maxDayOf(y, idx[1] + 1);
        var dayCol = state.cols[2];
        if (idx[2] + 1 > maxD) {
          dayCol.index = maxD - 1;
          dayCol.el.scrollTo({ top: (maxD - 1) * ITEM_H, behavior: 'smooth' });
          paintCol(dayCol);
          idx = [idx[0], idx[1], maxD - 1];
        }
        if (onLive) onLive((1900 + idx[0]) + '-' + pad2(idx[1] + 1) + '-' + pad2(idx[2] + 1));
      },
      onCancel);
  }

  function init() {
    var wheelRow = $('wheelRow');

    // scroll 事件不冒泡，捕获监听所有列
    wheelRow.addEventListener('scroll', function (e) {
      if (!state) return;
      var col = null;
      for (var i = 0; i < state.cols.length; i++) {
        if (state.cols[i].el === e.target) { col = state.cols[i]; break; }
      }
      if (!col) return;
      paintCol(col);
      clearTimeout(col._t);
      col._t = setTimeout(function () { settleCol(col); }, 120);
    }, true);

    wheelRow.addEventListener('click', function (e) {
      var item = e.target.closest('.wheel-item');
      if (!item || !state) return;
      var col = null;
      for (var i = 0; i < state.cols.length; i++) {
        if (state.cols[i].el.contains(item)) { col = state.cols[i]; break; }
      }
      if (!col) return;
      var idx = +item.getAttribute('data-i');
      col.el.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' });
      col.index = idx;
      if (state.onSettle) state.onSettle(indexes());
    });

    $('sheetDone').addEventListener('click', function () { close(true); });
    $('sheetMask').addEventListener('click', function () { close(false); });
  }

  root.WheelUI = { init: init, open: open, close: close, openDate: openDate };
})(window);
