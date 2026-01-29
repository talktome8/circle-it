/**
 * Clipboard Handler Module
 * Handles paste events for loading images from clipboard
 */

var ClipboardHandler = (function() {
    'use strict';

    /**
     * Callback when image is loaded from clipboard
     */
    var onImageLoaded = null;

    /**
     * Error callback
     */
    var onError = null;

    /**
     * Success callback (for toast notifications)
     */
    var onSuccess = null;

    /**
     * Handle paste event
     * @param {ClipboardEvent} event
     */
    function handlePaste(event) {
        // Don't handle paste if user is typing in an input field
        var activeElement = document.activeElement;
        if (activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )) {
            return;
        }

        var clipboardData = event.clipboardData || window.clipboardData;

        if (!clipboardData) {
            return;
        }

        // Look for image items in clipboard
        var items = clipboardData.items;

        if (!items) {
            return;
        }

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.type.indexOf('image') !== -1) {
                event.preventDefault();

                var blob = item.getAsFile();

                if (blob && onImageLoaded) {
                    onImageLoaded(blob, 'pasted-image');
                    if (onSuccess) {
                        onSuccess('Image pasted successfully!');
                    }
                }

                return; // Only handle first image
            }
        }
    }

    /**
     * Initialize clipboard handler
     * @param {Function} imageLoadedCallback - Callback when image blob is ready
     * @param {Function} successCallback - Success notification callback
     * @param {Function} errorCallback - Error notification callback
     */
    function init(imageLoadedCallback, successCallback, errorCallback) {
        onImageLoaded = imageLoadedCallback;
        onSuccess = successCallback;
        onError = errorCallback;

        document.addEventListener('paste', handlePaste);
    }

    /**
     * Destroy clipboard handler
     */
    function destroy() {
        document.removeEventListener('paste', handlePaste);
        onImageLoaded = null;
        onSuccess = null;
        onError = null;
    }

    // Public API
    return {
        init: init,
        destroy: destroy
    };
})();
