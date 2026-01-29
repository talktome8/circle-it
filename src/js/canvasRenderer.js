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
     * Create a circular clipping path
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     */
    function createCircularClip(ctx, size) {
        var centerX = size / 2;
        var centerY = size / 2;
        var radius = size / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
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
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {Object} state - Current application state
     */
    function render(ctx, size, state) {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw checkerboard background
        ctx.save();
        createCircularClip(ctx, size);
        drawCheckerboard(ctx, size);
        ctx.restore();

        // Draw image if loaded
        if (state.image) {
            ctx.save();
            createCircularClip(ctx, size);

            var dims = calculateImageDimensions(state.image, size, state.scale);

            ctx.drawImage(
                state.image,
                dims.x + state.position.x,
                dims.y + state.position.y,
                dims.width,
                dims.height
            );

            ctx.restore();
        }

        // Draw circular border
        drawCircularBorder(ctx, size);
    }

    /**
     * Draw a subtle border around the circular area
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     */
    function drawCircularBorder(ctx, size) {
        var centerX = size / 2;
        var centerY = size / 2;
        var radius = size / 2 - 1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Render the final output for download (no border, pure circular image)
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} size - Canvas size
     * @param {Object} state - Current application state
     * @param {number} scaleFactor - Scale factor for position adjustment
     */
    function renderForExport(ctx, size, state, scaleFactor) {
        scaleFactor = scaleFactor || 1;
        
        // Clear canvas with transparency
        ctx.clearRect(0, 0, size, size);

        if (!state.image) {
            return;
        }

        // Apply circular clip and draw image
        ctx.save();
        createCircularClip(ctx, size);

        var dims = calculateImageDimensions(state.image, size, state.scale);

        ctx.drawImage(
            state.image,
            dims.x + (state.position.x * scaleFactor),
            dims.y + (state.position.y * scaleFactor),
            dims.width,
            dims.height
        );

        ctx.restore();
    }

    /**
     * Render a preview version of the canvas
     * @param {CanvasRenderingContext2D} ctx - Preview canvas context
     * @param {number} previewSize - Preview canvas size
     * @param {number} canvasSize - Main canvas size
     * @param {Object} state - Current application state
     */
    function renderPreview(ctx, previewSize, canvasSize, state) {
        // Clear canvas
        ctx.clearRect(0, 0, previewSize, previewSize);

        if (!state.image) {
            // Draw empty placeholder
            ctx.save();
            createCircularClip(ctx, previewSize);
            ctx.fillStyle = '#f1f5f9';
            ctx.fillRect(0, 0, previewSize, previewSize);
            ctx.restore();
            return;
        }

        // Calculate scale ratio
        var ratio = previewSize / canvasSize;

        // Apply circular clip
        ctx.save();
        createCircularClip(ctx, previewSize);

        // Draw image scaled to preview
        var dims = calculateImageDimensions(state.image, previewSize, state.scale);

        ctx.drawImage(
            state.image,
            dims.x + (state.position.x * ratio),
            dims.y + (state.position.y * ratio),
            dims.width,
            dims.height
        );

        ctx.restore();
    }

    // Public API
    return {
        render: render,
        renderForExport: renderForExport,
        renderPreview: renderPreview,
        calculateImageDimensions: calculateImageDimensions
    };
})();
