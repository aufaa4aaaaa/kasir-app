// Global variables
let currentRole = 'cashier';
let products = [];
let cart = [];
let transactions = [];
let editingProductId = null;

// Initialize default products
function initializeProducts() {
    const defaultProducts = [
        { id: 1, name: 'Nasi Gudeg', price: 15000, stock: 20, category: 'makanan' },
        { id: 2, name: 'Es Teh Manis', price: 5000, stock: 30, category: 'minuman' },
        { id: 3, name: 'Kerupuk Udang', price: 8000, stock: 25, category: 'snack' },
        { id: 4, name: 'Soto Ayam', price: 18000, stock: 15, category: 'makanan' },
        { id: 5, name: 'Kopi Tubruk', price: 7000, stock: 40, category: 'minuman' },
        { id: 6, name: 'Tempe Goreng', price: 6000, stock: 12, category: 'makanan' },
        { id: 7, name: 'Tissue', price: 3000, stock: 50, category: 'perlengkapan' },
        { id: 8, name: 'Keripik Singkong', price: 10000, stock: 18, category: 'snack' }
    ];

    if (products.length === 0) {
        products = defaultProducts;
        saveToStorage();
    }
}

// Storage functions
function saveToStorage() {
    const data = { products, cart, transactions };
    window.appData = data; // Simulasi local storage
}

function loadFromStorage() {
    if (window.appData) {
        const data = window.appData;
        products = data.products || [];
        cart = data.cart || [];
        transactions = data.transactions || [];
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('currentTime').textContent = timeString;
}

// Switch role
function switchRole(role) {
    currentRole = role;

    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    if (role === 'admin') {
        document.getElementById('cashierSection').style.display = 'none';
        document.getElementById('adminSection').style.display = 'block';
        loadStockTable();
        updateSalesReport();
    } else {
        document.getElementById('cashierSection').style.display = 'block';
        document.getElementById('adminSection').style.display = 'none';
        loadProducts();
        loadTransactionHistory();
    }
}

// Load products
function loadProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';

    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => addToCart(product.id);

        const stockStatus = product.stock < 5 ? ' (Stok Menipis!)' : '';
        const stockClass = product.stock < 5 ? 'low-stock' : '';

        productCard.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-stock ${stockClass}">Stok: ${product.stock}${stockStatus}</div>
        `;

        if (product.stock === 0) {
            productCard.style.opacity = '0.5';
            productCard.style.cursor = 'not-allowed';
            productCard.onclick = null;
        }

        grid.appendChild(productCard);
    });
}

// Add to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock === 0) {
        showAlert('Produk tidak tersedia atau stok habis!', 'danger');
        return;
    }

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity += 1;
        } else {
            showAlert('Stok tidak mencukupi!', 'danger');
            return;
        }
    } else {
        cart.push({
            id: productId,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    updateCartDisplay();
    saveToStorage();
}

// Update cart
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const totalSection = document.getElementById('totalSection');

    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <p style="text-align: center; color: #666; padding: 20px;">
                Keranjang masih kosong. Pilih produk untuk mulai transaksi.
            </p>
        `;
        totalSection.style.display = 'none';
        return;
    }

    cartContainer.innerHTML = '';
    let subtotal = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatCurrency(item.price)} × ${item.quantity} = ${formatCurrency(itemTotal)}</div>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">−</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">×</button>
        `;
        cartContainer.appendChild(cartItem);
    });

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('tax').textContent = formatCurrency(tax);
    document.getElementById('total').textContent = formatCurrency(total);

    totalSection.style.display = 'block';
}

// Update quantity
function updateQuantity(productId, change) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (cartItem) {
        const newQuantity = cartItem.quantity + change;

        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else if (newQuantity <= product.stock) {
            cartItem.quantity = newQuantity;
            updateCartDisplay();
            saveToStorage();
        } else {
            showAlert('Stok tidak mencukupi!', 'danger');
        }
    }
}

// Remove item
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartDisplay();
    saveToStorage();
}

// Clear cart
function clearCart() {
    cart = [];
    updateCartDisplay();
    saveToStorage();
}

// Process transaction
function processTransaction() {
    if (cart.length === 0) {
        showAlert('Keranjang masih kosong!', 'danger');
        return;
    }

    let subtotal = 0;
    const transactionItems = [];

    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product && product.stock >= item.quantity) {
            subtotal += item.price * item.quantity;
            transactionItems.push({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.price * item.quantity
            });

            product.stock -= item.quantity;
        } else {
            showAlert(`Stok ${item.name} tidak mencukupi!`, 'danger');
            return;
        }
    });

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const transaction = {
        id: Date.now(),
        date: new Date().toLocaleString('id-ID'),
        items: transactionItems,
        subtotal: subtotal,
        tax: tax,
        total: total,
        itemCount: transactionItems.reduce((sum, item) => sum + item.quantity, 0)
    };

    transactions.push(transaction);
    cart = [];

    saveToStorage();
    updateCartDisplay();
    loadProducts();
    loadTransactionHistory();

    showAlert(`Transaksi berhasil! Total: ${formatCurrency(total)}`, 'success');
}

// Load history
function loadTransactionHistory() {
    const container = document.getElementById('transactionHistory');
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        const today = new Date();
        return transDate.toDateString() === today.toDateString();
    });

    if (todayTransactions.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #666; padding: 20px;">
                Belum ada transaksi hari ini.
            </p>
        `;
        return;
    }

    container.innerHTML = '';
    todayTransactions.reverse().forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = 'transaction-item';

        const itemsText = transaction.items.map(item =>
            `${item.name} (${item.quantity}x)`
        ).join(', ');

        transactionDiv.innerHTML = `
            <div class="transaction-header">
                <span>Transaksi #${transaction.id}</span>
                <span>${formatCurrency(transaction.total)}</span>
            </div>
            <div class="transaction-items">
                <div>🕐 ${transaction.date}</div>
                <div>🛍️ ${itemsText}</div>
                <div>📦 ${transaction.itemCount} item total</div>
            </div>
        `;

        container.appendChild(transactionDiv);
    });
}

// Admin functions
function loadStockTable() {
    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        const stockStatus = product.stock < 5 ? 'Stok Menipis' : 'Normal';
        const stockClass = product.stock < 5 ? 'low-stock' : '';

        row.innerHTML = `
            <td>${product.name}</td>
            <td>${formatCurrency(product.price)}</td>
            <td class="${stockClass}">${product.stock}</td>
            <td style="text-transform: capitalize;">${product.category}</td>
            <td class="${stockClass}">${stockStatus}</td>
            <td>
                <button class="btn btn-warning" onclick="editProduct(${product.id})">✏️ Edit</button>
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">🗑️ Hapus</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Form handling
document.getElementById('productForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const name = document.getElementById('productName').value.trim();
    const price = parseInt(document.getElementById('productPrice').value);
    const stock = parseInt(document.getElementById('productStock').value);
    const category = document.getElementById('productCategory').value;

    if (!name || !price || stock < 0 || !category) {
        showAdminAlert('Mohon lengkapi semua field!', 'danger');
        return;
    }

    if (editingProductId) {
        const product = products.find(p => p.id === editingProductId);
        if (product) {
            product.name = name;
            product.price = price;
            product.stock = stock;
            product.category = category;
            showAdminAlert('Produk berhasil diupdate!', 'success');
        }
        editingProductId = null;
    } else {
        const newProduct = {
            id: Date.now(),
            name: name,
            price: price,
            stock: stock,
            category: category
        };
        products.push(newProduct);
        showAdminAlert('Produk berhasil ditambahkan!', 'success');
    }

    saveToStorage();
    clearForm();
    loadStockTable();
    if (currentRole === 'cashier') {
        loadProducts();
    }
});

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        document.getElementById('productCategory').value = product.category;
        editingProductId = productId;

        const submitBtn = document.querySelector('#productForm button[type="submit"]');
        submitBtn.textContent = '📝 Update Produk';

        showAdminAlert('Mode edit aktif. Ubah data dan klik Update Produk.', 'success');
    }
}

// Delete product
function deleteProduct(productId) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
        products = products.filter(p => p.id !== productId);
        saveToStorage();
        loadStockTable();
        if (currentRole === 'cashier') {
            loadProducts();
        }
        showAdminAlert('Produk berhasil dihapus!', 'success');
    }
}

// Clear form
function clearForm() {
    document.getElementById('productForm').reset();
    editingProductId = null;
    const submitBtn = document.querySelector('#productForm button[type="submit"]');
    submitBtn.textContent = '💾 Simpan Produk';
}

// Alerts
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);

    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 3000);
}

function showAdminAlert(message, type) {
    const alertContainer = document.getElementById('adminAlert');
    alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 3000);
}

// Sales report
function updateSalesReport() {
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        const today = new Date();
        return transDate.toDateString() === today.toDateString();
    });

    const totalTransactions = todayTransactions.length;
    const totalRevenue = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalItemsSold = todayTransactions.reduce((sum, t) => sum + t.itemCount, 0);

    document.getElementById('totalTransactions').textContent = totalTransactions;
    document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
    document.getElementById('totalItemsSold').textContent = `${totalItemsSold} item`;
}

// Export report
function exportReport() {
    const todayTransactions = transactions.filter(t => {
        const transDate = new Date(t.date);
        const today = new Date();
        return transDate.toDateString() === today.toDateString();
    });

    let reportContent = `LAPORAN PENJUALAN HARIAN\n`;
    reportContent += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    reportContent += `=====================================\n\n`;

    reportContent += `RINGKASAN:\n`;
    reportContent += `Total Transaksi: ${todayTransactions.length}\n`;
    reportContent += `Total Pendapatan: ${formatCurrency(todayTransactions.reduce((sum, t) => sum + t.total, 0))}\n`;
    reportContent += `Total Item Terjual: ${todayTransactions.reduce((sum, t) => sum + t.itemCount, 0)} item\n\n`;

    reportContent += `DETAIL TRANSAKSI:\n`;
    reportContent += `=====================================\n`;

    todayTransactions.forEach((transaction, index) => {
        reportContent += `${index + 1}. Transaksi #${transaction.id}\n`;
        reportContent += `   Waktu: ${transaction.date}\n`;
        reportContent += `   Items:\n`;
        transaction.items.forEach(item => {
            reportContent += `   - ${item.name}: ${item.quantity}x ${formatCurrency(item.price)} = ${formatCurrency(item.total)}\n`;
        });
        reportContent += `   Subtotal: ${formatCurrency(transaction.subtotal)}\n`;
        reportContent += `   Pajak (10%): ${formatCurrency(transaction.tax)}\n`;
        reportContent += `   Total: ${formatCurrency(transaction.total)}\n\n`;
    });

    reportContent += `STOK SAAT INI:\n`;
    reportContent += `=====================================\n`;
    products.forEach(product => {
        const status = product.stock < 5 ? ' (STOK MENIPIS!)' : '';
        reportContent += `- ${product.name}: ${product.stock} unit${status}\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showAdminAlert('Laporan berhasil diexport!', 'success');
}

// Reset all data
function resetData() {
    if (confirm('PERINGATAN: Ini akan menghapus SEMUA data transaksi dan mereset produk ke default. Yakin ingin melanjutkan?')) {
        if (confirm('Ini adalah aksi yang tidak dapat dibatalkan. Klik OK untuk konfirmasi final.')) {
            transactions = [];
            cart = [];
            products = [];
            initializeProducts();
            saveToStorage();

            loadStockTable();
            updateSalesReport();
            clearForm();

            showAdminAlert('Data berhasil direset ke kondisi awal!', 'success');
        }
    }
}

// Init app
function initApp() {
    loadFromStorage();
    initializeProducts();
    loadProducts();
    loadTransactionHistory();
    updateTime();

    setInterval(updateTime, 1000);
    setInterval(saveToStorage, 30000);
}

// Start app
window.addEventListener('load', initApp);

// Sample data
function addSampleTransactions() {
    const sampleTransactions = [
        {
            id: Date.now() - 3600000,
            date: new Date(Date.now() - 3600000).toLocaleString('id-ID'),
            items: [
                { name: 'Nasi Gudeg', price: 15000, quantity: 2, total: 30000 },
                { name: 'Es Teh Manis', price: 5000, quantity: 2, total: 10000 }
            ],
            subtotal: 40000,
            tax: 4000,
            total: 44000,
            itemCount: 4
        },
        {
            id: Date.now() - 1800000,
            date: new Date(Date.now() - 1800000).toLocaleString('id-ID'),
            items: [
                { name: 'Soto Ayam', price: 18000, quantity: 1, total: 18000 },
                { name: 'Kopi Tubruk', price: 7000, quantity: 1, total: 7000 }
            ],
            subtotal: 25000,
            tax: 2500,
            total: 27500,
            itemCount: 2
        }
    ];

    if (transactions.length === 0) {
        transactions = sampleTransactions;
        saveToStorage();
    }
}

setTimeout(addSampleTransactions, 1000);
