// ==UserScript==
// @name         Roll20 FX Playground Tools
// @namespace    https://wiki.roll20.net/
// @version      0.1
// @description  Improved UI for Roll20's FX Playground
// @author       Braiba
// @match        https://wiki.roll20.net/fxplayground/
// @grant        none
// @require      http://code.jquery.com/jquery-3.6.0.js
// @require      https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/js/bootstrap.bundle.min.js
// ==/UserScript==

(function() {
    'use strict';

    var fields = [
        {
            "name": "angle",
            "label": "Angle",
            "type": "number",
            "min": 0,
            "max": 360,
            "isOptional": true,
            "defaultValue": 0,
            "defaultRandom": 360
        },
        {
            "name": "duration",
            "label": "Duration",
            "type": "number",
            "min": 1,
            "isOptional": true,
            "defaultValue": -1
        },
        {
            "name": "emissionRate",
            "label": "Emission Rate",
            "type": "number",
            "min": 0,
            "defaultValue": 8
        },
        {
            "name": "gravity",
            "label": "Gravity",
            "type": "point",
            "defaultValue": {x: 0.4, y: 0.2}
        },
        {
            "name": "lifeSpan",
            "label": "Life Span",
            "type": "number",
            "min": 0,
            "defaultValue": 9,
            "defaultRandom": 7
        },
        {
            "name": "maxParticles",
            "label": "Max Particles",
            "type": "number",
            "min": 1,
            "defaultValue": 150
        },
        {
            "name": "positionRandom",
            "label": "Position Random",
            "type": "point",
            "defaultValue": {x: 10, y: 10}
        },
        {
            "name": "sharpness",
            "label": "Sharpness",
            "type": "number",
            "max": 100,
            "min": 0,
            "defaultValue": 40,
            "defaultRandom": 10
        },
        {
            "name": "size",
            "label": "Size",
            "type": "number",
            "min": 0,
            "defaultValue": 45,
            "defaultRandom": 15
        },
        {
            "name": "speed",
            "label": "Speed",
            "type": "number",
            "min": 0,
            "defaultValue": 5,
            "defaultRandom": 1.5
        },
        {
            "name": "startColour",
            "label": "Start Colour",
            "type": "colour",
            "defaultValue": [250, 218, 68, 1],
            "defaultRandom": [62, 60, 60, 0]
        },
        {
            "name": "endColour",
            "label": "End Colour",
            "type": "colour",
            "defaultValue": [245, 35, 0, 0],
            "defaultRandom": [60, 60, 60, 0]
        }
    ];

    var hexToRgb = function(hex) {
        hex = hex.replace(/^#/,'');

        var matches = hex.match(/[0-9a-f]{2}/gi);
        return [
            parseInt(matches[0], 16),
            parseInt(matches[1], 16),
            parseInt(matches[2], 16)
        ];
    }

    var numberToHex = function(n, digits) {
        return n.toString(16).padStart(digits, '0');
    }

    var rgbaToHex = function(rgba, ignoreAlpha) {
        return '#' + numberToHex(rgba[0], 2) + numberToHex(rgba[1], 2) + numberToHex(rgba[2], 2) + (ignoreAlpha ? '' : numberToHex(rgba[3], 2));
    }

    var addFieldValueToFx = function(fieldData, formData, fxData) {
        if (fieldData.type === 'number') {
            var numValue = -1;

            if (!fieldData.hasOwnProperty('isOptional') || !fieldData.isOptional || formData.hasOwnProperty(fieldData.name + 'Enabled')) {
                numValue = parseFloat(formData[fieldData.name]);
                if (numValue === NaN) {
                    numValue = fieldData.defaultValue;
                }
            }

            if (numValue !== fieldData.defaultValue) {
                fxData[fieldData.name] = numValue;
            }

            if (fieldData.hasOwnProperty('defaultRandom')) {
                var randomName = fieldData.name + 'Random';
                var randomValue = parseFloat(formData[randomName]);
                if (randomValue !== fieldData.defaultRandom) {
                    fxData[randomName] = randomValue;
                }
            }
        } else if (fieldData.type === 'point') {
            var pointXValue = parseFloat(formData[fieldData.name + 'X']);
            var pointYValue = parseFloat(formData[fieldData.name + 'Y']);

            if ((pointXValue !== NaN) && (pointYValue !== NaN)) {
                var pointValue = {x: pointXValue, y: pointYValue};
                if (JSON.stringify(pointValue) !== JSON.stringify(fieldData.defaultValue)) {
                    fxData[fieldData.name] = pointValue;
                }
            }
        } else if (fieldData.type === 'colour') {
            var colValue = hexToRgb(formData[fieldData.name]);
            var colOpacity = parseFloat(formData[fieldData.name + 'Opacity']);
            if (colOpacity !== NaN) {
                colValue.push(colOpacity/100);
            } else {
                colValue.push(fieldData.defaultValue[3]);
            }

            if (JSON.stringify(colValue) !== JSON.stringify(fieldData.defaultValue)) {
                fxData[fieldData.name] = colValue;
            }
        } else {
            console.error('Unexpected field type: ' + fieldData.type);
        }
    }

    var buildFxData = function() {
        var formData = {};
        for (var inputData of $('#controlsPlus').serializeArray()) {
            formData[inputData.name] = inputData.value;
        }

        var fxData = {};
        for (var field of fields) {
            addFieldValueToFx(field, formData, fxData);
        }

        if (fxData.hasOwnProperty('gravity')) {
        // Zero values aren't allowed for gravity
            if (fxData.gravity.x === 0) {
                fxData.gravity.x = 0.001;
            }

            if (fxData.gravity.y === 0) {
                fxData.gravity.y = 0.001;
            }

            // Gravity has an explicit override on the format in the code (legacy?)
            fxData.gravity = [fxData.gravity.x, fxData.gravity.y];
        }

        return fxData;
    }

    var doRefreshPlus = function() {
        $('#data').val(JSON.stringify(buildFxData()));

        $('#refresh').click();
    }

    var createFieldInput = function(fieldData, $row) {
        var initialValue = fieldData.defaultValue;
        var isEnabled = true;
        var fieldNames = [];

        if (fieldData.type === 'number') {
            if (initialValue === -1) {
                initialValue = 0;
                isEnabled = false;
            }

            var $numInput = $('<input />')
                .attr('type', 'number')
                .attr('name', fieldData.name)
                .attr('min', 0)
                .val(initialValue)
                .addClass('form-control');

            if (fieldData.hasOwnProperty('max')) {
                $numInput.attr('max', fieldData.max);
            }

            if (!isEnabled) {
                $numInput.prop('disabled', true);
            }

            $row.append($('<div class="col"></div>').append($numInput));

            fieldNames.push(fieldData.name);

            if (fieldData.hasOwnProperty('defaultRandom')) {
                var $numRandomInput = $('<input />')
                    .attr('type', 'number')
                    .attr('name', fieldData.name + 'Random')
                    .attr('min', (fieldData.hasOwnProperty('min') ? fieldData.min : 0))
                    .val(fieldData.defaultRandom)
                    .addClass('form-control');

                if (fieldData.hasOwnProperty('max')) {
                    $numRandomInput.attr('max', fieldData.max);
                }

                if (!isEnabled) {
                    $numRandomInput.prop('disabled', true);
                }

                $row.append($('<div class="col-auto"><div class="form-control-plaintext">(&plusmn;</div></div>'));
                $row.append($('<div class="col"></div>').append($numRandomInput));
                $row.append($('<div class="col-auto"><div class="form-control-plaintext">)</div></div>'));

                // Angle can be disabled, but still have randomness applied
                // fieldNames.push(fieldData.name + 'Random');
            }

        } else if (fieldData.type === 'point') {
            var $xInput = $('<input />')
                .attr('type', 'number')
                .attr('name', fieldData.name + 'X')
                .val(initialValue.x)
                .addClass('form-control');

            var $yInput = $('<input />')
                .attr('type', 'number')
                .attr('name', fieldData.name + 'Y')
                .val(initialValue.y)
                .addClass('form-control');

            $row.append($('<div class="col"></div>').append($xInput));
            $row.append($('<div class="col-auto"><div class="form-control-plaintext">,</div></div>'));
            $row.append($('<div class="col"></div>').append($yInput));

            fieldNames.push(fieldData.name + 'X');
            fieldNames.push(fieldData.name + 'Y');
        } else if (fieldData.type === 'colour') {
            var $colInput = $('<input />')
                .attr('name', fieldData.name)
                .attr('type', 'color')
                .val(rgbaToHex(fieldData.defaultValue, true))
                .addClass('form-control');

            var $colOpacityInput = $('<input />')
                .attr('name', fieldData.name + 'Opacity')
                .attr('type', 'number')
                .attr('min', 0)
                .attr('max', 100)
                .val(fieldData.defaultValue[3] * 100)
                .addClass('form-control');

            $row.append($('<div class="col"></div>').append($colInput));
            $row.append($('<div class="col"></div>').append($colOpacityInput));
            $row.append($('<div class="col-auto"><div class="form-control-plaintext">%</div></div>'));

            fieldNames.push(fieldData.name);
        } else {
            console.error('Unexpected field type: ' + fieldData.type);
        }

        if (fieldData.hasOwnProperty('isOptional') && fieldData.isOptional) {
            var $enabledCheckbox = $('<input />')
                .attr('type', 'checkbox')
                .attr('name', fieldData.name + 'Enabled')
                .addClass('form-check-input')
                .data('linked-fields', fieldNames);

            if (isEnabled) {
                $enabledCheckbox.prop('checked', true);
            }

            $('label', $row).after($('<div class="col-auto"></div>').append($('<div class="form-check"></div>').append($enabledCheckbox)));
        }
    }

    var addFieldToForm = function($form, fieldData) {
        var html = `
<div class="form-group form-row">
    <label class="col-5 col-form-label">
        ${fieldData.label}
    </label>
</div>
`;
        var $row = $(html);

        createFieldInput(fieldData, $row);

        $form.append($row);
    }

    var copyFxDataToClipboard = function() {
        navigator.permissions.query({name: "clipboard-write"}).then(result => {
            if (result.state == "granted" || result.state == "prompt") {
                navigator.clipboard.writeText(JSON.stringify(buildFxData()))
                    .then(function() {
                        window.alert('The FX data has been copied to the clipboard');
                    }, function() {
                        window.alert('Could not copy to clipboard');
                    });
            }
        });
    }

    var init = function() {
        var css = `
#controls {
    display: none;
}

#controlsPlus {
    position: absolute;
    z-index: 1000;
    top: 10px;
    left: 10px;
    width: 450px;
    height: auto;
    padding: 10px;
    background-color: rgba(255,255,255,0.5);
}

#controlsPlus .form-check {
    display: flex;
    align-items: center;
    height: calc(1.5em + .75rem + 2px);
}

#controlsPlus .form-check-input {
    margin-top: 0;
}

`;
        $(document.head).append($('<style type="text/css">' + css + '</style>'));
        $(document.head).append($('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.0/dist/css/bootstrap.min.css" integrity="sha384-B0vP5xmATw1+K9KRQjQERJvTumQW0nPEzvF6L/Z6nronJ3oUOFUFpCjEUQouq2+l" crossorigin="anonymous">'));

        var controlsPlus = $('<form id="controlsPlus"></div>');

        for (var field of fields) {
            addFieldToForm(controlsPlus, field);
        }

        controlsPlus.append($('<div><button type="button" class="btn btn-primary">Copy FX Data</button></div>'));

        $(document.body).append(controlsPlus);

        $('#controlsPlus input[type=checkbox]').on('change', function() {
            var $checkbox = $(this);
            var linkedFields = $checkbox.data('linked-fields');

            for (var linkedField of linkedFields) {
                $('[name=' + linkedField + ']').prop('disabled', !$checkbox.prop('checked'));
            }
        });

        $('#controlsPlus input').on('change', function() {
            doRefreshPlus();
        });

        $('#controlsPlus button').on('click', function() {
            copyFxDataToClipboard();
        });
    }


    init();

    doRefreshPlus();
})();
