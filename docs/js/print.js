// ==================== 打印模塊 ====================
// 瀏覽器版：移除 ipcRenderer，改用 window.print() + @media print 實現

// 網頁版不支援枚舉打印機，loadPrinters 保留為空函數供 app.js 調用
function loadPrinters() {
  // 瀏覽器無法枚舉系統打印機，由操作系統打印對話框選擇
}

// 將標籤 HTML 注入動態 style + 隱藏 div，觸發 window.print()
function printLabels() {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }

  const justifyMap = { center: 'center', left: 'flex-start', right: 'flex-end' }
  const justifyContent = justifyMap[settings.textAlign] || 'center'

  // 建立標籤 HTML 片段
  const labelsHtml = skuList.map(item =>
    Array(item.qty).fill(null).map(() =>
      `<div class="lm-print-page"><div class="lm-print-sku">${escapeHtml(item.sku)}</div></div>`
    ).join('')
  ).join('')

  // 動態插入打印專用 style
  const styleId = 'lm-print-style'
  let styleEl = document.getElementById(styleId)
  if (styleEl) styleEl.remove()

  styleEl = document.createElement('style')
  styleEl.id = styleId
  styleEl.textContent = `
    @media print {
      /* 隱藏整個 App UI */
      body > #app { display: none !important; }
      /* 隱藏所有 modal */
      .modal { display: none !important; }
      /* 只顯示打印容器 */
      #lm-print-container { display: block !important; }
    }
    @page {
      size: ${settings.width}mm ${settings.height}mm;
      margin: 0;
    }
    #lm-print-container {
      display: none;
    }
    .lm-print-page {
      width: ${settings.width}mm;
      height: ${settings.height}mm;
      display: flex;
      align-items: center;
      justify-content: ${justifyContent};
      padding: 8mm;
      page-break-after: always;
      break-after: page;
    }
    .lm-print-sku {
      font-family: 'Courier New', monospace;
      font-size: ${settings.fontSize}mm;
      font-weight: ${settings.fontWeight};
      text-align: ${settings.textAlign};
      word-break: break-all;
      line-height: 1.3;
      width: 100%;
    }
  `
  document.head.appendChild(styleEl)

  // 動態插入（或更新）打印容器
  let container = document.getElementById('lm-print-container')
  if (!container) {
    container = document.createElement('div')
    container.id = 'lm-print-container'
    document.body.appendChild(container)
  }
  container.innerHTML = labelsHtml

  // 觸發打印
  window.print()

  // 打印對話框關閉後清理並清空列表
  const cleanup = () => {
    styleEl.remove()
    container.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
    skuList = []
    selectedIndex = -1
    renderList()
    updatePreview('SKU-EXAMPLE')
  }
  window.addEventListener('afterprint', cleanup)
}

// 預覽：在新分頁開啟完整標籤 HTML，瀏覽器可直接預覽或打印
function previewLabels() {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }

  const html = buildLabelHtml()
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')

  // 釋放 Blob URL（延遲一段時間確保新分頁已載入）
  if (win) {
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  } else {
    alert('請允許彈出視窗以使用預覽功能')
    URL.revokeObjectURL(url)
  }
}

document.getElementById('previewBtn').addEventListener('click', () => {
  const btn = document.getElementById('previewBtn')
  btn.disabled = true
  btn.textContent = '⏳ 生成中...'
  try {
    previewLabels()
  } finally {
    btn.disabled = false
    btn.textContent = '👁 預覽'
  }
})

document.getElementById('printBtn').addEventListener('click', () => {
  const btn = document.getElementById('printBtn')
  btn.disabled = true
  btn.textContent = '⏳ 打印中...'
  try {
    printLabels()
  } finally {
    btn.disabled = false
    btn.textContent = '🖨️ 打印'
  }
})
