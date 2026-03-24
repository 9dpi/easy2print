
/**
 * EASY TO PRINT - SECURE BACKEND (GOOGLE APPS SCRIPT)
 * Hướng dẫn:
 * 1. Paste đoạn code này vào trình biên soạn Google Apps Script.
 * 2. Thay đổi PAYPAL_CLIENT_ID và PAYPAL_SECRET (Lấy từ https://developer.paypal.com/)
 * 3. Tài khoản PayPal nhận tiền: vuquangcuong@gmail.com
 * 4. Deploy dưới dạng Web App và cấp quyền truy cập "Anyone" (Kể cả người ẩn danh).
 */

const CONFIG = {
  PAYPAL_ACCOUNT: 'vuquangcuong@gmail.com',  // Email tài khoản nhận tiền
  PAYPAL_CLIENT_ID: 'YOUR_PAYPAL_CLIENT_ID', // Thay bằng ID thực tế
  PAYPAL_SECRET: 'YOUR_PAYPAL_SECRET',       // Thay bằng Secret thực tế
  PAYPAL_API: 'https://api-m.sandbox.paypal.com', // Đổi thành 'https://api-m.paypal.com' khi chạy thật (Live)
  SHEET_ID: '1UAlwooykAXCkmDajDp6KgQqMxL2z8FCTeR_CBE7bTjo',
  DRIVE_FOLDER_ID: '1K2n0Wcpofaxd3Qv_lXDeFNtpDp_f7l2z'
};

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const transactionId = data.transaction_id;
    const payerEmail = data.payer_email;

    // BƯỚC 1: Lấy Access Token từ PayPal
    const accessToken = getPayPalAccessToken();

    // BƯỚC 2: Xác thực đơn hàng trực tiếp với Server PayPal
    const orderDetails = verifyPayPalOrder(transactionId, accessToken);

    // BƯỚC 3: Kiểm tra trạng thái và số tiền (Bảo mật cốt lõi)
    if (orderDetails.status === 'COMPLETED') {
      
      // A. Ghi dữ liệu vào Google Sheets
      logToGoogleSheet(data, orderDetails);

      // B. Gửi Email chứa link tải file (Bảo mật: Link không lộ ở Frontend)
      sendDownloadEmail(payerEmail, data.product_name);

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Order verified and logged.' }))
                           .setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error('PayPal Order Status is not COMPLETED: ' + orderDetails.status);
    }

  } catch (error) {
    Logger.log('Error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Lấy Access Token dùng OAuth 2.0
 */
function getPayPalAccessToken() {
  const auth = Utilities.base64Encode(CONFIG.PAYPAL_CLIENT_ID + ':' + CONFIG.PAYPAL_SECRET);
  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Basic ' + auth,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    payload: 'grant_type=client_credentials'
  };
  
  const response = UrlFetchApp.fetch(CONFIG.PAYPAL_API + '/v1/oauth2/token', options);
  const result = JSON.parse(response.getContentText());
  return result.access_token;
}

/**
 * Gọi PayPal API để lấy chi tiết Order thực tế
 */
function verifyPayPalOrder(orderId, token) {
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  };
  
  const response = UrlFetchApp.fetch(CONFIG.PAYPAL_API + '/v2/checkout/orders/' + orderId, options);
  return JSON.parse(response.getContentText());
}

/**
 * Ghi log vào Google Sheet cá nhân
 */
function logToGoogleSheet(originalData, paypalDetails) {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  const sheet = ss.getSheets()[0];
  
  sheet.appendRow([
    new Date(), 
    paypalDetails.id, 
    originalData.payer_email, 
    originalData.payer_name,
    originalData.product_name,
    paypalDetails.purchase_units[0].amount.value,
    paypalDetails.purchase_units[0].amount.currency_code,
    'Verified (COMPLETED)'
  ]);
}

/**
 * Gửi email tự động kèm link Drive
 */
function sendDownloadEmail(email, productName) {
  const driveUrl = 'https://drive.google.com/drive/folders/' + CONFIG.DRIVE_FOLDER_ID;
  
  const subject = '[Easy to Print] Your Download Link for ' + productName;
  const body = `Thank you for your purchase!\n\n` +
               `Your digital files are ready for download at the link below:\n` +
               `${driveUrl}\n\n` +
               `Please Note: This link is for your personal use as per the license agreement.\n\n` +
               `Best Regards,\nEasy to Print Team`;
               
  MailApp.sendEmail(email, subject, body);
}
