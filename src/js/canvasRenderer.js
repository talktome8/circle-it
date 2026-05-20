/**
 * Canvas Renderer Module
 * Handles all canvas drawing operations
 * Contains no DOM access - receives canvas context and state as parameters
 */

var CanvasRenderer = (function() {
    'use strict';

    /**
     * Checkerboard pattern colors for transparency visualization
     */
    var CHECKER_LIGHT = '#ffffff';
    var CHECKER_DARK = '#e5e5e5';
    var CHECKER_SIZE = 10;

    /**
     * Draw a checkerboard pattern to indicate transparency
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     */
    function drawCheckerboard(ctx, size) {
        var cols = Math.ceil(size / CHECKER_SIZE);
        var rows = Math.ceil(size / CHECKER_SIZE);

        for (var row = 0; row < rows; row++) {
            for (var col = 0; col < cols; col++) {
                var isLight = (row + col) % 2 === 0;
                ctx.fillStyle = isLight ? CHECKER_LIGHT : CHECKER_DARK;
                ctx.fillRect(
                    col * CHECKER_SIZE,
                    row * CHECKER_SIZE,
                    CHECKER_SIZE,
                    CHECKER_SIZE
                );
            }
        }
    }

    /**
     * Create a clipping path based on crop style
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {string} cropStyle - 'circle', 'square', or 'rounded'
     * @param {number} borderRadius - Border radius percentage for rounded style
     */
    function createClipPath(ctx, size, cropStyle, borderRadius) {
        cropStyle = cropStyle || 'circle';
        borderRadius = borderRadius || 20;

        ctx.beginPath();

        if (cropStyle === 'circle') {
            var centerX = size / 2;
            var centerY = size / 2;
            var radius = size / 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else if (cropStyle === 'square') {
            ctx.rect(0, 0, size, size);
        } else if (cropStyle === 'rounded') {
            var r = (borderRadius / 100) * (size / 2);
            r = Math.min(r, size / 2);
            ctx.moveTo(r, 0);
            ctx.lineTo(size - r, 0);
            ctx.quadraticCurveTo(size, 0, size, r);
            ctx.lineTo(size, size - r);
            ctx.quadraticCurveTo(size, size, size - r, size);
            ctx.lineTo(r, size);
            ctx.quadraticCurveTo(0, size, 0, size - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
        }

        ctx.closePath();
        ctx.clip();
    }

    /**
     * Create a circular clipping path (legacy support)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     */
    function createCircularClip(ctx, size) {
        createClipPath(ctx, size, 'circle', 0);
    }

    /**
     * Calculate image dimensions to cover the canvas while preserving aspect ratio
     * @param {HTMLImageElement} image - The image to calculate dimensions for
     * @param {number} canvasSize - The canvas size
     * @param {number} scalePercent - The zoom scale percentage (50-300)
     * @returns {Object} Object with width, height, x, y properties
     */
    function calculateImageDimensions(image, canvasSize, scalePercent) {
        var imageAspect = image.width / image.height;
        var scale = scalePercent / 100;
        var drawWidth, drawHeight;

        // Cover the canvas (like CSS background-size: cover)
        if (imageAspect > 1) {
            // Landscape image
            drawHeight = canvasSize * scale;
            drawWidth = drawHeight * imageAspect;
        } else {
            // Portrait or square image
            drawWidth = canvasSize * scale;
            drawHeight = drawWidth / imageAspect;
        }

        // Center the image
        var drawX = (canvasSize - drawWidth) / 2;
        var drawY = (canvasSize - drawHeight) / 2;

        return {
            width: drawWidth,
            height: drawHeight,
            x: drawX,
            y: drawY
        };
    }

    /**
     * Calculate dimensions to fit an image inside a square while preserving aspect ratio.
     * @param {HTMLImageElement} image - The image to calculate dimensions for
     * @param {number} canvasSize - Canvas size
     * @returns {Object} Object with width, height, x, y properties
     */
    function calculateContainDimensions(image, canvasSize) {
        var imageAspect = image.width / image.height;
        var drawWidth;
        var drawHeight;

        if (imageAspect > 1) {
            drawWidth = canvasSize;
            drawHeight = drawWidth / imageAspect;
        } else {
            drawHeight = canvasSize;
            drawWidth = drawHeight * imageAspect;
        }

        return {
            width: drawWidth,
            height: drawHeight,
            x: (canvasSize - drawWidth) / 2,
            y: (canvasSize - drawHeight) / 2
        };
    }

    /**
     * Clamp image position so the crop area is always fully covered.
     * @param {HTMLImageElement} image - The rendered image
     * @param {number} canvasSize - The source canvas size
     * @param {number} scalePercent - The zoom scale percentage
     * @param {Object} position - Current x/y offsets
     * @returns {Object} Clamped x/y offsets
     */
    function constrainPosition(image, canvasSize, scalePercent, position) {
        if (!image) {
            return { x: 0, y: 0 };
        }

        var dims = calculateImageDimensions(image, canvasSize, scalePercent);
        var x = position && typeof position.x === 'number' ? position.x : 0;
        var y = position && typeof position.y === 'number' ? position.y : 0;

        if (dims.width > canvasSize) {
            var minX = canvasSize - dims.width - dims.x;
            var maxX = -dims.x;
            x = Math.max(minX, Math.min(maxX, x));
        } else {
            x = 0;
        }

        if (dims.height > canvasSize) {
            var minY = canvasSize - dims.height - dims.y;
            var maxY = -dims.y;
            y = Math.max(minY, Math.min(maxY, y));
        } else {
            y = 0;
        }

        return { x: x, y: y };
    }

    /**
     * Build a subtle lighter tint from a hex color.
     * @param {string} color - Hex color
     * @returns {string} RGB color string
     */
    function getTint(color) {
        var hex = (color || '#eef2ff').replace('#', '');
        if (hex.length !== 6) {
            return '#ffffff';
        }

        var r = parseInt(hex.substring(0, 2), 16);
        var g = parseInt(hex.substring(2, 4), 16);
        var b = parseInt(hex.substring(4, 6), 16);

        r = Math.round(r + (255 - r) * 0.72);
        g = Math.round(g + (255 - g) * 0.72);
        b = Math.round(b + (255 - b) * 0.72);

        return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }

    /**
     * Draw the selected lightweight background treatment.
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {Object} state - Current application state
     * @param {string} cropStyle - Active crop style
     * @param {number} borderRadius - Rounded style radius
     * @param {HTMLImageElement} sourceImage - Source image
     * @param {boolean} forceOpaque - Whether export requires an opaque background
     */
    function drawBackground(ctx, size, state, cropStyle, borderRadius, sourceImage, forceOpaque) {
        var style = state.backgroundStyle || 'transparent';
        var color = state.backgroundColor || 'transparent';
        var autoColor = state.autoBackgroundColor || '#eef2ff';

        if (forceOpaque && style === 'transparent') {
            style = 'solid';
            color = '#ffffff';
        }

        if (style === 'transparent' && color === 'transparent' && !state.backgroundImage) {
            return;
        }

        ctx.save();
        createClipPath(ctx, size, cropStyle, borderRadius);

        if (style === 'blur' && sourceImage) {
            var blurDims = calculateImageDimensions(sourceImage, size, 115);
            ctx.filter = 'blur(' + Math.max(10, Math.round(size * 0.04)) + 'px)';
            ctx.drawImage(sourceImage, blurDims.x, blurDims.y, blurDims.width, blurDims.height);
            ctx.filter = 'none';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.fillRect(0, 0, size, size);
        } else if (style === 'gradient') {
            var gradient = ctx.createLinearGradient(0, 0, size, size);
            gradient.addColorStop(0, getTint(autoColor));
            gradient.addColorStop(0.55, autoColor);
            gradient.addColorStop(1, '#111827');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, size, size);
        } else if (style === 'auto') {
            ctx.fillStyle = autoColor;
            ctx.fillRect(0, 0, size, size);
        } else if (state.backgroundImage) {
            var bgDims = calculateImageDimensions(state.backgroundImage, size, 100);
            ctx.drawImage(state.backgroundImage, bgDims.x, bgDims.y, bgDims.width, bgDims.height);
        } else if (color && color !== 'transparent') {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, size, size);
        }

        ctx.restore();
    }

    /**
     * Interpolate between a neutral value and a target value by strength.
     * @param {number} neutral - Neutral value
     * @param {number} target - Target value
     * @param {number} amount - Strength from 0 to 1
     * @returns {number} Interpolated value
     */
    function mix(neutral, target, amount) {
        return neutral + ((target - neutral) * amount);
    }

    /**
     * Build a canvas filter string for the selected studio lighting look.
     * @param {Object} state - Current application state
     * @returns {string} Canvas filter string
     */
    function getImageFilter(state) {
        var look = state.studioLook || 'studio';
        var amount = Math.max(0, Math.min(1, (state.lightStrength || 0) / 100));
        var settings = {
            brightness: 1,
            contrast: 1,
            saturate: 1,
            sepia: 0,
            grayscale: 0
        };

        if (look === 'studio') {
            settings.brightness = mix(1, 1.08, amount);
            settings.contrast = mix(1, 1.09, amount);
            settings.saturate = mix(1, 1.06, amount);
        } else if (look === 'bright') {
            settings.brightness = mix(1, 1.16, amount);
            settings.contrast = mix(1, 1.04, amount);
            settings.saturate = mix(1, 1.04, amount);
        } else if (look === 'warm') {
            settings.brightness = mix(1, 1.08, amount);
            settings.contrast = mix(1, 1.06, amount);
            settings.saturate = mix(1, 1.12, amount);
            settings.sepia = mix(0, 0.12, amount);
        } else if (look === 'clean') {
            settings.brightness = mix(1, 1.1, amount);
            settings.contrast = mix(1, 0.98, amount);
            settings.saturate = mix(1, 0.96, amount);
        } else if (look === 'dramatic') {
            settings.brightness = mix(1, 0.96, amount);
            settings.contrast = mix(1, 1.22, amount);
            settings.saturate = mix(1, 1.08, amount);
        } else if (look === 'natural') {
            settings.brightness = mix(1, 1.02, amount);
            settings.contrast = mix(1, 1.02, amount);
            settings.saturate = mix(1, 1.01, amount);
        }

        return 'brightness(' + settings.brightness.toFixed(3) + ') ' +
            'contrast(' + settings.contrast.toFixed(3) + ') ' +
            'saturate(' + settings.saturate.toFixed(3) + ') ' +
            'sepia(' + settings.sepia.toFixed(3) + ') ' +
            'grayscale(' + settings.grayscale.toFixed(3) + ')';
    }

    /**
     * Draw subtle light shaping over the image.
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {string} cropStyle - Crop style
     * @param {number} borderRadius - Border radius
     * @param {Object} state - Current app state
     */
    function drawStudioOverlay(ctx, size, cropStyle, borderRadius, state) {
        var look = state.studioLook || 'studio';
        var amount = Math.max(0, Math.min(1, (state.lightStrength || 0) / 100));

        if (amount <= 0 || look === 'natural') {
            return;
        }

        ctx.save();
        createClipPath(ctx, size, cropStyle, borderRadius);

        if (look === 'studio' || look === 'bright' || look === 'clean' || look === 'warm') {
            var light = ctx.createRadialGradient(size * 0.38, size * 0.23, 0, size * 0.38, size * 0.23, size * 0.72);
            light.addColorStop(0, look === 'warm' ? 'rgba(255, 237, 213, 0.46)' : 'rgba(255, 255, 255, 0.42)');
            light.addColorStop(0.48, look === 'warm' ? 'rgba(255, 237, 213, 0.16)' : 'rgba(255, 255, 255, 0.12)');
            light.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.globalAlpha = amount;
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = light;
            ctx.fillRect(0, 0, size, size);
        }

        if (look === 'studio' || look === 'dramatic' || look === 'clean') {
            var shade = ctx.createRadialGradient(size / 2, size * 0.42, size * 0.26, size / 2, size / 2, size * 0.68);
            shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
            shade.addColorStop(1, look === 'dramatic' ? 'rgba(15, 23, 42, 0.32)' : 'rgba(15, 23, 42, 0.14)');
            ctx.globalAlpha = amount;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = shade;
            ctx.fillRect(0, 0, size, size);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Render the canvas with current state
     * Uses fully transparent canvas pixels - CSS checkerboard on the wrapper
     * element shows through to indicate transparency.
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {Object} state - Current application state
     */
    function render(ctx, size, state) {
        var cropStyle = state.cropStyle || 'circle';
        var borderRadius = state.borderRadius || 20;

        // Reset transform and clear canvas to full transparency
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, size, size);
        ctx.globalCompositeOperation = 'source-over';

        // NOTE: No checkerboard is drawn onto the canvas.
        // The CSS checkerboard on .canvas-wrapper shows through transparent pixels.

        // Determine which image to use
        var imageToRender = state.image;
        if (state.removeBackground && state.processedImage) {
            imageToRender = state.processedImage;
        }

        drawBackground(ctx, size, state, cropStyle, borderRadius, state.image, false);

        // Draw image if loaded
        if (imageToRender) {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);

            var dims = calculateImageDimensions(imageToRender, size, state.scale);
            var position = constrainPosition(imageToRender, size, state.scale, state.position);

            ctx.filter = getImageFilter(state);
            ctx.drawImage(
                imageToRender,
                dims.x + position.x,
                dims.y + position.y,
                dims.width,
                dims.height
            );
            ctx.filter = 'none';

            ctx.restore();
            drawStudioOverlay(ctx, size, cropStyle, borderRadius, state);
        }

        // Draw shape border
        drawShapeBorder(ctx, size, cropStyle, borderRadius);
    }

    /**
     * Draw a subtle border around the shape area
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {string} cropStyle - 'circle', 'square', or 'rounded'
     * @param {number} borderRadius - Border radius percentage for rounded style
     */
    function drawShapeBorder(ctx, size, cropStyle, borderRadius) {
        cropStyle = cropStyle || 'circle';
        borderRadius = borderRadius || 20;

        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;

        if (cropStyle === 'circle') {
            var centerX = size / 2;
            var centerY = size / 2;
            var radius = size / 2 - 1;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else if (cropStyle === 'square') {
            ctx.rect(1, 1, size - 2, size - 2);
        } else if (cropStyle === 'rounded') {
            var r = (borderRadius / 100) * (size / 2);
            r = Math.min(r, size / 2);
            var offset = 1;
            var s = size - 2;
            ctx.moveTo(offset + r, offset);
            ctx.lineTo(offset + s - r, offset);
            ctx.quadraticCurveTo(offset + s, offset, offset + s, offset + r);
            ctx.lineTo(offset + s, offset + s - r);
            ctx.quadraticCurveTo(offset + s, offset + s, offset + s - r, offset + s);
            ctx.lineTo(offset + r, offset + s);
            ctx.quadraticCurveTo(offset, offset + s, offset, offset + s - r);
            ctx.lineTo(offset, offset + r);
            ctx.quadraticCurveTo(offset, offset, offset + r, offset);
        }

        ctx.closePath();
        ctx.stroke();
    }

    /**
     * Draw a subtle border around the circular area (legacy support)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     */
    function drawCircularBorder(ctx, size) {
        drawShapeBorder(ctx, size, 'circle', 0);
    }

    /**
     * Render the final output for download (no border, no checkerboard, pure shaped image)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {Object} state - Current application state
     * @param {number} scaleFactor - Scale factor for position adjustment
     */
    function renderForExport(ctx, size, state, scaleFactor) {
        scaleFactor = scaleFactor || 1;
        var cropStyle = state.cropStyle || 'circle';
        var borderRadius = state.borderRadius || 20;

        // Reset any accumulated transforms and compositing modes
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas with full transparency (RGBA with 0 alpha)
        ctx.clearRect(0, 0, size, size);

        // Determine which image to use
        var imageToRender = state.image;
        if (state.removeBackground && state.processedImage) {
            imageToRender = state.processedImage;
        }

        if (!imageToRender) {
            return;
        }

        drawBackground(ctx, size, state, cropStyle, borderRadius, state.image, state.exportFormat === 'jpg');

        // Apply shape clip and draw image
        ctx.save();
        createClipPath(ctx, size, cropStyle, borderRadius);

        var dims = calculateImageDimensions(imageToRender, size, state.scale);
        var position = constrainPosition(imageToRender, size / scaleFactor, state.scale, state.position);

        ctx.filter = getImageFilter(state);
        ctx.drawImage(
            imageToRender,
            dims.x + (position.x * scaleFactor),
            dims.y + (position.y * scaleFactor),
            dims.width,
            dims.height
        );
        ctx.filter = 'none';

        ctx.restore();
        drawStudioOverlay(ctx, size, cropStyle, borderRadius, state);

        // Reset compositing mode after drawing
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Render a preview version of the canvas
     * Uses transparent pixels - CSS checkerboard on .preview-wrapper handles
     * transparency visualisation.
     * @param {CanvasRenderingContext2D} ctx - Preview canvas context
     * @param {number} previewSize - Preview canvas size
     * @param {number} canvasSize - Main canvas size
     * @param {Object} state - Current application state
     */
    function renderPreview(ctx, previewSize, canvasSize, state) {
        var cropStyle = state.cropStyle || 'circle';
        var borderRadius = state.borderRadius || 20;

        // Reset transform and clear to full transparency
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, previewSize, previewSize);
        ctx.globalCompositeOperation = 'source-over';

        // Determine which image to use
        var imageToRender = state.image;
        if (state.removeBackground && state.processedImage) {
            imageToRender = state.processedImage;
        }

        if (!imageToRender) {
            // Draw empty placeholder
            ctx.save();
            createClipPath(ctx, previewSize, cropStyle, borderRadius);
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, previewSize, previewSize);
            ctx.restore();
            return;
        }

        // Calculate scale ratio
        var ratio = previewSize / canvasSize;

        // Apply shape clip
        ctx.save();
        createClipPath(ctx, previewSize, cropStyle, borderRadius);

        ctx.restore();

        drawBackground(ctx, previewSize, state, cropStyle, borderRadius, state.image, state.exportFormat === 'jpg');

        ctx.save();
        createClipPath(ctx, previewSize, cropStyle, borderRadius);

        // Draw image scaled to preview
        var dims = calculateImageDimensions(imageToRender, previewSize, state.scale);
        var position = constrainPosition(imageToRender, canvasSize, state.scale, state.position);

        ctx.filter = getImageFilter(state);
        ctx.drawImage(
            imageToRender,
            dims.x + (position.x * ratio),
            dims.y + (position.y * ratio),
            dims.width,
            dims.height
        );
        ctx.filter = 'none';

        ctx.restore();
        drawStudioOverlay(ctx, previewSize, cropStyle, borderRadius, state);
    }

    /**
     * DEV-MODE: Verify that exported canvas has true transparency outside the shape.
     * Samples a few corner pixels and asserts alpha == 0.
     * Logs warnings to console; never throws in production.
     * @param {CanvasRenderingContext2D} ctx - The export canvas context
     * @param {number} size - Canvas size
     * @param {string} cropStyle - The crop style used
     */
    function verifyTransparency(ctx, size, cropStyle) {
        try {
            // Sample corners - these should always be outside any shape
            var samplePoints = [
                { x: 0, y: 0 },
                { x: size - 1, y: 0 },
                { x: 0, y: size - 1 },
                { x: size - 1, y: size - 1 }
            ];

            // For square crop the corners are INSIDE the shape, skip
            if (cropStyle === 'square') {
                return true;
            }

            var allTransparent = true;
            for (var i = 0; i < samplePoints.length; i++) {
                var p = samplePoints[i];
                var pixel = ctx.getImageData(p.x, p.y, 1, 1).data;
                if (pixel[3] !== 0) {
                    console.warn(
                        '[circle-it] Transparency check FAILED at (' + p.x + ',' + p.y + '): ' +
                        'alpha=' + pixel[3] + ' (expected 0). RGBA=[' + pixel.join(',') + ']'
                    );
                    allTransparent = false;
                }
            }

            if (allTransparent) {
                console.log('[circle-it] Transparency check PASSED - corners are fully transparent.');
            }
            return allTransparent;
        } catch (e) {
            // getImageData can throw on tainted canvases; silently ignore
            console.warn('[circle-it] Transparency check skipped:', e.message);
            return true;
        }
    }

    // Public API
    return {
        render: render,
        renderForExport: renderForExport,
        renderPreview: renderPreview,
        calculateImageDimensions: calculateImageDimensions,
        calculateContainDimensions: calculateContainDimensions,
        constrainPosition: constrainPosition,
        getImageFilter: getImageFilter,
        verifyTransparency: verifyTransparency
    };
})();
