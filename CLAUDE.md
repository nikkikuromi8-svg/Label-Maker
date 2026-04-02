# CLAUDE.md — Auto Invoice App

## Project Overview

A Next.js invoice generation tool for **The Last Renaissance Inc**.
Reads Excel/Google Sheets data, maps columns, filters by date range, and exports multi-page PDF invoices.

**Stack:** Next.js 15 · React 19 · TypeScript 5 · Tailwind CSS v4 · googleapis · xlsx · jsPDF

---

## Commands

```bash
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint check
npx tsc --noEmit # TypeScript type check (no output = clean)
node verify-refactor.mjs  # Structural integrity check (61 assertions)
```

Launch via desktop shortcut: `Start_Invoice_App.bat` (checks Google Drive token status, then runs `npm run dev`).

> **Node.js v25 注意事項：** `npm run dev` 腳本已改為
> `node --localstorage-file=./localstorage.json node_modules/next/dist/bin/next dev`
> 原因：Node.js v25 內建 Web Storage API，但沒有提供 `--localstorage-file` 路徑時
> `localStorage.getItem` 是 `undefined`，導致 `xlsx` 庫在服務端初始化時崩潰（500 Error）。
> 不可改回 `next dev`。

---

## Architecture

```
src/
├── types/invoice.ts          # InvoiceItem, Customer, DriveFile types + CUSTOMER_MEMORY
├── lib/
│   ├── excelUtils.ts         # Pure functions: parseExcelDate, processWorkbook, getFilteredData, calculateTotal, chunkData, autoMapHeaders
│   └── googleAuth.ts         # OAuth2 client, getAuthUrl, getAuthorizedClient, saveToken
├── hooks/
│   └── useInvoiceLogic.ts    # All state + handlers: file upload, Drive, PDF export
├── components/
│   ├── InvoiceEditor.tsx     # Main UI orchestrator — imports hook + sub-components
│   ├── DriveModal.tsx        # Google Drive file picker modal
│   └── PrintTemplate.tsx     # Off-screen A4 print pages (captured by jsPDF)
└── app/
    ├── page.tsx              # Dynamic import of InvoiceEditor (SSR disabled)
    ├── layout.tsx            # Root layout with Geist font
    ├── globals.css           # Tailwind v4 import + CSS variables
    └── api/
        ├── drive/route.ts              # GET: list Drive files or download by fileId
        └── auth/callback/route.ts      # GET: OAuth2 code → token exchange → redirect /
```

### Path Alias
`@/*` → `src/*` (configured in tsconfig.json). Always use `@/` for imports.

---

## File Size Rule

**No source file may exceed 200 lines.** All files currently comply:

| File | Lines |
|------|-------|
| types/invoice.ts | 23 |
| lib/excelUtils.ts | 97 |
| lib/googleAuth.ts | 32 |
| hooks/useInvoiceLogic.ts | 144 |
| components/DriveModal.tsx | 42 |
| components/PrintTemplate.tsx | 93 |
| components/InvoiceEditor.tsx | 197 |
| app/api/drive/route.ts | 48 |
| app/api/auth/callback/route.ts | 12 |

Run `node verify-refactor.mjs` after any major change to confirm compliance.

---

## Google Drive Integration

### Auth Flow
1. User clicks "Load from Google Drive" → calls `GET /api/drive`
2. If `token.json` is missing → API returns `{ authUrl }` → browser redirects to Google sign-in
3. After Google sign-in → `GET /api/auth/callback?code=...` → saves `token.json` → redirects to `/`
4. If `token.json` exists → API lists files from Google Drive folder and returns them

### Key Files
- `credentials.json` — OAuth2 client credentials (from Google Cloud Console). Structure:
  ```json
  { "web": { "client_id": "...", "client_secret": "...", "redirect_uris": ["http://localhost:3000/api/auth/callback"] } }
  ```
- `token.json` — Generated after first sign-in. Contains `access_token` + `refresh_token`. The googleapis library auto-refreshes using the refresh token.
- **Both files must NOT be committed to git** (already in `.gitignore`).

### Drive Folder
Hardcoded folder ID in `src/app/api/drive/route.ts`:
```ts
const FOLDER_ID = '1bhyh-SMqsf4XQUqKvMZgAZX62JnCRqdO';
```
Only lists `.xlsx` and Google Sheets files from this folder.

### Reconnecting
If token expires: click "Load from Google Drive" → follow Google sign-in again.

---

## Core Data Flow

```
Excel file (upload or Drive)
  → XLSX.read() → processWorkbook() [excelUtils.ts]
  → returns { headers, jsonData, sheetNames }
  → autoMapHeaders() auto-selects Date / Container / Price columns
  → user adjusts mapping via Column Mapping dropdowns
  → getFilteredData() filters rows by fromDate / toDate
  → calculateTotal() sums the price column
  → chunkData() splits into pages (15 rows first page, 22 rows subsequent)
  → PrintTemplate renders off-screen A4 pages
  → htmlToImage.toPng() captures each page
  → jsPDF assembles into PDF → downloads as invoice_INV-XXXX.pdf
```

---

## Business Data

**Company:** The Last Renaissance Inc · 16979 Turk Dr · La Puente, CA 91744

**Hardcoded Customers** (`src/types/invoice.ts`):
```ts
"Tech Corp":  { id: "CUST-001" }
"Galaxy Inc": { id: "CUST-002" }
```
Add new customers to the `CUSTOMER_MEMORY` object in `types/invoice.ts`.

**Column Auto-Mapping Keywords** (`src/lib/excelUtils.ts → autoMapHeaders`):
- Date column: `date`, `日期`
- Container column: `Floor`, `Container`, `柜号`, `裝貨`, `编号`
- Price column: `price`, `價`, `金额`, `費用`

**Invoice Settings:**
- Default invoice number: `5091` (editable in UI)
- Payment terms: "Payment is due within 7 days"
- Rows per page: 15 (first page), 22 (subsequent pages)

---

## UI Sections (InvoiceEditor.tsx)

| Section | Purpose |
|---------|---------|
| Header | Company logo + name |
| BILL TO | Customer name input with autocomplete |
| Invoice # / Date | Editable invoice number, auto today's date |
| Period Information | Month picker, From/To date filters |
| Column Mapping | 3 dropdowns: map Excel headers to Date / Container / Price |
| Data Table | Filtered rows preview |
| TOTAL | Summed price column |
| Action Buttons | Upload Document · Load from Google Drive · Generate PDF |

---

## Adding Features — Key Notes

- **New Excel column mapping**: add keywords to `autoMapHeaders()` in `excelUtils.ts`
- **New customer**: add entry to `CUSTOMER_MEMORY` in `types/invoice.ts`
- **Change Drive folder**: update `FOLDER_ID` in `src/app/api/drive/route.ts`
- **Change PDF layout**: edit `PrintTemplate.tsx` (A4 = `w-[800px] h-[1130px]`)
- **Adding a new UI section**: keep `InvoiceEditor.tsx` under 200 lines — extract to a new component if needed
- **State or logic changes**: go to `useInvoiceLogic.ts`; pure functions go in `excelUtils.ts`

---

## Verification

After any refactoring, run:
```bash
node verify-refactor.mjs   # 61 structural checks
npx tsc --noEmit           # TypeScript checks
```

Both should produce no errors before committing.
