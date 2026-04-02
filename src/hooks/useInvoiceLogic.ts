"use client";
import { useState, useRef, ChangeEvent } from 'react';
import { InvoiceItem, DriveFile, CUSTOMER_MEMORY } from '@/types/invoice';
import { autoMapHeaders } from '@/lib/excelUtils';

async function parseArrayBuffer(buffer: ArrayBuffer): Promise<{
    headers: string[];
    jsonData: any[];
    sheetNames: string[];
}> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    let allRaw: any[] = [];
    for (const sheetName of sheetNames) {
        const sheet = workbook.Sheets[sheetName];
        allRaw = allRaw.concat(
            XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' })
        );
    }
    if (allRaw.length === 0) return { headers: [], jsonData: [], sheetNames };
    const headers = Object.keys(allRaw[0]).map(h => h.trim());
    const jsonData = allRaw.map(row => {
        const clean: any = {};
        Object.keys(row).forEach(k => { clean[k.trim()] = row[k]; });
        return clean;
    });
    return { headers, jsonData, sheetNames };
}

export function useInvoiceLogic() {
    const [invoiceNumber, setInvoiceNumber] = useState(5091);
    const [customerName, setCustomerName] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [itemsPart2, setItemsPart2] = useState<InvoiceItem[]>([
        { id: crypto.randomUUID(), item: '', qty: 1, price: 0 },
        { id: crypto.randomUUID(), item: '', qty: 1, price: 0 },
        { id: crypto.randomUUID(), item: '', qty: 1, price: 0 },
    ]);
    const [periodMonth, setPeriodMonth] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [extractedTitles, setExtractedTitles] = useState<string[]>([]);
    const [extractedData, setExtractedData] = useState<any[]>([]);
    const [extractedMonths, setExtractedMonths] = useState<string[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [hasUploadedFile, setHasUploadedFile] = useState(false);
    const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
    const [showDriveModal, setShowDriveModal] = useState(false);
    const [isLoadingDrive, setIsLoadingDrive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const matchingCustomers = Object.values(CUSTOMER_MEMORY).filter(cust =>
        cust.name.toLowerCase().includes(customerName.toLowerCase())
    );

    const handleCustomerNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setCustomerName(e.target.value);
        setShowSuggestions(e.target.value.length > 0);
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
        setItemsPart2(items => items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const applyParsedData = ({ headers, jsonData, sheetNames }: { headers: string[]; jsonData: any[]; sheetNames: string[] }) => {
        setExtractedMonths(sheetNames);
        setExtractedTitles(headers);
        setExtractedData(jsonData);
        if (headers.length > 0) {
            setItemsPart2(prev => autoMapHeaders(headers, prev));
        }
        setPeriodMonth('');
        setFromDate('');
        setToDate('');
        setHasUploadedFile(true);
    };

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsExtracting(true);
        try {
            applyParsedData(await parseArrayBuffer(await file.arrayBuffer()));
        } catch {
            alert('Cannot parse Excel file.');
        } finally {
            setIsExtracting(false);
        }
    };

    const handleLoadFromDrive = async () => {
        setIsLoadingDrive(true);
        setShowDriveModal(true);
        try {
            const res = await fetch('/api/drive');
            const data = await res.json();
            if (data.authUrl) { window.location.href = data.authUrl; return; }
            setDriveFiles(data.files || []);
        } catch {
            alert('Failed to load Google Drive files.');
        } finally {
            setIsLoadingDrive(false);
        }
    };

    const handleDriveFileSelect = async (fileId: string, mimeType: string) => {
        setShowDriveModal(false);
        setIsExtracting(true);
        try {
            const res = await fetch(`/api/drive?fileId=${fileId}&mimeType=${encodeURIComponent(mimeType)}`);
            if (!res.ok) {
                const text = await res.text();
                console.error('Drive API error:', res.status, text);
                alert(`Failed to load file from Google Drive. (${res.status}: ${text.slice(0, 200)})`);
                return;
            }
            applyParsedData(await parseArrayBuffer(await res.arrayBuffer()));
        } catch (err) {
            console.error('Drive file select error:', err);
            alert('Failed to load file from Google Drive. Error: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsExtracting(false);
        }
    };

    const exportToPDF = async () => {
        if (!hasUploadedFile) { alert('Please upload a document first.'); return; }
        const pages = document.querySelectorAll('.print-page');
        if (pages.length === 0) { alert('Print template not found.'); return; }
        try {
            const [{ jsPDF }, htmlToImage] = await Promise.all([
                import('jspdf'),
                import('html-to-image'),
            ]);

            // Capture all pages first
            const images: string[] = [];
            for (let i = 0; i < pages.length; i++) {
                images.push(await htmlToImage.toPng(pages[i] as HTMLElement, { pixelRatio: 2, backgroundColor: '#ffffff' }));
            }

            // Use A4 width (210mm), calculate height proportionally for each page
            const A4_WIDTH_MM = 210;
            let pdf: InstanceType<typeof jsPDF> | null = null;

            for (let i = 0; i < images.length; i++) {
                const tempPdf = new jsPDF({ unit: 'mm', format: 'a4' });
                const imgProps = tempPdf.getImageProperties(images[i]);
                const pageHeightMM = (imgProps.height / imgProps.width) * A4_WIDTH_MM;

                if (i === 0) {
                    pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [A4_WIDTH_MM, pageHeightMM] });
                } else {
                    pdf!.addPage([A4_WIDTH_MM, pageHeightMM]);
                }
                pdf!.addImage(images[i], 'PNG', 0, 0, A4_WIDTH_MM, pageHeightMM);
            }

            pdf!.save(`invoice_INV-${invoiceNumber}.pdf`);
        } catch (error) {
            alert('Failed to generate PDF. Error: ' + (error instanceof Error ? error.message : String(error)));
        }
    };

    return {
        invoiceNumber, setInvoiceNumber,
        customerName, setCustomerName,
        showSuggestions, setShowSuggestions,
        itemsPart2,
        periodMonth, setPeriodMonth,
        fromDate, setFromDate,
        toDate, setToDate,
        extractedTitles,
        extractedData,
        extractedMonths,
        isExtracting,
        hasUploadedFile,
        driveFiles,
        showDriveModal, setShowDriveModal,
        isLoadingDrive,
        fileInputRef,
        matchingCustomers,
        handleCustomerNameChange,
        updateItem,
        handleFileUpload,
        handleLoadFromDrive,
        handleDriveFileSelect,
        exportToPDF,
    };
}
