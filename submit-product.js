/**
 * EASY TO PRINT - Product Submission Tool (GSheet Database Version)
 * ==============================================================
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// --- Configuration ---
const DOWNLOAD_DIR = path.join(__dirname, 'Download');
const ASSETS_DIR = path.join(__dirname, 'assets');
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
        return [];
    }
    return fs.readdirSync(DOWNLOAD_DIR).filter(f => {
        const ext = path.extname(f).toLowerCase();
        return VALID_EXTENSIONS.includes(ext);
    });
}

// --- Step 2: Interactive Prompt ---
async function promptUserForDetails(rl, files) {
    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║  🖨️  EASY TO PRINT - Product Submission Tool  ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    let selectedFile;
    if (files.length === 1) {
        selectedFile = files[0];
        console.log(`📸 Found image: ${selectedFile}\n`);
    } else {
        files.forEach((f, i) => console.log(`   [${i + 1}] ${f}`));
        const choice = await ask(rl, '\n👉 Select file number: ');
        const idx = parseInt(choice) - 1;
        if (idx < 0 || idx >= files.length) return null;
        selectedFile = files[idx];
    }

    const title = await ask(rl, '📝 Product Title: ');
    if (!title) return null;

    const category = await ask(rl, '📂 Category (e.g. "Wall Art > Boho"): ');
    
    console.log(`\n🏷️  Available Tags: ${AVAILABLE_TAGS.join(', ')}`);
    const tagsInput = await ask(rl, '🏷️  Enter tags: ');
    const tags = tagsInput.split(/\s+/).filter(t => AVAILABLE_TAGS.includes(t));
    if (tags.length === 0) tags.push('svg');

    const description = await ask(rl, '📖 Description: ');

    const id = slugify(title.split('|')[0].trim());

    // Detect Link
    let downloadUrl = null;
    let txtFileToDelete = null;
    const baseName = path.parse(selectedFile).name;
    const txtName = `${baseName}_Download.txt`;
    const txtPath = path.join(DOWNLOAD_DIR, txtName);

    if (fs.existsSync(txtPath)) {
        const content = fs.readFileSync(txtPath, 'utf8');
        const match = content.match(/https?:\/\/[^\s]+/);
        if (match) {
            downloadUrl = match[0];
            txtFileToDelete = txtName;
            console.log(`🔗 Detected URL: ${downloadUrl}`);
        }
    }

    if (!downloadUrl) {
        downloadUrl = await ask(rl, '🔗 Download URL: ');
    }

    return { id, title, category: category || 'Digital Downloads', tags, description, selectedFile, downloadUrl, txtFileToDelete };
}

// --- Step 3: Execution ---
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
    const files = scanDownloadFolder();
    if (files.length === 0) {
        console.log('⚠️  No images in Download/');
        process.exit(0);
    }

    const rl = createReadlineInterface();
    try {
        const details = await promptUserForDetails(rl, files);
        if (!details) return;

        const confirm = await ask(rl, '\n🚀 Submit? (y/n): ');
        if (confirm.toLowerCase() !== 'y') return;

        // Copy image
        const ext = path.extname(details.selectedFile);
        const newImgName = details.id + ext;
        fs.copyFileSync(path.join(DOWNLOAD_DIR, details.selectedFile), path.join(ASSETS_DIR, newImgName));
        
        // Push to GSheet
        await syncToGSheet({
            id: details.id,
            title: details.title,
            category: details.category,
            tags: details.tags,
            description: details.description,
            imagePath: 'assets/' + newImgName,
            downloadUrl: details.downloadUrl
        });

        // Cleanup
        fs.unlinkSync(path.join(DOWNLOAD_DIR, details.selectedFile));
        if (details.txtFileToDelete) fs.unlinkSync(path.join(DOWNLOAD_DIR, details.txtFileToDelete));

        console.log('\n🎉 DONE!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        rl.close();
    }
}

main();
