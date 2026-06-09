// Data keranjang: menyimpan item { id, name, price, quantity }
let cart = [];

// Mengambil elemen DOM
const cartListEl = document.getElementById('cart-list');
const totalPriceEl = document.getElementById('total-price');
const orderBtn = document.getElementById('order-btn');
const resetBtn = document.getElementById('reset-btn');
const cartCountEl = document.getElementById('cart-count');
const loadingScreen = document.getElementById('loading-screen');
const orderContainer = document.querySelector('.order-container');

// Nomor WhatsApp tujuan
const WA_NUMBER = '6281234567890';

// Fungsi untuk menampilkan notifikasi
function showToast(message, duration = 1800) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => {
        toast.style.opacity = '0';
    }, duration);
}

// Menyimpan cart ke localStorage
function saveCartToLocal() {
    localStorage.setItem('foodorder_cart', JSON.stringify(cart));
}

// Memuat cart dari localStorage
function loadCartFromLocal() {
    const saved = localStorage.getItem('foodorder_cart');
    if (saved) {
        try {
            cart = JSON.parse(saved);
            if (!Array.isArray(cart)) cart = [];
        } catch(e) { 
            cart = []; 
        }
    } else {
        cart = [];
    }
    renderCart();
}

// Update counter keranjang
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCountEl) {
        cartCountEl.textContent = `(${totalItems})`;
    }
}

// Render ulang tampilan keranjang
function renderCart() {
    if (!cartListEl) return;

    if (cart.length === 0) {
        cartListEl.innerHTML = '<li class="empty-cart">🍽️ Belum ada pesanan, klik Tambah</li>';
        totalPriceEl.innerText = 'Rp 0';
        updateCartCount();
        return;
    }

    let innerHtml = '';
    let grandTotal = 0;

    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        grandTotal += subtotal;

        innerHtml += `
            <li>
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-controls">
                    <button class="btn-cart-qty" data-action="decr" data-id="${item.id}">−</button>
                    <span class="cart-qty">${item.quantity}</span>
                    <button class="btn-cart-qty" data-action="incr" data-id="${item.id}">+</button>
                    <span class="cart-item-price">Rp ${formatNumber(item.price * item.quantity)}</span>
                    <button class="btn-remove-item" data-id="${item.id}">✕</button>
                </div>
            </li>
        `;
    });

    cartListEl.innerHTML = innerHtml;
    totalPriceEl.innerText = `Rp ${formatNumber(grandTotal)}`;
    updateCartCount();

    // Event listener untuk tombol di keranjang
    document.querySelectorAll('.btn-cart-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.getAttribute('data-action');
            const itemId = btn.getAttribute('data-id');
            if (action === 'incr') {
                updateQuantity(itemId, 1);
            } else if (action === 'decr') {
                updateQuantity(itemId, -1);
            }
        });
    });

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = btn.getAttribute('data-id');
            removeItemCompletely(itemId);
        });
    });
}

// Format angka
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Escape HTML
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Tambah ke keranjang
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`+1 ${name}`);
    } else {
        cart.push({ id, name, price, quantity: 1 });
        showToast(`✅ ${name} ditambahkan`);
    }
    renderCart();
    saveCartToLocal();
}

// Update quantity
function updateQuantity(id, delta) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx === -1) return;

    const item = cart[idx];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
        cart.splice(idx, 1);
        showToast(`🗑️ ${item.name} dihapus`);
    } else {
        item.quantity = newQty;
        showToast(`${item.name} → ${item.quantity}`);
    }
    renderCart();
    saveCartToLocal();
}

// Hapus item
function removeItemCompletely(id) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx !== -1) {
        const removed = cart[idx];
        cart.splice(idx, 1);
        showToast(`❌ ${removed.name} dihapus`);
        renderCart();
        saveCartToLocal();
    }
}

// Reset cart
function resetCart() {
    if (cart.length === 0) {
        showToast("Keranjang kosong");
        return;
    }
    cart = [];
    renderCart();
    saveCartToLocal();
    showToast("🔄 Semua pesanan dibatalkan");
}

// Format pesan WhatsApp
function formatWhatsAppMessage() {
    const customerName = document.getElementById('customer-name')?.value.trim();
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    const customerAddress = document.getElementById('customer-address')?.value.trim();
    const customerNote = document.getElementById('customer-note')?.value.trim();
    
    let message = '*🍽️ PESANAN MAKANAN*%0a%0a';
    message += `*Data Pemesan:*%0a`;
    if (customerName) message += `Nama: ${customerName}%0a`;
    if (customerPhone) message += `No. WhatsApp: ${customerPhone}%0a`;
    if (customerAddress) message += `Alamat: ${customerAddress}%0a`;
    message += `%0a*Detail Pesanan:*%0a`;
    
    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `${index + 1}. ${item.name} x${item.quantity} = Rp ${formatNumber(subtotal)}%0a`;
    });
    
    message += `%0a*Total: Rp ${formatNumber(total)}*%0a%0a`;
    if (customerNote) message += `*Catatan:*%0a${customerNote}%0a%0a`;
    message += `_Terima kasih!_`;
    
    return message;
}

// Kirim ke WhatsApp
function processOrder() {
    if (cart.length === 0) {
        showToast("⚠️ Keranjang masih kosong!", 2000);
        return;
    }
    
    const customerName = document.getElementById('customer-name')?.value.trim();
    if (!customerName) {
        showToast("⚠️ Isi nama pemesan!", 2000);
        document.getElementById('customer-name')?.focus();
        return;
    }
    
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    if (!customerPhone) {
        showToast("⚠️ Isi nomor WhatsApp!", 2000);
        document.getElementById('customer-phone')?.focus();
        return;
    }
    
    const customerAddress = document.getElementById('customer-address')?.value.trim();
    if (!customerAddress) {
        showToast("⚠️ Isi alamat pengiriman!", 2000);
        document.getElementById('customer-address')?.focus();
        return;
    }
    
    const message = formatWhatsAppMessage();
    const waLink = `https://wa.me/${WA_NUMBER}?text=${message}`;
    
    const confirmed = confirm(`Lanjutkan ke WhatsApp?`);
    if (confirmed) {
        window.open(waLink, '_blank');
        showToast("✅ Mengarahkan ke WhatsApp...", 2000);
    }
}

// Navigasi aktif berdasarkan scroll
function setActiveNav() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Mobile menu toggle
function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (toggle && navMenu) {
        toggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            toggle.classList.toggle('active');
        });
    }
}

// Bind menu buttons
function bindMenuButtons() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(menu => {
        const tambahBtn = menu.querySelector('.btn-tambah');
        if (!tambahBtn) return;
        
        const newBtn = tambahBtn.cloneNode(true);
        tambahBtn.parentNode.replaceChild(newBtn, tambahBtn);
        
        const id = menu.getAttribute('data-id');
        const name = menu.getAttribute('data-name');
        const price = parseInt(menu.getAttribute('data-price'), 10);
        
        newBtn.addEventListener('click', () => {
            addToCart(id, name, price);
        });
    });
}

// Hilangkan loading
function hideLoadingScreen() {
    setTimeout(() => {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                if (orderContainer) {
                    orderContainer.style.display = 'block';
                }
            }, 500);
        }
    }, 1000);
}

// Inisialisasi
function init() {
    loadCartFromLocal();
    bindMenuButtons();
    initMobileMenu();
    
    if (orderBtn) orderBtn.addEventListener('click', processOrder);
    if (resetBtn) resetBtn.addEventListener('click', resetCart);
    
    window.addEventListener('scroll', setActiveNav);
    setActiveNav();
    
    hideLoadingScreen();
}

// Jalankan init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
