/*! jquery-essence-validation.js | (c) 2013 Essence Digital | http://www.essencedigital.com | Credits: Matthew Burrows <matthew.burrows@essencedigital.com> */
(function ($) {
    // Create a Global namespace to contain all the validation logic.
    var Ess = Ess || {};
    // Create the function that will handle the validation functions.
    Ess.Validation = function ($element, opts) {
        this._init('essenceValidation', $element, opts);
    };
    Ess.Validation.prototype = {
        // To save alot of code repetition, build a function to return common field elements.
        _getCommonFieldElements: function () {
            var self = this;
            return {
                _fieldContainer: function ($field) {
                    return $field.closest(self.opts.messageParent);
                },
                _findSibling: function ($field) {
                    var $parent = this._fieldContainer($field);
                    if (self.opts.messageSibling) {
                        return $parent.siblings(self.opts.messageSibling);
                    }
                    return false;
                },
                _buildContainer: function ($field, err, msg) {
                    return $('<div>', {
                        'class': 'form__state ' + (err ? self.opts.errorMsgClass : self.opts.successMsgClass),
                        'html': err ? msg : 'Success!'
                    });
                },
                _msgContainer: function ($field, err) {
                    var $container = $field.closest(self.opts.messageParent);
                    return $container.find('.form__state');
                }
            };
        },
        _removeFieldMessage: function ($field, err) {
            var self = this,
                common = this._getCommonFieldElements(),
                classes = self.opts.errorContainerClass + ' ' + self.opts.successContainerClass,
                $fieldContainer = common._fieldContainer($field),
                $msgContainer = common._msgContainer($field, err),
                $msgSibling = common._findSibling($field);
            $fieldContainer.removeClass(classes);
            $msgContainer.remove();
            if ($msgSibling) {
                $msgSibling.removeClass(classes);
            }
        },
        _showFieldMessage: function ($field, err, msg) {
            var self = this,
                common = this._getCommonFieldElements(),
                className = err ? self.opts.errorContainerClass : self.opts.successContainerClass,
                $fieldContainer = common._fieldContainer($field),
                $msgContainer = common._buildContainer($field, err, msg),
                $msgSibling = common._findSibling($field);
            $fieldContainer
                .addClass(className)
                .append($msgContainer);
            if ($msgSibling) {
                $msgSibling.addClass(className);
            }
        },
        _fieldValidation: function ($field, errors) {
            var rules = this._validationRules($field);
            // Run a check to see if the field is empty.
            if (!rules.passed) {
                this._removeFieldMessage($field, false);
                this._showFieldMessage($field, true, rules.errorMsg);
                return errors += 1;
            } else {
                this._removeFieldMessage($field, true);
                this._showFieldMessage($field, false);
                return errors;
            }
        },
        _validationRules: function ($field) {
            var self = this,
                type = this._getType($field),
                $val = $field.val(),
                $data = $field.data(),
                $defaultErrorMsg = $data['defaulterror'] || this.opts.defaultMessage;

            // Strips spaces and full stops.
            if ($data.hasOwnProperty('stripspaces')) {
                $val = $val.replace(/\s|\./gi, '');
                $field.val($val);
            }

            // If there is a data-length attribute...
            if ($data.hasOwnProperty('length')) {
                var length = $data['length'];
                // Make sure the field value === the data-length value.
                if ($val.length !== length) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['lengtherror'] || $defaultErrorMsg
                    };
                }
            }

            // If there is a data-length attribute...
            if ($data.hasOwnProperty('date')) {
                // Make sure the field is in the correct date format
                if (null === $val.match(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/)) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['dateerror'] || $defaultErrorMsg
                    };
                }
            }

            // If there is a data-match attribute...
            if ($data.hasOwnProperty('match')) {
                var $dataMatch = ($data.match) ? $data.match : $field.data('match'),
                    $match = this.$element.find(':input[name="' + $dataMatch + '"]').val();
                // Make sure the field value === the data-length value.
                if ($match.toLowerCase() !== $val.toLowerCase()) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['matcherror'] || $defaultErrorMsg
                    };
                }
            }

            // If there is a not_numbers attribute...
            if ($data.hasOwnProperty('not_numbers')) {
                // Run a check to make sure we are dealing with numbers.
                if (!isNaN($val)) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['not_numberserror'] || $defaultErrorMsg
                    };
                }
            }

            // If there is a data-prefix attribute...
            if ($data.hasOwnProperty('prefix')) {
                var $prefix = $data['prefix'];
                // Make sure the field value is at least as long as the data-prefix length
                if ($val.length < $prefix.length) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['prefixerror'] || $defaultErrorMsg
                    };
                }
                // Then make sure the field value === the data-prefix value.
                if ($val.substring(0, $prefix.length) !== $prefix) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $data['prefixerror'] || $defaultErrorMsg
                    };
                }
            }

            // Check to see if it is an email field.
            if ('email' === type) {
                var pattern = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
                if ('' === $val || null === $val.match(pattern)) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $defaultErrorMsg
                    };
                }
            }

            // Run a check to see if the field is a radio or checkbox input type.
            if ('radio' === type || 'checkbox' === type) {
                if (!$field.is(':checked')) {
                    return {
                        passed: false,
                        val: '',
                        errorMsg: $defaultErrorMsg
                    };
                }
            }

            // Check to see if it is a select box.
            if ('select' === type) {
                if (!$val) {
                    return {
                        passed: false,
                        val: '',
                        errorMsg: $defaultErrorMsg
                    };
                }
            }

            // Check to see if it is a number input type.
            if ('number' === type) {
                if (isNaN(parseFloat($val)) || !isFinite($val)) {
                    return {
                        passed: false,
                        val: '',
                        errorMsg: $defaultErrorMsg
                    };
                }
            }

            // Check to see if it is a tel input type.
            if('tel' === type) {
                if(11 > $val.length || isNaN($val)) {
                    return {
                        passed: false,
                        val: $val,
                        errorMsg: $defaultErrorMsg
                    };
                }
            }

            // Run the most basic of checks. Make sure the field has a value.
            if ('' === $val) {
                return {
                    passed: false,
                    val: $val,
                    errorMsg: $defaultErrorMsg
                };
            }

            // If we get this far the tests have been passed!
            return {
                passed: true,
                val: $val
            };
        },
        _getType: function ($field) {
            if ($field) {
                var $type = $field.data('type') ? $field.data('type') : $field.prop('type');
                // Because browsers return either 'select-one' or 'select-multiple' for the $field.prop('type')
                // we need to run a check to make sure that the type contains the word 'select'.
                if ($type) {
                    if (-1 !== $type.toLowerCase().indexOf('select')) {
                        return 'select';
                    } else {
                        return $type.toLowerCase();
                    }
                }
            }
            return false;
        },
        _validateSubmission: function () {
            var self = this,
                errors = 0;
            $.each(self.fieldObjects, function (i, val) {
                var $field = self.$element.find(':input[name="' + val + '"]');
                errors = self._fieldValidation($field, errors);
            });
            // If there are errors return true.
            return (errors > 0) ? true : false;
        },
        _setFieldListeners: function ($name) {
            var self = this,
                changers = ['checkbox', 'radio', 'select'],
                $field = this.$element.find(':input[name="' + $name + '"]');
            if ($field) {
                var $type = this._getType($field),
                    validation = '_' + $type + 'Validation',
                    eventType = (-1 !== $.inArray($type, changers)) ? 'change' : 'blur';
                $field.on(eventType, function (e) {
                    var $this = $(this);
                    self._fieldValidation($field, 0);
                });
            }
        },
        _setSubmissionListener: function () {
            var self = this;
            // Handle the form submission.
            this.$element.on({
                'submit': function (e) {
                    var errors = self._validateSubmission();
                    if (errors) {
                        e.preventDefault();
                    } else {
                        if (self.opts.ajaxSubmission === true) {
                            e.preventDefault();
                        }
                        if (typeof self.opts.submitCallback === 'function') {
                            self.opts.submitCallback();
                        }
                    }
                }
            });
        },
        _mapFormFields: function () {
            var self = this,
                $fields = this.$element.find(':input'); // Find everything within the form.
            if (!this.autoComplete) {
                this.$element.prop('autocomplete', 'off');
            }
            // Loop through the fields.
            $fields.each(function (i, field) {
                var $this = $(this),
                    $name = $this.prop('name') || false,
                    $required = $this.hasClass('required') || false;
                // Is the field requried?
                if ($required) {
                    // Check to see if the $name value exists in the fieldObjects array.
                    if ($name && $.inArray($name, self.fieldObjects) == -1) {
                        self.fieldObjects.push($name);
                        self._setFieldListeners($name);
                    }
                }
            });
        },
        _getDefaults: function (opts) {
            var self = this;
            // Push the user specified options onto the function defaults.
            return $.extend({}, $.fn[self.type].defaults, opts);
        },
        _init: function (type, element, opts) {
            // Set up the function properties.
            this.type = type;
            this.$element = $(element); // Create a jQuery object of the element.
            this.opts = this._getDefaults(opts); // Merge the default and user specified options.
            this.fieldObjects = []; // Create an array to store the form fields name and a jQuery object of the form.
            // Initiate the function methods.
            this._setSubmissionListener();
            this._mapFormFields();
        }
    };
    $.extend($.fn, {
        essenceValidation: function (opts) {
            return this.each(function () {
                var $this = $(this),
                    $data = $this.data('essenceValidation'),
                    options = (typeof opts === 'object') && opts;
                if (!$data) {
                    $this.data('essenceValidation', ($data = new Ess.Validation(this, options)));
                }
                if (typeof opts === 'string') {
                    $data[opts]();
                }
            });
        }
    });
    $.fn.essenceValidation.defaults = {
        'autoComplete': false,
        'showMessages': true,
        'defaultMessage': 'Please fill out this field',
        'messageParent': 'div',
        'messageSibling': false,
        'ajaxSubmission': false,
        'errorMsgClass': 'error__msg',
        'successMsgClass': 'success__msg',
        'errorContainerClass': 'error',
        'successContainerClass': 'success',
        'submitCallback': function () {
            alert('Form submitted');
        }
    };
})(jQuery);