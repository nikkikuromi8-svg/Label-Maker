"use client";

import { useInvoiceLogic } from '@/hooks/useInvoiceLogic';
import { getFilteredData, calculateTotal, chunkData, parseExcelDate } from '@/lib/excelUtils';
import DriveModal from './DriveModal';
import PrintTemplate from './PrintTemplate';

export default function InvoiceEditor() {
    const {
        invoiceNumber, setInvoiceNumber,
        companyName, setCompanyName,
        customerName, setCustomerName,
        showSuggestions, setShowSuggestions,
        itemsPart2,
        periodMonth, setPeriodMonth,
        fromDate, setFromDate,
        toDate, setToDate,
        extractedTitles, extractedData,
        isExtracting, hasUploadedFile,
        driveFiles, showDriveModal, setShowDriveModal, isLoadingDrive,
        fileInputRef, matchingCustomers,
        handleCustomerNameChange, saveCustomerName, deleteCustomerFromHistory, updateItem,
        handleFileUpload, handleLoadFromDrive, handleDriveFileSelect, exportToPDF,
    } = useInvoiceLogic();

    const filteredData = getFilteredData(extractedData, itemsPart2, fromDate, toDate);
    const total = calculateTotal(filteredData, itemsPart2);
    const dataChunks = chunkData(filteredData);

    return (
        <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-4 sm:p-8 flex justify-center items-start font-sans">

            {showDriveModal && (
                <DriveModal
                    isLoadingDrive={isLoadingDrive}
                    driveFiles={driveFiles}
                    onClose={() => setShowDriveModal(false)}
                    onSelectFile={handleDriveFileSelect}
                />
            )}

            <div id="invoice-container" className="w-full max-w-4xl bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_40px_rgba(56,189,248,0.1)] rounded-2xl p-6 sm:p-10">

                {/* Header */}
                <div className="border-b border-white/10 pb-8 mb-8 border-opacity-50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-orange-500 flex items-center justify-center rounded-xl shadow-lg border border-white/20 shrink-0 overflow-hidden relative group">
                            <img src="/IMG-TLR.png" alt="Company Logo" className="w-full h-full object-cover relative z-10" suppressHydrationWarning onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <span className="font-bold text-xs tracking-wider absolute z-0 text-white group-hover:opacity-100">IMG-TLR</span>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-orange-400">INVOICE</h1>
                            <div className="mt-2 text-sm text-gray-300">
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="font-bold text-sky-300 uppercase tracking-widest bg-transparent border-b border-transparent hover:border-sky-400/50 focus:border-sky-400 focus:outline-none transition-all w-full"
                                />
                                <p>16979 Turk Dr</p>
                                <p>La Puente, CA 91744</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8 relative">
                    {isExtracting && (
                        <div className="absolute inset-0 z-10 bg-[#0b0f19]/80 backdrop-blur-sm rounded-xl border border-sky-400/30 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-sky-400/30 border-t-sky-300 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(56,189,248,0.5)]"></div>
                            <p className="text-sky-300 font-mono tracking-widest animate-pulse">LOADING DATA...</p>
                        </div>
                    )}
                    <div className="w-full md:w-1/2 space-y-4 relative z-20">
                        <h3 className="text-sm font-semibold text-sky-300 tracking-wider">BILL TO</h3>
                        <div className="relative">
                            <input type="text" placeholder="Customer Name" value={customerName} onChange={handleCustomerNameChange} onFocus={() => setShowSuggestions(customerName.length > 0)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onKeyDown={(e) => { if (e.key === 'Enter' && customerName.trim()) { saveCustomerName(customerName); setShowSuggestions(false); } }} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-gray-600" />
                            {showSuggestions && matchingCustomers.length > 0 && (
                                <ul className="absolute z-50 w-full mt-1 bg-[#111] border border-sky-400/30 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                                    {matchingCustomers.map((name) => (
                                        <li key={name} className="flex items-center justify-between px-4 py-3 hover:bg-cyan-500/20 transition-colors border-b border-white/5 last:border-0 group">
                                            <span onClick={() => { setCustomerName(name); saveCustomerName(name); setShowSuggestions(false); }} className="cursor-pointer text-sm text-gray-200 flex-1">{name}</span>
                                            <button onMouseDown={(e) => { e.preventDefault(); deleteCustomerFromHistory(name); }} className="text-gray-600 hover:text-red-400 transition-colors text-xs ml-2 opacity-0 group-hover:opacity-100">✕</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 relative z-20 flex justify-start md:justify-end text-sm">
                        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-4 items-center">
                            <span className="font-semibold text-sky-300 text-right tracking-wider uppercase">Invoice #</span>
                            <div className="flex items-center text-left">
                                <span className="text-gray-400 mr-1">INV-</span>
                                <input type="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(parseInt(e.target.value) || 0)} className="w-20 bg-black/20 text-left font-mono border border-white/10 rounded-md p-2 text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all" />
                            </div>
                            <span className="font-semibold text-sky-300 text-right tracking-wider uppercase">Date</span>
                            <span className="font-normal text-gray-400 text-left">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>

                {/* Period Information */}
                <div data-html2canvas-ignore="true" className="mb-6 overflow-hidden rounded-xl border border-white/10">
                    <div className="bg-black/40 text-sky-300 text-sm uppercase tracking-wider p-4 border-b border-white/10 font-bold flex items-center justify-between">
                        <span>Date Range Filter</span>
                        <span className="text-xs text-gray-500 normal-case font-normal tracking-normal">不選月份可直接填日期範圍</span>
                    </div>
                    <div className="p-6 bg-white/[0.01]">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-xs text-gray-400 tracking-wider shrink-0">QUICK FILL BY MONTH</span>
                            <input
                                type="month"
                                value={periodMonth}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPeriodMonth(val);
                                    if (val) {
                                        const [year, month] = val.split('-');
                                        setFromDate(`${val}-01`);
                                        const lastDay = new Date(Number(year), Number(month), 0).getDate();
                                        setToDate(`${val}-${lastDay}`);
                                    } else {
                                        setFromDate('');
                                        setToDate('');
                                    }
                                }}
                                className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-400 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            />
                            {periodMonth && (
                                <button onClick={() => { setPeriodMonth(''); setFromDate(''); setToDate(''); }} className="text-xs text-gray-500 hover:text-red-400 transition-colors">✕ 清除</button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 tracking-wider">FROM DATE</label>
                                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPeriodMonth(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-sky-400 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400 tracking-wider">TO DATE</label>
                                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPeriodMonth(''); }} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-sky-400 transition-all [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column Mapping */}
                <div data-html2canvas-ignore="true" className="mb-8 rounded-xl border border-white/10">
                    <div className="bg-black/40 text-sky-300 text-sm uppercase tracking-wider p-4 border-b border-white/10 font-bold">Column Mapping Configuration</div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[{ label: 'MAP TO: DATE', index: 0 }, { label: 'MAP TO: FLOOR/CONTAINER #', index: 1 }, { label: 'MAP TO: PRICE', index: 2 }].map(({ label, index }) => (
                            <div key={index} className="space-y-2 relative">
                                <label className="text-xs text-sky-300/80 tracking-wider">{label}</label>
                                <select value={itemsPart2[index]?.item || ''} onChange={(e) => updateItem(itemsPart2[index].id, 'item', e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white hover:border-white/20 focus:border-sky-400/50 outline-none transition-colors appearance-none cursor-pointer">
                                    <option value="" disabled>Select a title...</option>
                                    {extractedTitles.map((title, idx) => (<option key={idx} value={title}>{title}</option>))}
                                    {extractedTitles.length === 0 && <option value="" disabled className="text-gray-500">Load a file first...</option>}
                                </select>
                                <div className="absolute right-4 top-[38px] pointer-events-none text-gray-500">v</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                {extractedData.length > 0 && (
                    <div className="mb-8 rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-black/40 text-sky-300 text-xs uppercase tracking-wider">
                                    <th className="p-4 border-b border-white/10 font-bold text-center">Date</th>
                                    <th className="p-4 border-b border-white/10 font-bold text-center">Floor/Container #</th>
                                    <th className="p-4 border-b border-white/10 font-bold text-center">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-white/[0.02]">
                                {filteredData.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="p-4 text-center">{itemsPart2[0]?.item ? parseExcelDate(row[itemsPart2[0].item]) || '-' : '-'}</td>
                                        <td className="p-4 text-center">{itemsPart2[1]?.item ? row[itemsPart2[1].item] || '-' : '-'}</td>
                                        <td className="p-4 text-center font-mono text-sky-50">{itemsPart2[2]?.item && row[itemsPart2[2].item] ? `$${parseFloat(row[itemsPart2[2].item]).toFixed(2)}` : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pt-6 border-t border-white/10 gap-6">
                    <div className="w-full sm:w-1/2">
                        <h4 className="text-sm font-bold text-sky-300 uppercase tracking-widest mb-2">TERMS & CONDITIONS</h4>
                        <p className="text-sm text-gray-400">Payment is due within 7 days</p>
                    </div>
                    <div className="w-full sm:w-1/2 md:w-1/3">
                        <div className="flex justify-between items-center text-xl font-bold p-4 bg-sky-950/30 rounded-lg border border-sky-400/20">
                            <span className="text-gray-300">TOTAL</span>
                            <span className="text-sky-300 font-mono tracking-wider">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-12 flex flex-col sm:flex-row justify-between items-center border-t border-white/10 pt-8 gap-4">
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" />
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className={`w-full sm:w-auto font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${hasUploadedFile ? 'bg-green-900/40 text-green-300 border border-green-500/30' : 'bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-300 border border-indigo-500/30'}`}>
                            <span>doc</span> {hasUploadedFile ? 'Document Uploaded' : 'Upload Document'}
                        </button>
                        <button onClick={handleLoadFromDrive} disabled={isExtracting} className="w-full sm:w-auto font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
                            <span>cloud</span> Load from Google Drive
                        </button>
                    </div>
                    <button onClick={() => { if (customerName.trim()) saveCustomerName(customerName); exportToPDF(); }} disabled={!hasUploadedFile} className={`w-full sm:w-auto text-white font-semibold py-3 px-8 rounded-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${hasUploadedFile ? 'bg-gradient-to-r from-sky-500 to-orange-500 hover:from-sky-400 hover:to-orange-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-gray-700 text-gray-400'}`}>
                        Generate PDF
                    </button>
                </div>
            </div>

            <PrintTemplate
                dataChunks={dataChunks}
                customerName={customerName}
                companyName={companyName}
                invoiceNumber={invoiceNumber}
                itemsPart2={itemsPart2}
                total={total}
            />
        </div>
    );
}
