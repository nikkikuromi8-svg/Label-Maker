// ==================== SKU 列表模塊 ====================

var skuList = []
var selectedIndex = -1
var dropdownActiveIndex = -1

// ---- 歷史記錄 ----
function loadSkuHistory() {
  try { return JSON.parse(localStorage.getItem('skuHistory') || '[]') } catch(e) { return [] }
}

function saveToHistory(sku) {
  let history = loadSkuHistory()
  history = [sku, ...history.filter(s => s !== sku)].slice(0, 30)
  localStorage.setItem('skuHistory', JSON.stringify(history))
}

// ---- 下拉選單 ----
function renderDropdown(keyword) {
  const dropdown = document.getElementById('skuDropdown')
  const history = loadSkuHistory()
  const filtered = keyword
    ? history.filter(s => s.toUpperCase().includes(keyword.toUpperCase()))
    : history

  if (filtered.length === 0) {
    dropdown.innerHTML = keyword
      ? `<div class="sku-dropdown-empty">沒有符合的記錄</div>`
      : `<div class="sku-dropdown-empty">尚無歷史記錄</div>`
  } else {
    const header = keyword ? '搜尋結果' : '最近使用'
    dropdown.innerHTML = `<div class="sku-dropdown-header">${header}</div>` +
      filtered.map((s, i) => `
        <div class="sku-dropdown-item" data-sku="${escapeHtml(s)}" data-i="${i}">
          <span class="sku-drop-icon">${keyword ? '🔍' : '🕒'}</span>
          ${escapeHtml(s)}
        </div>`).join('')
    dropdown.querySelectorAll('.sku-dropdown-item').forEach(el => {
      el.addEventListener('mousedown', e => {
        e.preventDefault()
        document.getElementById('skuInput').value = el.dataset.sku
        closeDropdown()
      })
    })
  }
  dropdownActiveIndex = -1
  dropdown.classList.add('open')
}

function closeDropdown() {
  document.getElementById('skuDropdown').classList.remove('open')
  dropdownActiveIndex = -1
}

function setupManualInput() {
  const skuInput = document.getElementById('skuInput')
  const qtyInput = document.getElementById('qtyInput')

  skuInput.addEventListener('focus', () => renderDropdown(skuInput.value.trim()))
  skuInput.addEventListener('input', () => renderDropdown(skuInput.value.trim()))

  skuInput.addEventListener('keydown', e => {
    const dropdown = document.getElementById('skuDropdown')
    const items = dropdown.querySelectorAll('.sku-dropdown-item')
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      dropdownActiveIndex = Math.min(dropdownActiveIndex + 1, items.length - 1)
      items.forEach((el, i) => el.classList.toggle('active', i === dropdownActiveIndex))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      dropdownActiveIndex = Math.max(dropdownActiveIndex - 1, -1)
      items.forEach((el, i) => el.classList.toggle('active', i === dropdownActiveIndex))
    } else if (e.key === 'Enter') {
      if (dropdownActiveIndex >= 0 && items[dropdownActiveIndex]) {
        e.preventDefault()
        skuInput.value = items[dropdownActiveIndex].dataset.sku
        closeDropdown()
      } else {
        closeDropdown()
        document.getElementById('addManualSku').click()
      }
    } else if (e.key === 'Escape') {
      closeDropdown()
    }
  })

  skuInput.addEventListener('blur', () => setTimeout(closeDropdown, 150))

  document.getElementById('addManualSku').addEventListener('click', () => {
    const sku = skuInput.value.trim()
    const qty = parseInt(qtyInput.value) || 1
    if (!sku) { skuInput.focus(); return }
    saveToHistory(sku)
    addToList(sku, qty)
    skuInput.value = ''
    skuInput.focus()
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
