# Label Maker — 項目說明

## 項目簡介

Windows 桌面 SKU 標籤打印工具，基於 Electron 構建，無需網絡，可打包成 `.exe` 在不同電腦上使用。

## 技術棧

| 技術 | 用途 |
|------|------|
| Electron 28 | 桌面應用框架 |
| 原生 HTML/CSS/JS | UI（無前端框架，無打包工具） |
| tesseract.js | OCR 圖片識別 SKU |
| xlsx | Excel/CSV 批量匯入 |
| electron-builder | 打包 Windows .exe 安裝程序 |

## 常用命令

```bash
npm start        # 開發模式啟動
npm run build    # 打包 Windows .exe
node verify.js   # 驗證項目結構完整性
```

## 項目結構

```
Label Maker/
├── main.js              # Electron 主進程（視窗、IPC、打印、PDF預覽）
├── package.json
├── verify.js            # 項目完整性驗證腳本
├── assets/              # 圖標等靜態資源
└── src/
    ├── index.html       # 主界面 HTML（所有 UI 元素）
    ├── js/              # 業務邏輯（按模塊拆分，每個 ≤200 行）
    │   ├── app.js       # 入口：DOMContentLoaded、setupTabs、escapeHtml
    │   ├── settings.js  # 標籤設置：loadSettings、saveSettings、applySettings
    │   ├── list.js      # SKU 列表：addToList、renderList、setupManualInput
    │   ├── ocr.js       # 圖片識別：setupOCR、processImage（Tesseract）
    │   ├── batch.js     # 批量匯入：setupBatch、processExcel（XLSX）
    │   ├── preview.js   # 預覽渲染：updatePreview、buildLabelHtml
    │   └── print.js     # 打印/預覽：loadPrinters、previewBtn、printBtn
    └── css/             # 樣式（按模塊拆分，每個 ≤200 行）
        ├── base.css     # CSS 變量、reset、佈局
        ├── header.css   # 頂部導航欄
        ├── panels.css   # 標籤頁、表單、按鈕、上傳區
        ├── list.css     # SKU 列表、打印操作欄
        ├── preview.css  # 標籤預覽區域
        └── modal.css    # 設置彈窗
```

## JS 文件加載順序

index.html 中 script 標籤必須按以下順序加載（存在跨文件依賴）：

1. `settings.js` — 初始化全局 `settings` 變量
2. `list.js` — 初始化 `skuList`、`selectedIndex`
3. `ocr.js` — 依賴 `addToList`
4. `batch.js` — 初始化 `batchData`，依賴 `addToList`
5. `preview.js` — 依賴 `settings`、`skuList`、`escapeHtml`
6. `print.js` — 依賴 `buildLabelHtml`、`settings`、`skuList`
7. `app.js` — 最後加載，定義 `escapeHtml`，觸發 DOMContentLoaded

> 注意：所有跨文件函數調用均在運行時發生（非解析時），所以只要所有腳本在 DOMContentLoaded 前加載完畢即可正常訪問。

## 全局共享狀態

以下變量為全局（`var` 聲明），跨文件共享：

| 變量 | 定義位置 | 說明 |
|------|---------|------|
| `settings` | `settings.js` | 標籤尺寸、字體等設置，持久化至 localStorage |
| `skuList` | `list.js` | 當前打印列表 `[{ sku, qty }]` |
| `selectedIndex` | `list.js` | 列表中當前選中項的索引 |
| `batchData` | `batch.js` | 批量匯入暫存數據 |

## IPC 通信（主進程 ↔ 渲染進程）

| 頻道 | 方向 | 說明 |
|------|------|------|
| `get-printers` | 渲染→主 | 獲取系統打印機列表 |
| `print-label` | 渲染→主 | 打印標籤（傳入 HTML 和尺寸） |
| `preview-pdf` | 渲染→主 | 打開打印預覽視窗（新 BrowserWindow） |
| `open-file-dialog` | 渲染→主 | 打開文件選擇對話框 |

## 標籤設置

設置存儲在 `localStorage`（key: `labelSettings`）：

```json
{
  "width": 150,
  "height": 100,
  "fontSize": 15,
  "fontWeight": "bold",
  "textAlign": "center"
}
```

- 尺寸單位：mm
- 字體大小單位：mm（打印 HTML 直接用 `Xmm`，預覽按縮放比例換算成 px）
- 默認：橫向 150mm × 100mm

## 打印實現

`main.js` 的 `print-label` handler：
- 將標籤 HTML 寫入臨時文件
- 用隱藏的 BrowserWindow 加載
- 調用 `webContents.print()` 並通過 `pageSize`（單位：微米）指定標籤尺寸
- 打印完成後關閉臨時視窗並刪除臨時文件

## 打印預覽實現

`main.js` 的 `preview-pdf` handler：
- 按 CSS mm 單位構建預覽 HTML（96 DPI 近似實際比例）
- 打開新 BrowserWindow 顯示，無需外部 PDF 閱讀器
- 視窗標題顯示標籤實際尺寸

## 驗證腳本

`verify.js` 會檢查：
1. 所有必要文件是否存在
2. 所有文件行數是否 ≤ 200
3. HTML 中 35 個關鍵元素 ID 是否完整
4. 所有關鍵 CSS class 是否存在
5. 所有關鍵 JS 函數是否定義
6. index.html 是否正確引用新文件結構

新增功能或重構後應運行 `node verify.js` 確認完整性。

## 注意事項

- **不要使用打包工具**（Webpack/Vite）：項目用原生 script 標籤加載，保持簡單易維護
- **跨文件函數**：修改函數名時需同步更新所有引用該函數的文件
- **行數限制**：每個文件保持 ≤ 200 行，超出時應拆分模塊
- **打印機**：主要針對 Windows 熱敏標籤打印機，尺寸傳入單位為微米（mm × 1000）
