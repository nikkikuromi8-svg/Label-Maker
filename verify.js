// ==================== 項目驗證腳本 ====================
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
let passed = 0
let failed = 0

function check(label, condition, detail) {
  if (condition) {
    console.log('  ✅ ' + label)
    passed++
  } else {
    console.log('  ❌ ' + label + (detail ? ' — ' + detail : ''))
    failed++
  }
}

// ── 1. 文件存在性 ──────────────────────────────────────────
console.log('\n【1】檢查文件是否存在')
const requiredFiles = [
  'main.js',
  'src/index.html',
  'src/js/settings.js',
  'src/js/list.js',
  'src/js/ocr.js',
  'src/js/batch.js',
  'src/js/preview.js',
  'src/js/print.js',
  'src/js/app.js',
  'src/css/base.css',
  'src/css/header.css',
  'src/css/panels.css',
  'src/css/list.css',
  'src/css/preview.css',
  'src/css/modal.css',
]
requiredFiles.forEach(f => {
  check(f, fs.existsSync(path.join(ROOT, f)))
})

// ── 2. 行數 ≤ 200 ──────────────────────────────────────────
console.log('\n【2】檢查各文件行數 ≤ 200')
requiredFiles.forEach(f => {
  const fullPath = path.join(ROOT, f)
  if (!fs.existsSync(fullPath)) return
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n').length
  check(f + ' (' + lines + ' 行)', lines <= 200, '超出 ' + (lines - 200) + ' 行')
})

// 同時驗證 main.js 和 index.html 依然正常
const mainLines = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8').split('\n').length
const htmlLines = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8').split('\n').length
console.log('  ℹ️  main.js: ' + mainLines + ' 行 | src/index.html: ' + htmlLines + ' 行')

// ── 3. HTML 元素 ID 完整性 ──────────────────────────────────
console.log('\n【3】檢查 HTML 關鍵元素 ID')
const html = fs.readFileSync(path.join(ROOT, 'src/index.html'), 'utf8')
const requiredIds = [
  'skuInput', 'qtyInput', 'addManualSku',
  'uploadZone', 'imageInput', 'ocrStatus', 'ocrPreview', 'ocrImage',
  'ocrResult', 'ocrSkuInput', 'ocrQtyInput', 'addOcrSku',
  'excelUploadZone', 'excelInput', 'batchStatus', 'batchPreview', 'batchInfo', 'addAllBatch',
  'skuList', 'clearList', 'totalCount',
  'printerSelect', 'previewBtn', 'printBtn',
  'labelPreview', 'previewSku', 'previewSizeInfo',
  'openSettings', 'settingsModal', 'closeSettings', 'saveSettings',
  'labelWidth', 'labelHeight', 'fontSize', 'fontWeight',
]
requiredIds.forEach(id => {
  check('id="' + id + '"', html.includes('id="' + id + '"'))
})

// ── 4. CSS class 存在性 ──────────────────────────────────────
console.log('\n【4】檢查關鍵 CSS class 定義')
const cssFiles = ['base','header','panels','list','preview','modal'].map(
  n => fs.readFileSync(path.join(ROOT, 'src/css/' + n + '.css'), 'utf8')
)
const allCss = cssFiles.join('\n')
const requiredClasses = [
  '.header', '.main-layout', '.panel', '.left-panel', '.center-panel', '.right-panel',
  '.tab-bar', '.tab', '.tab-content', '.tab-content.active',
  '.form-group', '.btn-primary', '.btn-danger-sm',
  '.upload-zone', '.upload-icon', '.ocr-status', '.ocr-preview', '.ocr-result',
  '.batch-hint',
  '.sku-list', '.empty-hint', '.sku-item', '.sku-item-text', '.sku-item-qty', '.sku-item-del',
  '.list-footer', '.print-actions', '.printer-select', '.btn-preview', '.btn-print',
  '.preview-container', '.label-preview', '.label-sku', '.preview-size-info',
  '.modal', '.modal-content', '.modal-header', '.modal-body', '.modal-footer',
  '.setting-group', '.size-inputs', '.align-buttons', '.align-btn',
]
requiredClasses.forEach(cls => {
  check(cls, allCss.includes(cls))
})

// ── 5. JS 關鍵函數存在性 ──────────────────────────────────────
console.log('\n【5】檢查關鍵 JS 函數定義')
const jsFiles = ['settings','list','ocr','batch','preview','print','app'].map(
  n => fs.readFileSync(path.join(ROOT, 'src/js/' + n + '.js'), 'utf8')
)
const allJs = jsFiles.join('\n')
const requiredFunctions = [
  'function loadSettings',
  'function saveSettings',
  'function applySettings',
  'function setupSettings',
  'function addToList',
  'function renderList',
  'function selectItem',
  'function removeItem',
  'function setupList',
  'function setupOCR',
  'function processImage',
  'function setupBatch',
  'function processExcel',
  'function updatePreview',
  'function updateLabelPreviewSize',
  'function buildLabelHtml',
  'function setupManualInput',
  'function loadPrinters',
  'function setupTabs',
  'function escapeHtml',
]
requiredFunctions.forEach(fn => {
  check(fn + '()', allJs.includes(fn))
})

// ── 6. HTML 正確引用新文件 ──────────────────────────────────
console.log('\n【6】檢查 index.html 引用新文件')
const cssLinks = ['css/base.css','css/header.css','css/panels.css','css/list.css','css/preview.css','css/modal.css']
const jsLinks  = ['js/settings.js','js/list.js','js/ocr.js','js/batch.js','js/preview.js','js/print.js','js/app.js']
cssLinks.forEach(f => check('<link> ' + f, html.includes(f)))
jsLinks.forEach(f  => check('<script> ' + f, html.includes(f)))

// 確認舊文件已不再被引用
check('舊 style.css 不再引用', !html.includes('href="style.css"'))
check('舊 app.js 不再引用',   !html.includes('src="app.js"'))

// ── 結果 ────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50))
console.log('結果：通過 ' + passed + ' / 失敗 ' + failed)
if (failed === 0) {
  console.log('🎉 所有檢查通過！可以執行 npm start 驗證運行。\n')
} else {
  console.log('⚠️  有 ' + failed + ' 項未通過，請檢查上方標記的項目。\n')
}
process.exit(failed > 0 ? 1 : 0)
