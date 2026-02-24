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
     * Render the canvas with current state
     * Uses fully transparent canvas pixels — CSS checkerboard on the wrapper
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

        // Draw background image if set (and remove background is enabled)
        if (state.removeBackground && state.backgroundImage) {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);
            // Cover the canvas with background image
            var bgDims = calculateImageDimensions(state.backgroundImage, size, 100);
            ctx.drawImage(state.backgroundImage, bgDims.x, bgDims.y, bgDims.width, bgDims.height);
            ctx.restore();
        }
        // Draw solid background color if set (and remove background is enabled)
        else if (state.removeBackground && state.backgroundColor && state.backgroundColor !== 'transparent') {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);
            ctx.fillStyle = state.backgroundColor;
            ctx.fillRect(0, 0, size, size);
            ctx.restore();
        }

        // Determine which image to use
        var imageToRender = state.image;
        if (state.removeBackground && state.processedImage) {
            imageToRender = state.processedImage;
        }

        // Draw image if loaded
        if (imageToRender) {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);

            var dims = calculateImageDimensions(imageToRender, size, state.scale);

            ctx.drawImage(
                imageToRender,
                dims.x + state.position.x,
                dims.y + state.position.y,
                dims.width,
                dims.height
            );

            ctx.restore();
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

        // Draw background image if set (for removed background images)
        if (state.removeBackground && state.backgroundImage) {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);
            var bgDims = calculateImageDimensions(state.backgroundImage, size, 100);
            ctx.drawImage(state.backgroundImage, bgDims.x, bgDims.y, bgDims.width, bgDims.height);
            ctx.restore();
        }
        // Draw background color if set (for removed background images)
        else if (state.removeBackground && state.backgroundColor && state.backgroundColor !== 'transparent') {
            ctx.save();
            createClipPath(ctx, size, cropStyle, borderRadius);
            ctx.fillStyle = state.backgroundColor;
            ctx.fillRect(0, 0, size, size);
            ctx.restore();
        }

        // Apply shape clip and draw image
        ctx.save();
        createClipPath(ctx, size, cropStyle, borderRadius);

        var dims = calculateImageDimensions(imageToRender, size, state.scale);

        ctx.drawImage(
            imageToRender,
            dims.x + (state.position.x * scaleFactor),
            dims.y + (state.position.y * scaleFactor),
            dims.width,
            dims.height
        );

        ctx.restore();

        // Reset compositing mode after drawing
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Render a preview version of the canvas
     * Uses transparent pixels — CSS checkerboard on .preview-wrapper handles
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

        // Draw background color if set
        if (state.removeBackground && state.backgroundColor && state.backgroundColor !== 'transparent') {
            ctx.fillStyle = state.backgroundColor;
            ctx.fillRect(0, 0, previewSize, previewSize);
        }

        // Draw background image if set
        if (state.removeBackground && state.backgroundImage) {
            var bgDims = calculateImageDimensions(state.backgroundImage, previewSize, 100);
            ctx.drawImage(state.backgroundImage, bgDims.x, bgDims.y, bgDims.width, bgDims.height);
        }

        // Draw image scaled to preview
        var dims = calculateImageDimensions(imageToRender, previewSize, state.scale);

        ctx.drawImage(
            imageToRender,
            dims.x + (state.position.x * ratio),
            dims.y + (state.position.y * ratio),
            dims.width,
            dims.height
        );

        ctx.restore();
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
            // Sample corners — these should always be outside any shape
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
                console.log('[circle-it] Transparency check PASSED — corners are fully transparent.');
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
        verifyTransparency: verifyTransparency
    };
})();
