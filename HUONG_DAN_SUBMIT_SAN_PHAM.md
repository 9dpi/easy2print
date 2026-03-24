# 🚀 Hướng Dẫn Thêm Sản Phẩm Digital (Cơ Chế Dynamic)

Hệ thống đã được nâng cấp lên cơ chế **Trang Động (Dynamic Page)**. Bạn chỉ cần 1 tệp `digital-product-detail.html` duy nhất cho toàn bộ sản phẩm.

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
    price: "$9.99",
    image: "assets/new-product-mockup.png",
    category: "Digital Downloads > SVG Files > Category",
    tags: ["svg", "art"]
},
```
> [!TIP]
> **ID duy nhất**: ID này bạn tự đặt (không dấu, cách nhau bằng gạch ngang), ví dụ: `floral-wreath-svg`. Nó sẽ xuất hiện trên URL: `?id=floral-wreath-svg`.

---

## 💻 Bước 4: Hiển thị trên Trang chủ (`index.html`)

Thêm khối `product-card` vào `index.html`. Quan trọng nhất là sửa ID trong phần `onclick`:

```html
<div class="product-card" data-tags="svg art" onclick="window.location.href='digital-product-detail.html?id=id-san-pham-doc-nhat'">
    <div class="product-image-container">
        <img src="assets/new-product-mockup.png" alt="Tên sản phẩm">
        <span class="stock-status">DIGITAL</span>
    </div>
    <div class="product-info">
        <h3>Tên Sản Phẩm Hiển Thị</h3>
        <div class="product-price">$9.99</div>
        <div class="hashtags">
            <span class="hashtag">#svg</span>
            <span class="hashtag">#art</span>
        </div>
    </div>
</div>
```

---

## 🚀 Bước 5: Commit và Push git

Sau khi thêm sản phẩm, dùng terminal chạy:
```bash
git add .
git commit -m "Add new digital product: [ID Sản Phẩm]"
git push origin main
```

---

### 💡 Lưu ý quan trọng cho `data-tags`:
Phần lọc tìm kiếm theo hashtag dựa vào thuộc tính `data-tags="..."`. Bạn phải điền đúng tag (svg, laser, art,...) để khách hàng có thể tìm thấy sản phẩm khi bấm vào Menu Danh mục.
