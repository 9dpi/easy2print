/**
 * EASY EMBROIDERY - AI Auto Product Submission Tool
 * ==============================================================
 * Tự động hóa việc tạo Title, Description, Hashtag bằng AI (DeepSeek).
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const DEEPSEEK_API_KEY = 'sk-e2cfceecd3724eaf97cd27f5ebe04559'; // Nhập API Key của bạn vào đây
const DOWNLOAD_DIR = path.join(__dirname, 'Download');
const ASSETS_DIR = path.join(__dirname, 'assets');
const GDRIVE_SYNC_DIR = 'G:\\My Drive\\easy2print'; // Thư mục Google Drive Desktop của bạn
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];

// --- Utilities ---
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Gọi AI DeepSeek để tạo nội dung SEO chuyên nghiệp
 */
async function generateAIContent(fileName) {
    if (DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY') {
        return {
            title: fileName.replace(/[-_]/g, ' '),
            description: "Premium Machine Embroidery Design. Tested and optimized for home machines.",
            tags: ["embroidery", "dst", "pes"]
        };
    }

    console.log(`🤖 AI đang phân tích và tạo nội dung cho: ${fileName}...`);
    try {
        const prompt = `Bạn là chuyên gia marketing cho cửa hàng thêu "Easy Embroidery".
Tên file gốc: "${fileName}"
Hãy tạo ra thông tin sản phẩm thêu máy (embroidery design) chuẩn SEO 2026:
1. Title: Tên sản phẩm hấp dẫn, chứa từ khóa (vd: Floral, DST, PES, Machine Embroidery).
2. Description: Mô tả People-First hữu ích, nhắc đến việc đã test trên máy gia đình, kích thước chuẩn.
3. Tags: 5-8 hashtag phù hợp nhất.

Trả về định dạng JSON: {"title": "...", "description": "...", "tags": ["tag1", "tag2"]}`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" }
            })
        });

        const result = await response.json();
        return JSON.parse(result.choices[0].message.content);
    } catch (e) {
        console.log(`⚠️ AI Error: ${e.message}. Sử dụng thông tin mặc định.`);
        return {
            title: fileName.replace(/[-_]/g, ' '),
            description: "High-quality machine embroidery design. Instant download.",
            tags: ["embroidery", "home-machine"]
        };
    }
}

// --- Step 1: Scan Download folder ---
function scanDownloadFolder() {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
        return [];
    }
    return fs.readdirSync(DOWNLOAD_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return VALID_EXTENSIONS.includes(ext);
    });
}

// --- Step 2: Sync to Google Sheets ---
async function syncToGSheet(payload) {
    console.log(`☁️  Đang đẩy dữ liệu lên Google Sheets...`);
    try {
        const res = await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addProduct', ...payload })
        });
        const result = await res.json();
        if (result.status === 'success') {
            console.log(`✅ Thành công! Sản phẩm đã nằm trên GSheet.`);
        } else {
            console.log(`❌ Lỗi API GSheet: ${result.message}`);
        }
    } catch (e) {
        console.log(`❌ GSheet Sync Failed: ${e.message}`);
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  🧵 EASY EMBROIDERY - AI AUTO SUBMISSION     ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    const files = scanDownloadFolder();
    if (files.length === 0) {
        console.log('⚠️ Không tìm thấy file trong Download/');
        process.exit(0);
    }

    // Lọc danh sách file theo name (tránh trùng lặp nếu có cả .svg và .dst)
    const uniqueBases = [...new Set(files.map(f => path.parse(f).name))];

    for (const baseName of uniqueBases) {
        console.log(`\n⏳ Đang xử lý sản phẩm: ${baseName}...`);

        // Tìm file ảnh/file thumb (.svg hoặc .png/jpg)
        const thumbFile = files.find(f => path.parse(f).name === baseName && VALID_EXTENSIONS.includes(path.extname(f).toLowerCase()));

        if (!thumbFile) {
            console.log(`❌ Không tìm thấy file ảnh cho ${baseName}. Bỏ qua.`);
            continue;
        }

        // Gọi AI tạo nội dung
        const aiContent = await generateAIContent(baseName);
        const id = slugify(baseName);

        // Tìm file Download (Ưu tiên .dst, nếu không có thì tìm .txt chứa link)
        let downloadUrl = "https://example.com/check-link"; // Fallback
        let fileToDelete = [];

        // 1. Kiểm tra file .dst trong thư mục
        const dstFile = files.find(f => path.parse(f).name === baseName && path.extname(f).toLowerCase() === '.dst');
        if (dstFile) {
            const srcPath = path.join(DOWNLOAD_DIR, dstFile);
            const destPath = path.join(GDRIVE_SYNC_DIR, dstFile);
            
            // Tự động copy vào Drive Desktop
            if (fs.existsSync(GDRIVE_SYNC_DIR)) {
                fs.copyFileSync(srcPath, destPath);
                console.log(`🚀 Đã đồng bộ file thêu lên Drive: ${dstFile}`);
            } else {
                console.log(`⚠️ Không tìm thấy ổ G:\\. Hãy đảm bảo Google Drive Desktop đang chạy!`);
            }

            downloadUrl = `[File Drive Sẵn Sàng] ${dstFile}`; 
            fileToDelete.push(dstFile);
        }

        // 2. Tìm link trong file .txt (nếu có)
        const txtFile = `${baseName}_Download.txt`;
        const txtPath = path.join(DOWNLOAD_DIR, txtFile);
        if (fs.existsSync(txtPath)) {
            const content = fs.readFileSync(txtPath, 'utf8');
            const match = content.match(/https?:\/\/[^\s]+/);
            if (match) {
                downloadUrl = match[0];
                fileToDelete.push(txtFile);
                console.log(`🔗 Đã tìm thấy link tải: ${downloadUrl}`);
            }
        }

        // Copy ảnh vào Assets
        const ext = path.extname(thumbFile);
        const newImgName = id + ext;
        fs.copyFileSync(path.join(DOWNLOAD_DIR, thumbFile), path.join(ASSETS_DIR, newImgName));
        fileToDelete.push(thumbFile);

        // Push to GSheet
        await syncToGSheet({
            id: id,
            title: aiContent.title,
            category: "Machine Embroidery",
            tags: aiContent.tags,
            description: aiContent.description,
            imagePath: 'assets/' + newImgName,
            downloadUrl: downloadUrl
        });

        // Cleanup
        fileToDelete.forEach(f => {
            const p = path.join(DOWNLOAD_DIR, f);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });

        console.log(`🎉 Hoàn tất sản phẩm: ${aiContent.title}`);
    }
    console.log('\n✅ TẤT CẢ SẢN PHẨM ĐÃ ĐƯỢC XỬ LÝ!');
}

main();
