const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    title: 'Label Maker',
    icon: path.join(__dirname, 'assets', 'icon.png')
  })

  mainWindow.loadFile('src/index.html')
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// 打開文件對話框
ipcMain.handle('open-file-dialog', async (event, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [{ name: 'All Files', extensions: ['*'] }]
  })
  return result
})

// 打印標籤
ipcMain.handle('print-label', async (event, options) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  const htmlContent = options.htmlContent
  const tempFile = path.join(app.getPath('temp'), 'label_print.html')
  fs.writeFileSync(tempFile, htmlContent)

  await printWindow.loadFile(tempFile)

  return new Promise((resolve) => {
    printWindow.webContents.print({
      silent: options.silent || false,
      printBackground: true,
      deviceName: options.printerName || '',
      pageSize: {
        width: options.width * 1000 || 100000,
        height: options.height * 1000 || 150000
      },
      margins: { marginType: 'none' }
    }, (success, errorType) => {
      printWindow.close()
      fs.unlinkSync(tempFile)
      resolve({ success, errorType })
    })
  })
})

// 獲取打印機列表
ipcMain.handle('get-printers', async () => {
  const printers = await mainWindow.webContents.getPrintersAsync()
  return printers
})

// 打印預覽視窗
ipcMain.handle('preview-pdf', async (event, options) => {
  const PX_PER_MM = 3.7795275591
  const labelW = Math.round(options.width * PX_PER_MM)
  const labelH = Math.round(options.height * PX_PER_MM)
  const winW = Math.min(labelW + 80, 1200)
  const winH = Math.min(labelH + 200, 900)

  const previewHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @media print {
    @page { size: ${options.width}mm ${options.height}mm; margin: 0; }
    .toolbar { display: none !important; }
    html, body {
      display: block !important;
      width: ${options.width}mm !important;
      height: auto !important;
      min-height: 0 !important;
      background: white !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
    }
    .label-wrap {
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;
      gap: 0 !important;
      width: ${options.width}mm !important;
    }
    .label-page {
      display: flex !important;
      align-items: center !important;
      justify-content: ${options.justifyContent} !important;
      width: ${options.width}mm !important;
      height: ${options.height}mm !important;
      box-shadow: none !important;
      margin: 0 !important;
      padding: 8mm !important;
      overflow: hidden !important;
      page-break-after: always;
      break-after: page;
      page-break-inside: avoid;
    }
    .label-page:last-child {
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
  }
  body {
    background: #e5e7eb;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    font-family: 'Microsoft YaHei', 'Segoe UI', sans-serif;
    gap: 16px;
  }
  .toolbar {
    background: #1e293b;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    position: sticky;
    top: 0;
    z-index: 10;
    width: 100%;
    max-width: ${labelW + 40}px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .btn-print-now {
    background: #22c55e;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
  }
  .btn-print-now:hover { background: #16a34a; }
  .btn-print-now:disabled { background: #86efac; cursor: not-allowed; }
  .label-wrap { display: flex; flex-direction: column; gap: 16px; align-items: center; }
  .label-page {
    width: ${options.width}mm;
    height: ${options.height}mm;
    background: white;
    display: flex;
    align-items: center;
    justify-content: ${options.justifyContent};
    padding: 8mm;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  }
  .label-sku {
    font-family: 'Courier New', monospace;
    font-size: ${options.fontSize}mm;
    font-weight: ${options.fontWeight};
    text-align: ${options.textAlign};
    word-break: break-all;
    line-height: 1.3;
    width: 100%;
  }
</style>
</head>
<body>
<div class="toolbar">
  <span>打印預覽 — ${options.width} mm × ${options.height} mm</span>
  <button class="btn-print-now" id="printNow">🖨️ 確認打印</button>
</div>
<div class="label-wrap">${options.labelsHtml}</div>
<script>
  document.getElementById('printNow').addEventListener('click', function() {
    this.disabled = true;
    this.textContent = '⏳ 打印中...';
    window.print();
    setTimeout(() => { window.close(); }, 2000);
  });
</script>
</body>
</html>`

  const tempPreview = path.join(app.getPath('temp'), 'label_preview_win.html')
  fs.writeFileSync(tempPreview, previewHtml)

  const previewWin = new BrowserWindow({
    width: winW,
    height: winH,
    title: '打印預覽',
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  })
  await previewWin.loadFile(tempPreview)
  return { success: true }
})
