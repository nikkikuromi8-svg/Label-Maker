import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const SRC = join(ROOT, 'src');

const results = [];

function check(name, passed) {
    results.push({ name, passed });
    console.log(`${passed ? '✅' : '❌'} ${name}`);
}

function exists(rel) { return existsSync(join(SRC, rel)); }

function contains(rel, text) {
    if (!exists(rel)) return false;
    return readFileSync(join(SRC, rel), 'utf8').includes(text);
}

function lineCount(rel) {
    if (!exists(rel)) return 0;
    return readFileSync(join(SRC, rel), 'utf8').split('\n').length;
}

console.log('\n=== FILE EXISTENCE ===');
const newFiles = [
    'types/invoice.ts',
    'lib/excelUtils.ts',
    'hooks/useInvoiceLogic.ts',
    'components/DriveModal.tsx',
    'components/PrintTemplate.tsx',
    'components/InvoiceEditor.tsx',
];
for (const f of newFiles) check(`${f} exists`, exists(f));

console.log('\n=== LINE COUNT (all must be ≤200) ===');
for (const f of newFiles) {
    const n = lineCount(f);
    check(`${f}: ${n} lines ≤ 200`, n <= 200);
}

console.log('\n=== TYPES ===');
check('InvoiceItem type', contains('types/invoice.ts', 'InvoiceItem'));
check('Customer type', contains('types/invoice.ts', 'Customer'));
check('DriveFile type', contains('types/invoice.ts', 'DriveFile'));
check('CUSTOMER_MEMORY constant', contains('types/invoice.ts', 'CUSTOMER_MEMORY'));

console.log('\n=== EXCEL UTILS ===');
check('parseExcelDate exported', contains('lib/excelUtils.ts', 'export function parseExcelDate'));
check('processWorkbook exported', contains('lib/excelUtils.ts', 'export function processWorkbook'));
check('autoMapHeaders exported', contains('lib/excelUtils.ts', 'export function autoMapHeaders'));
check('getFilteredData exported', contains('lib/excelUtils.ts', 'export function getFilteredData'));
check('calculateTotal exported', contains('lib/excelUtils.ts', 'export function calculateTotal'));
check('chunkData exported', contains('lib/excelUtils.ts', 'export function chunkData'));

console.log('\n=== HOOK ===');
check('useInvoiceLogic exported', contains('hooks/useInvoiceLogic.ts', 'export function useInvoiceLogic'));
check('handleFileUpload', contains('hooks/useInvoiceLogic.ts', 'handleFileUpload'));
check('handleLoadFromDrive', contains('hooks/useInvoiceLogic.ts', 'handleLoadFromDrive'));
check('handleDriveFileSelect', contains('hooks/useInvoiceLogic.ts', 'handleDriveFileSelect'));
check('exportToPDF', contains('hooks/useInvoiceLogic.ts', 'exportToPDF'));
check('applyWorkbookData (shared excel logic)', contains('hooks/useInvoiceLogic.ts', 'applyWorkbookData'));

console.log('\n=== DRIVE MODAL UI ===');
check('DriveModal default export', contains('components/DriveModal.tsx', 'export default function DriveModal'));
check('Drive file list render', contains('components/DriveModal.tsx', 'driveFiles.map'));
check('Loading spinner', contains('components/DriveModal.tsx', 'animate-spin'));
check('Close button (onClose)', contains('components/DriveModal.tsx', 'onClose'));
check('Select from Google Drive title', contains('components/DriveModal.tsx', 'Select from Google Drive'));

console.log('\n=== PRINT TEMPLATE ===');
check('PrintTemplate default export', contains('components/PrintTemplate.tsx', 'export default function PrintTemplate'));
check('.print-page class present', contains('components/PrintTemplate.tsx', 'print-page'));
check('Company name: The Last Renaissance Inc', contains('components/PrintTemplate.tsx', 'The Last Renaissance Inc'));
check('Thank You text', contains('components/PrintTemplate.tsx', 'Thank'));
check('TERMS & CONDITIONS', contains('components/PrintTemplate.tsx', 'TERMS & CONDITIONS'));
check('TOTAL block', contains('components/PrintTemplate.tsx', 'TOTAL'));
check('BILL TO label', contains('components/PrintTemplate.tsx', 'BILL TO'));
check('print-container id', contains('components/PrintTemplate.tsx', 'print-container'));

console.log('\n=== INVOICE EDITOR (MAIN UI) ===');
check('Uses useInvoiceLogic hook', contains('components/InvoiceEditor.tsx', 'useInvoiceLogic'));
check('Renders DriveModal', contains('components/InvoiceEditor.tsx', 'DriveModal'));
check('Renders PrintTemplate', contains('components/InvoiceEditor.tsx', 'PrintTemplate'));
check('INVOICE heading', contains('components/InvoiceEditor.tsx', 'INVOICE'));
check('BILL TO section', contains('components/InvoiceEditor.tsx', 'BILL TO'));
check('Company address (16979 Turk Dr)', contains('components/InvoiceEditor.tsx', '16979 Turk Dr'));
check('Period Information section', contains('components/InvoiceEditor.tsx', 'Period Information'));
check('Column Mapping Configuration', contains('components/InvoiceEditor.tsx', 'Column Mapping'));
check('Generate PDF button', contains('components/InvoiceEditor.tsx', 'Generate PDF'));
check('Load from Google Drive button', contains('components/InvoiceEditor.tsx', 'Load from Google Drive'));
check('Upload Document button', contains('components/InvoiceEditor.tsx', 'Upload Document'));
check('Invoice number input', contains('components/InvoiceEditor.tsx', 'invoiceNumber'));
check('Customer name autocomplete', contains('components/InvoiceEditor.tsx', 'matchingCustomers'));
check('TERMS & CONDITIONS section', contains('components/InvoiceEditor.tsx', 'TERMS & CONDITIONS'));
check('TOTAL display', contains('components/InvoiceEditor.tsx', 'TOTAL'));
check('Data table (Date/Floor/Price headers)', contains('components/InvoiceEditor.tsx', 'Floor/Container #'));
check('LOADING DATA overlay', contains('components/InvoiceEditor.tsx', 'LOADING DATA'));

console.log('\n=== ORIGINAL FILE NOT BROKEN ===');
check('API drive route intact', existsSync(join(ROOT, 'src/app/api/drive/route.ts')));
check('Auth callback route intact', existsSync(join(ROOT, 'src/app/api/auth/callback/route.ts')));
check('googleAuth lib intact', existsSync(join(ROOT, 'src/lib/googleAuth.ts')));

const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`\n${'='.repeat(40)}`);
console.log(`RESULT: ${passed}/${results.length} passed, ${failed} failed`);
if (failed > 0) {
    console.log('\nFailed checks:');
    results.filter(r => !r.passed).forEach(r => console.log(`  ❌ ${r.name}`));
    process.exit(1);
} else {
    console.log('All checks passed!');
}
