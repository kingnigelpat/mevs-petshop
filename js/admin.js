import { db, auth, isConfigured, cloudinaryConfig } from './firebase-config.js';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// DOM Elements
const addBtn = document.getElementById('add-product-btn');
const modal = document.getElementById('product-modal');
const overlay = document.getElementById('modal-overlay');
const closeBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('product-form');
const productList = document.getElementById('admin-product-list');
const searchInput = document.getElementById('search-products');

// Cloudinary
const imageInput = document.getElementById('product-image');
const imageUrlInput = document.getElementById('image-url');
const uploadWrapper = document.getElementById('upload-wrapper');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');
const statusMessage = document.getElementById('upload-status');
const saveBtn = document.getElementById('save-btn');

// Auth
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const adminEmailSpan = document.getElementById('admin-email');

// Password Gate
const passwordGate = document.getElementById('password-gate');
const gateForm = document.getElementById('gate-form');
const gatePasswordInput = document.getElementById('gate-password');
const gateError = document.getElementById('gate-error');
const ACCESS_CODE = atob('R29kd2luNzg='); // Obfuscated access code

// State
let allProducts = [];
let editModeId = null;
let gateUnlocked = false;

// Initialization
function init() {
    // Password gate handler
    if (gateForm) {
        gateForm.addEventListener('submit', handleGateSubmit);
    }

    // Check config
    if (!isConfigured) {
        document.getElementById('setup-modal').classList.remove('hidden');
        renderProducts([]); // Render empty
        document.getElementById('total-products-count').innerText = "0";
    } else {
        // Auth Listener
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginOverlay.style.display = 'none';
                if (adminEmailSpan) adminEmailSpan.innerText = user.email;
                fetchProducts();
            } else {
                loginOverlay.style.display = 'flex';
            }
        });
    }

    // Event Listeners
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

    addBtn.addEventListener('click', () => openModal(false));
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    form.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', handleSearch);

    // Cloudinary upload listeners
    imageInput.addEventListener('change', handleImageUpload);
    removeImageBtn.addEventListener('click', clearImageUpload);

    setupDragAndDrop();
}

// Password Gate Handler
function handleGateSubmit(e) {
    e.preventDefault();
    const enteredCode = gatePasswordInput.value;

    if (enteredCode === ACCESS_CODE) {
        gateUnlocked = true;
        passwordGate.style.display = 'none';
    } else {
        gateError.textContent = '❌ Incorrect access code. Try again.';
        gateError.style.display = 'block';
        gatePasswordInput.value = '';
        gatePasswordInput.focus();

        // Shake animation
        passwordGate.querySelector('.login-card').style.animation = 'shake 0.4s ease';
        setTimeout(() => {
            passwordGate.querySelector('.login-card').style.animation = '';
        }, 400);
    }
}

async function fetchProducts() {
    try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });

        document.getElementById('total-products-count').innerText = allProducts.length;
        renderProducts(allProducts);

    } catch (error) {
        console.error("Error fetching products:", error);
        productList.innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Failed to load products. Check console or firebase rules.</td></tr>`;
    }
}

function renderProducts(products) {
    productList.innerHTML = '';

    if (products.length === 0) {
        productList.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding: 3rem;">No products found. Start adding some!</td></tr>`;
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="td-img">
                <img src="${product.imageUrl || 'https://via.placeholder.com/60?text=No+Img'}" alt="img">
            </td>
            <td>
                <div style="font-weight: 600;">${product.name}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${product.description ? product.description.substring(0, 30) + '...' : ''}</div>
            </td>
            <td><span style="background: #e0f2fe; color: #0284c7; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.85rem;">${product.category}</span></td>
            <td style="font-weight: 600;">$${parseFloat(product.price).toFixed(2)}</td>
            <td class="action-btns">
                <button class="action-btn edit-btn" data-id="${product.id}" title="Edit"><i class="ri-pencil-line"></i></button>
                <button class="action-btn delete-btn" data-id="${product.id}" title="Delete"><i class="ri-delete-bin-line"></i></button>
            </td>
        `;
        productList.appendChild(tr);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editProduct(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteProduct(e.currentTarget.dataset.id));
    });
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );
    renderProducts(filtered);
}

// Auth Handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Authenticating...';
    btn.disabled = true;
    loginError.style.display = 'none';

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Form clears naturally as overlay hides
    } catch (error) {
        console.error("Login failed", error);
        loginError.innerText = "Invalid credentials. Please try again.";
        loginError.style.display = 'block';
    } finally {
        btn.innerHTML = 'Login to Dashboard';
        btn.disabled = false;
    }
}

// Form Handlers
async function handleFormSubmit(e) {
    e.preventDefault();
    if (!isConfigured) {
        alert("Firebase is not configured yet. Saving is disabled.");
        return;
    }

    const productData = {
        name: document.getElementById('product-name').value.trim(),
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-desc').value.trim(),
        imageUrl: imageUrlInput.value || ''
    };

    saveBtn.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> Saving...';
    saveBtn.disabled = true;

    try {
        if (editModeId) {
            // Update
            const docRef = doc(db, 'products', editModeId);
            productData.updatedAt = serverTimestamp();
            await updateDoc(docRef, productData);
        } else {
            // Create
            productData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'products'), productData);
        }

        closeModal();
        fetchProducts(); // Refresh list
    } catch (error) {
        console.error("Error saving product: ", error);
        alert("Failed to save product.");
    } finally {
        saveBtn.innerHTML = 'Save Product';
        saveBtn.disabled = false;
    }
}

async function editProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    editModeId = id;
    document.getElementById('modal-title').innerText = "Edit Product";

    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-desc').value = product.description;

    if (product.imageUrl) {
        imageUrlInput.value = product.imageUrl;
        imagePreview.src = product.imageUrl;
        imagePreviewContainer.classList.remove('hidden');
        uploadWrapper.classList.add('hidden');
    } else {
        clearImageUpload();
    }

    openModal(true);
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
        await deleteDoc(doc(db, "products", id));
        fetchProducts();
    } catch (error) {
        console.error("Error deleting product", error);
        alert("Failed to delete product");
    }
}

function openModal(isEdit = false) {
    if (!isEdit) {
        editModeId = null;
        form.reset();
        document.getElementById('modal-title').innerText = "Add New Product";
        clearImageUpload();
    }
    modal.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeModal() {
    modal.classList.add('hidden');
    overlay.classList.add('hidden');
    form.reset();
    clearImageUpload();
}

// Cloudinary Upload Logic
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    await uploadToCloudinary(file);
}

async function uploadToCloudinary(file) {
    if (cloudinaryConfig.cloudName === "YOUR_CLOUD_NAME") {
        showStatus('Cloudinary not configured. Check firebase-config.js', 'error');
        return;
    }

    showStatus('Uploading image...', 'loading');
    saveBtn.disabled = true;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", cloudinaryConfig.uploadPreset);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        // Success
        imageUrlInput.value = data.secure_url;
        imagePreview.src = data.secure_url;
        uploadWrapper.classList.add('hidden');
        imagePreviewContainer.classList.remove('hidden');

        showStatus('Upload complete!', 'success');
        setTimeout(() => setStatusVisible(false), 2000);

    } catch (error) {
        console.error("Upload error:", error);
        showStatus(`Upload failed: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        imageInput.value = ''; // Reset input
    }
}

function clearImageUpload() {
    imageUrlInput.value = '';
    imagePreview.src = '';
    uploadWrapper.classList.remove('hidden');
    imagePreviewContainer.classList.add('hidden');
    setStatusVisible(false);
}

function showStatus(msg, type) {
    statusMessage.textContent = msg;
    statusMessage.className = `status-message status-${type}`;
    setStatusVisible(true);
}

function setStatusVisible(visible) {
    statusMessage.style.display = visible ? 'block' : 'none';
}

function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadWrapper.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadWrapper.addEventListener(eventName, () => {
            uploadWrapper.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadWrapper.addEventListener(eventName, () => {
            uploadWrapper.classList.remove('dragover');
        });
    });

    uploadWrapper.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadToCloudinary(file);
        } else {
            showStatus('Please upload a valid image file', 'error');
        }
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
