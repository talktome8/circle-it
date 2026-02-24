/**
 * Background Remover Module
 * Handles AI-powered background removal using @imgly/background-removal
 */

var BackgroundRemover = (function() {
    'use strict';

    var cachedResults = new Map();
    var libraryLoaded = false;
    var libraryLoading = false;
    var loadPromise = null;

    /**
     * Load the background removal library dynamically
     * @returns {Promise} Resolves when library is loaded
     */
    function loadLibrary() {
        if (libraryLoaded && typeof imglyRemoveBackground !== 'undefined') {
            return Promise.resolve();
        }

        if (loadPromise) {
            return loadPromise;
        }

        libraryLoading = true;
        
        loadPromise = new Promise(function(resolve, reject) {
            // Check if already loaded
            if (typeof imglyRemoveBackground !== 'undefined') {
                libraryLoaded = true;
                libraryLoading = false;
                resolve();
                return;
            }

            console.log('Dynamically loading @imgly/background-removal...');
            
            var script = document.createElement('script');
            script.type = 'module';
            script.textContent = `
                import { removeBackground } from 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.1/+esm';
                window.imglyRemoveBackground = removeBackground;
                window.dispatchEvent(new Event('imglyLoaded'));
            `;
            
            var handleLoad = function() {
                window.removeEventListener('imglyLoaded', handleLoad);
                console.log('Background removal library loaded successfully');
                libraryLoaded = true;
                libraryLoading = false;
                resolve();
            };
            
            window.addEventListener('imglyLoaded', handleLoad);
            
            // Timeout fallback
            setTimeout(function() {
                if (!libraryLoaded) {
                    window.removeEventListener('imglyLoaded', handleLoad);
                    libraryLoading = false;
                    reject(new Error('Library load timeout'));
                }
            }, 30000);
            
            document.head.appendChild(script);
        });

        return loadPromise;
    }

    /**
     * Generate a cache key for an image
     * @param {HTMLImageElement} image - The image element
     * @returns {string} Cache key
     */
    function getCacheKey(image) {
        return image.src.substring(0, 100) + '_' + image.width + '_' + image.height;
    }

    /**
     * Convert image element to blob
     * @param {HTMLImageElement} image - The image element
     * @returns {Promise<Blob>} Image blob
     */
    function imageToBlob(image) {
        return new Promise(function(resolve, reject) {
            var canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;
            
            var ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);
            
            canvas.toBlob(function(blob) {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to convert image to blob'));
                }
            }, 'image/png');
        });
    }

    /**
     * Convert blob to image element
     * @param {Blob} blob - Image blob
     * @returns {Promise<HTMLImageElement>} Image element
     */
    function blobToImage(blob) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            var url = URL.createObjectURL(blob);
            
            img.onload = function() {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load processed image'));
            };
            
            img.src = url;
        });
    }

    /**
     * Remove background from an image
     * @param {HTMLImageElement} image - The source image
     * @param {Function} onProgress - Progress callback (0-1)
     * @returns {Promise<HTMLImageElement>} Processed image with transparent background
     */
    function removeBackground(image, onProgress) {
        // Check cache first
        var cacheKey = getCacheKey(image);
        if (cachedResults.has(cacheKey)) {
            return Promise.resolve(cachedResults.get(cacheKey));
        }

        if (onProgress) onProgress(0.05);

        return loadLibrary()
            .then(function() {
                if (onProgress) onProgress(0.1);
                return imageToBlob(image);
            })
            .then(function(blob) {
                if (typeof window.imglyRemoveBackground !== 'function') {
                    throw new Error('Background removal function not available');
                }

                var config = {
                    publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.5.1/dist/',
                    model: 'small',
                    output: {
                        format: 'image/png',
                        quality: 1
                    },
                    progress: function(key, current, total) {
                        if (onProgress && total > 0) {
                            // Scale progress: 10% for loading, 90% for processing
                            var progress = 0.1 + (current / total) * 0.9;
                            onProgress(progress);
                        }
                    }
                };

                console.log('Starting background removal...');
                return window.imglyRemoveBackground(blob, config);
            })
            .then(function(resultBlob) {
                console.log('Background removal complete');
                return blobToImage(resultBlob);
            })
            .then(function(processedImage) {
                console.log('Processed image ready:', processedImage.width, 'x', processedImage.height);
                cachedResults.set(cacheKey, processedImage);
                return processedImage;
            })
            .catch(function(error) {
                console.error('Background removal error:', error);
                throw error;
            });
    }

    /**
     * Check if background removal is supported
     * @returns {boolean} True if supported (always true since we load dynamically)
     */
    function isSupported() {
        // Always return true since we load the library on demand
        return true;
    }

    /**
     * Clear the cache
     */
    function clearCache() {
        cachedResults.clear();
    }

    // Public API
    return {
        removeBackground: removeBackground,
        isSupported: isSupported,
        clearCache: clearCache
    };
})();
