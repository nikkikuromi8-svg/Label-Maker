// ==================== OCR 圖片識別模塊 ====================

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

  ocrImage.src = URL.createObjectURL(file)
  preview.style.display = 'block'
  result.style.display = 'none'
  status.textContent = '⏳ 正在識別...'

  try {
    const { pathToFileURL } = require('url')
    const workerPath = pathToFileURL(require('path').join(__dirname, 'worker.min.js')).href
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath,
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = '⏳ 識別中 ' + Math.round(m.progress * 100) + '%'
        }
      }
    })
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()

    const tokens = text.split(/[\n\r\s]+/).map(s => s.trim()).filter(s => s.length > 2)

    // 優先匹配條形碼 SKU：字母+數字混合，6-15字符
    const skuPattern = /^[A-Z0-9]{6,15}$/i
    const skuMatch = tokens.find(s => skuPattern.test(s) && /[A-Z]/i.test(s) && /[0-9]/.test(s))
    const bestSku = skuMatch || tokens.sort((a, b) => b.length - a.length)[0] || text.trim()

    document.getElementById('ocrSkuInput').value = bestSku
    result.style.display = 'flex'
    result.style.flexDirection = 'column'
    result.style.gap = '8px'
    status.textContent = '✅ 識別完成，請確認 SKU'
  } catch(e) {
    console.error('OCR error:', e)
    status.textContent = '❌ 識別失敗：' + e.message
  }
}
