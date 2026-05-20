/**
 * Downloader Module
 * Handles optimized avatar export.
 */

var Downloader = (function() {
    'use strict';

    var PREVIEW_SIZE = 400;
    var PRESET_SIZES = {
        linkedin: 1024,
        instagram: 1080,
        discord: 512,
        whatsapp: 640,
        tiktok: 1080,
        youtube: 800,
        gaming: 1024
    };

    function getExportSize(state) {
        var baseSize = PRESET_SIZES[state.preset] || 1024;
        return state.hdExport ? Math.min(baseSize * 2, 2048) : baseSize;
    }

    function getEncoderQuality(quality) {
        if (quality === 'standard') return 0.82;
        if (quality === 'max') return 0.98;
        return 0.92;
    }

    function generateFilename(state) {
        var timestamp = Date.now();
        var preset = state.preset || 'avatar';
        var format = state.exportFormat === 'jpg' ? 'jpg' : 'png';
        return 'circle-it-' + preset + '-' + timestamp + '.' + format;
    }

    function triggerDownload(dataUrl, filename) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadImage(state, renderForExport, onSuccess, onError) {
        if (!state.image) {
            if (onError) onError('No image to download');
            return;
        }

        try {
            var exportSize = getExportSize(state);
            var exportCanvas = document.createElement('canvas');
            exportCanvas.width = exportSize;
            exportCanvas.height = exportSize;

            var ctx = exportCanvas.getContext('2d', { alpha: state.exportFormat !== 'jpg' });
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, exportSize, exportSize);

            renderForExport(ctx, exportSize, state, exportSize / PREVIEW_SIZE);

            if (state.exportFormat !== 'jpg' && typeof CanvasRenderer !== 'undefined' && CanvasRenderer.verifyTransparency) {
                CanvasRenderer.verifyTransparency(ctx, exportSize, state.cropStyle);
            }

            var mimeType = state.exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
            var dataUrl = exportCanvas.toDataURL(mimeType, getEncoderQuality(state.exportQuality));
            triggerDownload(dataUrl, generateFilename(state));

            if (onSuccess) onSuccess(exportSize);
        } catch (e) {
            console.error('Download error:', e);
            if (onError) onError('Failed to generate download');
        }
    }

    function init(downloadBtn, getState, renderForExport, onSuccess, onError) {
        downloadBtn.addEventListener('click', function() {
            var state = getState();
            downloadBtn.classList.add('loading');
            downloadBtn.disabled = true;

            setTimeout(function() {
                downloadImage(state, renderForExport, function(size) {
                    downloadBtn.classList.remove('loading');
                    downloadBtn.disabled = false;
                    if (onSuccess) onSuccess(size);
                }, function(err) {
                    downloadBtn.classList.remove('loading');
                    downloadBtn.disabled = false;
                    if (onError) onError(err);
                });
            }, 80);
        });
    }

    function updateButtonState(downloadBtn, hasImage) {
        downloadBtn.disabled = !hasImage;
    }

    function getPresetSize(preset, hdExport) {
        var size = PRESET_SIZES[preset] || 1024;
        return hdExport ? Math.min(size * 2, 2048) : size;
    }

    return {
        init: init,
        updateButtonState: updateButtonState,
        downloadImage: downloadImage,
        getPresetSize: getPresetSize
    };
})();
