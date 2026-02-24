/**
 * Image Loader Module
 * Handles image file input via drag & drop, file picker, and clipboard
 */

var ImageLoader = (function() {
    'use strict';

    /**
     * Allowed MIME types for image upload
     */
    var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    /**
     * Maximum file size (20MB)
     */
    var MAX_FILE_SIZE = 20 * 1024 * 1024;

    /**
     * Maximum dimension (width or height) before we downscale.
     * Very large images can cause canvas OOM or sluggish rendering.
     */
    var MAX_DIMENSION = 4096;

    /**
     * Callback function when image is loaded
     */
    var onImageLoaded = null;

    /**
     * Error callback
     */
    var onError = null;

    /**
     * Check if a file is a valid image type
     * @param {File} file - File to validate
     * @returns {boolean} True if valid image type
     */
    function isValidImageType(file) {
        return file && ALLOWED_TYPES.indexOf(file.type) !== -1;
    }

    /**
     * Get filename without extension
     * @param {string} filename
     * @returns {string}
     */
    function getBaseName(filename) {
        if (!filename) return 'image';
        return filename.replace(/\.[^/.]+$/, '');
    }

    /**
     * Downscale an image if it exceeds MAX_DIMENSION on either axis.
     * Returns a new Image element (or the original if no downscale needed).
     * @param {HTMLImageElement} image - Original image
     * @param {Function} callback - Receives the (possibly downscaled) Image
     */
    function downscaleIfNeeded(image, callback) {
        var w = image.naturalWidth || image.width;
        var h = image.naturalHeight || image.height;

        if (w <= MAX_DIMENSION && h <= MAX_DIMENSION) {
            callback(image);
            return;
        }

        // Calculate scaled dimensions keeping aspect ratio
        var ratio = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
        var newW = Math.round(w * ratio);
        var newH = Math.round(h * ratio);

        console.log('[circle-it] Downscaling image from ' + w + 'x' + h + ' to ' + newW + 'x' + newH);

        var canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        var ctx = canvas.getContext('2d', { alpha: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, newW, newH);

        var scaled = new Image();
        scaled.onload = function() {
            callback(scaled);
        };
        scaled.onerror = function() {
            // Fallback to original if conversion fails
            callback(image);
        };
        scaled.src = canvas.toDataURL('image/png');
    }

    /**
     * Load an image from a File object
     * @param {File} file - The image file to load
     */
    function loadImageFromFile(file) {
        if (!isValidImageType(file)) {
            if (onError) {
                onError('Unsupported image format. Please use JPEG, PNG, or WebP.');
            }
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            if (onError) {
                onError('Image is too large. Please use an image under 20MB.');
            }
            return;
        }

        var reader = new FileReader();

        reader.onload = function(event) {
            var image = new Image();

            image.onload = function() {
                downscaleIfNeeded(image, function(finalImage) {
                    if (onImageLoaded) {
                        onImageLoaded(finalImage, getBaseName(file.name));
                    }
                });
            };

            image.onerror = function() {
                if (onError) {
                    onError('Failed to load image. The file may be corrupted.');
                }
            };

            image.src = event.target.result;
        };

        reader.onerror = function() {
            if (onError) {
                onError('Failed to read file.');
            }
        };

        reader.readAsDataURL(file);
    }

    /**
     * Load an image from a Blob (for clipboard)
     * @param {Blob} blob - The image blob to load
     * @param {string} name - Optional name
     */
    function loadImageFromBlob(blob, name) {
        if (!blob || blob.type.indexOf('image') === -1) {
            if (onError) {
                onError('Clipboard does not contain an image.');
            }
            return;
        }

        var reader = new FileReader();

        reader.onload = function(event) {
            var image = new Image();

            image.onload = function() {
                downscaleIfNeeded(image, function(finalImage) {
                    if (onImageLoaded) {
                        onImageLoaded(finalImage, name || 'pasted-image');
                    }
                });
            };

            image.onerror = function() {
                if (onError) {
                    onError('Failed to load pasted image.');
                }
            };

            image.src = event.target.result;
        };

        reader.onerror = function() {
            if (onError) {
                onError('Failed to read clipboard image.');
            }
        };

        reader.readAsDataURL(blob);
    }

    /**
     * Handle file input change event
     * @param {Event} event - Change event from file input
     */
    function handleFileInputChange(event) {
        var files = event.target.files;
        if (files && files.length > 0) {
            loadImageFromFile(files[0]);
        }
        // Reset input so same file can be selected again
        event.target.value = '';
    }

    /**
     * Handle dragover event
     * @param {DragEvent} event - Drag event
     */
    function handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
    }

    /**
     * Handle dragenter event
     * @param {DragEvent} event - Drag event
     * @param {HTMLElement} dropzone - Dropzone element
     */
    function handleDragEnter(event, dropzone) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.add('drag-over');
    }

    /**
     * Handle dragleave event
     * @param {DragEvent} event - Drag event
     * @param {HTMLElement} dropzone - Dropzone element
     */
    function handleDragLeave(event, dropzone) {
        event.preventDefault();
        event.stopPropagation();
        
        // Only remove class if leaving the dropzone entirely
        var rect = dropzone.getBoundingClientRect();
        var x = event.clientX;
        var y = event.clientY;
        
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            dropzone.classList.remove('drag-over');
        }
    }

    /**
     * Handle drop event
     * @param {DragEvent} event - Drop event
     * @param {HTMLElement} dropzone - Dropzone element
     */
    function handleDrop(event, dropzone) {
        event.preventDefault();
        event.stopPropagation();
        dropzone.classList.remove('drag-over');

        var files = event.dataTransfer.files;
        if (files && files.length > 0) {
            loadImageFromFile(files[0]);
        }
    }

    /**
     * Handle keyboard activation of dropzone
     * @param {KeyboardEvent} event - Keyboard event
     * @param {HTMLInputElement} fileInput - File input element
     */
    function handleDropzoneKeydown(event, fileInput) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            fileInput.click();
        }
    }

    /**
     * Initialize the image loader with DOM elements
     * @param {HTMLElement} dropzone - Dropzone element
     * @param {HTMLInputElement} fileInput - File input element
     * @param {Function} successCallback - Callback when image is loaded
     * @param {Function} errorCallback - Callback on error
     */
    function init(dropzone, fileInput, successCallback, errorCallback) {
        onImageLoaded = successCallback;
        onError = errorCallback;

        // File input change handler
        fileInput.addEventListener('change', handleFileInputChange);

        // Drag and drop handlers
        dropzone.addEventListener('dragover', handleDragOver);
        
        dropzone.addEventListener('dragenter', function(event) {
            handleDragEnter(event, dropzone);
        });
        
        dropzone.addEventListener('dragleave', function(event) {
            handleDragLeave(event, dropzone);
        });
        
        dropzone.addEventListener('drop', function(event) {
            handleDrop(event, dropzone);
        });

        // Keyboard accessibility
        dropzone.addEventListener('keydown', function(event) {
            handleDropzoneKeydown(event, fileInput);
        });
    }

    /**
     * Trigger file input programmatically
     * @param {HTMLInputElement} fileInput - File input element
     */
    function triggerFileInput(fileInput) {
        fileInput.click();
    }

    // Public API
    return {
        init: init,
        loadImageFromFile: loadImageFromFile,
        loadImageFromBlob: loadImageFromBlob,
        triggerFileInput: triggerFileInput
    };
})();
