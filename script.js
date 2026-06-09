// Data keranjang: menyimpan item { id, name, price, quantity }
let cart = [];

// Mengambil elemen DOM
const cartListEl = document.getElementById('cart-list');
const totalPriceEl = document.getElementById('total-price');
const orderBtn = document.getElementById('order-btn');
const resetBtn = document.getElementById('reset-btn');

// Fungsi untuk menampilkan notifikasi singkat
function showToast(message, duration = 1800) {
    const toast = document.getElementById('toast');
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

// Render ulang tampilan keranjang
function renderCart() {
    if (!cartListEl) return;

    if (cart.length === 0) {
        cartListEl.innerHTML = '<li class="empty-cart">🍽️ Belum ada pesanan, klik Tambah</li>';
        totalPriceEl.innerText = 'Rp 0';
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

    // Tambahkan event listener untuk tombol +/- dan hapus di setiap item keranjang
    document.querySelectorAll('.btn-cart-qty').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
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
        showToast(`+1 ${name} ditambahkan`);
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

// Proses order (simulasi)
function processOrder() {
    if (cart.length === 0) {
        showToast("⚠️ Keranjang masih kosong, tambahkan menu dulu yuk!", 2000);
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemSummary = cart.map(item => `${item.name} x${item.quantity}`).join(', ');
    
    const userConfirmed = confirm(`🛍️ Pesanan Anda:\n${itemSummary}\nTotal: Rp ${formatNumber(total)}\n\nKonfirmasi pesanan?`);
    if (userConfirmed) {
        showToast(`🎉 Pesanan berhasil! Terima kasih. Total Rp ${formatNumber(total)}`, 2500);
        cart = [];
        renderCart();
        saveCartToLocal();
    } else {
        showToast("Pesanan dibatalkan", 1500);
    }
}

// Event listener tombol tambah pada masing-masing menu
function bindMenuButtons() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(menu => {
        const tambahBtn = menu.querySelector('.btn-tambah');
        if (!tambahBtn) return;
        const id = menu.getAttribute('data-id');
        const name = menu.getAttribute('data-name');
        const price = parseInt(menu.getAttribute('data-price'), 10);
        
        const newBtn = tambahBtn.cloneNode(true);
        tambahBtn.parentNode.replaceChild(newBtn, tambahBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart(id, name, price);
        });
    });
}

// Inisialisasi semua event + load data
function init() {
    loadCartFromLocal();
    bindMenuButtons();
    if (orderBtn) orderBtn.addEventListener('click', processOrder);
    if (resetBtn) resetBtn.addEventListener('click', resetCart);
}

// Panggil init saat halaman siap
document.addEventListener('DOMContentLoaded', init);
