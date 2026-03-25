/**
 * EASY TO PRINT - Product Submission Tool
 * ========================================
 * Tự động thêm sản phẩm mới lên website Easy to Print.
 *
 * Cách dùng:
 * 1. Bỏ file ảnh (.png, .jpg) VÀ file text (.txt chứa link tải) vào thư mục Download/
 * 2. Chạy: node submit-product.js
 * 3. Nhập thông tin sản phẩm.
 * 4. Tool sẽ tự động cập nhật web và GHI VÀO GOOGLE SHEETS!
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Configuration ---
const DOWNLOAD_DIR = path.join(__dirname, 'Download');
const ASSETS_DIR = path.join(__dirname, 'assets');
const PRODUCTS_FILE = path.join(__dirname, 'products.js');
const INDEX_FILE = path.join(__dirname, 'index.html');
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];
const AVAILABLE_TAGS = ['svg', 'art', 'bundle', 'printable', 'tshirt', 'wallart', 'accessories', 'gift'];
const DEFAULT_PRICE = '$2.00';
const ORIGINAL_PRICE = '$5.00';

// --- Utilities ---
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

function createReadlineInterface() {
    return readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}

function ask(rl, question) {
    return new Promise(resolve => {
        rl.question(question, answer => resolve(answer.trim()));
    });
}

// --- Step 1: Scan Download folder ---
function scanDownloadFolder() {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
        console.log('📁 Created Download/ folder. Please put your image file there and run again.');
        return [];
    }
    const files = fs.readdirSync(DOWNLOAD_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return VALID_EXTENSIONS.includes(ext);
    });
    return files;
}

// --- Step 2: Interactive Prompt ---
async function promptUserForDetails(rl, files) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  🖨️  EASY TO PRINT - Product Submission Tool  ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    // Select image file
    let selectedFile;
    if (files.length === 1) {
        selectedFile = files[0];
        console.log(`📸 Found image: ${selectedFile}\n`);
    } else {
        console.log('📸 Found multiple images in Download/:');
        files.forEach((f, i) => console.log(`   [${i + 1}] ${f}`));
        const choice = await ask(rl, '\n👉 Select file number: ');
        const idx = parseInt(choice) - 1;
        if (idx < 0 || idx >= files.length) {
            console.log('❌ Invalid selection. Exiting.');
            return null;
        }
        selectedFile = files[idx];
    }

    // Product title
    const title = await ask(rl, '📝 Product Title: ');
    if (!title) {
        console.log('❌ Title is required. Exiting.');
        return null;
    }

    // Category
    const category = await ask(rl, '📂 Category (e.g. "Wall Art > Boho"): ');

    // Tags
    console.log(`\n🏷️  Available Tags: ${AVAILABLE_TAGS.map(t => '#' + t).join(', ')}`);
    const tagsInput = await ask(rl, '🏷️  Enter tags separated by space (e.g. "svg art"): ');
    const tags = tagsInput.split(/\s+/).filter(t => AVAILABLE_TAGS.includes(t));

    if (tags.length === 0) {
        console.log('⚠️  No valid tags selected, defaulting to #svg');
        tags.push('svg');
    }

    // Generate ID from title
    const id = slugify(title.split('|')[0].trim());

    // --- Search for Download URL from a .txt file ---
    let downloadUrl = null;
    let txtFileToDelete = null;
    const baseName = path.parse(selectedFile).name;
    const possibleTxtFiles = [
        `${baseName}_Download.txt`,
        `${baseName}.txt`,
        `${baseName} Download.txt`
    ];

    for (const txt of possibleTxtFiles) {
        const txtPath = path.join(DOWNLOAD_DIR, txt);
        if (fs.existsSync(txtPath)) {
            const txtContent = fs.readFileSync(txtPath, 'utf8');
            const urlMatch = txtContent.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                downloadUrl = urlMatch[0];
                txtFileToDelete = txt;
                console.log(`\n🔗 Automatically detected Download URL from ${txt}:`);
                console.log(`   ${downloadUrl}`);
                break;
            }
        }
    }

    // Manual link if not found
    if (!downloadUrl) {
        const userInputUrl = await ask(rl, '\n🔗 Enter specific Download URL (Dropbox/Drive) or press Enter to skip: ');
        if (userInputUrl) downloadUrl = userInputUrl;
    }

    return { id, title, category: category || 'Digital Downloads', tags, selectedFile, downloadUrl, txtFileToDelete };
}

// --- Step 3a: Copy image to assets ---
function copyImageToAssets(selectedFile, productId) {
    const ext = path.extname(selectedFile).toLowerCase();
    const newFileName = productId + ext;
    const srcPath = path.join(DOWNLOAD_DIR, selectedFile);
    const destPath = path.join(ASSETS_DIR, newFileName);

    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Image copied: Download/${selectedFile} → assets/${newFileName}`);
    return `assets/${newFileName}`;
}

// --- Step 3b: Update products.js ---
function updateProductsJs(product) {
    let content = fs.readFileSync(PRODUCTS_FILE, 'utf-8');

    const tagsStr = product.tags.map(t => `"${t}"`).join(', ');
    const newEntry = `products["${product.id}"] = {
    title: "${product.title}",
    price: "${DEFAULT_PRICE}",
    image: "${product.imagePath}",
    category: "${product.category}",
    tags: [${tagsStr}]
};`;

    const insertMarker = 'if (typeof window !== \'undefined\')';
    if (content.includes(insertMarker)) {
        content = content.replace(insertMarker, newEntry + '\n\n' + insertMarker);
    } else {
        content += '\n' + newEntry + '\n';
    }

    fs.writeFileSync(PRODUCTS_FILE, content, 'utf-8');
    console.log(`✅ products.js updated with "${product.id}"`);
}

// --- Step 3c: Update index.html ---
function updateIndexHtml(product) {
    let content = fs.readFileSync(INDEX_FILE, 'utf-8');

    const tagsDataAttr = product.tags.join(' ');
    const hashtagsHtml = product.tags.map(t => `<span class="hashtag">#${t}</span>`).join('');

    const newCard = `            <!-- Product: ${product.id} -->
            <div class="product-card" onclick="window.location.href='digital-product-detail.html?id=${product.id}'" data-tags="${tagsDataAttr}">
                <div class="product-image-container">
                    <img src="${product.imagePath}" alt="${product.title}">
                    <div class="favorite-icon">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                    </div>
                    <span class="stock-status">DIGITAL</span>
                </div>
                <div class="product-info">
                    <h3>${product.title}</h3>
                    <div class="product-price">${DEFAULT_PRICE} <span class="original-price">${ORIGINAL_PRICE}</span></div><div class="hashtags">${hashtagsHtml}</div>
                </div>
            </div>`;

    const sections = content.split('product-grid');
    if (sections.length >= 3) {
        const secondGridStart = content.indexOf('product-grid', content.indexOf('product-grid') + 1);
        const closingPattern = '</div>\r\n    </section>';
        const closingPatternAlt = '</div>\n    </section>';
        
        let insertPos = content.indexOf(closingPattern, secondGridStart);
        if (insertPos === -1) insertPos = content.indexOf(closingPatternAlt, secondGridStart);
        
        if (insertPos !== -1) {
            content = content.substring(0, insertPos) + '\n' + newCard + '\n        ' + content.substring(insertPos);
            fs.writeFileSync(INDEX_FILE, content, 'utf-8');
            console.log(`✅ index.html updated with new product card`);
            return true;
        }
    }

    const mainClose = content.lastIndexOf('</main>');
    if (mainClose !== -1) {
        const lastGridClose = content.lastIndexOf('</div>', mainClose);
        content = content.substring(0, lastGridClose) + '\n' + newCard + '\n        ' + content.substring(lastGridClose);
        fs.writeFileSync(INDEX_FILE, content, 'utf-8');
        console.log(`✅ index.html updated!`);
        return true;
    }

    return false;
}

// --- Step 3d: Google Sheets Sync ---
async function syncToGoogleSheets(productName, downloadUrl) {
    if (!downloadUrl) return;

    console.log(`\n☁️  Syncing to Google Sheets...`);
    const payload = JSON.stringify({
        action: 'addProduct',
        productName: productName,
        downloadUrl: downloadUrl
    });

    try {
        const response = await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload
        });
        
        // Follow redirect manually if fetch natively fails CORS redirect on server
        if (response.type === 'opaqueredirect' || response.redirected) {
             console.log(`✅ Google Sheets sync sent successfully!`);
             return;
        }

        const result = await response.json();
        if (result.status === 'success') {
            console.log(`✅ Google Sheets sync successful! Row added to 'Products' tab.`);
        } else {
            console.log(`⚠️  Google Sheets sync returned: ${result.message}`);
        }
    } catch (err) {
        console.log(`❌ Google Sheets sync failed: ${err.message} (Double check you deployed Code.gs)`);
    }
}

// --- Step 3e: Cleanup ---
function cleanupDownload(selectedFile, txtFileToDelete) {
    console.log('');
    const srcPath = path.join(DOWNLOAD_DIR, selectedFile);
    fs.unlinkSync(srcPath);
    console.log(`🗑️  Cleaned up: Download/${selectedFile}`);
    
    if (txtFileToDelete) {
        const txtPath = path.join(DOWNLOAD_DIR, txtFileToDelete);
        if (fs.existsSync(txtPath)) {
            fs.unlinkSync(txtPath);
            console.log(`🗑️  Cleaned up: Download/${txtFileToDelete}`);
        }
    }
}

// --- Main ---
async function main() {
    const files = scanDownloadFolder();

    if (files.length === 0) {
        console.log('\n⚠️  No image files found in Download/ folder.');
        console.log('   Supported formats: .png, .jpg, .jpeg, .webp');
        console.log('   Please add an image and run again.\n');
        process.exit(0);
    }

    const rl = createReadlineInterface();

    try {
        const details = await promptUserForDetails(rl, files);
        if (!details) {
            rl.close();
            process.exit(1);
        }

        // Confirmation
        console.log('\n────────────────────────────────────');
        console.log('📋 REVIEW BEFORE SUBMIT:');
        console.log(`   ID:       ${details.id}`);
        console.log(`   Title:    ${details.title}`);
        console.log(`   Category: ${details.category}`);
        console.log(`   Tags:     ${details.tags.map(t => '#' + t).join(', ')}`);
        console.log(`   Image:    ${details.selectedFile}`);
        console.log(`   Price:    ${DEFAULT_PRICE}`);
        if (details.downloadUrl) console.log(`   DownURL:  ${details.downloadUrl}`);
        console.log('────────────────────────────────────');

        const confirm = await ask(rl, '\n🚀 Submit this product? (y/n): ');
        if (confirm.toLowerCase() !== 'y') {
            console.log('❌ Cancelled.');
            rl.close();
            process.exit(0);
        }

        // Execute all steps
        console.log('\n⏳ Processing...\n');

        const imagePath = copyImageToAssets(details.selectedFile, details.id);
        const product = { ...details, imagePath };

        updateProductsJs(product);
        updateIndexHtml(product);
        await syncToGoogleSheets(details.title, details.downloadUrl);
        cleanupDownload(details.selectedFile, details.txtFileToDelete);

        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║  🎉 PRODUCT SUBMITTED SUCCESSFULLY!          ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log(`\n🌐 View at: http://localhost:8000/`);
        console.log(`📄 Detail:  http://localhost:8000/digital-product-detail.html?id=${details.id}`);
        console.log('\n💡 Don\'t forget to commit & push:');
        console.log('   git add . && git commit -m "Add product: ' + details.id + '" && git push origin main\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        rl.close();
    }
}

main();
