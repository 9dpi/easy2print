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
2.  **Lọc Danh mục**: 4 vòng tròn danh mục bên dưới Hero Banner đã được cấu hình sẵn để lọc sản phẩm theo hashtag:
    *   **T-shirts**: Lọc sản phẩm có tag `#svg`
    *   **Posters**: Lọc sản phẩm có tag `#art`
    *   **Kid & Babies**: Lọc sản phẩm có tag `#planner`
    *   **Home & Living**: Lọc sản phẩm có tag `#laser`

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
