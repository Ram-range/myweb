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

// Nomor WhatsApp tujuan (ganti dengan nomor WhatsApp restoran)
const WA_NUMBER = '6281234567890'; // Ganti dengan nomor WhatsApp tujuan

// Fungsi untuk menampilkan notifikasi singkat
function showToast(message, duration = 1800) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) scale(1)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) scale(0.9)';
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
            <li data-cart-index="${index}">
                <div class="cart-item-name">${escapeHtml(item.name)}</div>
                <div class="cart-item-controls">
                    <button class="btn-cart-qty" data-action="decr" data-id="${item.id}">−</button>
                    <span class="cart-qty">${item.quantity}</span>
                    <button class="btn-cart-qty" data-action="incr" data-id="${item.id}">+</button>
                    <span class="cart-item-price">Rp ${formatNumber(item.price * item.quantity)}</span>
                    <button class="btn-remove-item" data-id="${item.id}" title="Hapus item">✕</button>
                </div>
            </li>
        `;
    });

    cartListEl.innerHTML = innerHtml;
    totalPriceEl.innerText = `Rp ${formatNumber(grandTotal)}`;
    updateCartCount();

    // Tambahkan event listener untuk tombol +/- dan hapus di setiap item keranjang
    document.querySelectorAll('.btn-cart-qty').forEach(btn => {
        btn.removeEventListener('click', handleCartQtyClick);
        btn.addEventListener('click', handleCartQtyClick);
    });

    document.querySelectorAll('.btn-remove-item').forEach(btn => {
        btn.removeEventListener('click', handleRemoveItemClick);
        btn.addEventListener('click', handleRemoveItemClick);
    });
}

// Handler untuk tombol quantity di keranjang
function handleCartQtyClick(e) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const action = btn.getAttribute('data-action');
    const itemId = btn.getAttribute('data-id');
    if (action === 'incr') {
        updateQuantity(itemId, 1);
    } else if (action === 'decr') {
        updateQuantity(itemId, -1);
    }
}

// Handler untuk tombol hapus item
function handleRemoveItemClick(e) {
    const btn = e.currentTarget;
    const itemId = btn.getAttribute('data-id');
    removeItemCompletely(itemId);
}

// Format angka dengan pemisah ribuan
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Escape HTML untuk keamanan
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Fungsi untuk menambah item ke keranjang (dari tombol tambah)
function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity += 1;
        showToast(`+1 ${name} (Total: ${existingItem.quantity})`);
    } else {
        cart.push({
            id: id,
            name: name,
            price: price,
            quantity: 1
        });
        showToast(`✅ ${name} ditambahkan ke keranjang`);
    }
    renderCart();
    saveCartToLocal();
}

// Mengupdate quantity: delta = +1 atau -1
function updateQuantity(id, delta) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx === -1) return;

    const item = cart[idx];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
        cart.splice(idx, 1);
        showToast(`🗑️ ${item.name} dihapus dari keranjang`);
    } else {
        item.quantity = newQty;
        const verb = delta > 0 ? 'ditambahkan' : 'dikurangi';
        showToast(`${item.name} ${verb} → ${item.quantity}`);
    }
    renderCart();
    saveCartToLocal();
}

// Hapus seluruh item (meskipun quantity > 0)
function removeItemCompletely(id) {
    const idx = cart.findIndex(item => item.id === id);
    if (idx !== -1) {
        const removed = cart[idx];
        cart.splice(idx, 1);
        showToast(`❌ ${removed.name} dihapus dari pesanan`);
        renderCart();
        saveCartToLocal();
    }
}

// Reset seluruh keranjang
function resetCart() {
    if (cart.length === 0) {
        showToast("Keranjang sudah kosong");
        return;
    }
    cart = [];
    renderCart();
    saveCartToLocal();
    showToast("🔄 Semua pesanan telah dibatalkan");
}

// Format pesanan untuk WhatsApp
function formatWhatsAppMessage() {
    const customerName = document.getElementById('customer-name')?.value.trim();
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    const customerAddress = document.getElementById('customer-address')?.value.trim();
    const customerNote = document.getElementById('customer-note')?.value.trim();
    
    let message = '*🍽️ PESANAN MAKANAN*%0a%0a';
    
    // Data pemesan
    message += `*Data Pemesan:*%0a`;
    if (customerName) message += `Nama: ${customerName}%0a`;
    if (customerPhone) message += `No. WhatsApp: ${customerPhone}%0a`;
    if (customerAddress) message += `Alamat: ${customerAddress}%0a`;
    message += `%0a`;
    
    // Detail pesanan
    message += `*Detail Pesanan:*%0a`;
    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        message += `${index + 1}. ${item.name} x${item.quantity} = Rp ${formatNumber(subtotal)}%0a`;
    });
    
    message += `%0a*Total: Rp ${formatNumber(total)}*%0a%0a`;
    
    // Catatan
    if (customerNote) {
        message += `*Catatan:*%0a${customerNote}%0a%0a`;
    }
    
    // Footer
    message += `_Pesanan dibuat via FoodOrder App_%0a`;
    message += `_Terima kasih!_`;
    
    return message;
}

// Kirim pesanan ke WhatsApp
function sendToWhatsApp() {
    // Validasi keranjang tidak kosong
    if (cart.length === 0) {
        showToast("⚠️ Keranjang masih kosong, tambahkan menu dulu yuk!", 2000);
        return false;
    }
    
    // Validasi nama pemesan
    const customerName = document.getElementById('customer-name')?.value.trim();
    if (!customerName) {
        showToast("⚠️ Mohon isi nama pemesan terlebih dahulu!", 2000);
        document.getElementById('customer-name')?.focus();
        return false;
    }
    
    // Validasi nomor WhatsApp
    const customerPhone = document.getElementById('customer-phone')?.value.trim();
    if (!customerPhone) {
        showToast("⚠️ Mohon isi nomor WhatsApp untuk konfirmasi!", 2000);
        document.getElementById('customer-phone')?.focus();
        return false;
    }
    
    // Validasi format nomor WhatsApp (minimal 10 digit)
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
        showToast("⚠️ Nomor WhatsApp tidak valid! Masukkan 10-13 digit angka.", 2500);
        document.getElementById('customer-phone')?.focus();
        return false;
    }
    
    // Validasi alamat
    const customerAddress = document.getElementById('customer-address')?.value.trim();
    if (!customerAddress) {
        showToast("⚠️ Mohon isi alamat pengiriman!", 2000);
        document.getElementById('customer-address')?.focus();
        return false;
    }
    
    return true;
}

// Proses order via WhatsApp
function processOrder() {
    if (!sendToWhatsApp()) {
        return;
    }
    
    const message = formatWhatsAppMessage();
    const waLink = `https://wa.me/${WA_NUMBER}?text=${message}`;
    
    // Tampilkan konfirmasi sebelum redirect ke WhatsApp
    const confirmed = confirm(`📱 Anda akan diarahkan ke WhatsApp untuk melanjutkan pesanan.\n\nPastikan nomor WhatsApp Anda aktif.\n\nLanjutkan?`);
    
    if (confirmed) {
        // Simpan data ke localStorage sebelum redirect
        saveCartToLocal();
        
        // Buka WhatsApp
        window.open(waLink, '_blank');
        
        // Tampilkan notifikasi
        showToast("✅ Mengarahkan ke WhatsApp...", 2000);
    }
}

// Event listener tombol tambah pada masing-masing menu
function bindMenuButtons() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(menu => {
        const tambahBtn = menu.querySelector('.btn-tambah');
        if (!tambahBtn) return;
        
        // Hapus event listener lama jika ada
        const newBtn = tambahBtn.cloneNode(true);
        tambahBtn.parentNode.replaceChild(newBtn, tambahBtn);
        
        const id = menu.getAttribute('data-id');
        const name = menu.getAttribute('data-name');
        const price = parseInt(menu.getAttribute('data-price'), 10);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(id, name, price);
        });
    });
}

// ===== INI YANG PENTING: LOADING HILANG SETELAH 1 DETIK =====
function hideLoadingScreen() {
    // Loading akan hilang setelah 1 detik
    setTimeout(function() {
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.visibility = 'hidden';
            setTimeout(function() {
                loadingScreen.style.display = 'none';
                if (orderContainer) {
                    orderContainer.style.display = 'block';
                }
            }, 500);
        } else {
            // Jika loading screen tidak ada, langsung tampilkan container
            if (orderContainer) {
                orderContainer.style.display = 'block';
            }
        }
    }, 1000); // ← INI DURASI LOADING: 1 DETIK
}

// Inisialisasi semua event + load data
function init() {
    console.log("Mulai loading...");
    
    // Load data dari localStorage
    loadCartFromLocal();
    
    // Bind menu buttons
    bindMenuButtons();
    
    // Event untuk order dan reset
    if (orderBtn) {
        orderBtn.removeEventListener('click', processOrder);
        orderBtn.addEventListener('click', processOrder);
    }
    if (resetBtn) {
        resetBtn.removeEventListener('click', resetCart);
        resetBtn.addEventListener('click', resetCart);
    }
    
    // Jalankan fungsi untuk menghilangkan loading
    hideLoadingScreen();
    
    console.log("Loading selesai, web akan tampil dalam 1 detik");
}

// Jalankan init ketika halaman siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM sudah siap, langsung jalankan
    init();
}
