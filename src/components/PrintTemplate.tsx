import { InvoiceItem } from '@/types/invoice';
import { parseExcelDate } from '@/lib/excelUtils';

type Props = {
    dataChunks: any[][];
    customerName: string;
    companyName: string;
    invoiceNumber: number;
    itemsPart2: InvoiceItem[];
    total: number;
};

export default function PrintTemplate({ dataChunks, customerName, companyName, invoiceNumber, itemsPart2, total }: Props) {
    return (
        <div className="fixed top-0 left-[-9999px] z-[-50] opacity-0 pointer-events-none flex flex-col gap-10" id="print-container">
            {dataChunks.map((chunk, pageIndex) => (
                <div key={pageIndex} className="print-page w-[800px] bg-white text-gray-900 p-12 font-sans relative flex flex-col">
                    <div className="w-full">
                        {pageIndex === 0 && (
                            <>
                                <div className="mb-8 pb-6 border-b-2 border-sky-400 flex items-center gap-6">
                                    <div className="w-20 h-20 shrink-0 bg-sky-50 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-sky-100 shadow-sm">
                                        <img src="/IMG-TLR.png" alt="Company Logo" className="w-full h-full object-contain" suppressHydrationWarning onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                    <div>
                                        <h1 className="text-4xl font-bold tracking-widest text-sky-500">INVOICE</h1>
                                        <div className="mt-2 leading-relaxed tracking-wide">
                                            <p className="text-sm font-bold text-sky-900">{companyName}</p>
                                            <p className="text-xs text-gray-400">16979 Turk Dr · La Puente, CA 91744</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-start mb-12">
                                    <div>
                                        <h3 className="text-md font-bold mb-2 tracking-widest text-orange-500">BILL TO</h3>
                                        <p className="text-base text-gray-800 uppercase font-semibold">{customerName || '________________________'}</p>
                                    </div>
                                    <div className="mt-2 grid grid-cols-[auto_auto] gap-x-4 gap-y-2 justify-end items-center">
                                        <div className="font-semibold text-xl text-orange-500 text-right tracking-widest">INVOICE #</div>
                                        <div className="font-semibold text-xl text-sky-700 text-left">{invoiceNumber}</div>
                                        <div className="font-semibold text-base text-orange-500 text-right tracking-widest">INVOICE DATE</div>
                                        <div className="font-normal text-base text-gray-700 text-left">{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</div>
                                    </div>
                                </div>
                            </>
                        )}
                        <table className="w-full border-collapse text-center">
                            {pageIndex === 0 && (
                                <thead>
                                    <tr className="bg-sky-500 text-white">
                                        <th className="py-2 px-2 text-sm font-bold tracking-widest uppercase">DATE</th>
                                        <th className="py-2 px-2 text-sm font-bold tracking-widest uppercase">FLOOR / CONTAINER #</th>
                                        <th className="py-2 px-2 text-sm font-bold tracking-widest uppercase">PRICE</th>
                                    </tr>
                                </thead>
                            )}
                            <tbody>
                                {chunk.length > 0 ? chunk.map((row: any, i: number) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-sky-50/60'}>
                                        <td className="py-2 px-2 text-sm text-gray-500">{itemsPart2[0]?.item ? parseExcelDate(row[itemsPart2[0].item]) || '-' : '-'}</td>
                                        <td className="py-2 px-2 text-sm text-gray-800 font-medium">{itemsPart2[1]?.item ? row[itemsPart2[1].item] || '-' : '-'}</td>
                                        <td className="py-2 px-2 text-sm font-mono font-semibold text-sky-700">{itemsPart2[2]?.item && row[itemsPart2[2].item] ? `$${parseFloat(row[itemsPart2[2].item]).toFixed(2)}` : '-'}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="py-8 text-center text-sm text-gray-400">No data available.</td></tr>
                                )}
                            </tbody>
                        </table>
                        {pageIndex === dataChunks.length - 1 && (
                            <div className="mt-8">
                                <div className="flex justify-end mt-4 mb-4">
                                    <div className="w-48 flex justify-between font-bold text-lg text-orange-600 p-2 bg-orange-50 rounded">
                                        <span>TOTAL</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="w-full flex justify-center items-center gap-8 pt-6">
                                    <h4 className="text-4xl text-sky-500 tracking-widest font-normal">Thank&nbsp;&nbsp;You</h4>
                                    <div className="h-12 border-l-[3px] border-sky-500/80"></div>
                                    <div className="text-left flex flex-col justify-center">
                                        <h4 className="text-sm font-medium text-sky-500 uppercase tracking-wide mb-2">TERMS & CONDITIONS</h4>
                                        <p className="text-sm text-black">Payment is due within 7 days</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            ))}
        </div>
    );
}
