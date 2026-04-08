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

// 圖片畫到 canvas（縮放 + 旋轉）
function buildCanvas(img, scale, deg) {
  const ow = img.naturalWidth || img.width
  const oh = img.naturalHeight || img.height
  const w = ow * scale
  const h = oh * scale
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const rad = deg * Math.PI / 180
  if (deg === 90 || deg === 270) {
    canvas.width = h; canvas.height = w
  } else {
    canvas.width = w; canvas.height = h
  }
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(rad)
  ctx.scale(scale, scale)
  ctx.drawImage(img, -ow / 2, -oh / 2)
  return canvas
}

// Otsu 二值化（解決反光/光線不均）
function otsuBinarize(canvas) {
  const out = document.createElement('canvas')
  out.width = canvas.width; out.height = canvas.height
  const ctx = out.getContext('2d')
  ctx.drawImage(canvas, 0, 0)
  const imageData = ctx.getImageData(0, 0, out.width, out.height)
  const d = imageData.data
  const n = out.width * out.height
  const hist = new Array(256).fill(0)
  for (let i = 0; i < d.length; i += 4) {
    hist[Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])]++
  }
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * hist[i]
  let sumB = 0, wB = 0, maxVar = 0, threshold = 128
  for (let t = 0; t < 256; t++) {
    wB += hist[t]
    if (!wB) continue
    const wF = n - wB
    if (!wF) break
    sumB += t * hist[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const v = wB * wF * (mB - mF) ** 2
    if (v > maxVar) { maxVar = v; threshold = t }
  }
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])
    const val = gray > threshold ? 255 : 0
    d[i] = d[i+1] = d[i+2] = val; d[i+3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  return out
}

// 裁剪中心區域
function cropCenter(canvas, ratio) {
  const sw = Math.floor(canvas.width * ratio)
  const sh = Math.floor(canvas.height * ratio)
  const sx = Math.floor((canvas.width - sw) / 2)
  const sy = Math.floor((canvas.height - sh) / 2)
  const out = document.createElement('canvas')
  out.width = sw; out.height = sh
  out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
  return out
}

// ZXing 條碼解碼（多策略自我修復）
async function robustBarcodeScan(img) {
  const ZXing = require('@zxing/browser')
  const reader = new ZXing.BrowserMultiFormatReader()
  const ROTATIONS = [0, 90, 180, 270]
  const SCALES = [1, 1.5, 1.2, 0.5]

  async function tryDecode(canvas) {
    try {
      const result = await reader.decodeFromCanvas(canvas)
      if (result) return result.getText().trim()
    } catch(e) {}
    return null
  }

  // 策略1：多尺度 × 多角度
  for (const scale of SCALES) {
    for (const deg of ROTATIONS) {
      const r = await tryDecode(buildCanvas(img, scale, deg))
      if (r) return r
    }
  }

  // 策略2：Otsu 二值化 × 多角度
  for (const scale of [1, 1.5]) {
    for (const deg of ROTATIONS) {
      const r = await tryDecode(otsuBinarize(buildCanvas(img, scale, deg)))
      if (r) return r
    }
  }

  // 策略3：ROI 裁剪 × 多角度（含二值化）
  for (const ratio of [0.7, 0.5]) {
    for (const scale of [1, 1.5]) {
      for (const deg of ROTATIONS) {
        const c = buildCanvas(img, scale, deg)
        const r1 = await tryDecode(cropCenter(c, ratio))
        if (r1) return r1
        const r2 = await tryDecode(otsuBinarize(cropCenter(c, ratio)))
        if (r2) return r2
      }
    }
  }

  return null
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
    // 載入圖片
    const img = new Image()
    img.src = imageUrl
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej })

    // 優先用 ZXing 條碼掃描
    const barcodeResult = await robustBarcodeScan(img)
    if (barcodeResult) {
      document.getElementById('ocrSkuInput').value = barcodeResult
      result.style.display = 'flex'
      result.style.flexDirection = 'column'
      result.style.gap = '8px'
      status.textContent = '✅ 條形碼識別成功，請確認 SKU'
      return
    }

    // 條碼失敗，退用 Tesseract OCR
    status.textContent = '⏳ 條形碼未識別，嘗試文字識別...'
    const workerPath = require('path').join(__dirname, 'worker.min.js')
    const worker = await Tesseract.createWorker('eng', 1, {
      workerPath,
      logger: m => {
        if (m.status === 'recognizing text') {
          status.textContent = '⏳ 文字識別中 ' + Math.round(m.progress * 100) + '%'
        }
      }
    })
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()

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
    status.textContent = '❌ 識別失敗：' + e.message
  }
}
