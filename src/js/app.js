// ==================== 主入口 & 工具函數 ====================

const { ipcRenderer } = require('electron')
const XLSX = require('xlsx')
const Tesseract = require('tesseract.js')

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
