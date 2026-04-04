// ==================== 主入口 & 工具函數 ====================
// 瀏覽器版：移除 require('electron')、require('xlsx')、require('tesseract.js')
// XLSX 和 Tesseract 均由 index.html 的 CDN script 標籤載入為全局變量

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
      tab.classList.add('active')
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active')
    })
  })
}

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
