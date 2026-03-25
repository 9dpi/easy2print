@echo off
title Easy to Print - Product Submission Tool
echo ==============================================
echo   EASY TO PRINT - PRODUCT SUBMISSION TOOL
echo ==============================================
echo.
echo Đang mở hệ thống tự động tải sản phẩm...
echo.

:: Di chuyển đến thư mục chứa file .bat này
cd /d "%~dp0"

:: Chạy tool Node.js
node submit-product.js

:: Dừng màn hình lại sau khi xong để người dùng kịp đọc thông báo
echo.
pause
