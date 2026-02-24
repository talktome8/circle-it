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
        toast: null,
        removeBgToggle: null,
        removeBgHint: null,
        bgColorOptions: null,
        colorSwatches: null,
        customColorPicker: null,
        cropStyleRadios: null,
        borderRadiusControl: null,
        borderRadiusSlider: null,
        radiusValue: null
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
        elements.canvasCtx = elements.canvas.getContext('2d', { alpha: true });
        elements.previewCanvas = document.getElementById('previewCanvas');
        elements.previewCtx = elements.previewCanvas.getContext('2d', { alpha: true });
        elements.zoomSlider = document.getElementById('zoomSlider');
        elements.zoomValue = document.getElementById('zoomValue');
        elements.resetBtn = document.getElementById('resetBtn');
        // Support both legacy 'newImageBtn' and current 'homeBtn'
        elements.newImageBtn = document.getElementById('newImageBtn') || document.getElementById('homeBtn');
        elements.downloadBtn = document.getElementById('downloadBtn');
        elements.toast = document.getElementById('toast');
        elements.removeBgToggle = document.getElementById('removeBgToggle');
        elements.removeBgHint = document.getElementById('removeBgHint');
        elements.bgColorOptions = document.getElementById('bgColorOptions');
        elements.colorSwatches = document.querySelectorAll('.color-swatch');
        elements.customColorPicker = document.getElementById('customColorPicker');
        elements.cropStyleRadios = document.querySelectorAll('input[name="cropStyle"]');
        elements.borderRadiusControl = document.getElementById('borderRadiusControl');
        elements.borderRadiusSlider = document.getElementById('borderRadiusSlider');
        elements.radiusValue = document.getElementById('radiusValue');
        elements.canvasWrapper = document.querySelector('.canvas-wrapper');
        elements.previewWrapper = document.querySelector('.preview-wrapper');
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
        var canDownload = state.image !== null && !state.isProcessingBackground;
        Downloader.updateButtonState(elements.downloadBtn, canDownload);

        // Update canvas cursor
        elements.canvas.style.cursor = state.image ? 'grab' : 'default';

        // Update remove background toggle state
        if (elements.removeBgToggle) {
            elements.removeBgToggle.disabled = state.isProcessingBackground;
        }

        // Show/hide background color options
        if (elements.bgColorOptions) {
            elements.bgColorOptions.hidden = !state.removeBackground;
        }

        // Update hint text
        if (elements.removeBgHint) {
            if (state.isProcessingBackground) {
                elements.removeBgHint.textContent = 'Processing... Please wait';
                elements.removeBgHint.classList.add('processing');
            } else if (state.removeBackground && state.processedImage) {
                elements.removeBgHint.textContent = 'Background removed ✓';
                elements.removeBgHint.classList.remove('processing');
            } else {
                elements.removeBgHint.textContent = 'AI-powered background removal';
                elements.removeBgHint.classList.remove('processing');
            }
        }

        // Show/hide border radius control based on crop style
        if (elements.borderRadiusControl) {
            elements.borderRadiusControl.hidden = state.cropStyle !== 'rounded';
        }

        // Update border radius slider
        if (elements.borderRadiusSlider && elements.radiusValue) {
            elements.borderRadiusSlider.value = state.borderRadius;
            elements.radiusValue.textContent = state.borderRadius + '%';
        }

        // Update wrapper shapes based on crop style
        updateWrapperShapes(state.cropStyle, state.borderRadius);
    }

    /**
     * Update wrapper element shapes based on crop style
     * @param {string} cropStyle - 'circle', 'square', or 'rounded'
     * @param {number} borderRadius - Border radius percentage for rounded style
     */
    function updateWrapperShapes(cropStyle, borderRadius) {
        cropStyle = cropStyle || 'circle';
        borderRadius = borderRadius || 20;

        // Set data attribute on wrappers for CSS styling
        if (elements.canvasWrapper) {
            elements.canvasWrapper.dataset.shape = cropStyle;
            if (cropStyle === 'rounded') {
                elements.canvasWrapper.style.borderRadius = (borderRadius / 100 * 50) + '%';
            } else {
                elements.canvasWrapper.style.borderRadius = '';
            }
        }

        if (elements.previewWrapper) {
            elements.previewWrapper.dataset.shape = cropStyle;
            if (cropStyle === 'rounded') {
                elements.previewWrapper.style.borderRadius = (borderRadius / 100 * 50) + '%';
            } else {
                elements.previewWrapper.style.borderRadius = '';
            }
        }

        // Also update the preview canvas
        var previewCanvas = elements.previewCanvas;
        if (previewCanvas) {
            previewCanvas.dataset.shape = cropStyle;
            if (cropStyle === 'rounded') {
                previewCanvas.style.borderRadius = (borderRadius / 100 * 50) + '%';
            } else {
                previewCanvas.style.borderRadius = '';
            }
        }
    }

    /**
     * Handle color swatch click
     * @param {string} color - The selected color
     */
    function handleColorSelect(color) {
        AppState.setBackgroundColor(color);
        
        // Update active state on swatches
        elements.colorSwatches.forEach(function(swatch) {
            swatch.classList.toggle('active', swatch.dataset.color === color);
        });
    }

    /**
     * Handle custom color picker change
     */
    function handleCustomColorChange() {
        var color = elements.customColorPicker.value;
        AppState.setBackgroundColor(color);
        
        // Remove active state from preset swatches
        elements.colorSwatches.forEach(function(swatch) {
            swatch.classList.remove('active');
        });
    }

    /**
     * Handle remove background toggle
     */
    function handleRemoveBgToggle() {
        var enabled = elements.removeBgToggle.checked;
        AppState.setRemoveBackground(enabled);

        if (enabled && AppState.hasImage()) {
            var state = AppState.getState();
            
            // Check if we already have a processed image
            if (state.processedImage) {
                return;
            }

            // Start processing - library will be loaded on demand
            AppState.setProcessingBackground(true);
            elements.removeBgHint.textContent = 'Loading AI model (first time may take a minute)...';
            elements.removeBgHint.classList.add('processing');

            BackgroundRemover.removeBackground(state.image, function(progress) {
                var percent = Math.round(progress * 100);
                if (percent < 15) {
                    elements.removeBgHint.textContent = 'Loading library...';
                } else if (percent < 50) {
                    elements.removeBgHint.textContent = 'Downloading AI model... ' + percent + '%';
                } else {
                    elements.removeBgHint.textContent = 'Removing background... ' + percent + '%';
                }
            })
            .then(function(processedImage) {
                AppState.setProcessedImage(processedImage);
                AppState.setProcessingBackground(false);
                showToast('Background removed successfully!', 'success');
            })
            .catch(function(err) {
                console.error('Background removal failed:', err);
                AppState.setProcessingBackground(false);
                AppState.setRemoveBackground(false);
                elements.removeBgToggle.checked = false;
                var errorMsg = err && err.message ? err.message : 'Background removal failed. Please try again.';
                showToast(errorMsg, 'error');
            });
        }
    }

    /**
     * Handle crop style radio button change
     * @param {Event} e - Change event
     */
    function handleCropStyleChange(e) {
        var style = e.target.value;
        AppState.setCropStyle(style);
    }

    /**
     * Handle border radius slider change
     */
    function handleBorderRadiusChange() {
        var radius = parseInt(elements.borderRadiusSlider.value, 10);
        AppState.setBorderRadius(radius);
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
        BackgroundRemover.clearCache();
        showUploadView();
        
        // Reset zoom slider to default
        elements.zoomSlider.value = AppState.getDefaultScale();
        elements.zoomValue.textContent = AppState.getDefaultScale() + '%';
        
        // Reset toggle
        if (elements.removeBgToggle) {
            elements.removeBgToggle.checked = false;
        }

        // Reset color swatches to default (transparent)
        if (elements.colorSwatches) {
            elements.colorSwatches.forEach(function(swatch) {
                swatch.classList.toggle('active', swatch.dataset.color === 'transparent');
            });
        }

        // Reset crop style to circle
        if (elements.cropStyleRadios) {
            elements.cropStyleRadios.forEach(function(radio) {
                radio.checked = radio.value === 'circle';
            });
        }

        // Reset border radius slider
        if (elements.borderRadiusSlider) {
            elements.borderRadiusSlider.value = 20;
        }
        if (elements.radiusValue) {
            elements.radiusValue.textContent = '20%';
        }
        
        // Render empty state
        CanvasRenderer.render(elements.canvasCtx, CANVAS_SIZE, AppState.getState());
        CanvasRenderer.renderPreview(elements.previewCtx, PREVIEW_SIZE, CANVAS_SIZE, AppState.getState());
    }

    /**
     * Initialize button event listeners
     */
    function initButtons() {
        // Guard against missing elements
        if (elements.resetBtn) {
            elements.resetBtn.addEventListener('click', handleReset);
        }
        if (elements.newImageBtn) {
            elements.newImageBtn.addEventListener('click', handleNewImage);
        }
        
        // Initialize remove background toggle
        if (elements.removeBgToggle) {
            elements.removeBgToggle.addEventListener('change', handleRemoveBgToggle);
        }

        // Initialize color swatches
        if (elements.colorSwatches) {
            elements.colorSwatches.forEach(function(swatch) {
                swatch.addEventListener('click', function() {
                    handleColorSelect(swatch.dataset.color);
                });
            });
        }

        // Initialize custom color picker
        if (elements.customColorPicker) {
            elements.customColorPicker.addEventListener('input', handleCustomColorChange);
            elements.customColorPicker.addEventListener('change', handleCustomColorChange);
        }

        // Initialize crop style radio buttons
        if (elements.cropStyleRadios) {
            elements.cropStyleRadios.forEach(function(radio) {
                radio.addEventListener('change', handleCropStyleChange);
            });
        }

        // Initialize border radius slider
        if (elements.borderRadiusSlider) {
            elements.borderRadiusSlider.addEventListener('input', handleBorderRadiusChange);
            elements.borderRadiusSlider.addEventListener('change', handleBorderRadiusChange);
        }
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

        // Check if background removal library is available
        if (BackgroundRemover.isSupported()) {
            console.log('Circle-it initialized with background removal support');
        } else {
            console.warn('Circle-it initialized - background removal library not loaded');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
