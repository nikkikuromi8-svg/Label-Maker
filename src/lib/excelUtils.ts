import { InvoiceItem } from '@/types/invoice';

export function parseExcelDate(rawVal: any): string {
    if (!rawVal) return '';
    const strVal = String(rawVal).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(strVal)) return strVal;
    if (strVal.includes('/')) {
        const parts = strVal.split('/');
        if (parts.length === 3) {
            if (parts[0].length === 4)
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
        return strVal;
    } else if (!isNaN(Number(strVal)) && Number(strVal) > 20000) {
        const jsDate = new Date(Math.round((Number(strVal) - 25569) * 86400000));
        if (!isNaN(jsDate.getTime())) return jsDate.toISOString().split('T')[0];
        return strVal;
    }
    return strVal;
}

export function autoMapHeaders(headers: string[], prevItems: InvoiceItem[]): InvoiceItem[] {
    const find = (kws: string[]) =>
        headers.find(h => kws.some(k => h.toLowerCase().includes(k.toLowerCase()))) || '';
    return [
        { id: prevItems[0].id, item: find(['date', '日期']), qty: 1, price: 0 },
        { id: prevItems[1].id, item: find(['Floor', 'Container', '柜号', '裝貨', '编号']), qty: 1, price: 0 },
        { id: prevItems[2].id, item: find(['price', '價', '金额', '費用']), qty: 1, price: 0 },
    ];
}

export function getFilteredData(
    extractedData: any[],
    itemsPart2: InvoiceItem[],
    fromDate: string,
    toDate: string
): any[] {
    const dateCol = itemsPart2[0]?.item;
    let data = extractedData;
    if (dateCol) {
        data = extractedData.filter(row => {
            const v = row[dateCol];
            return v !== undefined && v !== null && String(v).trim() !== '';
        });
    }
    if (!fromDate && !toDate) return data;
    return data.filter(row => {
        if (!dateCol) return true;
        const d = parseExcelDate(row[dateCol]);
        const afterFrom = fromDate ? d >= fromDate : true;
        const beforeTo = toDate ? d <= toDate : true;
        return afterFrom && beforeTo;
    });
}

export function calculateTotal(filteredData: any[], itemsPart2: InvoiceItem[]): number {
    const priceCol = itemsPart2[2]?.item;
    if (!priceCol || filteredData.length === 0) return 0;
    return filteredData.reduce((sum, row) => sum + (parseFloat(row[priceCol]) || 0), 0);
}

export function chunkData(data: any[], rowsFirst = 15, rowsOther = 22): any[][] {
    if (data.length === 0) return [[]];
    const chunks: any[][] = [data.slice(0, rowsFirst)];
    let idx = rowsFirst;
    while (idx < data.length) {
        chunks.push(data.slice(idx, idx + rowsOther));
        idx += rowsOther;
    }
    return chunks;
}
