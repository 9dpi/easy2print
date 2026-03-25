/**
 * EASY TO PRINT - Auto Product Submission Tool (ZERO-TOUCH)
 * ==============================================================
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const DOWNLOAD_DIR = path.join(__dirname, 'Download');
const ASSETS_DIR = path.join(__dirname, 'assets');
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'];

// --- Utilities ---
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
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

// --- Step 2: Execution ---
async function syncToGSheet(payload) {
    console.log(`☁️  Syncing to Google Sheets...`);
    try {
        await fetch(APP_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addProduct', ...payload })
        });
        console.log(`✅ Success! Data pushed to GSheet.`);
    } catch (e) {
        console.log(`❌ GSheet Sync Failed: ${e.message}`);
    }
}

async function main() {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  🖨️  EASY TO PRINT - ZERO-TOUCH SUBMISSION  ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    const files = scanDownloadFolder();
    if (files.length === 0) {
        console.log('⚠️  No images in Download/');
        process.exit(0);
    }

    for (const file of files) {
        const baseName = path.parse(file).name;
        console.log(`\n⏳ Processing: ${baseName}...`);

        // Default or Placeholder details
        const title = baseName.replace(/[-_]/g, ' '); // Clean filename for title
        const id = slugify(title);
        const category = "Digital Downloads";
        const tags = ["svg", "art"]; // Placeholder tags
        const description = "Hỗ trợ cắt CNC/Laser và in ấn. Tương thích với Glowforge, xTool, Cricut..."; // Default fallback description

        // Detect Link
        let downloadUrl = "https://example.com/download/" + id; // Default generic link
        let txtFileToDelete = null;
        
        // Try multiple possible text file formats
        const possibleTxtFiles = [
            `${baseName}_Download.txt`,
            `${baseName}.txt`,
            `${baseName} Download.txt`
        ];

        for (const txt of possibleTxtFiles) {
            const txtPath = path.join(DOWNLOAD_DIR, txt);
            if (fs.existsSync(txtPath)) {
                const content = fs.readFileSync(txtPath, 'utf8');
                const match = content.match(/https?:\/\/[^\s]+/);
                if (match) {
                    downloadUrl = match[0];
                    txtFileToDelete = txt;
                    console.log(`🔗 Detected URL: ${downloadUrl}`);
                    break;
                }
            }
        }

        // Copy image
        const ext = path.extname(file);
        const newImgName = id + ext;
        fs.copyFileSync(path.join(DOWNLOAD_DIR, file), path.join(ASSETS_DIR, newImgName));
        
        // Push to GSheet
        await syncToGSheet({
            id: id,
            title: title,
            category: category,
            tags: tags,
            description: description,
            imagePath: 'assets/' + newImgName,
            downloadUrl: downloadUrl
        });

        // Cleanup
        fs.unlinkSync(path.join(DOWNLOAD_DIR, file));
        if (txtFileToDelete) {
            fs.unlinkSync(path.join(DOWNLOAD_DIR, txtFileToDelete));
        }
        console.log(`🎉 Done with ${baseName}`);
    }
    console.log('\n✅ ALL FILES PROCESSED SUCCESSFULLY!');
}

main();
