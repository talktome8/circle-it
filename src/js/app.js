/**
 * App Module
 * Main application bootstrap and coordination.
 */

(function() {
    'use strict';

    var CANVAS_SIZE = 400;
    var PREVIEW_SIZE = 128;

    var PRESETS = {
        linkedin: { label: 'LinkedIn', size: 1024, shape: 'circle', scale: 116, faceRatio: 0.48, targetY: 0.47 },
        instagram: { label: 'Instagram', size: 1080, shape: 'circle', scale: 112, faceRatio: 0.52, targetY: 0.48 },
        discord: { label: 'Discord', size: 512, shape: 'circle', scale: 118, faceRatio: 0.5, targetY: 0.47 },
        whatsapp: { label: 'WhatsApp', size: 640, shape: 'circle', scale: 114, faceRatio: 0.5, targetY: 0.48 },
        tiktok: { label: 'TikTok', size: 1080, shape: 'circle', scale: 120, faceRatio: 0.46, targetY: 0.46 },
        youtube: { label: 'YouTube', size: 800, shape: 'circle', scale: 112, faceRatio: 0.5, targetY: 0.48 },
        gaming: { label: 'Gaming', size: 1024, shape: 'rounded', scale: 122, faceRatio: 0.44, targetY: 0.46 }
    };

    var elements = {};
    var lastDetectedFace = null;

    function initElements() {
        elements.uploadSection = document.getElementById('uploadSection');
        elements.editorSection = document.getElementById('editorSection');
        elements.dropzone = document.getElementById('dropzone');
        elements.fileInput = document.getElementById('fileInput');
        elements.canvas = document.getElementById('canvas');
        elements.canvasCtx = elements.canvas.getContext('2d', { alpha: true });
        elements.beforeCanvas = document.getElementById('beforeCanvas');
        elements.beforeCtx = elements.beforeCanvas.getContext('2d', { alpha: true });
        elements.previewCanvas = document.getElementById('previewCanvas');
        elements.previewCtx = elements.previewCanvas.getContext('2d', { alpha: true });
        elements.zoomSlider = document.getElementById('zoomSlider');
        elements.zoomValue = document.getElementById('zoomValue');
        elements.resetBtn = document.getElementById('resetBtn');
        elements.newImageBtn = document.getElementById('homeBtn');
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
        elements.beforeWrapper = document.querySelector('.before-wrapper');
        elements.presetButtons = document.querySelectorAll('.preset-option');
        elements.presetSize = document.getElementById('presetSize');
        elements.backgroundStyleButtons = document.querySelectorAll('.segment-option[data-bg-style]');
        elements.lookButtons = document.querySelectorAll('.look-option');
        elements.lightStrengthSlider = document.getElementById('lightStrengthSlider');
        elements.lightStrengthValue = document.getElementById('lightStrengthValue');
        elements.formatSelect = document.getElementById('formatSelect');
        elements.qualitySelect = document.getElementById('qualitySelect');
        elements.hdExportToggle = document.getElementById('hdExportToggle');
        elements.exportSummary = document.getElementById('exportSummary');
        elements.previewInfo = document.getElementById('previewInfo');
    }

    function showToast(message, type) {
        var toast = elements.toast;
        toast.classList.remove('show', 'success', 'error');
        toast.textContent = message;
        if (type === 'success') toast.classList.add('success');
        if (type === 'error') toast.classList.add('error');
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(function() {
            toast.classList.remove('show');
        }, 2600);
    }

    function showUploadView() {
        elements.uploadSection.hidden = false;
        elements.editorSection.hidden = true;
    }

    function showEditorView() {
        elements.uploadSection.hidden = true;
        elements.editorSection.hidden = false;
    }

    function getPreset(key) {
        return PRESETS[key] || PRESETS.linkedin;
    }

    function clipPreviewShape(ctx, size, cropStyle, borderRadius) {
        cropStyle = cropStyle || 'circle';
        borderRadius = borderRadius || 20;
        ctx.beginPath();

        if (cropStyle === 'circle') {
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        } else if (cropStyle === 'square') {
            ctx.rect(0, 0, size, size);
        } else {
            var radius = Math.min((borderRadius / 100) * (size / 2), size / 2);
            ctx.moveTo(radius, 0);
            ctx.lineTo(size - radius, 0);
            ctx.quadraticCurveTo(size, 0, size, radius);
            ctx.lineTo(size, size - radius);
            ctx.quadraticCurveTo(size, size, size - radius, size);
            ctx.lineTo(radius, size);
            ctx.quadraticCurveTo(0, size, 0, size - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
        }

        ctx.closePath();
        ctx.clip();
    }

    function renderBeforePreview(state) {
        var ctx = elements.beforeCtx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

        var image = state && state.image;
        if (!image) return;

        var ratio = PREVIEW_SIZE / CANVAS_SIZE;
        var dims = CanvasRenderer.calculateImageDimensions(image, PREVIEW_SIZE, state.scale);
        var position = CanvasRenderer.constrainPosition(image, CANVAS_SIZE, state.scale, state.position);

        ctx.save();
        clipPreviewShape(ctx, PREVIEW_SIZE, state.cropStyle, state.borderRadius);
        ctx.drawImage(
            image,
            dims.x + (position.x * ratio),
            dims.y + (position.y * ratio),
            dims.width,
            dims.height
        );
        ctx.restore();
    }

    function sampleImageColor(image) {
        try {
            var canvas = document.createElement('canvas');
            var size = 24;
            canvas.width = size;
            canvas.height = size;
            var ctx = canvas.getContext('2d', { alpha: false });
            ctx.drawImage(image, 0, 0, size, size);
            var data = ctx.getImageData(0, 0, size, size).data;
            var r = 0;
            var g = 0;
            var b = 0;
            var count = 0;

            for (var i = 0; i < data.length; i += 16) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }

            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            return '#' + [r, g, b].map(function(value) {
                return value.toString(16).padStart(2, '0');
            }).join('');
        } catch (e) {
            return '#eef2ff';
        }
    }

    function applySmartPosition(faceBox) {
        var state = AppState.getState();
        var image = state.image;
        if (!image) return;

        var preset = getPreset(state.preset);
        var scale = preset.scale;
        var position = { x: 0, y: 0 };

        if (faceBox) {
            var desiredFaceHeight = CANVAS_SIZE * preset.faceRatio;
            var baseDims = CanvasRenderer.calculateImageDimensions(image, CANVAS_SIZE, 100);
            scale = Math.max(100, Math.min(300, Math.round((desiredFaceHeight / faceBox.height) * 100)));
            var dims = CanvasRenderer.calculateImageDimensions(image, CANVAS_SIZE, scale);
            var sourceScale = dims.width / image.width;
            var faceCenterX = (faceBox.x + faceBox.width / 2) * sourceScale;
            var faceCenterY = (faceBox.y + faceBox.height / 2) * sourceScale;
            position.x = CANVAS_SIZE / 2 - dims.x - faceCenterX;
            position.y = (CANVAS_SIZE * preset.targetY) - dims.y - faceCenterY;
        }

        AppState.setScale(scale);
        var constrained = CanvasRenderer.constrainPosition(image, CANVAS_SIZE, scale, position);
        AppState.setPosition(constrained.x, constrained.y);
    }

    function detectFace(image) {
        if (!('FaceDetector' in window)) {
            applySmartPosition(null);
            return;
        }

        try {
            var detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
            detector.detect(image)
                .then(function(faces) {
                    if (faces && faces.length > 0 && faces[0].boundingBox) {
                        lastDetectedFace = faces[0].boundingBox;
                        applySmartPosition(lastDetectedFace);
                        showToast('Smart positioning applied', 'success');
                    } else {
                        lastDetectedFace = null;
                        applySmartPosition(null);
                    }
                })
                .catch(function() {
                    lastDetectedFace = null;
                    applySmartPosition(null);
                });
        } catch (e) {
            lastDetectedFace = null;
            applySmartPosition(null);
        }
    }

    function onImageLoaded(image, name) {
        AppState.setImage(image, name);
        AppState.setAutoBackgroundColor(sampleImageColor(image));
        showEditorView();
        renderBeforePreview(AppState.getState());
        detectFace(image);
        showToast('Image loaded', 'success');
    }

    function onImageError(message) {
        showToast(message, 'error');
    }

    function updateWrapperShapes(cropStyle, borderRadius) {
        [elements.canvasWrapper, elements.previewWrapper].forEach(function(wrapper) {
            if (!wrapper) return;
            wrapper.dataset.shape = cropStyle;
            wrapper.style.borderRadius = cropStyle === 'rounded' ? (borderRadius / 2) + '%' : '';
        });

        if (elements.previewCanvas) {
            elements.previewCanvas.dataset.shape = cropStyle;
            elements.previewCanvas.style.borderRadius = cropStyle === 'rounded' ? (borderRadius / 2) + '%' : '';
        }
    }

    function updateActiveControls(state) {
        elements.presetButtons.forEach(function(button) {
            button.classList.toggle('active', button.dataset.preset === state.preset);
        });

        elements.backgroundStyleButtons.forEach(function(button) {
            button.classList.toggle('active', button.dataset.bgStyle === state.backgroundStyle);
        });

        elements.colorSwatches.forEach(function(swatch) {
            swatch.classList.toggle('active', swatch.dataset.color === state.backgroundColor);
        });

        elements.cropStyleRadios.forEach(function(radio) {
            radio.checked = radio.value === state.cropStyle;
        });

        elements.lookButtons.forEach(function(button) {
            button.classList.toggle('active', button.dataset.look === state.studioLook);
        });
    }

    function onStateChange(state) {
        CanvasRenderer.render(elements.canvasCtx, CANVAS_SIZE, state);
        CanvasRenderer.renderPreview(elements.previewCtx, PREVIEW_SIZE, CANVAS_SIZE, state);
        renderBeforePreview(state);

        Interactions.updateSliderValue(elements.zoomSlider, elements.zoomValue, state.scale);
        Downloader.updateButtonState(elements.downloadBtn, state.image !== null && !state.isProcessingBackground);

        elements.canvas.style.cursor = state.image ? 'grab' : 'default';
        elements.removeBgToggle.disabled = state.isProcessingBackground;
        elements.removeBgToggle.checked = state.removeBackground;
        elements.bgColorOptions.hidden = true;

        if (state.isProcessingBackground) {
            elements.removeBgHint.textContent = 'Processing locally...';
            elements.removeBgHint.classList.add('processing');
        } else if (state.removeBackground && state.processedImage) {
            elements.removeBgHint.textContent = 'Cutout ready';
            elements.removeBgHint.classList.remove('processing');
        } else {
            elements.removeBgHint.textContent = 'Optional on-device background removal';
            elements.removeBgHint.classList.remove('processing');
        }

        elements.borderRadiusControl.hidden = state.cropStyle !== 'rounded';
        elements.borderRadiusSlider.value = state.borderRadius;
        elements.radiusValue.textContent = state.borderRadius + '%';
        elements.lightStrengthSlider.value = state.lightStrength;
        elements.lightStrengthSlider.setAttribute('aria-valuenow', state.lightStrength);
        elements.lightStrengthValue.textContent = state.lightStrength + '%';
        elements.formatSelect.value = state.exportFormat;
        elements.qualitySelect.value = state.exportQuality;
        elements.hdExportToggle.checked = state.hdExport;

        var size = Downloader.getPresetSize(state.preset, state.hdExport);
        elements.presetSize.textContent = size + 'px';
        elements.exportSummary.textContent = state.exportFormat.toUpperCase() + ' ' + state.exportQuality;
        elements.previewInfo.textContent = getPreset(state.preset).label + ' export - ' + size + 'x' + size;

        updateWrapperShapes(state.cropStyle, state.borderRadius);
        updateActiveControls(state);
    }

    function handlePresetSelect(presetKey) {
        var preset = getPreset(presetKey);
        AppState.setPreset(presetKey);
        AppState.setCropStyle(preset.shape);
        if (preset.shape === 'rounded') {
            AppState.setBorderRadius(18);
        }
        applySmartPosition(lastDetectedFace);
        showToast(preset.label + ' preset applied', 'success');
    }

    function handleColorSelect(color) {
        AppState.setBackgroundColor(color);
    }

    function handleCustomColorChange() {
        AppState.setBackgroundColor(elements.customColorPicker.value);
    }

    function handleBackgroundStyle(style) {
        AppState.setBackgroundStyle(style);
    }

    function handleRemoveBgToggle() {
        var enabled = elements.removeBgToggle.checked;
        AppState.setRemoveBackground(enabled);

        if (enabled && AppState.hasImage()) {
            var state = AppState.getState();
            if (state.processedImage) return;

            AppState.setProcessingBackground(true);
            BackgroundRemover.removeBackground(state.image, function(progress) {
                elements.removeBgHint.textContent = 'Processing locally... ' + Math.round(progress * 100) + '%';
            })
            .then(function(processedImage) {
                AppState.setProcessedImage(processedImage);
                AppState.setProcessingBackground(false);
                showToast('Transparent cutout ready', 'success');
            })
            .catch(function(err) {
                console.error('Background removal failed:', err);
                AppState.setProcessingBackground(false);
                AppState.setRemoveBackground(false);
                showToast('Background removal failed', 'error');
            });
        }
    }

    function handleReset() {
        applySmartPosition(lastDetectedFace);
        showToast('Smart position restored', 'success');
    }

    function handleNewImage() {
        lastDetectedFace = null;
        AppState.clear();
        BackgroundRemover.clearCache();
        showUploadView();
    }

    function initButtons() {
        elements.resetBtn.addEventListener('click', handleReset);
        elements.newImageBtn.addEventListener('click', handleNewImage);
        elements.removeBgToggle.addEventListener('change', handleRemoveBgToggle);

        elements.presetButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                handlePresetSelect(button.dataset.preset);
            });
        });

        elements.backgroundStyleButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                handleBackgroundStyle(button.dataset.bgStyle);
            });
        });

        elements.lookButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                AppState.setStudioLook(button.dataset.look);
                showToast(button.textContent + ' light applied', 'success');
            });
        });

        elements.lightStrengthSlider.addEventListener('input', function() {
            AppState.setLightStrength(parseInt(elements.lightStrengthSlider.value, 10));
        });

        elements.colorSwatches.forEach(function(swatch) {
            swatch.addEventListener('click', function() {
                handleColorSelect(swatch.dataset.color);
            });
        });

        elements.customColorPicker.addEventListener('input', handleCustomColorChange);
        elements.customColorPicker.addEventListener('change', handleCustomColorChange);

        elements.cropStyleRadios.forEach(function(radio) {
            radio.addEventListener('change', function(event) {
                AppState.setCropStyle(event.target.value);
            });
        });

        elements.borderRadiusSlider.addEventListener('input', function() {
            AppState.setBorderRadius(parseInt(elements.borderRadiusSlider.value, 10));
        });

        elements.formatSelect.addEventListener('change', function() {
            AppState.setExportFormat(elements.formatSelect.value);
        });

        elements.qualitySelect.addEventListener('change', function() {
            AppState.setExportQuality(elements.qualitySelect.value);
        });

        elements.hdExportToggle.addEventListener('change', function() {
            AppState.setHdExport(elements.hdExportToggle.checked);
        });
    }

    function init() {
        initElements();

        ImageLoader.init(elements.dropzone, elements.fileInput, onImageLoaded, onImageError);
        ClipboardHandler.init(function(blob, name) {
            ImageLoader.loadImageFromBlob(blob, name);
        }, function(message) {
            showToast(message, 'success');
        }, function(message) {
            showToast(message, 'error');
        });

        Interactions.init(elements.canvas, elements.zoomSlider, elements.zoomValue, {
            getState: AppState.getState,
            setPosition: AppState.setPosition,
            setScale: AppState.setScale
        });

        Downloader.init(elements.downloadBtn, AppState.getState, CanvasRenderer.renderForExport, function(size) {
            showToast('Exported ' + size + 'px avatar', 'success');
        }, function(err) {
            showToast(err || 'Download failed', 'error');
        });

        initButtons();
        AppState.subscribe(onStateChange);
        onStateChange(AppState.getState());
        showUploadView();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
