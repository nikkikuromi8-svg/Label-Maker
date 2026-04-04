const { ipcRenderer } = require('electron')
const XLSX = require('xlsx')
const Tesseract = require('tesseract.js')
const path = require('path')

// ==================== 狀態 ====================
let skuList = []
let selectedIndex = -1
let settings = loadSettings()
let batchData = []

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  applySettings()
  loadPrinters()
  setupTabs()
  setupManualInput()
  setupOCR()
  setupBatch()
  setupList()
  setupSettings()
  updatePreview('SKU-EXAMPLE')
})

// ==================== 設置 ====================
function loadSettings() {
  try {
    const saved = localStorage.getItem('labelSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      // 如果是舊的直向預設值，重置為橫向
      if (parsed.width === 100 && parsed.height === 150) {
        parsed.width = 150
        parsed.height = 100
      }
      // 重置舊的 pt 單位為 mm
      if (parsed.fontSize >= 20) {
        parsed.fontSize = 15
      }
      return parsed
    }
  } catch(e) {}
  return {
    width: 150,
    height: 100,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center'
  }
}

function saveSettings() {
  localStorage.setItem('labelSettings', JSON.stringify(settings))
}

function applySettings() {
  document.getElementById('labelWidth').value = settings.width
  document.getElementById('labelHeight').value = settings.height
  document.getElementById('fontSize').value = settings.fontSize
  document.getElementById('fontWeight').value = settings.fontWeight

  // 對齊按鈕
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === settings.textAlign)
  })

  updateLabelPreviewSize()
}

// ==================== 標籤頁 ====================
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
      tab.classList.add('active')
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active')
    })
  })
}

// ==================== 手動輸入 ====================
function setupManualInput() {
  const skuInput = document.getElementById('skuInput')
  const qtyInput = document.getElementById('qtyInput')

  document.getElementById('addManualSku').addEventListener('click', () => {
    const sku = skuInput.value.trim()
    const qty = parseInt(qtyInput.value) || 1
    if (!sku) { skuInput.focus(); return }
    addToList(sku, qty)
    skuInput.value = ''
    skuInput.focus()
  })

  skuInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('addManualSku').click()
  })
}

// ==================== OCR ====================
function setupOCR() {
  const uploadZone = document.getElementById('uploadZone')
  const imageInput = document.getElementById('imageInput')

  uploadZone.addEventListener('click', () => imageInput.click())
  imageInput.addEventListener('change', e => {
    if (e.target.files[0]) processImage(e.target.files[0])
  })

  uploadZone.addEventListener('dragover', e => {
    e.preventDefault()
    uploadZone.classList.add('drag-over')
  })
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'))
  uploadZone.addEventListener('drop', e => {
    e.preventDefault()
    uploadZone.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) processImage(file)
  })

  document.getElementById('addOcrSku').addEventListener('click', () => {
    const sku = document.getElementById('ocrSkuInput').value.trim()
    const qty = parseInt(document.getElementById('ocrQtyInput').value) || 1
    if (!sku) return
    addToList(sku, qty)
    document.getElementById('ocrResult').style.display = 'none'
    document.getElementById('ocrPreview').style.display = 'none'
    document.getElementById('ocrStatus').textContent = ''
    document.getElementById('imageInput').value = ''
  })
}

async function processImage(file) {
  const status = document.getElementById('ocrStatus')
  const preview = document.getElementById('ocrPreview')
  const result = document.getElementById('ocrResult')
  const ocrImage = document.getElementById('ocrImage')

  // 顯示圖片預覽
  const url = URL.createObjectURL(file)
  ocrImage.src = url
  preview.style.display = 'block'
  result.style.display = 'none'
  status.textContent = '⏳ 正在識別...'

  try {
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = `⏳ 識別中 ${Math.round(m.progress * 100)}%`
        }
      }
    })

    // 提取可能是 SKU 的文字（去除空格、換行，取最長連續字符串）
    const skuCandidates = text.split(/[\n\r\s]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2)

    const bestSku = skuCandidates.sort((a, b) => b.length - a.length)[0] || text.trim()

    document.getElementById('ocrSkuInput').value = bestSku
    result.style.display = 'flex'
    result.style.flexDirection = 'column'
    result.style.gap = '8px'
    status.textContent = '✅ 識別完成，請確認 SKU'
  } catch(e) {
    status.textContent = '❌ 識別失敗，請手動輸入'
  }
}

// ==================== 批量匯入 ====================
function setupBatch() {
  const zone = document.getElementById('excelUploadZone')
  const input = document.getElementById('excelInput')

  zone.addEventListener('click', () => input.click())
  input.addEventListener('change', e => {
    if (e.target.files[0]) processExcel(e.target.files[0])
  })

  zone.addEventListener('dragover', e => {
    e.preventDefault()
    zone.classList.add('drag-over')
  })
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'))
  zone.addEventListener('drop', e => {
    e.preventDefault()
    zone.classList.remove('drag-over')
    const file = e.dataTransfer.files[0]
    if (file) processExcel(file)
  })

  document.getElementById('addAllBatch').addEventListener('click', () => {
    batchData.forEach(({ sku, qty }) => addToList(sku, qty))
    document.getElementById('batchPreview').style.display = 'none'
    document.getElementById('batchStatus').textContent = `✅ 已加入 ${batchData.length} 條 SKU`
    batchData = []
    document.getElementById('excelInput').value = ''
  })
}

function processExcel(file) {
  const status = document.getElementById('batchStatus')
  const preview = document.getElementById('batchPreview')
  status.textContent = '⏳ 讀取中...'

  const reader = new FileReader()
  reader.onload = e => {
    try {
      const workbook = XLSX.read(e.target.result, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 })

      batchData = []
      data.forEach((row, i) => {
        if (i === 0 && isNaN(row[0]) && typeof row[0] === 'string' &&
            row[0].toLowerCase().includes('sku')) return // 跳過標題行

        const sku = String(row[0] || '').trim()
        const qty = parseInt(row[1]) || 1
        if (sku) batchData.push({ sku, qty })
      })

      if (batchData.length === 0) {
        status.textContent = '❌ 未找到有效數據'
        preview.style.display = 'none'
        return
      }

      document.getElementById('batchInfo').textContent =
        `找到 ${batchData.length} 條 SKU 記錄`
      preview.style.display = 'block'
      status.textContent = ''
    } catch(err) {
      status.textContent = '❌ 文件讀取失敗'
    }
  }
  reader.readAsArrayBuffer(file)
}

// ==================== SKU 列表 ====================
function setupList() {
  document.getElementById('clearList').addEventListener('click', () => {
    if (skuList.length === 0) return
    if (confirm('確定要清空列表嗎？')) {
      skuList = []
      selectedIndex = -1
      renderList()
      updatePreview('SKU-EXAMPLE')
    }
  })
}

function addToList(sku, qty = 1) {
  // 如果已存在相同 SKU，累加數量
  const existing = skuList.find(item => item.sku === sku)
  if (existing) {
    existing.qty += qty
  } else {
    skuList.push({ sku, qty })
  }
  renderList()
  updatePreview(sku)
}

function renderList() {
  const container = document.getElementById('skuList')
  const total = skuList.reduce((sum, item) => sum + item.qty, 0)

  document.getElementById('totalCount').textContent = `共 ${total} 個標籤`

  if (skuList.length === 0) {
    container.innerHTML = '<div class="empty-hint">尚未添加任何 SKU</div>'
    return
  }

  container.innerHTML = skuList.map((item, i) => `
    <div class="sku-item ${i === selectedIndex ? 'selected' : ''}"
         onclick="selectItem(${i})" data-index="${i}">
      <span class="sku-item-text">${escapeHtml(item.sku)}</span>
      <span class="sku-item-qty">×${item.qty}</span>
      <button class="sku-item-del" onclick="removeItem(event, ${i})">✕</button>
    </div>
  `).join('')
}

function selectItem(index) {
  selectedIndex = index
  renderList()
  if (skuList[index]) updatePreview(skuList[index].sku)
}

function removeItem(e, index) {
  e.stopPropagation()
  skuList.splice(index, 1)
  if (selectedIndex >= skuList.length) selectedIndex = skuList.length - 1
  renderList()
  if (skuList[selectedIndex]) updatePreview(skuList[selectedIndex].sku)
  else updatePreview('SKU-EXAMPLE')
}

// ==================== 預覽 ====================
function updatePreview(sku) {
  const el = document.getElementById('previewSku')
  el.textContent = sku
  // 將 mm 換算成 px 再按預覽縮放比例縮小
  const container = document.querySelector('.preview-container')
  const ratio = Math.min(
    (container.offsetWidth - 32) / settings.width,
    (container.offsetHeight - 32) / settings.height
  ) * 0.85
  el.style.fontSize = `${settings.fontSize * ratio}px`
  el.style.fontWeight = settings.fontWeight
  el.style.textAlign = settings.textAlign
}

function updateLabelPreviewSize() {
  const preview = document.getElementById('labelPreview')
  const container = document.querySelector('.preview-container')
  const containerW = container.offsetWidth - 32
  const containerH = container.offsetHeight - 32

  // 按比例縮放到預覽框
  const ratio = Math.min(containerW / settings.width, containerH / settings.height) * 0.85
  preview.style.width = `${settings.width * ratio}px`
  preview.style.height = `${settings.height * ratio}px`

  document.getElementById('previewSizeInfo').textContent =
    `${settings.width} mm × ${settings.height} mm`
}

// ==================== 設置彈窗 ====================
function setupSettings() {
  document.getElementById('openSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex'
    applySettings()
  })

  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none'
  })

  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  document.getElementById('saveSettings').addEventListener('click', () => {
    settings.width = parseInt(document.getElementById('labelWidth').value) || 100
    settings.height = parseInt(document.getElementById('labelHeight').value) || 150
    settings.fontSize = parseInt(document.getElementById('fontSize').value) || 32
    settings.fontWeight = document.getElementById('fontWeight').value
    settings.textAlign = document.querySelector('.align-btn.active')?.dataset.align || 'center'

    saveSettings()
    updateLabelPreviewSize()
    const currentSku = selectedIndex >= 0 ? skuList[selectedIndex]?.sku : 'SKU-EXAMPLE'
    updatePreview(currentSku || 'SKU-EXAMPLE')
    document.getElementById('settingsModal').style.display = 'none'
  })
}

// ==================== 打印機 ====================
async function loadPrinters() {
  try {
    const printers = await ipcRenderer.invoke('get-printers')
    const select = document.getElementById('printerSelect')
    printers.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.name
      opt.textContent = p.name
      if (p.isDefault) opt.selected = true
      select.appendChild(opt)
    })
  } catch(e) {
    console.error('獲取打印機失敗', e)
  }
}

// ==================== 生成標籤 HTML ====================
function buildLabelHtml() {
  const justifyMap = { center: 'center', left: 'flex-start', right: 'flex-end' }
  const labelsHtml = skuList.map(item =>
    Array(item.qty).fill(null).map(() => `
      <div class="label-page">
        <div class="label-sku">${escapeHtml(item.sku)}</div>
      </div>
    `).join('')
  ).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: ${settings.width}mm; }
  .label-page {
    width: ${settings.width}mm;
    height: ${settings.height}mm;
    display: flex;
    align-items: center;
    justify-content: ${justifyMap[settings.textAlign] || 'center'};
    padding: 8mm;
    page-break-after: always;
  }
  .label-sku {
    font-family: 'Courier New', monospace;
    font-size: ${settings.fontSize}mm;
    font-weight: ${settings.fontWeight};
    text-align: ${settings.textAlign};
    word-break: break-all;
    line-height: 1.3;
    width: 100%;
  }
  @page {
    size: ${settings.width}mm ${settings.height}mm;
    margin: 0;
  }
</style>
</head>
<body>${labelsHtml}</body>
</html>`
}

// ==================== PDF 預覽 ====================
document.getElementById('previewBtn').addEventListener('click', async () => {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }
  const btn = document.getElementById('previewBtn')
  btn.disabled = true
  btn.textContent = '⏳ 生成中...'

  try {
    await ipcRenderer.invoke('preview-pdf', {
      htmlContent: buildLabelHtml(),
      width: settings.width,
      height: settings.height
    })
  } catch(e) {
    alert('預覽失敗: ' + e.message)
  } finally {
    btn.disabled = false
    btn.textContent = '👁 預覽'
  }
})

// ==================== 打印 ====================
document.getElementById('printBtn').addEventListener('click', async () => {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }

  const printerName = document.getElementById('printerSelect').value
  const btn = document.getElementById('printBtn')
  btn.disabled = true
  btn.textContent = '⏳ 打印中...'

  try {
    const result = await ipcRenderer.invoke('print-label', {
      htmlContent: buildLabelHtml(),
      printerName,
      width: settings.width,
      height: settings.height,
      silent: false
    })

    if (result.success) {
      btn.textContent = '✅ 打印成功'
      setTimeout(() => {
        btn.disabled = false
        btn.textContent = '🖨️ 打印'
      }, 2000)
    } else {
      alert(`打印失敗: ${result.errorType}`)
      btn.disabled = false
      btn.textContent = '🖨️ 打印'
    }
  } catch(e) {
    alert('打印出錯: ' + e.message)
    btn.disabled = false
    btn.textContent = '🖨️ 打印'
  }
})

// ==================== 工具函數 ====================
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 窗口大小變化時重新計算預覽
window.addEventListener('resize', updateLabelPreviewSize)
