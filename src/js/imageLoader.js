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
                if (onImageLoaded) {
                    onImageLoaded(image, getBaseName(file.name));
                }
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
        var reader = new FileReader();

        reader.onload = function(event) {
            var image = new Image();

            image.onload = function() {
                if (onImageLoaded) {
                    onImageLoaded(image, name || 'pasted-image');
                }
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
