import { db, isConfigured } from './firebase-config.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Elements
const productGrid = document.getElementById('product-grid');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartCountElement = document.querySelector('.cart-count');

// State
let allProducts = [];
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
let cartCount = cartItems.length;

// Initialize
function init() {
    updateCartIcon();
    loadProducts();
    setupFilters();
}

// Load products
async function loadProducts() {
    try {
        if (!isConfigured) {
            console.warn("Firebase is not configured. Loading premium mock data for presentation purposes.");
            allProducts = getMockProducts();
            renderProducts(allProducts);
            return;
        }

        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        allProducts = [];
        querySnapshot.forEach((doc) => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        if (allProducts.length === 0) {
            productGrid.innerHTML = `
                <div class="empty-state">
                    <i class="ri-shopping-basket-line"></i>
                    <h3>No products found</h3>
                    <p>Check back later for our premium collections!</p>
                </div>
            `;
            return;
        }

        renderProducts(allProducts);
    } catch (error) {
        console.error("Error loading products:", error);
        productGrid.innerHTML = `
            <div class="empty-state" style="color: #ef4444;">
                <i class="ri-error-warning-line"></i>
                <h3>Error Loading Products</h3>
                <p>Please try refreshing the page.</p>
            </div>
        `;
    }
}

// Render products to grid
function renderProducts(productsToRender) {
    productGrid.innerHTML = '';

    productsToRender.forEach(product => {
        const productHtml = `
            <div class="product-card" data-category="${product.category}">
                <div class="img-container">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x250?text=No+Image'}" alt="${product.name}" class="product-img" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-desc-short">${product.description ? product.description.substring(0, 60) + '...' : ''}</p>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <button class="add-to-cart" onclick="window.addToCart(event)">
                        <i class="ri-shopping-cart-2-line"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        productGrid.insertAdjacentHTML('beforeend', productHtml);
    });
}

// Setup category filtration
function setupFilters() {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const filter = e.target.dataset.filter;
            if (filter === 'all') {
                renderProducts(allProducts);
            } else {
                const filtered = allProducts.filter(p => p.category === filter);
                renderProducts(filtered);

                if (filtered.length === 0) {
                    productGrid.innerHTML = `
                        <div class="empty-state">
                            <i class="ri-search-line"></i>
                            <h3>No items found in ${filter}</h3>
                            <p>We are constantly updating our stock!</p>
                        </div>
                    `;
                }
            }
        });
    });
}

// Add to cart functionality
window.addToCart = function (e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const card = btn.closest('.product-card');
    const productName = card.querySelector('.product-title').innerText;
    const productPrice = card.querySelector('.product-price').innerText;

    // Animation effect
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ri-check-line"></i> Added`;
    btn.style.backgroundColor = 'var(--primary)';
    btn.style.color = 'white';

    // Update counter and storage
    cartItems.push(`${productName} (${productPrice})`);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    cartCount = cartItems.length;
    updateCartIcon();

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = 'transparent';
        btn.style.color = 'var(--secondary)';
    }, 1500);
}

function updateCartIcon() {
    if (cartCountElement) cartCountElement.textContent = cartCount;
}

window.checkoutWhatsapp = function () {
    if (cartItems.length === 0) {
        alert("Your cart is empty! Please add some items before checking out.");
        return;
    }

    let orderText = "Hello Mevs Pet Shop! I would like to order the following items:\n\n";
    cartItems.forEach((item, index) => {
        orderText += `${index + 1}. ${item}\n`;
    });
    orderText += "\nCould you please provide the direct account number for payment?";

    const whatsappUrl = `https://wa.me/14503011233?text=${encodeURIComponent(orderText)}`;

    navigator.clipboard.writeText(orderText).then(() => {
        alert("🛒 Your order list has been COPIED to your clipboard!\n\nWhen WhatsApp opens, simply SEND it in our chat to place your order.");
        window.open(whatsappUrl, '_blank');

        // Clear cart after redirecting to avoid double ordering
        cartItems = [];
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        cartCount = 0;
        updateCartIcon();
    }).catch(err => {
        // Fallback for browsers blocking clipboard auto-copy
        alert("Navigating to WhatsApp to place your order!");
        window.open(whatsappUrl, '_blank');

        cartItems = [];
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        cartCount = 0;
        updateCartIcon();
    });
}

// Mock Data for unconfigured representation
function getMockProducts() {
    return [
        {
            id: 'mock1',
            name: 'Luxury Velvet Collar',
            category: 'Collars',
            price: 24.99,
            description: 'Premium plush velvet collar featuring gold-plated hardware. Handcrafted for maximum comfort and unparalleled style.',
            imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400&h=300'
        },
        {
            id: 'mock3',
            name: 'Interactive Laser Toy',
            category: 'Toys',
            price: 34.50,
            description: 'Keep your pet entertained for hours with varied random laser patterns and automatic shut-off timers.',
            imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=400&h=300'
        },
        {
            id: 'mock4',
            name: 'Ceramic Raised Feeder Bowl',
            category: 'Accessories',
            price: 45.00,
            description: 'Ergonomic raised feeding station crafted from premium ceramic and bamboo wood. Prevents neck strain and improves digestion.',
            imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400&h=300'
        },
        {
            id: 'mock5',
            name: 'Durable Rope Chew Toy',
            category: 'Toys',
            price: 14.99,
            description: 'Indestructible woven rope meant for heavy chewers. Promotes dental health and prevents tartar buildup.',
            imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=400&h=300'
        },
        {
            id: 'mock6',
            name: 'Premium Leather Harness',
            category: 'Collars',
            price: 59.99,
            description: 'Ergonomic leather harness offering better control without choking. Hand-stitched with brass buckles.',
            imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&q=80&w=400&h=300'
        }
    ];
}

// Start app
document.addEventListener('DOMContentLoaded', init);
