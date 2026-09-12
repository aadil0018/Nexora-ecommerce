const PDFDocument = require('pdfkit');

/**
 * Generates a branded PDF invoice buffer for an order.
 * @param {Object} order - Populated Mongoose order object or plain order dictionary
 * @returns {Promise<Buffer>} - Resolves with the generated PDF Buffer
 */
const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryColor = '#4f46e5';
      const darkColor = '#0f172a';
      const grayColor = '#64748b';
      const lightGray = '#f1f5f9';
      const greenColor = '#10b981';

      // --- 1. HEADER & LOGO ---
      doc
        .rect(0, 0, doc.page.width, 100)
        .fill(darkColor);

      // Nexora Logo Text
      doc
        .fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('NEXORA', 40, 32, { continued: true })
        .fillColor(primaryColor)
        .text(' .', { continued: false });

      doc
        .fillColor('#94a3b8')
        .fontSize(9)
        .font('Helvetica')
        .text('AI-Powered Intelligent Commerce Platform', 40, 62);

      // Header Right: Tax Invoice Label
      doc
        .fillColor('#ffffff')
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('TAX INVOICE', 350, 32, { align: 'right', width: 205 });

      const invoiceNumber = `INV-${order._id ? order._id.toString().slice(-8).toUpperCase() : '000000'}`;
      const invoiceDate = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-IN');

      doc
        .fillColor('#cbd5e1')
        .fontSize(9)
        .font('Helvetica')
        .text(`Invoice #: ${invoiceNumber}`, 350, 58, { align: 'right', width: 205 })
        .text(`Date: ${invoiceDate}`, 350, 72, { align: 'right', width: 205 });

      doc.moveDown();

      // --- 2. BILL TO & ORDER INFO BOXES ---
      const topY = 120;
      doc
        .roundedRect(40, topY, 255, 110, 6)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      doc
        .roundedRect(310, topY, 245, 110, 6)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      // Left Box: Billed To Customer
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLED TO / SHIPPING ADDRESS', 52, topY + 12);

      const customerName =
        (order.user && order.user.name) ||
        (order.shippingAddress && order.shippingAddress.name) ||
        'Valued Customer';
      const customerEmail = (order.user && order.user.email) || '';
      const phone = (order.shippingAddress && order.shippingAddress.phone) || '';
      const address = (order.shippingAddress && order.shippingAddress.address) || '';
      const cityZip = [
        order.shippingAddress && order.shippingAddress.city,
        order.shippingAddress && order.shippingAddress.postalCode,
      ]
        .filter(Boolean)
        .join(' - ');
      const country = (order.shippingAddress && order.shippingAddress.country) || 'India';

      doc
        .fillColor(darkColor)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(customerName, 52, topY + 28);

      doc
        .fillColor(grayColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text(address, 52, topY + 44, { width: 235 })
        .text(`${cityZip}, ${country}`, 52, topY + 58)
        .text(`Phone: ${phone}`, 52, topY + 72)
        .text(`Email: ${customerEmail}`, 52, topY + 86);

      // Right Box: Order Particulars
      doc
        .fillColor(primaryColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ORDER PARTICULARS', 322, topY + 12);

      const orderIdStr = order._id ? order._id.toString() : 'N/A';
      const paymentMethod = order.paymentMethod || 'Online UPI / Card';
      const paymentStatus = order.paymentStatus || 'Completed';
      const orderStatus = order.orderStatus || 'Processing';

      doc
        .fillColor(grayColor)
        .fontSize(8.5)
        .font('Helvetica')
        .text('Order ID:', 322, topY + 30)
        .fillColor(darkColor)
        .text(orderIdStr, 400, topY + 30, { width: 145 })
        .fillColor(grayColor)
        .text('Status:', 322, topY + 46)
        .fillColor(orderStatus === 'Cancelled' ? '#ef4444' : greenColor)
        .font('Helvetica-Bold')
        .text(orderStatus.toUpperCase(), 400, topY + 46)
        .font('Helvetica')
        .fillColor(grayColor)
        .text('Payment:', 322, topY + 62)
        .fillColor(darkColor)
        .text(`${paymentMethod} (${paymentStatus})`, 400, topY + 62)
        .fillColor(grayColor)
        .text('Fulfillment:', 322, topY + 78)
        .fillColor(darkColor)
        .text('Nexora Express Logistics', 400, topY + 78);

      // --- 3. ITEMS TABLE HEADER ---
      const tableY = 250;
      doc
        .rect(40, tableY, 515, 26)
        .fill(lightGray);

      doc
        .fillColor(darkColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('#', 50, tableY + 8)
        .text('ITEM DESCRIPTION', 80, tableY + 8)
        .text('QTY', 350, tableY + 8, { width: 40, align: 'center' })
        .text('PRICE', 410, tableY + 8, { width: 60, align: 'right' })
        .text('TOTAL', 485, tableY + 8, { width: 60, align: 'right' });

      // --- 4. ITEMS ROWS ---
      let currentY = tableY + 32;
      const items = order.orderItems || [];

      items.forEach((item, index) => {
        const itemTotal = (item.price || 0) * (item.qty || 1);

        doc
          .fillColor(grayColor)
          .fontSize(8.5)
          .font('Helvetica')
          .text(`${index + 1}`, 50, currentY)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text(item.name || 'Product', 80, currentY, { width: 250 })
          .font('Helvetica')
          .fillColor(darkColor)
          .text(`${item.qty || 1}`, 350, currentY, { width: 40, align: 'center' })
          .text(`₹${Number(item.price || 0).toLocaleString('en-IN')}`, 410, currentY, { width: 60, align: 'right' })
          .font('Helvetica-Bold')
          .text(`₹${Number(itemTotal).toLocaleString('en-IN')}`, 485, currentY, { width: 60, align: 'right' });

        currentY += 24;

        // Separator line
        doc
          .moveTo(40, currentY - 6)
          .lineTo(555, currentY - 6)
          .strokeColor('#f1f5f9')
          .lineWidth(0.8)
          .stroke();
      });

      // --- 5. SUMMARY & TOTALS ---
      const totalAmount = Number(order.totalAmount || 0);
      const summaryY = Math.max(currentY + 16, 440);

      // Notes on Left
      doc
        .roundedRect(40, summaryY, 260, 85, 4)
        .fill('#f8fafc');

      doc
        .fillColor(primaryColor)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('THANK YOU FOR SHOPPING WITH NEXORA', 52, summaryY + 12);

      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica')
        .text(
          'This is a computer-generated tax invoice. For returns or support, visit nexora.com/orders or contact our AI support concierge.',
          52,
          summaryY + 28,
          { width: 236 }
        );

      // Totals on Right
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', 340, summaryY + 8)
        .fillColor(darkColor)
        .text(`₹${totalAmount.toLocaleString('en-IN')}`, 455, summaryY + 8, { width: 90, align: 'right' })
        .fillColor(grayColor)
        .text('Shipping & Delivery:', 340, summaryY + 24)
        .fillColor(greenColor)
        .text('FREE', 455, summaryY + 24, { width: 90, align: 'right' })
        .fillColor(grayColor)
        .text('Taxes (Included):', 340, summaryY + 40)
        .fillColor(darkColor)
        .text('₹0.00', 455, summaryY + 40, { width: 90, align: 'right' });

      // Total Line Box
      doc
        .rect(330, summaryY + 60, 225, 30)
        .fill(primaryColor);

      doc
        .fillColor('#ffffff')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('GRAND TOTAL:', 342, summaryY + 70)
        .fontSize(12)
        .text(`₹${totalAmount.toLocaleString('en-IN')}`, 440, summaryY + 68, { width: 105, align: 'right' });

      // --- 6. FOOTER ---
      doc
        .fontSize(7.5)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(
          'Nexora E-Commerce Technologies Pvt. Ltd. • GSTIN: 29ABCDE1234F1Z5 • Authorized Tax Document',
          40,
          770,
          { align: 'center', width: 515 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateInvoicePDF };
