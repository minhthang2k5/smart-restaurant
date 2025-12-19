import { saveAs } from "file-saver";

/**
 * Download file from blob response
 * @param {Blob} blob - File blob from API
 * @param {string} filename - name of file
 */
export const downloadFile = (blob, filename) => {
  // Validate blob
  if (!(blob instanceof Blob)) {
    console.error("Invalid blob object");
    throw new Error("Invalid download data");
  }

  saveAs(blob, filename);
};

/**
 * Extract filename from Content-Disposition header
 * @param {Object} headers - Response headers
 */
export const getFilenameFromHeaders = (headers) => {
  const contentDisposition = headers["content-disposition"];
  if (contentDisposition) {
    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(
      contentDisposition
    );
    if (matches && matches[1]) {
      return matches[1].replace(/['"]/g, "");
    }
  }
  return `download-${Date.now()}`;
};

/**
 * Create download link element (alternative method)
 * @param {Blob} blob
 * @param {string} filename
 */
export const downloadFileNative = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
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

/**
 * Download with loading feedback
 */
export const downloadWithProgress = async (
  downloadFn,
  filename,
  onProgress
) => {
  try {
    onProgress?.({ status: "loading", message: "Preparing download..." });

    const blob = await downloadFn();

    onProgress?.({ status: "success", message: "Downloading..." });

    downloadFile(blob, filename);

    onProgress?.({ status: "complete", message: "Download complete!" });

    return true;
  } catch (error) {
    onProgress?.({ status: "error", message: "Download failed!" });
    console.error("Download error:", error);
    return false;
  }
};
