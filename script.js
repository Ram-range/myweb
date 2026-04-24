let cart = [];

function addCart(nama, harga) {
    cart.push({nama, harga});
    updateCart();
}

function updateCart() {
    let items = document.getElementById("cartItems");
    let total = 0;

    items.innerHTML = "";

    cart.forEach(item => {
        items.innerHTML += `<p>${item.nama} - Rp ${item.harga}</p>`;
        total += item.harga;
    });

    document.getElementById("total").innerHTML = "Total: Rp " + total;
    document.getElementById("cartCount").innerHTML = cart.length;
}

function toggleCart() {
    document.getElementById("cart").classList.toggle("active");
}

function checkout() {
    let text = "Pesanan:\n";

    cart.forEach(item => {
        text += item.nama + "\n";
    });

    let url = `https://wa.me/6281234567890?text=${encodeURIComponent(text)}`;
    window.open(url);
}

function searchMenu() {
    let input = document.getElementById("search").value.toLowerCase();
    let cards = document.querySelectorAll(".card");

    cards.forEach(card => {
        let name = card.innerText.toLowerCase();
        card.style.display = name.includes(input) ? "block" : "none";
    });
}
