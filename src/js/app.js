/**
 * App Module
 * Main application bootstrap and coordination
 */

(function() {
    'use strict';

    /**
     * DOM Element references
     */
    var elements = {
        uploadSection: null,
        editorSection: null,
        dropzone: null,
        fileInput: null,
        canvas: null,
        canvasCtx: null,
        previewCanvas: null,
        previewCtx: null,
        zoomSlider: null,
        zoomValue: null,
        resetBtn: null,
        newImageBtn: null,
        downloadBtn: null,
        toast: null
    };

    /**
     * Canvas configuration
     */
    var CANVAS_SIZE = 400;
    var PREVIEW_SIZE = 120;

    /**
     * Initialize DOM element references
     */
    function initElements() {
        elements.uploadSection = document.getElementById('uploadSection');
        elements.editorSection = document.getElementById('editorSection');
        elements.dropzone = document.getElementById('dropzone');
        elements.fileInput = document.getElementById('fileInput');
        elements.canvas = document.getElementById('canvas');
        elements.canvasCtx = elements.canvas.getContext('2d');
        elements.previewCanvas = document.getElementById('previewCanvas');
        elements.previewCtx = elements.previewCanvas.getContext('2d');
        elements.zoomSlider = document.getElementById('zoomSlider');
        elements.zoomValue = document.getElementById('zoomValue');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.newImageBtn = document.getElementById('newImageBtn');
        elements.downloadBtn = document.getElementById('downloadBtn');
        elements.toast = document.getElementById('toast');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - 'success' | 'error' | 'info'
     */
    function showToast(message, type) {
        var toast = elements.toast;
        type = type || 'info';

        // Clear existing classes
        toast.classList.remove('show', 'success', 'error');

        // Set content and type
        toast.textContent = message;
        if (type === 'success') toast.classList.add('success');
        if (type === 'error') toast.classList.add('error');

        // Force reflow to restart animation
        void toast.offsetWidth;

        // Show toast
        toast.classList.add('show');

        // Hide after delay
        setTimeout(function() {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Show the upload section, hide editor
     */
    function showUploadView() {
        elements.uploadSection.hidden = false;
        elements.editorSection.hidden = true;
    }

    /**
     * Show the editor section, hide upload
     */
    function showEditorView() {
        elements.uploadSection.hidden = true;
        elements.editorSection.hidden = false;
    }

    /**
     * Handle successful image load
     * @param {HTMLImageElement} image - Loaded image element
     * @param {string} name - Image name
     */
    function onImageLoaded(image, name) {
        AppState.setImage(image, name);
        showEditorView();
        showToast('Image loaded successfully!', 'success');
    }

    /**
     * Handle image load error
     * @param {string} message - Error message
     */
    function onImageError(message) {
        showToast(message, 'error');
    }

    /**
     * Handle state changes - update UI
     * @param {Object} state - Current state
     */
    function onStateChange(state) {
        // Render main canvas
        CanvasRenderer.render(elements.canvasCtx, CANVAS_SIZE, state);

        // Render preview canvas
        CanvasRenderer.renderPreview(elements.previewCtx, PREVIEW_SIZE, CANVAS_SIZE, state);

        // Update zoom slider
        Interactions.updateSliderValue(elements.zoomSlider, elements.zoomValue, state.scale);

        // Update download button
        Downloader.updateButtonState(elements.downloadBtn, state.image !== null);

        // Update canvas cursor
        elements.canvas.style.cursor = state.image ? 'grab' : 'default';
    }

    /**
     * Handle reset button click
     */
    function handleReset() {
        AppState.reset();
        showToast('Position and zoom reset', 'success');
    }

    /**
     * Handle new image button click
     */
    function handleNewImage() {
        AppState.clear();
        showUploadView();
        
        // Reset zoom slider to default
        elements.zoomSlider.value = AppState.getDefaultScale();
        elements.zoomValue.textContent = AppState.getDefaultScale() + '%';
        
        // Render empty state
        CanvasRenderer.render(elements.canvasCtx, CANVAS_SIZE, AppState.getState());
        CanvasRenderer.renderPreview(elements.previewCtx, PREVIEW_SIZE, CANVAS_SIZE, AppState.getState());
    }

    /**
     * Initialize button event listeners
     */
    function initButtons() {
        elements.resetBtn.addEventListener('click', handleReset);
        elements.newImageBtn.addEventListener('click', handleNewImage);
    }

    /**
     * Initialize the application
     */
    function init() {
        // Get DOM elements
        initElements();

        // Initialize image loader with error handling
        ImageLoader.init(
            elements.dropzone,
            elements.fileInput,
            onImageLoaded,
            onImageError
        );

        // Initialize clipboard handler
        ClipboardHandler.init(
            function(blob, name) {
                ImageLoader.loadImageFromBlob(blob, name);
            },
            function(message) {
                showToast(message, 'success');
            },
            function(message) {
                showToast(message, 'error');
            }
        );

        // Initialize interactions
        Interactions.init(
            elements.canvas,
            elements.zoomSlider,
            elements.zoomValue,
            {
                getState: AppState.getState,
                setPosition: AppState.setPosition,
                setScale: AppState.setScale
            }
        );

        // Initialize downloader with callbacks
        Downloader.init(
            elements.downloadBtn,
            AppState.getState,
            CanvasRenderer.renderForExport,
            function() {
                showToast('Image downloaded!', 'success');
            },
            function(err) {
                showToast(err || 'Download failed', 'error');
            }
        );

        // Initialize buttons
        initButtons();

        // Subscribe to state changes
        AppState.subscribe(onStateChange);

        // Initial render
        CanvasRenderer.render(elements.canvasCtx, CANVAS_SIZE, AppState.getState());
        CanvasRenderer.renderPreview(elements.previewCtx, PREVIEW_SIZE, CANVAS_SIZE, AppState.getState());

        // Ensure correct initial view
        showUploadView();

        console.log('Circle-it initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
