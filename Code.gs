/**
 * EASY TO PRINT - SECURE BACKEND (PHASE 1 - GSHEET DATABASE)
 */

const CONFIG = {
  PAYPAL_ACCOUNT: 'vuquangcuong@gmail.com',
  PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID',
  PAYPAL_SECRET: 'YOUR_PAYPAL_SECRET',
  PAYPAL_API: 'https://api-m.sandbox.paypal.com',
  SHEET_ID: 'YOUR_GOOGLE_SHEET_ID',
  DRIVE_FOLDER_ID: 'YOUR_GOOGLE_DRIVE_FOLDER_ID'
};

/**
 * Endpoint GET: Lấy danh sách sản phẩm (Dùng cho Website render động)
 * Có tích hợp CacheService để tăng tốc độ phản hồi.
 */
function doGet(e) {
  const cache = CacheService.getScriptCache();
  const cachedData = cache.get("products_json");
  
  if (cachedData != null) {
    return ContentService.createTextOutput(cachedData).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName("Products");
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

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

    const finalJson = JSON.stringify(products);
    // Lưu vào cache trong 5 phút (300 giây)
    cache.put("products_json", finalJson, 300);
    
    return ContentService.createTextOutput(finalJson).setMimeType(ContentService.MimeType.JSON);
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

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === productName) {
        return data[i][8];
      }
    }
  } catch (e) { return null; }
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

function sendDownloadEmail(email, productName) {
  const driveUrl = getDownloadLinkFromSheet(productName) || ('https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID);
  MailApp.sendEmail(email, '[Easy to Print] Link for ' + productName, `Thanks for your purchase! Your folder: ${driveUrl}`);
}
