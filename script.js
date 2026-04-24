let cart = [];

function toggleCart() {
  document.getElementById("cart").classList.toggle("active");
}

function showToast() {
  let t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(()=>t.classList.remove("show"),2000);
}

function addToCart(nama, harga) {
  let item = cart.find(i => i.nama === nama);

  if(item){
    item.qty++;
  } else {
    cart.push({nama, harga, qty:1});
  }

  showToast();
  renderCart();
}

function renderCart(){
  let html = "";
  let total = 0;

  cart.forEach((item,i)=>{
    total += item.harga * item.qty;

    html += `
    <div class="cart-item">
      <b>${item.nama}</b><br>
      Rp ${item.harga}<br>

      <button onclick="changeQty(${i},-1)">-</button>
      ${item.qty}
      <button onclick="changeQty(${i},1)">+</button>
      <br>
      <button onclick="removeItem(${i})">Hapus</button>
    </div>
    `;
  });

  document.getElementById("cartItems").innerHTML = html;
  document.getElementById("total").innerText = total;
}

function changeQty(i,val){
  cart[i].qty += val;
  if(cart[i].qty <= 0) cart.splice(i,1);
  renderCart();
}

function removeItem(i){
  cart.splice(i,1);
  renderCart();
}

function checkout(){
  let alamat = document.getElementById("alamat").value;

  let text = "Pesanan:\n";

  cart.forEach(item=>{
    text += `${item.nama} x${item.qty}\n`;
  });

  text += "\nAlamat: " + alamat;

  window.open("https://wa.me/6281234567890?text="+encodeURIComponent(text));
}
