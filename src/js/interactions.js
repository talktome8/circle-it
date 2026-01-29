/**
 * Interactions Module
 * Handles user interactions for dragging and zooming
 */

var Interactions = (function() {
    'use strict';

    /**
     * Drag state tracking
     */
    var dragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        startPositionX: 0,
        startPositionY: 0
    };

    /**
     * References to callbacks and state functions
     */
    var getState = null;
    var setPosition = null;
    var setScale = null;
    var canvasElement = null;
    var zoomSliderElement = null;
    var zoomValueElement = null;

    /**
     * Handle mouse down on canvas
     * @param {MouseEvent} event - Mouse event
     */
    function handleMouseDown(event) {
        if (!getState().image) {
            return;
        }

        event.preventDefault();
        
        var state = getState();
        dragState.isDragging = true;
        dragState.startX = event.clientX;
        dragState.startY = event.clientY;
        dragState.startPositionX = state.position.x;
        dragState.startPositionY = state.position.y;

        canvasElement.style.cursor = 'grabbing';

        // Add document-level listeners for drag
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handle mouse move during drag
     * @param {MouseEvent} event - Mouse event
     */
    function handleMouseMove(event) {
        if (!dragState.isDragging) {
            return;
        }

        event.preventDefault();

        var deltaX = event.clientX - dragState.startX;
        var deltaY = event.clientY - dragState.startY;

        var newX = dragState.startPositionX + deltaX;
        var newY = dragState.startPositionY + deltaY;

        setPosition(newX, newY);
    }

    /**
     * Handle mouse up to end drag
     * @param {MouseEvent} event - Mouse event
     */
    function handleMouseUp(event) {
        if (!dragState.isDragging) {
            return;
        }

        event.preventDefault();
        dragState.isDragging = false;

        canvasElement.style.cursor = 'grab';

        // Remove document-level listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handle touch start on canvas
     * @param {TouchEvent} event - Touch event
     */
    function handleTouchStart(event) {
        if (!getState().image || event.touches.length !== 1) {
            return;
        }

        event.preventDefault();

        var touch = event.touches[0];
        var state = getState();
        
        dragState.isDragging = true;
        dragState.startX = touch.clientX;
        dragState.startY = touch.clientY;
        dragState.startPositionX = state.position.x;
        dragState.startPositionY = state.position.y;
    }

    /**
     * Handle touch move during drag
     * @param {TouchEvent} event - Touch event
     */
    function handleTouchMove(event) {
        if (!dragState.isDragging || event.touches.length !== 1) {
            return;
        }

        event.preventDefault();

        var touch = event.touches[0];
        var deltaX = touch.clientX - dragState.startX;
        var deltaY = touch.clientY - dragState.startY;

        var newX = dragState.startPositionX + deltaX;
        var newY = dragState.startPositionY + deltaY;

        setPosition(newX, newY);
    }

    /**
     * Handle touch end
     */
    function handleTouchEnd() {
        dragState.isDragging = false;
    }

    /**
     * Handle mouse wheel zoom on canvas
     * @param {WheelEvent} event - Wheel event
     */
    function handleWheel(event) {
        if (!getState().image) {
            return;
        }

        event.preventDefault();

        var state = getState();
        var delta = event.deltaY > 0 ? -5 : 5;
        var newScale = state.scale + delta;

        setScale(newScale);
        updateSliderValue(zoomSliderElement, zoomValueElement, newScale);
    }

    /**
     * Handle zoom slider change
     * @param {Event} event - Input event
     */
    function handleZoomChange(event) {
        var value = parseInt(event.target.value, 10);
        if (!isNaN(value)) {
            setScale(value);
            updateZoomDisplay(zoomValueElement, value);
        }
    }

    /**
     * Update the zoom display value
     * @param {HTMLElement} element
     * @param {number} scale
     */
    function updateZoomDisplay(element, scale) {
        if (element) {
            element.textContent = scale + '%';
        }
    }

    /**
     * Initialize interactions with DOM elements and state functions
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {HTMLInputElement} zoomSlider - Zoom slider element
     * @param {HTMLElement} zoomValue - Zoom value display element
     * @param {Object} stateFunctions - Object with getState, setPosition, setScale
     */
    function init(canvas, zoomSlider, zoomValue, stateFunctions) {
        canvasElement = canvas;
        zoomSliderElement = zoomSlider;
        zoomValueElement = zoomValue;
        getState = stateFunctions.getState;
        setPosition = stateFunctions.setPosition;
        setScale = stateFunctions.setScale;

        // Mouse events for canvas dragging
        canvas.addEventListener('mousedown', handleMouseDown);

        // Mouse wheel zoom
        canvas.addEventListener('wheel', handleWheel, { passive: false });

        // Touch events for mobile support
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd);
        canvas.addEventListener('touchcancel', handleTouchEnd);

        // Zoom slider
        zoomSlider.addEventListener('input', handleZoomChange);

        // Initialize display
        var state = getState();
        updateSliderValue(zoomSlider, zoomValue, state.scale);
    }

    /**
     * Update the zoom slider value to match state
     * @param {HTMLInputElement} zoomSlider - Zoom slider element
     * @param {HTMLElement} zoomValue - Zoom value display element
     * @param {number} scale - Current scale value
     */
    function updateSliderValue(zoomSlider, zoomValue, scale) {
        if (zoomSlider) {
            zoomSlider.value = scale;
            zoomSlider.setAttribute('aria-valuenow', scale);
        }
        updateZoomDisplay(zoomValue, scale);
    }

    // Public API
    return {
        init: init,
        updateSliderValue: updateSliderValue
    };
})();
