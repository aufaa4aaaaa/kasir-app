// Utility functions
function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function showNotification(message, isError = false) {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.classList.remove('error');

  if (isError) {
    notification.classList.add('error');
  }

  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Data management
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let editingProductId = null;

// Default products if empty (dengan kategori)
if (products.length === 0) {
  products = [
    { id: 1, name: 'Teh Botol Sosro', price: 5000, stock: 20, category: 'minuman' },
    { id: 2, name: 'Indomie Goreng', price: 3500, stock: 30, category: 'makanan' },
    { id: 3, name: 'Aqua 600ml', price: 4000, stock: 25, category: 'minuman' },
    { id: 4, name: 'Chitato', price: 8000, stock: 15, category: 'snack' },
    { id: 5, name: 'Kopi Kapal Api', price: 12000, stock: 18, category: 'minuman' },
    { id: 6, name: 'Roti Tawar', price: 15000, stock: 12, category: 'makanan' },
  ];
  localStorage.setItem('products', JSON.stringify(products));
}

// Mapping kategori ke gambar ikon (gunakan URL gambar bebas)
const categoryImages = {
  makanan: 'https://img.icons8.com/color/96/000000/hamburger.png',
  minuman: 'https://img.icons8.com/color/96/000000/cold-drink.png',
  snack: 'https://img.icons8.com/color/96/000000/chips.png',
  perlengkapan: 'https://img.icons8.com/color/96/000000/shopping-basket.png',
  dll: 'https://img.icons8.com/color/96/000000/box.png',
};

// Tab navigation
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`${tab.dataset.tab}-content`).classList.add('active');
  });
});

// Render products dengan filter kategori
function renderProducts() {
  const container = document.getElementById('products-container');
  const filter = document.getElementById('category-filter').value;
  container.innerHTML = '';

  // Filter produk berdasarkan kategori
  const filteredProducts =
    filter === 'all' ? products : products.filter((p) => p.category === filter);

  if (filteredProducts.length === 0) {
    container.innerHTML =
      '<p style="text-align:center; color:#7f8c8d;">Tidak ada produk di kategori ini.</p>';
    return;
  }

  filteredProducts.forEach((product) => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';

    // Ambil gambar kategori, fallback ke ikon box
    const imgSrc = categoryImages[product.category] || categoryImages['dll'];

    productCard.innerHTML = `
      <img src="${imgSrc}" alt="${product.category}" class="product-icon" />
      <div class="product-name">${product.name}</div>
      <div class="product-price">${formatRupiah(product.price)}</div>
      <div class="product-stock">Stok: ${product.stock}</div>
      <div style="font-style: italic; color: #555; margin-bottom: 10px;">Kategori: ${product.category}</div>
      <button class="add-to-cart" onclick="addToCart(${product.id})" ${
      product.stock === 0 ? 'disabled' : ''
    }>
        ${product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
      </button>
    `;
    container.appendChild(productCard);
  });
}

// Render cart
function renderCart() {
  const container = document.getElementById('cart-container');
  const totalElement = document.getElementById('total-amount');

  container.innerHTML = '';
  let total = 0;

  if (Object.keys(cart).length === 0) {
    container.innerHTML =
      '<p style="text-align: center; padding: 20px; color: #7f8c8d;">Keranjang belanja kosong</p>';
    totalElement.textContent = formatRupiah(0);
    return;
  }

  Object.keys(cart).forEach((productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      const quantity = cart[productId];
      const subtotal = product.price * quantity;
      total += subtotal;

      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      cartItem.innerHTML = `
          <div class="cart-item-info">
              <div class="cart-item-name">${product.name}</div>
              <div class="cart-item-price">${formatRupiah(product.price)} x ${quantity}</div>
          </div>
          <div class="cart-item-quantity">
              <button class="quantity-btn decrease" onclick="updateCartQuantity(${product.id}, ${
        quantity - 1
      })">-</button>
              <span style="font-weight: bold; min-width: 30px; text-align: center;">${quantity}</span>
              <button class="quantity-btn" onclick="updateCartQuantity(${product.id}, ${
        quantity + 1
      })" ${quantity >= product.stock ? 'disabled' : ''}>+</button>
          </div>
      `;
      container.appendChild(cartItem);
    }
  });

  totalElement.textContent = formatRupiah(total);
}

// Render admin products
function renderAdminProducts() {
  const container = document.getElementById('admin-products-container');
  container.innerHTML = '';

  products.forEach((product) => {
    const productRow = document.createElement('div');
    productRow.className = 'product-row';
    productRow.innerHTML = `
        <div class="product-row-info">
            <div><strong>${product.name}</strong></div>
            <div>${formatRupiah(product.price)} | Stok: ${product.stock} | Kategori: ${product.category}</div>
        </div>
        <div class="product-row-actions">
            <button class="btn btn-primary" onclick="startEditProduct(${product.id})">Edit</button>
            <button class="btn btn-danger" onclick="deleteProduct(${product.id})">Hapus</button>
        </div>
    `;
    container.appendChild(productRow);
  });
}

// Cart functions
function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product || product.stock === 0) return;

  if (!cart[productId]) {
    cart[productId] = 0;
  }

  if (cart[productId] < product.stock) {
    cart[productId]++;
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    showNotification(`${product.name} ditambahkan ke keranjang`);
  } else {
    showNotification('Stok tidak mencukupi', true);
  }
}

function updateCartQuantity(productId, newQuantity) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  if (newQuantity <= 0) {
    delete cart[productId];
  } else if (newQuantity <= product.stock) {
    cart[productId] = newQuantity;
  } else {
    showNotification('Stok tidak mencukupi', true);
    return;
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}

// Admin functions
function startEditProduct(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  document.getElementById('product-name').value = product.name;
  document.getElementById('product-price').value = product.price;
  document.getElementById('product-stock').value = product.stock;
  document.getElementById('product-category').value = product.category || 'dll';
  document.getElementById('edit-product-id').value = productId;
  document.getElementById('cancel-edit').style.display = 'block';

  editingProductId = productId;

  document.getElementById('product-name').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  document.getElementById('product-name').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-stock').value = '';
  document.getElementById('product-category').value = 'makanan';
  document.getElementById('edit-product-id').value = '';
  document.getElementById('cancel-edit').style.display = 'none';

  editingProductId = null;
}

function saveProduct() {
  const name = document.getElementById('product-name').value.trim();
  const price = parseInt(document.getElementById('product-price').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  const category = document.getElementById('product-category').value || 'dll';
  const productId = document.getElementById('edit-product-id').value;

  if (!name || isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
    showNotification('Harap isi semua field dengan benar', true);
    return;
  }

  if (productId) {
    const index = products.findIndex((p) => p.id === parseInt(productId));
    if (index !== -1) {
      products[index] = {
        ...products[index],
        name,
        price,
        stock,
        category,
      };
    }
  } else {
    const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
    products.push({
      id: newId,
      name,
      price,
      stock,
      category,
    });
  }

  localStorage.setItem('products', JSON.stringify(products));
  renderProducts();
  renderAdminProducts();
  cancelEdit();

  showNotification(productId ? 'Produk berhasil diupdate' : 'Produk berhasil ditambahkan');
}

function deleteProduct(productId) {
  if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

  products = products.filter((p) => p.id !== productId);
  localStorage.setItem('products', JSON.stringify(products));

  if (cart[productId]) {
    delete cart[productId];
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
  }

  renderProducts();
  renderAdminProducts();
  showNotification('Produk berhasil dihapus');
}

// Checkout
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (Object.keys(cart).length === 0) {
    showNotification('Keranjang belanja kosong', true);
    return;
  }

  Object.keys(cart).forEach((productId) => {
    const product = products.find((p) => p.id === parseInt(productId));
    if (product) {
      product.stock -= cart[productId];
    }
  });

  localStorage.setItem('products', JSON.stringify(products));
  cart = {};
  localStorage.setItem('cart', JSON.stringify(cart));

  renderProducts();
  renderCart();
  renderAdminProducts();

  showNotification('Checkout berhasil! Stok telah diperbarui.');
});

// Event listeners
document.getElementById('save-product').addEventListener('click', saveProduct);
document.getElementById('cancel-edit').addEventListener('click', cancelEdit);
document.getElementById('category-filter').addEventListener('change', renderProducts);

// Initialize
renderProducts();
renderCart();
renderAdminProducts();
