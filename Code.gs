/**
 * EASY TO PRINT - SECURE BACKEND (PHASE 1 - GSHEET DATABASE)
 */

const CONFIG = {
  PAYPAL_ACCOUNT: 'vuquangcuong@gmail.com',
  PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
  PAYPAL_SECRET: 'YOUR_PAYPAL_SECRET',
  PAYPAL_API: 'https://api-m.sandbox.paypal.com',
  SHEET_ID: '1UAlwooykAXCkmDajDp6KgQqMxL2z8FCTeR_CBE7bTjo',
  DRIVE_FOLDER_ID: 'YOUR_GOOGLE_DRIVE_FOLDER_ID'
};

/**
 * Endpoint GET: Lấy danh sách sản phẩm (Dùng cho Website render động)
 * Có tích hợp CacheService để tăng tốc độ phản hồi.
 */
function doGet(e) {
  const cache = CacheService.getScriptCache();
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    
    // --- Tính năng lấy Review ngẫu nhiên (Kèm Cache) ---
    if (e.parameter.action === 'getReviews') {
      const cachedReviews = cache.get("reviews_json");
      if (cachedReviews != null) return ContentService.createTextOutput(cachedReviews).setMimeType(ContentService.MimeType.JSON);

      const reviewSheet = ss.getSheetByName("Comments");
      if (!reviewSheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
      
      const reviewData = reviewSheet.getDataRange().getValues();
      const reviews = [];
      
      for (let i = 0; i < reviewData.length; i++) {
        const name = (reviewData[i][0] || "").toString().trim();
        const comment = (reviewData[i][2] || "").toString().trim();
        if (!name || !comment) continue;
        
        const now = new Date();
        const randomDays = Math.floor(Math.random() * 30);
        const randomDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
        const dateStr = randomDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        reviews.push({ name, date: dateStr, text: comment, initial: name.charAt(0).toUpperCase() });
      }
      const finalReviewsJson = JSON.stringify(reviews);
      cache.put("reviews_json", finalReviewsJson, 300); // Lưu cache 5 phút
      return ContentService.createTextOutput(finalReviewsJson).setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- Lấy danh sách sản phẩm (Kèm Cache) ---
    const cachedProducts = cache.get("products_json");
    if (cachedProducts != null) return ContentService.createTextOutput(cachedProducts).setMimeType(ContentService.MimeType.JSON);

    const sheet = ss.getSheetByName("Products");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const products = [];

    for (let i = 1; i < data.length; i++) {
        let product = {};
        data[i].forEach((cell, index) => {
            let key = headers[index].toLowerCase().replace(/\s+/g, '_');
            product[key] = cell;
        });
        products.push(product);
    }

    const finalProductsJson = JSON.stringify(products);
    cache.put("products_json", finalProductsJson, 300); // Lưu cache 5 phút
    return ContentService.createTextOutput(finalProductsJson).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === "addProduct") {
      return handleAddProduct(data);
    }

    if (data.action === "customRequest") {
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      const email = data.email;
      const size = data.size || "Standard";
      const desc = data.description || "No description provided.";

      // 1. Gửi Email thông báo cho Admin
      const emailBody = `💡 CÓ YÊU CẦU THÊU THEO YÊU CẦU MỚI!\n\n` +
                        `- Email khách: ${email}\n` +
                        `- Kích thước muốn: ${size}\n` +
                        `- Mô tả: ${desc}\n\n` +
                        `Vui lòng phản hồi khách qua email để báo giá và nhận file ảnh!`;
      
      MailApp.sendEmail("vuquangcuong@gmail.com", "🌟 [Easy Embroidery] New Custom Design Request!", emailBody);

      // 2. Lưu vào trang GSheet "CustomRequests"
      let customSheet = ss.getSheetByName("CustomRequests");
      if (!customSheet) {
          customSheet = ss.insertSheet("CustomRequests");
          customSheet.appendRow(["Timestamp", "Email", "Dimensions", "Description", "Status"]);
      }
      customSheet.appendRow([new Date(), email, size, desc, "Pending"]);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Request received!' }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    if (data.action === "submitReview") {
      const adminEmail = "vuquangcuong@gmail.com";
      const subject = `⭐ New Review for ${data.product}`;
      const body = `
        New Review Submitted:
        - Product: ${data.product}
        - Customer: ${data.name}
        - Rating: ${data.rating} Stars
        - Comment: ${data.comment}
      `;
      MailApp.sendEmail(adminEmail, subject, body);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    const transactionId = data.transaction_id || data.id;
    const payerEmail = data.payer_email || (data.payer ? data.payer.email_address : "");

    const accessToken = getPayPalAccessToken();
    const orderDetails = verifyPayPalOrder(transactionId, accessToken);

    if (orderDetails.status === 'COMPLETED') {
        const amountPaid = parseFloat(orderDetails.purchase_units[0].amount.value);
        if (amountPaid < 2.00) throw new Error('Transaction amount too low.');

        logToGoogleSheet(data, orderDetails);
        sendDownloadEmail(payerEmail, data.product_name);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
                             .setMimeType(ContentService.MimeType.JSON);
    } else {
        throw new Error('PayPal state not completed.');
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Xử lý lệnh thêm sản phẩm tự động từ tool submit-product.js (Nâng cấp Phase 1)
 */
function handleAddProduct(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName("Products");
    
    const COLUMNS = [
      "ID", "Title", "Price", "Original Price", 
      "Image URL", "Category", "Tags", "Description", "Download Link"
    ];

    if (!sheet) {
      sheet = ss.insertSheet("Products");
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight("bold").setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
    
    const row = [
      data.id,
      data.title,
      data.price || "$2.00",
      data.originalPrice || "$5.00",
      data.imagePath,
      data.category,
      Array.isArray(data.tags) ? data.tags.join(", ") : data.tags,
      data.description || "",
      data.downloadUrl
    ];

    sheet.appendRow(row);
    
    // Xóa cache
    CacheService.getScriptCache().remove("products_json");
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
                         .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

function getDownloadLinkFromSheet(productName) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName("Products");
    if (!sheet) return null;

    const query = (productName || "").toString().trim().toLowerCase();
    const data = sheet.getDataRange().getValues();
    
    // 1. Ưu tiên kiểm tra link đã dán sẵn trong GSheet (Cột I)
    for (let i = 1; i < data.length; i++) {
      const rowTitle = (data[i][1] || "").toString().trim().toLowerCase();
      if (rowTitle === query || query.includes(rowTitle)) {
        const linkInSheet = data[i][8]; 
        if (linkInSheet && linkInSheet.toString().startsWith("http")) {
           return linkInSheet;
        }
      }
    }

    // 2. TỰ ĐỘNG QUÉT DRIVER (Cực kỳ thông minh)
    // Nếu GSheet chưa có link, hệ thống sẽ tự vào thư mục Drive để tìm file trùng tên
    Logger.log("🔎 Đang tự động tìm file trên Drive cho: " + productName);
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const files = folder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName().toLowerCase();
      
      // Nếu tên file chứa tên sản phẩm (vd: "hoa_hong.dst" chứa "hoa hong")
      if (fileName.includes(query.replace(/\s+/g, '_')) || fileName.includes(query)) {
        Logger.log("🎯 Đã tự động tìm thấy file: " + file.getName());
        return file.getDownloadUrl().replace("?e=download", ""); // Lấy link tải trực tiếp
      }
    }

    Logger.log("⚠️ Không tìm thấy file lẻ trên Drive. Trả về link thư mục tổng.");
    return null;
  } catch (e) { 
    Logger.log("❌ Lỗi tìm kiếm: " + e.message);
    return null; 
  }
}

function getPayPalAccessToken() {
  const auth = Utilities.base64Encode(CONFIG.PAYPAL_CLIENT_ID + ':' + CONFIG.PAYPAL_SECRET);
  const options = {
    method: 'post',
    headers: { 'Authorization': 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' },
    payload: 'grant_type=client_credentials'
  };
  const response = UrlFetchApp.fetch(CONFIG.PAYPAL_API + '/v1/oauth2/token', options);
  return JSON.parse(response.getContentText()).access_token;
}

function verifyPayPalOrder(orderId, token) {
  const options = { method: 'get', headers: { 'Authorization': 'Bearer ' + token } };
  const response = UrlFetchApp.fetch(CONFIG.PAYPAL_API + '/v2/checkout/orders/' + orderId, options);
  return JSON.parse(response.getContentText());
}

function logToGoogleSheet(originalData, paypalDetails) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheets()[0];
  sheet.appendRow([new Date(), paypalDetails.id, originalData.payer_email, originalData.payer_name, originalData.product_name, paypalDetails.purchase_units[0].amount.value, 'USD', 'Verified']);
}

function sendDownloadEmail(payerEmail, productName) {
  const downloadUrl = getDownloadLinkFromSheet(productName) || ('https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID);
  
  const subject = `🧵 Your Embroidery Files: ${productName} [Easy Embroidery]`;
  
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1a365d; padding: 25px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Easy Embroidery</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #2d3748; margin-top: 0;">Thank you for your purchase!</h2>
        <p style="color: #4a5568; line-height: 1.6;">We're excited to help you start your next embroidery project. You can now download your digital design files below:</p>
        
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 6px; margin: 25px 0; text-align: center; border: 1px dashed #cbd5e0;">
            <p style="font-weight: bold; margin-bottom: 5px; color: #2d3748;">Download Product:</p>
            <p style="margin-bottom: 20px; font-style: italic;">${productName}</p>
            <a href="${downloadUrl}" style="background-color: #3182ce; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download Files (.DST / .PES)</a>
        </div>
        
        <h4 style="color: #2d3748;">How to use:</h4>
        <ul style="color: #4a5568; padding-left: 20px;">
          <li>Download the file to your computer.</li>
          <li>Transfer the .DST or .PES file to your machine via USB.</li>
          <li>For best results, use a high-quality stabilizer.</li>
        </ul>
        
        <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 30px 0;">
        
        <p style="color: #718096; font-size: 14px; text-align: center;">
          Need help? Reply to this email or visit our <a href="https://9dpi.github.io/easy2print/" style="color: #3182ce;">Help Center</a>.
        </p>
      </div>
      <div style="background-color: #edf2f7; padding: 15px; text-align: center; font-size: 12px; color: #a0aec0;">
        © 2026 Easy Embroidery. Digital patterns for creative makers.
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: payerEmail,
    subject: subject,
    htmlBody: htmlBody
  });
}

/**
 * Hàm TEST để bạn kiểm tra mẫu Email
 * Chạy hàm này trong Google Apps Script Editor
 */
function testMyEmail() {
  const testEmail = "vuquangcuong@gmail.com";
  const testProductName = "Floral Mandala Design";
  sendDownloadEmail(testEmail, testProductName);
  Logger.log("Đã gửi email test tới: " + testEmail);
}
