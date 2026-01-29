# Circle-it

**Crop any image into a perfect circle with transparent background.**

A simple, fast, and privacy-focused image editing tool that runs entirely in your browser. No uploads, no servers, no data collection.

🌐 **Live Demo:** [circle-it.raztom.com](https://circle-it.raztom.com)

## ✨ Features

- **Drag & Drop Upload** — Simply drop any image onto the page
- **Clipboard Paste** — Press `Ctrl+V` (or `⌘+V` on Mac) to paste screenshots
- **Circle Cropping** — Perfect circular mask with transparent background
- **Reposition & Zoom** — Drag to move, scroll to zoom, or use the slider
- **Real-time Preview** — See your final result before downloading
- **One-Click Download** — Export as PNG with transparent background
- **Mobile Friendly** — Touch-optimized with responsive design
- **Privacy First** — Everything happens in your browser, no data leaves your device

## 🚀 Getting Started

### Use Online

Visit [circle-it.raztom.com](https://circle-it.raztom.com) to start using the tool immediately.

### Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/raztom/circle-it.git
   cd circle-it
   ```

2. **Open in browser:**
   - Simply open `index.html` in your browser
   - Or use a local server:
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js (npx)
     npx serve
     
     # Using VS Code Live Server extension
     # Right-click index.html → "Open with Live Server"
     ```

3. **Visit:** `http://localhost:8000`

No build tools, no dependencies, no installation required!

## 📖 How to Use

1. **Upload an Image**
   - Drag and drop an image onto the upload area
   - Click the upload area to browse your files
   - Paste an image from clipboard (`Ctrl/⌘ + V`)

2. **Adjust Position**
   - Drag the image to reposition it within the circle
   - Use the zoom slider or mouse wheel to adjust size

3. **Download**
   - Click "Download PNG" to save your circular image
   - The file saves as `circle-it-[timestamp].png`

## 🎨 Supported Formats

**Input:** JPEG, PNG, WebP  
**Output:** PNG with transparent background (512×512 pixels)

## 🏗️ Project Structure

```
circle-it/
├── index.html              # Main HTML file
├── README.md               # This file
└── src/
    ├── css/
    │   ├── main.css        # Global styles & layout
    │   └── controls.css    # Button & slider styles
    └── js/
        ├── app.js          # Application bootstrap & coordination
        ├── state.js        # Centralized state management
        ├── imageLoader.js  # File input & drag-drop handling
        ├── canvasRenderer.js # Canvas drawing operations
        ├── interactions.js # Drag, touch & zoom interactions
        ├── downloader.js   # Image export & download
        └── clipboardHandler.js # Clipboard paste support
```

## 🛠️ Technical Details

- **Pure vanilla JavaScript** — No frameworks or external libraries
- **No build tools required** — Just open the HTML file
- **Modular architecture** — Single responsibility modules
- **State-driven rendering** — Only state changes trigger updates
- **Responsive design** — Works on desktop and mobile
- **Accessible** — Keyboard navigation and screen reader support

## 🚢 Deployment

### GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings → Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/ (root)` folder
5. Your site will be live at `https://username.github.io/circle-it`

### Cloudflare Pages (Recommended)

1. Connect your GitHub repository to Cloudflare Pages
2. Set build settings:
   - **Build command:** (leave empty)
   - **Build output directory:** `/`
3. Deploy
4. Configure custom domain: `circle-it.yourdomain.com`

**Benefits:**
- Free SSL
- Global CDN
- Fast edge caching
- Easy Git integration

### Vercel

1. Import your GitHub repository
2. Framework preset: **Other**
3. Build settings: (leave defaults)
4. Deploy

## 🌐 Custom Domain Setup (Cloudflare)

1. Add a CNAME record in Cloudflare DNS:
   - Name: `circle-it` (or your subdomain)
   - Target: Your Cloudflare Pages URL
2. Cloudflare will auto-configure SSL

## 💡 Tips for Best Results

- Use high-resolution images for the best output quality
- Square images work well, but any aspect ratio is supported
- The zoom slider lets you find the perfect framing
- Drag the image to center your subject within the circle

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Made with ❤️ for the creative community**
