// ==================== Self-Healing 條碼掃描模塊 ====================
// robustScan(img) — 多策略自動修復條碼識別
// 策略順序：多尺度 → Otsu二值化 → ROI裁剪 → 裁剪+二值化
// 每個策略都嘗試 0°, 90°, 180°, 270° 四個旋轉角度

async function robustScan(img) {
  if (typeof ZXingBrowser === 'undefined') throw new Error('SCAN_FAILED')

  const reader = new ZXingBrowser.BrowserMultiFormatReader()
  const ROTATIONS = [0, 90, 180, 270]
  const SCALES    = [1, 1.5, 1.2, 0.5]

  // --- 工具函數 ---

  // 圖片 → canvas（縮放 + 旋轉）
  function toCanvas(src, scale, deg) {
    const ow = src.naturalWidth  || src.width
    const oh = src.naturalHeight || src.height
    const w = ow * scale
    const h = oh * scale
    const canvas = document.createElement('canvas')
    const ctx    = canvas.getContext('2d')
    const rad    = deg * Math.PI / 180
    // 旋轉 90/270 時寬高互換
    if (deg === 90 || deg === 270) {
      canvas.width = h; canvas.height = w
    } else {
      canvas.width = w; canvas.height = h
    }
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rad)
    ctx.scale(scale, scale)
    ctx.drawImage(src, -ow / 2, -oh / 2)
    return canvas
  }

  // Otsu 全域二值化（解決光線不均、反光問題）
  function otsuBinarize(canvas) {
    const src = document.createElement('canvas')
    src.width = canvas.width; src.height = canvas.height
    const ctx = src.getContext('2d')
    ctx.drawImage(canvas, 0, 0)
    const imageData = ctx.getImageData(0, 0, src.width, src.height)
    const d = imageData.data
    const n = src.width * src.height

    // 建立灰度直方圖
    const hist = new Array(256).fill(0)
    for (let i = 0; i < d.length; i += 4) {
      hist[Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])]++
    }

    // Otsu 最佳閾值
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

    // 套用閾值 → 黑白圖
    for (let i = 0; i < d.length; i += 4) {
      const gray = Math.round(0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2])
      const val  = gray > threshold ? 255 : 0
      d[i] = d[i+1] = d[i+2] = val
      d[i+3] = 255
    }
    ctx.putImageData(imageData, 0, 0)
    return src
  }

  // 裁剪中心 ROI（過濾背景干擾）
  function cropCenter(canvas, ratio) {
    const sw = Math.floor(canvas.width  * ratio)
    const sh = Math.floor(canvas.height * ratio)
    const sx = Math.floor((canvas.width  - sw) / 2)
    const sy = Math.floor((canvas.height - sh) / 2)
    const out = document.createElement('canvas')
    out.width = sw; out.height = sh
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh)
    return out
  }

  // ZXing 解碼（取得任何結果即回傳）
  async function tryDecode(canvas) {
    try {
      const result = await reader.decodeFromCanvas(canvas)
      const text = result.getText().trim()
      if (text.length > 0) return text
    } catch(e) { /* 繼續下一個策略 */ }
    return null
  }

  // --- 主流程（依序嘗試各策略，成功立即回傳）---

  // 策略 1：多尺度縮放 × 自動旋轉
  for (const scale of SCALES) {
    for (const deg of ROTATIONS) {
      const r = await tryDecode(toCanvas(img, scale, deg))
      if (r) return r
    }
  }

  // 策略 2：Otsu 二值化 × 自動旋轉
  for (const scale of [1, 1.5]) {
    for (const deg of ROTATIONS) {
      const r = await tryDecode(otsuBinarize(toCanvas(img, scale, deg)))
      if (r) return r
    }
  }

  // 策略 3：局部裁剪 ROI × 自動旋轉
  for (const ratio of [0.7, 0.5]) {
    for (const scale of [1, 1.5]) {
      for (const deg of ROTATIONS) {
        // 3a. 純裁剪
        const r1 = await tryDecode(cropCenter(toCanvas(img, scale, deg), ratio))
        if (r1) return r1
        // 3b. 裁剪 + 二值化
        const r2 = await tryDecode(otsuBinarize(cropCenter(toCanvas(img, scale, deg), ratio)))
        if (r2) return r2
      }
    }
  }

  throw new Error('SCAN_FAILED')
}
