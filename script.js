document.addEventListener('DOMContentLoaded', () => {
    // --- 3D Hover Effect for Pricing Cards ---
    const cards = document.querySelectorAll('.pricing-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            if (window.innerWidth <= 900) return; // Disable on smaller screens
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;
            
            const isPopular = card.classList.contains('popular');
            const scale = isPopular ? 'scale(1.05)' : 'scale(1)';
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) ${scale}`;
            
            // Move glow effect following cursor
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.left = `${x - 100}px`;
                glow.style.top = `${y - 100}px`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const isPopular = card.classList.contains('popular');
            const scale = (isPopular && window.innerWidth > 900) ? 'scale(1.05)' : 'scale(1)';
            card.style.transform = scale;
            
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.left = '';
                glow.style.top = '';
            }
        });
    });

    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                mobileMenu.classList.remove('open');
                
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- Mobile Menu Toggle ---
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const isActive = q.classList.contains('active');
            
            // Close all
            faqQuestions.forEach(item => {
                item.classList.remove('active');
                item.nextElementSibling.style.maxHeight = null;
            });
            
            // Open clicked if it wasn't active
            if (!isActive) {
                q.classList.add('active');
                const answer = q.nextElementSibling;
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // --- Shopping Cart Logic ---
    // Persisted so the cart survives the Discord OAuth round-trip during checkout.
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('column_cart') || '[]'); } catch (e) { cart = []; }

    const cartToggle = document.getElementById('cart-toggle');
    const closeCart = document.getElementById('close-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartBadge = document.getElementById('cart-badge');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');
    const addToCartBtns = document.querySelectorAll('.add-to-cart');
    const toastContainer = document.getElementById('toast-container');

    // Toggle Cart function
    function toggleCart() {
        cartSidebar.classList.toggle('open');
        cartOverlay.classList.toggle('show');
    }

    cartToggle.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);

    // Add to Cart Event
    addToCartBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Click animation
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 150);

            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));

            // Add or increment
            const existingItem = cart.find(item => item.id === id);
            if (existingItem) {
                existingItem.qty += 1;
            } else {
                cart.push({ id, name, price, qty: 1 });
            }

            updateCartUI();
            showToast(`${name} added to your cart!`);
        });
    });

    // Update Cart UI
    function updateCartUI() {
        try { localStorage.setItem('column_cart', JSON.stringify(cart)); } catch (e) {}
        // Update badge count
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        cartBadge.textContent = totalItems;
        
        // Update Items list
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your cart is empty</div>';
            checkoutBtn.disabled = true;
        } else {
            cartItemsContainer.innerHTML = '';
            cart.forEach(item => {
                const itemEl = document.createElement('div');
                itemEl.className = 'cart-item';
                itemEl.innerHTML = `
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p>$${item.price.toFixed(2)}</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="qty-btn minus" data-id="${item.id}">-</button>
                        <span class="item-qty">${item.qty}</span>
                        <button class="qty-btn plus" data-id="${item.id}">+</button>
                    </div>
                `;
                cartItemsContainer.appendChild(itemEl);
            });
            checkoutBtn.disabled = false;
            
            // Attach event listeners for +/- buttons dynamically
            document.querySelectorAll('.qty-btn.minus').forEach(btn => {
                btn.addEventListener('click', (e) => updateQty(e.target.getAttribute('data-id'), -1));
            });
            document.querySelectorAll('.qty-btn.plus').forEach(btn => {
                btn.addEventListener('click', (e) => updateQty(e.target.getAttribute('data-id'), 1));
            });
        }

        // Calculate & Update Total Price
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        cartTotalPrice.textContent = `$${total.toFixed(2)}`;
    }

    // Function to update quantity of an item
    function updateQty(id, delta) {
        const itemIndex = cart.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            cart[itemIndex].qty += delta;
            if (cart[itemIndex].qty <= 0) {
                cart.splice(itemIndex, 1); // remove if 0
            }
            updateCartUI();
        }
    }

    // ── Checkout: every order is completed in the Discord server ──
    // No OAuth and no hosted invoice anymore. The buyer is sent straight to the
    // server, opens a ticket, and staff run  !sign @user <duration>  which issues
    // the KeyAuth key and the timed role.
    const DISCORD_INVITE = (typeof BACKEND !== 'undefined' && BACKEND.invite) || 'https://discord.gg/wgxyDQS9WW';

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;

        // Remember the basket so the buyer can quote it in their ticket.
        try {
            localStorage.setItem('column_last_order', cart.map(i => `${i.name} x${i.qty}`).join(', '));
        } catch (e) {}

        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Opening Discord…';
        showToast('Opening Discord — open a ticket and staff will hand over your key.');
        setTimeout(() => { window.location.href = DISCORD_INVITE; }, 900);
    });

    // Render any cart restored from localStorage.
    updateCartUI();

    // Old OAuth return links (#dc=<ref>) can still be bookmarked — strip them so the
    // hash doesn't stick around in the URL bar.
    if (location.hash.includes('dc=')) {
        history.replaceState(null, '', location.pathname + location.search + '#pricing');
    }

    // Toast Notification System
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="#6366f1" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>${message}</span>
        `;
        
        toastContainer.appendChild(toast);
        
        // Trigger reflow to start transition
        void toast.offsetWidth;
        
        toast.classList.add('show');
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300); // Wait for exit animation
        }, 3000);
    }

    // --- Matrix Rain Effect ---
    const canvas = document.getElementById('rain-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        // Hacking / Tech characters
        const characters = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'.split('');
        const fontSize = 16;
        let columns = width / fontSize;
        let drops = [];
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        function drawRain() {
            // Semi-transparent black to create trailing effect
            ctx.fillStyle = 'rgba(5, 5, 8, 0.1)';
            ctx.fillRect(0, 0, width, height);

            ctx.fillStyle = '#4f46e5'; // Primary accent color (purple-blue)
            ctx.font = fontSize + 'px monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        // Handle resize properly
        window.addEventListener('resize', () => {
            columns = width / fontSize;
            drops = [];
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
        });

        setInterval(drawRain, 35);
    }
    // --- Hacker Text Effect ---
    const hackTexts = document.querySelectorAll('.hack-text');
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let hackIntervals = [];

    if (hackTexts.length > 0) {
        const startHacking = (target, index) => {
            let iteration = 0;
            clearInterval(hackIntervals[index]);
            
            hackIntervals[index] = setInterval(() => {
                target.innerText = target.dataset.value
                    .split("")
                    .map((letter, i) => {
                        if(i < iteration || letter === " ") {
                            return target.dataset.value[i];
                        }
                        return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join("");
                
                if(iteration >= target.dataset.value.length){ 
                    clearInterval(hackIntervals[index]);
                }
                
                iteration += 1 / 3;
            }, 30);
        };
        
        hackTexts.forEach((text, i) => {
            setTimeout(() => startHacking(text, i), 500);
        });

        const pillBadge = document.querySelector('.pill-badge');
        if (pillBadge) {
            pillBadge.addEventListener('mouseenter', () => {
                hackTexts.forEach((text, i) => startHacking(text, i));
            });
        }
    }


});
