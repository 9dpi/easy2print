# 🚀 Hướng Dẫn Thêm Sản Phẩm Digital (Cơ Chế Dynamic)

Hệ thống đã được nâng cấp lên cơ chế **Trang Động (Dynamic Page)**. Bạn chỉ cần 1 tệp `digital-product-detail.html` duy nhất cho toàn bộ sản phẩm.

> [!TIP]
> **CÔNG CỤ MỚI**: Để việc thêm sản phẩm dễ dàng hơn, bạn có thể sử dụng trang admin nội bộ:
> 🔗 [**add-product.html**](add-product.html)
> Trang này sẽ giúp bạn tạo mã code tự động và xem trước (preview) sản phẩm trước khi thêm vào hệ thống.

---

## 📂 Bước 1: Chuẩn bị File trên Google Drive
(Giữ nguyên như trước - Đảm bảo phân quyền "Anyone with link can view")

---

## 🎨 Bước 2: Chuẩn bị Hình ảnh Mockup (Thumbnail)
1.  Lưu hình ảnh vào thư mục `assets/`.
2.  Ví dụ: `assets/new-product-mockup.png`.

---

## 📝 Bước 3: Đăng ký Sản phẩm vào `products.js`

Mở tệp `products.js` và thêm một đoạn mã JS cho sản phẩm mới vào trong khối `const products = { ... };`.

**Mẫu code (Copy & điền thông tin):**
```javascript
"id-san-pham-doc-nhat": {
    title: "Tên Sản Phẩm Đầy Đủ Hiển Thị Trên Trang Chi Tiết",
    price: "$2.00", // GIÁ HIỆN TẠI ĐANG LÀ ĐỒNG GIÁ $2.00
    image: "assets/new-product-mockup.png",
    category: "Digital Downloads > SVG Files > Category",
    tags: ["svg", "art"]
},
```
> [!TIP]
> **ID duy nhất**: ID này bạn tự đặt (không dấu, cách nhau bằng gạch ngang), ví dụ: `floral-wreath-svg`. Nó sẽ xuất hiện trên URL: `?id=floral-wreath-svg`.

---

## 💻 Bước 4: Hiển thị trên Trang chủ (`index.html`)

Thêm khối `product-card` vào `index.html`. Quan trọng nhất là sửa ID trong phần `onclick` và thêm giá gốc để hiển thị gạch ngang:

```html
<div class="product-card" data-tags="svg art" onclick="window.location.href='digital-product-detail.html?id=id-san-pham-doc-nhat'">
    <div class="product-image-container">
        <img src="assets/new-product-mockup.png" alt="Tên sản phẩm">
        <span class="stock-status">DIGITAL</span>
    </div>
    <div class="product-info">
        <h3>Tên Sản Phẩm Hiển Thị</h3>
        <div class="product-price">$2.00 <span class="original-price">$5.00</span></div>
        <div class="hashtags">
            <span class="hashtag">#svg</span>
            <span class="hashtag">#art</span>
        </div>
    </div>
</div>
```

---

## 🔍 Tính năng Tìm kiếm & Lọc theo Danh mục

1.  **Tìm kiếm**: Ô tìm kiếm phía trên cùng cho phép khách hàng tìm sản phẩm theo tên (không phân biệt hoa thường).
2.  **Lọc Danh mục**: Khách hàng có thể lọc theo menu điều hướng (`nav-links`) với các hashtag sau:
    *   **SVG Files**: `#svg`
    *   **Digital Art Prints**: `#art`
    *   **Graphic Bundles**: `#bundle`
    *   **Printables**: `#printable`
    *   **T-Shirt Design**: `#tshirt`
    *   **WallArt**: `#wallart`

*(Chú ý điền đúng `data-tags` tại `product-card` để sản phẩm xuất hiện ở danh mục tương ứng).*

> [!IMPORTANT]
> **Cache Browser**: Nếu bạn đã sửa file mà trang web không thay đổi, hãy thêm mã phiên bản vào link CSS/JS trong HTML (ví dụ: `index.css?v=2.1`) hoặc nhấn **Ctrl + F5** để xóa cache.

---

## 🚀 Bước 5: Commit và Push git

Sau khi thêm sản phẩm, dùng terminal chạy:
```bash
git add .
git commit -m "Add new digital product: [ID Sản Phẩm]"
git push origin main
```

---

## 🚀 Hướng Dẫn Nhân Bản (Clone) Website Thành 1 Cửa Hàng Riêng Biệt

Để nhân bản một phiên bản thứ hai của website (chẳng hạn `easy2print_2`) hoạt động hoàn toàn độc lập với website cũ, bạn hãy làm theo 5 bước sau:

### 📂 Bước 1: Sao chép Mã nguồn (Frontend)
1. Copy thư mục `Easy_to_print` hiện tại và dán ra một thư mục mới có tên là `Easy_to_print_2`.
2. Tạo một kho lưu trữ (Repository) mới trên Github (vd: `easy2print_2`).
3. Đẩy (Push) mã nguồn từ thư mục mới lên Github và kích hoạt chế độ Github Pages.

### ☁️ Bước 2: Thiết lập Backend mới (Google Apps Script)
1. Tạo **1 Google Sheet mới** (để chứa đơn hàng mới) và **1 Thư mục Google Drive mới** (Nhớ cấp quyền "Bất kỳ ai có liên kết đều có thể xem" cho Thư mục Drive này).
2. Tạo một tệp **Google Apps Script** mới trên nền tảng Google.
3. Chép toàn bộ nội dung file `Code.gs` từ website cũ dán vào.
4. Cập nhật biến `SHEET_ID` và `DRIVE_FOLDER_ID` tương ứng với 2 thư mục/trang tính mới.
5. Nhấn **Deploy -> New Deployment -> Web App** (với quyền "Anyone/Bất cứ ai"). Copy **đoạn Link API mới** vừa được tạo.

### 🔗 Bước 3: Cập nhật Liên kết & Bảo mật vào Web mới
1. Mở file `checkout.js` trong thư mục web mới.
2. Tìm đến hằng số `APP_SCRIPT_URL` và **Thay bằng Link API mới** của bạn (vừa copy ở Bước 2).

### 🎨 Bước 4: Chuyển đổi Thương hiệu & Sản phẩm (Nếu cần)
1. **Thay Tên/Logo**: Sửa chữ `Easy to Print` thành thương hiệu mới trong các file `.html`.
2. **Sản phẩm**: Xóa trắng dữ liệu trong tệp `products.js` và dùng công cụ nội bộ trang admin (`add-product.html`) để nhập sản phẩm mới.

### 💳 Bước 5: Cấu hình Thanh toán (PayPal)
*   **Dùng chung PayPal gốc**: Bạn có thể giữ nguyên Client ID & Secret cũ nếu vẫn muốn tiền đổ về ví PayPal cũ.
*   **Dùng PayPal mới**: Nếu muốn nhận ở tài khoản PayPal khác, hãy tạo Client ID/Secret mới trên Developer PayPal. Thay thông tin vào tệp `Code.gs` và các thẻ `<script src="https://www.paypal.com/sdk/js?client-id=...">` ở file `.html`.
