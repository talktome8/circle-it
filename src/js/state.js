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
    var DEFAULT_SCALE = 100; // Percentage (50-300)

    /**
     * Internal state object
     */
    var state = {
        image: null,
        imageName: '',
        position: { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y },
        scale: DEFAULT_SCALE,
        isLoading: false
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
            imageName: state.imageName,
            position: { x: state.position.x, y: state.position.y },
            scale: state.scale,
            isLoading: state.isLoading
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
        state.imageName = name || 'image';
        state.position = { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y };
        state.scale = DEFAULT_SCALE;
        state.isLoading = false;
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
     * @param {number} scale - Scale percentage (50 to 300)
     */
    function setScale(scale) {
        state.scale = Math.max(50, Math.min(300, Math.round(scale)));
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
        state.imageName = '';
        state.position = { x: DEFAULT_POSITION.x, y: DEFAULT_POSITION.y };
        state.scale = DEFAULT_SCALE;
        state.isLoading = false;
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
        getDefaultScale: getDefaultScale
    };
})();
