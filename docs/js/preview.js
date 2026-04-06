// ==================== 預覽 & 標籤生成模塊 ====================

function updatePreview(sku) {
  const el = document.getElementById('previewSku')
  el.textContent = sku
  const container = document.querySelector('.preview-container')
  const ratio = Math.min(
    (container.offsetWidth - 32) / settings.width,
    (container.offsetHeight - 32) / settings.height
  ) * 0.85
  el.style.fontSize = (settings.fontSize * ratio) + 'px'
  el.style.fontWeight = settings.fontWeight
  el.style.textAlign = settings.textAlign
}

function updateLabelPreviewSize() {
  const preview = document.getElementById('labelPreview')
  const container = document.querySelector('.preview-container')
  const containerW = container.offsetWidth - 32
  const containerH = container.offsetHeight - 32
  const ratio = Math.min(containerW / settings.width, containerH / settings.height) * 0.85
  preview.style.width = (settings.width * ratio) + 'px'
  preview.style.height = (settings.height * ratio) + 'px'
  document.getElementById('previewSizeInfo').textContent =
    settings.width + ' mm × ' + settings.height + ' mm'
}

function buildLabelHtml() {
  const justifyMap = { center: 'center', left: 'flex-start', right: 'flex-end' }
  const labelsHtml = skuList.filter(item => item.status !== 'printed').map(item =>
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

window.addEventListener('resize', updateLabelPreviewSize)
