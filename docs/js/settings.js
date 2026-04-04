// ==================== 設置模塊 ====================

function loadSettings() {
  try {
    const saved = localStorage.getItem('labelSettings')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.width === 100 && parsed.height === 150) {
        parsed.width = 150
        parsed.height = 100
      }
      if (parsed.fontSize >= 20) {
        parsed.fontSize = 15
      }
      return parsed
    }
  } catch(e) {}
  return {
    width: 150,
    height: 100,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center'
  }
}

var settings = loadSettings()

function saveSettings() {
  localStorage.setItem('labelSettings', JSON.stringify(settings))
}

function applySettings() {
  document.getElementById('labelWidth').value = settings.width
  document.getElementById('labelHeight').value = settings.height
  document.getElementById('fontSize').value = settings.fontSize
  document.getElementById('fontWeight').value = settings.fontWeight
  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.align === settings.textAlign)
  })
  updateLabelPreviewSize()
}

function setupSettings() {
  document.getElementById('openSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex'
    applySettings()
  })

  document.getElementById('closeSettings').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'none'
  })

  document.querySelectorAll('.align-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.align-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
  })

  document.getElementById('saveSettings').addEventListener('click', () => {
    settings.width = parseInt(document.getElementById('labelWidth').value) || 150
    settings.height = parseInt(document.getElementById('labelHeight').value) || 100
    settings.fontSize = parseInt(document.getElementById('fontSize').value) || 15
    settings.fontWeight = document.getElementById('fontWeight').value
    settings.textAlign = document.querySelector('.align-btn.active')?.dataset.align || 'center'
    saveSettings()
    updateLabelPreviewSize()
    const currentSku = selectedIndex >= 0 ? skuList[selectedIndex]?.sku : 'SKU-EXAMPLE'
    updatePreview(currentSku || 'SKU-EXAMPLE')
    document.getElementById('settingsModal').style.display = 'none'
  })
}
