// ==================== 打印機 & 打印模塊 ====================

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

document.getElementById('previewBtn').addEventListener('click', async () => {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }
  const btn = document.getElementById('previewBtn')
  btn.disabled = true
  btn.textContent = '⏳ 生成中...'

  const justifyMap = { center: 'center', left: 'flex-start', right: 'flex-end' }
  const labelsHtml = skuList.map(item =>
    Array(item.qty).fill(null).map(() =>
      `<div class="label-page"><div class="label-sku">${escapeHtml(item.sku)}</div></div>`
    ).join('')
  ).join('')

  try {
    await ipcRenderer.invoke('preview-pdf', {
      labelsHtml,
      width: settings.width,
      height: settings.height,
      fontSize: settings.fontSize,
      fontWeight: settings.fontWeight,
      textAlign: settings.textAlign,
      justifyContent: justifyMap[settings.textAlign] || 'center'
    })
  } catch(e) {
    alert('預覽失敗: ' + e.message)
  } finally {
    btn.disabled = false
    btn.textContent = '👁 預覽'
  }
})

document.getElementById('printBtn').addEventListener('click', async () => {
  if (skuList.length === 0) {
    alert('請先添加 SKU')
    return
  }
  const btn = document.getElementById('printBtn')
  btn.disabled = true
  btn.textContent = '⏳ 生成中...'

  const justifyMap = { center: 'center', left: 'flex-start', right: 'flex-end' }
  const labelsHtml = skuList.map(item =>
    Array(item.qty).fill(null).map(() =>
      `<div class="label-page"><div class="label-sku">${escapeHtml(item.sku)}</div></div>`
    ).join('')
  ).join('')

  const printerName = document.getElementById('printerSelect').value
  try {
    await ipcRenderer.invoke('preview-pdf', {
      labelsHtml,
      width: settings.width,
      height: settings.height,
      fontSize: settings.fontSize,
      fontWeight: settings.fontWeight,
      textAlign: settings.textAlign,
      justifyContent: justifyMap[settings.textAlign] || 'center',
      printerName
    })
    // 打印後清空列表
    skuList = []
    selectedIndex = -1
    renderList()
    updatePreview('SKU-EXAMPLE')
  } catch(e) {
    alert('打印出錯: ' + e.message)
  } finally {
    btn.disabled = false
    btn.textContent = '🖨️ 打印'
  }
})
