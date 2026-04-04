// ==================== SKU 列表模塊 ====================

var skuList = []
var selectedIndex = -1

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

function addToList(sku, qty) {
  qty = qty || 1
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
  document.getElementById('totalCount').textContent = '共 ' + total + ' 個標籤'

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
