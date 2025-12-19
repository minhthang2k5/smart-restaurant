import { saveAs } from "file-saver";

/**
 * Download file from blob response
 * @param {Blob} blob - File blob from API
 * @param {string} filename - name of file
 */
export const downloadFile = (blob, filename) => {
  saveAs(blob, filename);
};

/**
 * Extract filename from Content-Disposition header
 * @param {Object} response - Axios response
 */
export const getFilenameFromResponse = (response) => {
  const contentDisposition = response.headers["content-disposition"];
  if (contentDisposition) {
    const matches = /filename="(.+)"/.exec(contentDisposition);
    if (matches && matches[1]) return matches[1];
  }
  return "download";
};

/**
 * Download QR code wrapper with error handling
 */
export const downloadQRWithFeedback = async (
  downloadFn,
  filename,
  onSuccess,
  onError
) => {
  try {
    const response = await downloadFn();
    const blob = response instanceof Blob ? response : new Blob([response]);
    downloadFile(blob, filename);
    onSuccess?.();
  } catch (error) {
    console.error("Download failed:", error);
    onError?.(error);
  }
};
