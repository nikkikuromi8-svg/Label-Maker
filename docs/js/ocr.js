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

// 用 ZXing 解條形碼
async function tryBarcode(imageUrl) {
  try {
    const hints = new Map()
    const formats = [
      ZXingBrowser.BarcodeFormat.CODE_128,
      ZXingBrowser.BarcodeFormat.CODE_39,
      ZXingBrowser.BarcodeFormat.EAN_13,
      ZXingBrowser.BarcodeFormat.EAN_8,
      ZXingBrowser.BarcodeFormat.UPC_A,
      ZXingBrowser.BarcodeFormat.QR_CODE,
    ]
    hints.set(ZXingBrowser.DecodeHintType.POSSIBLE_FORMATS, formats)
    const reader = new ZXingBrowser.BrowserMultiFormatReader(hints)
    const img = new Image()
    img.src = imageUrl
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej })
    const result = await reader.decodeFromImageElement(img)
    return result.getText()
  } catch(e) {
    return null
  }
}

async function processImage(file) {
  const status = document.getElementById('ocrStatus')
  const preview = document.getElementById('ocrPreview')
  const result = document.getElementById('ocrResult')
  const ocrImage = document.getElementById('ocrImage')

  const imageUrl = URL.createObjectURL(file)
  ocrImage.src = imageUrl
  preview.style.display = 'block'
  result.style.display = 'none'
  status.textContent = '⏳ 正在識別條形碼...'

  try {
    // 先嘗試條形碼解碼
    const barcodeResult = await tryBarcode(imageUrl)
    if (barcodeResult) {
      document.getElementById('ocrSkuInput').value = barcodeResult
      result.style.display = 'flex'
      result.style.flexDirection = 'column'
      result.style.gap = '8px'
      status.textContent = '✅ 條形碼識別成功，請確認 SKU'
      return
    }

    // 條形碼失敗，退用 OCR
    status.textContent = '⏳ 條形碼未識別，嘗試文字識別...'
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = '⏳ 文字識別中 ' + Math.round(m.progress * 100) + '%'
        }
      }
    })

    const tokens = text.split(/[\n\r\s]+/).map(s => s.trim()).filter(s => s.length > 2)
    const skuPattern = /^[A-Z0-9]{6,15}$/i
    const skuMatch = tokens.find(s => skuPattern.test(s) && /[A-Z]/i.test(s) && /[0-9]/.test(s))
    const bestSku = skuMatch || tokens.sort((a, b) => b.length - a.length)[0] || text.trim()

    document.getElementById('ocrSkuInput').value = bestSku
    result.style.display = 'flex'
    result.style.flexDirection = 'column'
    result.style.gap = '8px'
    status.textContent = '✅ 識別完成，請確認 SKU'
  } catch(e) {
    console.error('識別錯誤:', e)
    status.textContent = '❌ 識別失敗，請手動輸入'
  }
}
