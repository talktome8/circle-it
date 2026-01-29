/**
 * Downloader Module
 * Handles exporting and downloading the circular image
 */

var Downloader = (function() {
    'use strict';

    /**
     * Output canvas size for download
     */
    var EXPORT_SIZE = 512;

    /**
     * Preview canvas size
     */
    var PREVIEW_SIZE = 400;

    /**
     * Generate a filename with timestamp
     * @returns {string} Generated filename
     */
    function generateFilename() {
        var timestamp = Date.now();
        return 'circle-it-' + timestamp + '.png';
    }

    /**
     * Create and trigger a download
     * @param {string} dataUrl - Data URL of the image
     * @param {string} filename - Name of the file to download
     */
    function triggerDownload(dataUrl, filename) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Download the circular image
     * @param {Object} state - Current application state
     * @param {Function} renderForExport - Render function from CanvasRenderer
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    function downloadImage(state, renderForExport, onSuccess, onError) {
        if (!state.image) {
            if (onError) onError('No image to download');
            return;
        }

        try {
            // Create an offscreen canvas for export
            var exportCanvas = document.createElement('canvas');
            exportCanvas.width = EXPORT_SIZE;
            exportCanvas.height = EXPORT_SIZE;
            
            var ctx = exportCanvas.getContext('2d');

            // Scale factor for position adjustment
            var scaleFactor = EXPORT_SIZE / PREVIEW_SIZE;

            // Render for export with scale factor
            renderForExport(ctx, EXPORT_SIZE, state, scaleFactor);

            // Convert to PNG and download
            var dataUrl = exportCanvas.toDataURL('image/png');
            var filename = generateFilename();
            
            triggerDownload(dataUrl, filename);

            if (onSuccess) onSuccess();
        } catch (e) {
            console.error('Download error:', e);
            if (onError) onError('Failed to generate download');
        }
    }

    /**
     * Initialize the downloader
     * @param {HTMLButtonElement} downloadBtn - Download button element
     * @param {Function} getState - Function to get current state
     * @param {Function} renderForExport - Render function from CanvasRenderer
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    function init(downloadBtn, getState, renderForExport, onSuccess, onError) {
        downloadBtn.addEventListener('click', function() {
            var state = getState();
            
            // Add loading state
            downloadBtn.classList.add('loading');
            downloadBtn.disabled = true;

            // Small delay to show loading state
            setTimeout(function() {
                downloadImage(state, renderForExport, function() {
                    downloadBtn.classList.remove('loading');
                    downloadBtn.disabled = false;
                    if (onSuccess) onSuccess();
                }, function(err) {
                    downloadBtn.classList.remove('loading');
                    downloadBtn.disabled = false;
                    if (onError) onError(err);
                });
            }, 100);
        });
    }

    /**
     * Update download button enabled state
     * @param {HTMLButtonElement} downloadBtn - Download button element
     * @param {boolean} hasImage - Whether an image is loaded
     */
    function updateButtonState(downloadBtn, hasImage) {
        downloadBtn.disabled = !hasImage;
    }

    // Public API
    return {
        init: init,
        updateButtonState: updateButtonState,
        downloadImage: downloadImage
    };
})();
