/**
 * State Management Module
 * Centralized state object with subscription-based updates
 */

var AppState = (function() {
    'use strict';

    /**
     * Default state values
     */
    var DEFAULT_POSITION = { x: 0, y: 0 };
    var DEFAULT_SCALE = 100; // Percentage (100-300)
    var DEFAULT_PRESET = 'linkedin';

    /**
     * Internal state object
     */
    var state = {
        image: null,
        processedImage: null,  // Image with background removed
        imageName: '',
        position: { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y },
        scale: DEFAULT_SCALE,
        isLoading: false,
        removeBackground: false,
        isProcessingBackground: false,
        backgroundColor: 'transparent',  // Background color when removeBackground is enabled
        backgroundImage: null,  // Background image (AI generated or uploaded)
        isGeneratingBackground: false,  // Whether AI is generating background
        cropStyle: 'circle',  // 'circle', 'square', 'rounded'
        borderRadius: 20,  // Border radius percentage for rounded style (0-50)
        preset: DEFAULT_PRESET,
        exportFormat: 'png',
        exportQuality: 'high',
        hdExport: false,
        backgroundStyle: 'transparent',
        autoBackgroundColor: '#eef2ff',
        studioLook: 'studio',
        lightStrength: 75
    };

    /**
     * Subscribers to state changes
     */
    var subscribers = [];

    /**
     * Notify all subscribers of state change
     */
    function notifySubscribers() {
        var currentState = getState();
        for (var i = 0; i < subscribers.length; i++) {
            try {
                subscribers[i](currentState);
            } catch (e) {
                console.error('State subscriber error:', e);
            }
        }
    }

    /**
     * Get a copy of the current state
     * @returns {Object} Current state snapshot
     */
    function getState() {
        return {
            image: state.image,
            processedImage: state.processedImage,
            imageName: state.imageName,
            position: { x: state.position.x, y: state.position.y },
            scale: state.scale,
            isLoading: state.isLoading,
            removeBackground: state.removeBackground,
            isProcessingBackground: state.isProcessingBackground,
            backgroundColor: state.backgroundColor,
            backgroundImage: state.backgroundImage,
            isGeneratingBackground: state.isGeneratingBackground,
            cropStyle: state.cropStyle,
            borderRadius: state.borderRadius,
            preset: state.preset,
            exportFormat: state.exportFormat,
            exportQuality: state.exportQuality,
            hdExport: state.hdExport,
            backgroundStyle: state.backgroundStyle,
            autoBackgroundColor: state.autoBackgroundColor,
            studioLook: state.studioLook,
            lightStrength: state.lightStrength
        };
    }

    /**
     * Check if an image is loaded
     * @returns {boolean} True if image exists
     */
    function hasImage() {
        return state.image !== null;
    }

    /**
     * Set the image and reset position/scale
     * @param {HTMLImageElement} image - The loaded image element
     * @param {string} name - Optional name for the image
     */
    function setImage(image, name) {
        state.image = image;
        state.processedImage = null;
        state.imageName = name || 'image';
        state.position = { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y };
        state.scale = DEFAULT_SCALE;
        state.isLoading = false;
        state.removeBackground = false;
        state.isProcessingBackground = false;
        state.backgroundColor = 'transparent';
        state.backgroundImage = null;
        state.isGeneratingBackground = false;
        state.studioLook = 'studio';
        state.lightStrength = 75;
        notifySubscribers();
    }

    /**
     * Update the image position
     * @param {number} x - X offset from center
     * @param {number} y - Y offset from center
     */
    function setPosition(x, y) {
        state.position.x = x;
        state.position.y = y;
        notifySubscribers();
    }

    /**
     * Update the zoom scale (percentage)
     * @param {number} scale - Scale percentage (100 to 300)
     */
    function setScale(scale) {
        state.scale = Math.max(100, Math.min(300, Math.round(scale)));
        notifySubscribers();
    }

    /**
     * Set loading state
     * @param {boolean} loading
     */
    function setLoading(loading) {
        state.isLoading = loading;
        notifySubscribers();
    }

    /**
     * Reset position and scale to defaults
     */
    function reset() {
        state.position = { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y };
        state.scale = DEFAULT_SCALE;
        notifySubscribers();
    }

    /**
     * Clear all state (for new image)
     */
    function clear() {
        state.image = null;
        state.processedImage = null;
        state.imageName = '';
        state.position = { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y };
        state.scale = DEFAULT_SCALE;
        state.isLoading = false;
        state.removeBackground = false;
        state.isProcessingBackground = false;
        state.backgroundColor = 'transparent';
        state.backgroundImage = null;
        state.isGeneratingBackground = false;
        state.cropStyle = 'circle';
        state.borderRadius = 20;
        state.preset = DEFAULT_PRESET;
        state.exportFormat = 'png';
        state.exportQuality = 'high';
        state.hdExport = false;
        state.backgroundStyle = 'transparent';
        state.autoBackgroundColor = '#eef2ff';
        state.studioLook = 'studio';
        state.lightStrength = 75;
        notifySubscribers();
    }

    /**
     * Set remove background option
     * @param {boolean} enabled
     */
    function setRemoveBackground(enabled) {
        state.removeBackground = enabled;
        notifySubscribers();
    }

    /**
     * Set the processed image (with background removed)
     * @param {HTMLImageElement} image - The processed image
     */
    function setProcessedImage(image) {
        state.processedImage = image;
        notifySubscribers();
    }

    /**
     * Set background processing state
     * @param {boolean} processing
     */
    function setProcessingBackground(processing) {
        state.isProcessingBackground = processing;
        notifySubscribers();
    }

    /**
     * Set background color
     * @param {string} color - CSS color value or 'transparent'
     */
    function setBackgroundColor(color) {
        state.backgroundColor = color;
        state.backgroundStyle = color === 'transparent' ? 'transparent' : 'solid';
        state.backgroundImage = null;  // Clear background image when setting color
        notifySubscribers();
    }

    /**
     * Set the lightweight background style.
     * @param {string} style - 'transparent', 'solid', 'gradient', 'blur', or 'auto'
     */
    function setBackgroundStyle(style) {
        if (['transparent', 'solid', 'gradient', 'blur', 'auto'].indexOf(style) !== -1) {
            state.backgroundStyle = style;
            if (style === 'transparent') {
                state.backgroundColor = 'transparent';
            } else if (style === 'solid' && state.backgroundColor === 'transparent') {
                state.backgroundColor = '#ffffff';
            }
            notifySubscribers();
        }
    }

    /**
     * Store an automatically sampled palette color.
     * @param {string} color - Hex color
     */
    function setAutoBackgroundColor(color) {
        state.autoBackgroundColor = color || '#eef2ff';
        notifySubscribers();
    }

    /**
     * Set background image
     * @param {HTMLImageElement} image - Background image
     */
    function setBackgroundImage(image) {
        state.backgroundImage = image;
        state.backgroundColor = 'transparent';  // Clear color when setting image
        notifySubscribers();
    }

    /**
     * Set background generation state
     * @param {boolean} generating
     */
    function setGeneratingBackground(generating) {
        state.isGeneratingBackground = generating;
        notifySubscribers();
    }

    /**
     * Set crop style
     * @param {string} style - 'circle', 'square', or 'rounded'
     */
    function setCropStyle(style) {
        if (['circle', 'square', 'rounded'].indexOf(style) !== -1) {
            state.cropStyle = style;
            notifySubscribers();
        }
    }

    /**
     * Set the active profile-picture preset.
     * @param {string} preset - Preset key
     */
    function setPreset(preset) {
        state.preset = preset || DEFAULT_PRESET;
        notifySubscribers();
    }

    /**
     * Set export format.
     * @param {string} format - 'png' or 'jpg'
     */
    function setExportFormat(format) {
        if (['png', 'jpg'].indexOf(format) !== -1) {
            state.exportFormat = format;
            notifySubscribers();
        }
    }

    /**
     * Set export quality.
     * @param {string} quality - 'standard', 'high', or 'max'
     */
    function setExportQuality(quality) {
        if (['standard', 'high', 'max'].indexOf(quality) !== -1) {
            state.exportQuality = quality;
            notifySubscribers();
        }
    }

    /**
     * Toggle HD export.
     * @param {boolean} enabled
     */
    function setHdExport(enabled) {
        state.hdExport = !!enabled;
        notifySubscribers();
    }

    /**
     * Set studio lighting look.
     * @param {string} look - Lighting look key
     */
    function setStudioLook(look) {
        if (['natural', 'studio', 'bright', 'warm', 'clean', 'dramatic'].indexOf(look) !== -1) {
            state.studioLook = look;
            notifySubscribers();
        }
    }

    /**
     * Set studio lighting strength.
     * @param {number} strength - Strength percentage (0-100)
     */
    function setLightStrength(strength) {
        state.lightStrength = Math.max(0, Math.min(100, Math.round(strength)));
        notifySubscribers();
    }

    /**
     * Set border radius for rounded style
     * @param {number} radius - Border radius percentage (0-50)
     */
    function setBorderRadius(radius) {
        state.borderRadius = Math.max(0, Math.min(50, Math.round(radius)));
        notifySubscribers();
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Function to call on state change
     * @returns {Function} Unsubscribe function
     */
    function subscribe(callback) {
        subscribers.push(callback);
        return function unsubscribe() {
            var index = subscribers.indexOf(callback);
            if (index > -1) {
                subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Get default scale value
     * @returns {number} Default scale
     */
    function getDefaultScale() {
        return DEFAULT_SCALE;
    }

    // Public API
    return {
        getState: getState,
        hasImage: hasImage,
        setImage: setImage,
        setPosition: setPosition,
        setScale: setScale,
        setLoading: setLoading,
        reset: reset,
        clear: clear,
        subscribe: subscribe,
        getDefaultScale: getDefaultScale,
        setRemoveBackground: setRemoveBackground,
        setProcessedImage: setProcessedImage,
        setProcessingBackground: setProcessingBackground,
        setBackgroundColor: setBackgroundColor,
        setBackgroundImage: setBackgroundImage,
        setGeneratingBackground: setGeneratingBackground,
        setBackgroundStyle: setBackgroundStyle,
        setAutoBackgroundColor: setAutoBackgroundColor,
        setCropStyle: setCropStyle,
        setBorderRadius: setBorderRadius,
        setPreset: setPreset,
        setExportFormat: setExportFormat,
        setExportQuality: setExportQuality,
        setHdExport: setHdExport,
        setStudioLook: setStudioLook,
        setLightStrength: setLightStrength
    };
})();
