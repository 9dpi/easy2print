/* 🤖 EMBROIDERY CHATBOT LOGIC - GUIDED CONVERSATION SYSTEM */
document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
    
    // 1. Create Floating Chatbot Container
    const container = document.createElement('div');
    container.id = 'embroidery-chatbot-container';
    container.innerHTML = `
        <div class="chat-bubble" id="chat-bubble">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
        </div>
        <div class="chat-window" id="chat-window">
            <div class="chat-header">
                <h3>Custom Embroidery Service</h3>
                <span class="close-chat" id="close-chat">×</span>
            </div>
            <div class="chat-messages" id="chat-messages">
                <div class="msg bot">Hello! Welcome to Easy Embroidery. How can I help you today?</div>
                <div class="chat-options" id="initial-options">
                    <button class="option-btn" data-type="photo">Turn Photo to Stitch</button>
                    <button class="option-btn" data-type="logo">Custom Logo Design</button>
                    <button class="option-btn" data-type="general">General Question</button>
                </div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-input" placeholder="Type a message...">
                <button class="send-btn" id="send-chat-btn">➔</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    const bubble = document.getElementById('chat-bubble');
    const window = document.getElementById('chat-window');
    const closeBtn = document.getElementById('close-chat');
    const messages = document.getElementById('chat-messages');
    const optionsArea = document.getElementById('initial-options');

    // 2. Event Handlers
    bubble.onclick = () => window.classList.toggle('active');
    closeBtn.onclick = () => window.classList.remove('active');

    optionsArea.onclick = (e) => {
        if (e.target.classList.contains('option-btn')) {
            const type = e.target.dataset.type;
            const label = e.target.innerText;
            handleUserOption(type, label);
        }
    };

    async function handleUserOption(type, label) {
        addMessage(label, 'user');
        optionsArea.style.display = 'none';

        if (type === 'photo' || type === 'logo') {
            addMessage("That sounds great! I specialize in that. To provide a quote, please fill out this quick form:", 'bot');
            renderCustomForm();
        } else {
            addMessage("I'm happy to help. What would you like to know about our designs?", 'bot');
        }
    }

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `msg ${sender}`;
        div.innerText = text;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    function renderCustomForm() {
        const div = document.createElement('div');
        div.className = 'custom-form-container';
        div.innerHTML = `
            <div class="custom-form" style="background:#fff; border:1px solid #eee; padding:15px; border-radius:15px; margin-top:10px">
                <input type="text" id="form-email" placeholder="Your Email Address" required>
                <input type="text" id="form-size" placeholder="Stich Size (e.g. 4x4, 5x7)">
                <textarea id="form-msg" placeholder="Tell us more about your design..."></textarea>
                <button class="btn-send-request" id="submit-custom-req">Send My Request</button>
                <p style="font-size:10px; color:#666; margin-top:8px">We'll contact you within 24h!</p>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        document.getElementById('submit-custom-req').onclick = submitRequest;
    }

    async function submitRequest() {
        const email = document.getElementById('form-email').value;
        const size = document.getElementById('form-size').value;
        const msg = document.getElementById('form-msg').value;

        if (!email) return alert('Please provide your email!');

        const btn = document.getElementById('submit-custom-req');
        btn.innerText = '⌛ Sending...';
        btn.disabled = true;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'customRequest',
                    email: email,
                    size: size,
                    description: msg
                })
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                document.querySelector('.custom-form').innerHTML = '<p style="color:green; font-weight:700">Thank you! Our expert will email you shortly with a quote and instructions to send your file.</p>';
                addMessage("Request sent successfully! Any other questions?", 'bot');
            }
        } catch (e) {
            btn.innerText = 'Error! Try again';
            btn.disabled = false;
        }
    }
});
