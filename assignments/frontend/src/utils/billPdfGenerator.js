import { jsPDF } from "jspdf";

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Load font from URL
 */
async function loadFont(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch font from ${url}`);
      return null;
    }
    const buffer = await response.arrayBuffer();
    return arrayBufferToBase64(buffer);
  } catch (err) {
    console.error("Font loading error:", err);
    return null;
  }
}

/**
 * Vietnamese currency formatter
 */
const formatVNDForPdf = (amount) => {
  if (amount === null || amount === undefined) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

/**
 * Generate PDF bill for a session
 * @param {Object} billData - Bill data from API
 * @returns {Promise<string>} - fileName
 */
export const generateBillPdf = async (billData) => {
  if (!billData) {
    throw new Error("No bill data available");
  }

  const doc = new jsPDF();

  // Try to load custom font
  // Ensure you have Roboto-Regular.ttf in /public/fonts/
  const fontBase64 = await loadFont("/fonts/Roboto-Regular.ttf");
  let fontName = "helvetica";

  if (fontBase64) {
    doc.addFileToVFS("Roboto-Regular.ttf", fontBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");
    fontName = "Roboto";
  } else {
    console.warn(
      "Using default font. Vietnamese characters may not display correctly. Please ensure /public/fonts/Roboto-Regular.ttf exists."
    );
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper: set font style safely
  const setFontStyle = (isBold = false) => {
    if (fontName === "helvetica") {
      doc.setFont(fontName, isBold ? "bold" : "normal");
    } else {
      // If we only loaded Regular, ignore bold request or use 'normal'
      // To support bold, we'd need to load Roboto-Bold.ttf as well.
      doc.setFont(fontName, "normal");
    }
  };

  // Helper: Add centered text
  const addCenteredText = (text, y, fontSize = 12, isBold = false) => {
    doc.setFontSize(fontSize);
    setFontStyle(isBold);
    const textWidth = doc.getTextWidth(text);
    doc.text(text, (pageWidth - textWidth) / 2, y);
  };

  // Helper: Add horizontal line
  const addLine = (y) => {
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
  };

  // Helper: Add text row with left and right aligned content
  const addRow = (leftText, rightText, y, options = {}) => {
    const { fontSize = 11, isBold = false } = options;
    doc.setFontSize(fontSize);
    setFontStyle(isBold);
    doc.text(leftText, 20, y);
    doc.text(rightText, pageWidth - 20, y, { align: "right" });
  };

  // ==================== HEADER ====================
  addCenteredText("RESTAURANT BILL", yPos, 20, true);
  yPos += 12;
  addLine(yPos);
  yPos += 12;

  // ==================== SESSION INFO ====================
  doc.setFontSize(11);
  setFontStyle(false);
  
  doc.text(`Table: ${billData.tableNumber || "N/A"}`, 20, yPos);
  yPos += 7;
  
  if (billData.location) {
    doc.text(`Location: ${billData.location}`, 20, yPos);
    yPos += 7;
  }
  
  doc.text(`Session: ${billData.sessionNumber || "N/A"}`, 20, yPos);
  yPos += 7;
  
  const dateStr = billData.startedAt 
    ? new Date(billData.startedAt).toLocaleString("vi-VN")
    : "N/A";
  doc.text(`Date: ${dateStr}`, 20, yPos);
  yPos += 12;

  addLine(yPos);
  yPos += 10;

  // ==================== ITEMS HEADER ====================
  setFontStyle(true);
  doc.setFontSize(12);
  doc.text("ORDER ITEMS", 20, yPos);
  yPos += 8;
  addLine(yPos);
  yPos += 8;

  // ==================== ITEMS LIST ====================
  setFontStyle(false);
  doc.setFontSize(10);

  if (billData.items && billData.items.length > 0) {
    billData.items.forEach((item) => {
      // Use original name (no normalization)
      const itemName = item.name || "Unknown Item";
      const itemText = `${item.quantity}x ${itemName}`;
      const priceText = formatVNDForPdf(item.totalPrice);

      addRow(itemText, priceText, yPos, { fontSize: 10 });
      yPos += 6;

      // Modifiers
      if (item.modifiers && item.modifiers.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        
        item.modifiers.forEach((mod) => {
          const modName = mod.name || "";
          const modText = mod.priceAdjustment > 0
            ? `  + ${modName} (+${formatVNDForPdf(mod.priceAdjustment)})`
            : `  + ${modName}`;
          doc.text(modText, 25, yPos);
          yPos += 5;
        });
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }

      yPos += 2;

      // Check for page break
      if (yPos > 265) {
        doc.addPage();
        yPos = 20;
      }
    });
  } else {
    doc.text("No items", 20, yPos);
    yPos += 8;
  }

  yPos += 6;
  addLine(yPos);
  yPos += 10;

  // ==================== TOTALS ====================
  addRow("Subtotal:", formatVNDForPdf(billData.subtotal || 0), yPos);
  yPos += 7;

  addRow("Tax (10%):", formatVNDForPdf(billData.taxAmount || 0), yPos);
  yPos += 7;

  if (billData.discountAmount > 0) {
    addRow("Discount:", `-${formatVNDForPdf(billData.discountAmount)}`, yPos);
    yPos += 7;
  }

  addLine(yPos);
  yPos += 10;

  // Total (emphasized)
  addRow("TOTAL:", formatVNDForPdf(billData.totalAmount || 0), yPos, {
    fontSize: 14,
    isBold: true,
  });

  yPos += 18;
  addLine(yPos);
  yPos += 12;

  // ==================== FOOTER ====================
  doc.setFontSize(10);
  setFontStyle(false);
  addCenteredText("Cảm ơn quý khách!", yPos);
  yPos += 6;
  doc.setFontSize(9);
  addCenteredText("Hẹn gặp lại", yPos);

  // ==================== SAVE ====================
  const fileName = `bill-table-${billData.tableNumber || "unknown"}-${
    billData.sessionNumber || "session"
  }.pdf`;
  doc.save(fileName);

  return fileName;
};

export default generateBillPdf;
