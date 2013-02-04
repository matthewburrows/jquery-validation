/*
 * - jquery-essence-validation.js
 * - (c) 2013 Essence Digital | http://www.essencedigital.com
 *
 * - Credits: Matthew Burrows <matthew.burrows@essencedigital.com>
 */
(function($) {
	// Create a Global namespace to contain all the validation logic.
	var Ess = Ess || {};
	// Create the function that will handle the validation functions.
	Ess.Validation = function ( $element, opts ) {
		this._init( 'essenceValidation', $element, opts );
	};
	Ess.Validation.prototype = {
		// To save alot of code repetition, build a function to return common field elements.
		_getCommonFieldElements: function () {
			var self = this;
			return {
				_fieldContainer: function ( $field ) {
					return $field.closest( self.opts.messageParent );
				},
				_buildMsgContainer: function ( $field ) {
					return $( '<div>', {
						'class'   : 'error-msg',
						'html' : $field.data( 'errorMessage' ) 
					} );
				},
				_msgContainer: function ( $field ) {
					var $container = $field.closest( self.opts.messageParent )
					return $container.find('.error-msg');
				}
			}
		},	
		_removeFieldMessage: function ( $field ) {
			var self            = this,
				common          = this._getCommonFieldElements();
			common._fieldContainer( $field ).removeClass( 'error' );
			common._msgContainer( $field ).remove();
		},
		_showFieldMessage: function ( $field ) {
			var self            = this,
				common          = this._getCommonFieldElements();
			if( !$errorMsg ) {
				var $fieldContainer = common._fieldContainer( $field ),
					$errorMsg       = common._msgContainer( $field ),
					$msgContainer   = common._buildMsgContainer( $field );
				if( !$fieldContainer.hasClass( 'error' ) ) {
					$fieldContainer.addClass( 'error' ).append( $msgContainer );
				}
			}
		},
		_textValidation: function ( $field, errors ) {
			// Run a check to see if the field is empty.
			if( $field.val() === '' ) {
				this._showFieldMessage( $field );
				return errors += 1;
			}
			else {
				this._removeFieldMessage( $field );
				return errors;
			}
		},
		_emailValidation: function ( $field, errors ) {
			var $val = $field.val(),
				pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;
			// Run a check to see if the field is empty.
			if( $val === '' || !$val.match( pattern ) ) {
				this._showFieldMessage( $field );
				return errors += 1;
			}
			else {
				this._removeFieldMessage( $field );
				return errors;
			}
		},
		_radioValidation: function ( $field, errors ) {
			// Run a check to see if the field has been checked.
			if( !$field.is( ':checked' ) ) {
				this._showFieldMessage( $field );
				return errors += 1;
			}
			else {
				this._removeFieldMessage( $field );
				return errors;
			}
		},
		_checkboxValidation: function ( $field, errors ) {
			// To save rewriting code just run the _radioValidation method as we are checking for the same thing.
			return this._radioValidation( $field, errors );
		},
		_selectValidation: function ( $field, errors ) {
			// Run a check to see if an option has been selected.
			if( !$field.is( ':selected' ) ) {
				this._showFieldMessage( $field );
				return errors += 1;
			}
			else {
				this._removeFieldMessage( $field );
				return errors;
			}
		},
		_validateSubmission: function () {
			var self   = this,
				errors = 0;
			$.each( self.fieldObjects, function ( i, val ) {
				var $field     = self.$element.find( ':input[name="' + val + '"]'),
					type       = $field.prop( 'type' ),
					validation = '_' + type + 'Validation';
				// Run a check to see if the field type has a unique validation method.
				if( self[validation] && typeof self[validation] === 'function' ) {
					errors = self[validation]( $field, errors );
				}
				// Else just default to the _textValidation method.
				else {
					errors = self._textValidation( $field, errors );
				}
			} );
			// If there are errors return true.
			return ( errors > 0 ) ? true : false;
		},
		_setSubmissionListener: function () {
			var self = this;
			// Handle the form submission.
			this.$element.on({
				'submit': function ( e ) {
					var errors = self._validateSubmission();
					if( errors ) {
						e.preventDefault();
					}
				}
			});
		},
		_mapFieldMessage: function ( name ) {
			var self = this,
				$field = this.$element.find( ':input[name="' + name + '"]');
			if(
				this.overwriteDefaultMessage &&
				this.overwriteDefaultMessage.hasOwnProperty( name )
			) {
				$field.data( 'errorMessage', self.overwriteDefaultMessage[name] );
			}
			else {
				$field.data( 'errorMessage', self.opts.defaultMessage );
			}
		},
		_mapFormFields: function () {
			var self = this,
				$fields = this.$element.find( ':input' ); // Find everything within the form.
			// Loop through the fields.
			$fields.each( function ( i, field ) {
				var $this     = $(this),
					$name     = $this.prop( 'name' ) || false,
					$required = $this.data( 'required' ) || false;
				// Is the field requried?
				if( $required ) {
					// Check to see if the $name value exists in the fieldObjects array.
					if( $name && $.inArray( $name, self.fieldObjects ) == -1 ) {
						self.fieldObjects.push( $name );
						self._mapFieldMessage( $name ); // Push the name and a jQuery object of the field to _mapFieldMessage
					}
				}
			} );
		},
		_getDefaults: function ( opts ) {
			var self = this;
			// Push the user specified options onto the function defaults.
			return $.extend( {}, $.fn[self.type].defaults, opts );
		},
		_init: function ( type, element, opts ) {
			// Set up the function properties.
			this.type                    = type;
			this.$element                = $(element); 					// Create a jQuery object of the element.
			this.opts                    = this._getDefaults( opts ); 	// Merge the default and user specified options.
			this.fieldObjects            = []; 							// Create an array to store the form fields name and a jQuery object of the form.
			this.overwriteDefaultMessage = ( this.opts.hasOwnProperty( 'overwriteDefaultMessage' ) ) ? this.opts.overwriteDefaultMessage : false;
			// Initiate the function methods.
			this._setSubmissionListener();
			this._mapFormFields();
		}
	};
	$.extend( $.fn, {
		essenceValidation: function ( opts ) {
			return this.each( function () {
				var $this   = $(this),
					$data   = $this.data( 'essenceValidation' ),
					options = ( typeof opts === 'object' ) && opts;
				if( !$data ) {
					$this.data( 'essenceValidation', ( $data = new Ess.Validation( this, options ) ) );
				}
				if( typeof opts === 'string' ) {
					$data[opts]();
				}
			} );
		}
	} );
	$.fn.essenceValidation.defaults = {
		'showMessages'  : true,
		'defaultMessage': 'Please fill out this field',
		'messageParent' : 'div'
	};
})(jQuery);