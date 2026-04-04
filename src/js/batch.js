// ==================== 批量匯入模塊 ====================

var batchData = []

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
    document.getElementById('batchStatus').textContent = '✅ 已加入 ' + batchData.length + ' 條 SKU'
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
            row[0].toLowerCase().includes('sku')) return
        const sku = String(row[0] || '').trim()
        const qty = parseInt(row[1]) || 1
        if (sku) batchData.push({ sku, qty })
      })

      if (batchData.length === 0) {
        status.textContent = '❌ 未找到有效數據'
        preview.style.display = 'none'
        return
      }

      document.getElementById('batchInfo').textContent = '找到 ' + batchData.length + ' 條 SKU 記錄'
      preview.style.display = 'block'
      status.textContent = ''
    } catch(err) {
      status.textContent = '❌ 文件讀取失敗'
    }
  }
  reader.readAsArrayBuffer(file)
}
