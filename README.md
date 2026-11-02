# 人生总步数

每天的步数是零散数字，一生加总并换算成距离才有画面感

> 点子来源：Obsidian《人生可视化 / 人生总步数》 · 同系列仓库参考 [life-grid](https://github.com/palmyer/life-grid)

## 功能

- 累计步数 × 步长 → 总距离
- 里程碑逐级点亮：北京→上海 / 横穿中国 / 绕地球 / 到月球
- 余生额度：按日均外推还能再走多远

## 运行

纯静态零依赖，任选其一：

```bash
cd total-steps
python -m http.server 8740
```

- 网页版：<http://127.0.0.1:8740/>
- 手机壳预览：<http://127.0.0.1:8740/preview.html>（life-grid 同款）

或直接双击 `index.html`。

## 设计

- iOS 暗色风格：纯黑背景、#1C1C1E 分组卡片、SF 系统色板
- 选择一律使用 iOS 风格底部滚轮（`shared/wheel.js`）
- 数据存于浏览器 localStorage（`lv-` 前缀），不上传任何服务器
- 生日 / 预期寿命与同系列工具共享同一份配置
