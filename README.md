# Mevs Pet Shop

A stunning, professional Pet Shop e-commerce storefront with a fully functional admin panel for managing the store's inventory.

## Tech Stack
- **HTML, Vanilla CSS (with modern variables and animations)**
- **Vanilla JavaScript (ES Modules for lean architecture)**
- **Firebase Firestore v10 (for managing product data)**
- **Cloudinary (for seamless image uploading in the admin panel)**

## Getting Started
Since this application uses ES Modules (`import ... from ...`), you cannot run it by simply double-clicking the `index.html` file (you will encounter CORS errors). You need a local server.

The quickest way is via the provided package script:
1. Ensure you have Node.js installed.
2. Run `npm install serve -g` (if you haven't installed it)
3. Run `npm run dev` to start a local server at [http://localhost:3000](http://localhost:3000)

## Configuration required for Admin Panel
Right now, the front-end will display **mock premium pet accessories** so you can see exactly how professional the design looks before configuring the database. 

However, to use the Admin Panel properly (post products, edit descriptions, change image, upload via Cloudinary, and delete products), you **must** provide your Firebase and Cloudinary credentials.

Open `js/firebase-config.js` and replace the placeholder values:

### 1. Firebase Firestore
Enter your Firebase configurations. Make sure Firestore Database is enabled and that your rules are configured to allow reading and writing.

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ...
};
```

### 2. Cloudinary
You need a Cloudinary `cloud_name` and an **unsigned upload preset** to allow the Admin Panel to programmatically upload image assets directly from the frontend.

```javascript
export const cloudinaryConfig = {
    cloudName: "YOUR_CLOUD_NAME", // e.g., 'dxyxxxxxx'
    uploadPreset: "YOUR_UPLOAD_PRESET" // MUST be an unsigned preset
};
```

## Features Handled
- Responsive, Premium Shop Aesthetics carefully designed to wow visitors. 
- Integrated a mock cart animation and functional category filters that respond to Firebase data.
- Built-in drag-and-drop Cloudinary uploading directly in the Admin Panel.
- Robust CRUD functionality for your store synced securely with Firebase.
