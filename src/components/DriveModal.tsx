"use client";
import { DriveFile } from '@/types/invoice';

type Props = {
    isLoadingDrive: boolean;
    driveFiles: DriveFile[];
    onClose: () => void;
    onSelectFile: (fileId: string, mimeType: string) => void;
};

export default function DriveModal({ isLoadingDrive, driveFiles, onClose, onSelectFile }: Props) {
    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sky-300 font-bold tracking-wider">Select from Google Drive</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">x</button>
                </div>
                {isLoadingDrive ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-sky-400/30 border-t-sky-300 rounded-full animate-spin"></div>
                    </div>
                ) : driveFiles.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 text-sm">找不到 Excel 檔案，請確認資料夾內有 .xlsx 或 Google Sheets 檔案。</p>
                ) : (
                    <ul className="space-y-2">
                        {driveFiles.map(file => (
                            <li key={file.id}>
                                <button
                                    onClick={() => onSelectFile(file.id, file.mimeType)}
                                    className="w-full text-left px-4 py-3 rounded-lg bg-white/5 hover:bg-sky-900/40 border border-white/10 hover:border-sky-400/30 text-gray-200 transition-all flex items-center gap-3"
                                >
                                    <span>spreadsheet</span>
                                    <span className="text-sm">{file.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
