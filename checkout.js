
document.addEventListener('DOMContentLoaded', () => {
    // Selection buttons logic
    const optionBtns = document.querySelectorAll('.option-btn');
    optionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.querySelector('.selected').classList.remove('selected');
            btn.classList.add('selected');
        });
    });

    const colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.parentElement;
            parent.querySelector('.selected').classList.remove('selected');
            btn.classList.add('selected');
        });
    });

    // Thumbnail switching logic
    const thumbs = document.querySelectorAll('.thumb');
    const mainImg = document.querySelector('.main-image img');
    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            const imgSrc = thumb.querySelector('img').src;
            mainImg.src = imgSrc;
            document.querySelector('.thumb.active').classList.remove('active');
            thumb.classList.add('active');
        });
    });

    // Integrated AppScript & Drive Configuration
    const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBQdvEMfs43bA-tiHzKALERxhrPFIUK-IXkWOio3vLCe8QUXfyziGliwIkckFtt5mFLw/exec';
    
    // Function to log purchase to Google Sheets via AppScript
    async function notifyBackend(details) {
        console.log('Sending data to AppScript:', details);
        
        const payload = {
            timestamp: new Date().toISOString(),
            payer_email: details.payer.email_address,
            payer_name: details.payer.name.given_name + ' ' + details.payer.name.surname,
            transaction_id: details.id,
            product_name: 'Premium Custom Print / Digital SVG',
            amount: details.purchase_units[0].amount.value,
            currency: details.purchase_units[0].amount.currency_code,
            sheet_id: '1UAlwooykAXCkmDajDp6KgQqMxL2z8FCTeR_CBE7bTjo' // Logging Sheet
        };

        try {
            // Using fetch with no-cors for simple AppScript triggers (handling CORS is easier this way from pure client-side)
            await fetch(APP_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('Backend notification sent successfully');
        } catch (error) {
            console.error('Failed to notify backend:', error);
        }
    }

    // PayPal Button Integration
    if (window.paypal) {
        paypal.Buttons({
            style: {
                layout: 'vertical',
                color:  'gold',
                shape:  'pill',
                label:  'checkout'
            },
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '25.00' // This would ideally be dynamic
                        },
                        description: 'Easy to Print Purchase'
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    console.log('Capture result', details);
                    
                    // Notify AppScript to log to Google Sheets
                    notifyBackend(details);

                    // Simulated success flow
                    const payerEmail = details.payer.email_address || 'user@example.com';
                    showSuccessModal(payerEmail);
                });
            },
            onError: function(err) {
                console.error('PayPal Error', err);
                alert("Something went wrong with the payment process. Please try again.");
            }
        }).render('#paypal-button-container');
    }

    // Modal control logic
    const modal = document.getElementById('success-modal');
    const closeModal = document.querySelector('.close-modal');
    const displayEmail = document.getElementById('display-email');

    function showSuccessModal(email) {
        displayEmail.textContent = email;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Re-enable scroll
        window.location.href = 'index.html'; // Redirect back
    });

    // Close on outside click
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

});
