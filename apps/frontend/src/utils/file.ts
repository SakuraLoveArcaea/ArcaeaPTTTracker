/**
 * 將文字內容包裝為 Blob 並觸發瀏覽器下載檔案
 * 用於將下載邏輯與 Pinia Store 進行解耦，避免 Store 內含 DOM 操作
 */
export const downloadFile = (content: string, filename: string, contentType = 'application/json') => {
    if (typeof window === 'undefined') return;
    
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
};
