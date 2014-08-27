/*!
* qTip - Speech bubble tips plugin
*
* This plugin requires the main qTip library in order to function.
* Download it here: http://craigsworks.com/projects/qtip/
*
* Copyright (c) 2009 Craig Thompson
* http://craigsworks.com
*
* Launch: December 2009
* Version: UNSTABLE REVISION CODE! Visit http://craigsworks.com/projects/qtip/ for stable code
*
* Licensed under MIT
* http://www.opensource.org/licenses/mit-license.php
*/

"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
/*jslint onevar: true, browser: true, forin: true, undef: true, nomen: true, bitwise: true, regexp: true, newcap: true, maxerr: 300 */
/*global window: false, jQuery: false */
(function($)
{
	// Munge the primitives - Paul Irish
	var TRUE = true,
		FALSE = false,
		NULL = null,
		noop = function(){};

	// Check qTip library is present
	if(!$.fn.qtip) {
		if(window.console){ window.console.error('This plugin requires the qTip library.',''); }
		return FALSE;
	}

	// Tip coordinates calculator
	function calculate(corner, width, height)
	{
		// Define tip coordinates in terms of height and width values
		var tips = {
			bottomright:	[[0,0],				[width,height],		[width,0]],
			bottomleft:		[[0,0],				[width,0],				[0,height]],
			topright:		[[0,height],		[width,0],				[width,height]],
			topleft:			[[0,0],				[0,height],				[width,height]],
			topcenter:		[[0,height],		[width/2,0],			[width,height]],
			bottomcenter:	[[0,0],				[width,0],				[width/2,height]],
			rightcenter:	[[0,0],				[width,height/2],		[0,height]],
			leftcenter:		[[width,0],			[width,height],		[0,height/2]]
		};
		tips.lefttop = tips.bottomright; tips.righttop = tips.bottomleft;
		tips.leftbottom = tips.topright; tips.rightbottom = tips.topleft;

		return tips[corner];
	}

	function Tip(qTip, command)
	{
		var self = this;
		self.qTip = qTip;

		self.tip = NULL;
		self.corner = NULL;
		self.type = NULL;
		self.size = NULL;
		self.method = 'css';
		self.cache = {
			overflow: {
				left: FALSE, top: FALSE
			}
		},
		self.checks = {
			'^position.my$': function() {
				// Check if tip corner is automatic and update if so
				if(this.get('style.tip.corner') === TRUE) {
					self.checks['^style.tip.(corner|type)'].call(this);
				}
			},
			'^style.tip.(corner|type)': function() {
				// Re-determine tip type and update
				determine();
				self.update();

				// Only update the position if mouse isn't the target
				if(this.get('position.target') !== 'mouse') {
					this.reposition();
				}
			}
		};

		// Determines tip corner
		function determine()
		{
			var corner = qTip.options.style.tip.corner,
				type = qTip.options.style.tip.type || corner,
				corners = qTip.options.position;

			if(corner === FALSE) {
				return FALSE;
			}
			else{
				if(corner === TRUE) {
					if(corners.at.left && corners.at.top) {
						return FALSE;
					}
					else {
						self.corner = $.extend({}, corners.my);
					}

					self.corner.adjust = true;
				}
				else if(!corner.precedance) {
					self.corner = new $.fn.qtip.plugins.Corner(corner);
				}

				if(type === TRUE) {
					if(corners.at.left && corners.at.top) {
						return FALSE;
					}
					else {
						self.type = $.extend({}, corners.my);
					}

					self.type.adjust = true;
				}
				else if(!type.precedance) {
					self.type = new $.fn.qtip.plugins.Corner(type);
				}
			}

			return self.corner.string() !== 'centercenter';
		}

		// Tip position method
		function position(corner)
		{
			var corners  = ['left', 'right'],
				opts = qTip.options.style,
				adjust = 0,
				borderAdjust = corner.y + corner.x.substr(0,1).toUpperCase() + corner.x.substr(1),
				ieAdjust = { left: 0, right: 0, top: 0, bottom: 0 };
			corner = corner || self.corner;

			// Return if tips are disabled or tip is not yet rendered
			if(qTip.options.style.tip.corner === FALSE || !self.tip){ return FALSE; }

			// Set initial position
			self.tip.css({
				top: '', bottom: '',
				left: '', right: '',
				margin: ''
			});

			// Setup corners to be adjusted
			corners[ (corner.precedance === 'y') ? 'push' : 'unshift' ]('top', 'bottom');

			// Calculate border adjustment
			try{ borderAdjust = opts.radius || opts[ borderAdjust ].radius; }
			catch(e){ borderAdjust = 0; }

			// Setup adjustments
			if($.browser.msie && self.method !== 'css')
			{
				ieAdjust = {
					left: 1, top: 1,
					right: (corner.precedance === 'y') ? 1 : 2,
					bottom: (corner.precedance === 'x') ? 1 : 2
				};
			}

			// Adjust primary corners
			switch(corner[ corner.precedance === 'y' ? 'x' : 'y' ])
			{
				case 'center':
					self.tip.css(corners[0], '50%')
						.css('margin-'+corners[0], -(self.size[ (corner.precedance === 'y') ? 'width' : 'height' ] / 2));
				break;

				case corners[0]:
					self.tip.css(corners[0], corner.offset.left - ieAdjust[ corners[0] ] - adjust + borderAdjust);
				break;

				case corners[1]:
					self.tip.css(corners[1], corner.offset.left + ieAdjust[ corners[1] ] - adjust + borderAdjust);
				break;
			}

			// Adjust secondary corners
			adjust += self.size[ (corner.precedance === 'x') ? 'width' : 'height' ];
			if(corner[corner.precedance] === corners[2]) {
				self.tip.css(corners[2], corner.offset[ corners[2] ] - ieAdjust[ corners[2] ] - adjust);
			}
			else {
				self.tip.css(corners[3], corner.offset[ corners[2] ] + ieAdjust[ corners[3] ] - adjust);
			}
		}

		function adjust(event, api, position) {
			// Only continue if tip adjustments are enabled
			if(!self.corner.adjust) {
				return false;
			}

			var newCorner = $.extend({}, self.corner),
				newPosition = $.extend(TRUE, {}, position),
				precedance = newCorner.precedance === 'y' ? ['y', 'x', 'top', 'height'] : ['x', 'y', 'left', 'width'],
				overflow = newPosition.adjust,
				adjustment = api.get('position.adjust.screen');
				newCorner.offset = { left: 0, top: 0 };

			// Adjust tip position
			newPosition[ precedance[2] ] += (newCorner[ precedance[0] ] === precedance[2] ? 1 : -1) * self.size[ precedance[3] ];
			$.extend(position, newPosition);

			// Determine if tip needs adjusting
			if((function() {
				var A = self.cache.overflow.left,
					B = self.cache.overflow.top,
					C =  overflow.left > 0,
					D = overflow.top > 0;

				return adjustment === 'fit' ? TRUE : !((!A && C) || (A && !C) || (B && !D) || (!B && D));
			})() === TRUE){ return; }


			// Adjust position according to adjustment that took place
			if(newCorner.x !== 'center' && overflow.left > -1) {
				newCorner.x = newCorner.x === 'left' ? 'right' : 'left';
			}
			if(newCorner.y !== 'center' && overflow.top > -1) {
				newCorner.y = newCorner.y === 'top' ? 'bottom' : 'top';
			}

			// Update overflow cache
			self.cache.overflow = {
				left: self.corner.x !== newCorner.x,
				top: self.corner.y !== newCorner.y
			};

			// Update and redraw the tip
			if(self.corner.string() !== newCorner.string()) { self.create(); }
			self.update(newCorner);
		}

		$.extend(self, {
			init: function()
			{
				// Determine tip corner and type
				var properties = determine.call(qTip);
				if(properties === FALSE){ return FALSE; }

				// Bind update events
				qTip.elements.tooltip.bind('tooltipmove.tip', adjust);

				// Create a new tip
				self.create();
				self.update();

				return self;
			},

			create: function()
			{
				// Create tip element and prepend to the tooltip with corner data attached
				if(self.tip){ self.tip.remove(); }
				self.tip = $('<div class="ui-tooltip-tip ui-widget-content"></div>').prependTo(qTip.elements.tooltip);

				// Detect tip size
				qTip.elements.tooltip.addClass('ui-tooltip-accessible');
				self.size = { width: self.tip.width(), height: self.tip.height() };
				qTip.elements.tooltip.removeClass('ui-tooltip-accessible');

				// Detect what type of tip to use
				self.method = qTip.options.style.tip.antialias !== false ? $('<canvas/>').get(0).getContext ? 'canvas' : $.browser.msie ? 'vml' : 'css' : 'css';

				// Create tip element
				switch(self.method)
				{
					case 'canvas':
						self.tip.append('<canvas height="'+self.size.height+'" width="'+self.size.width+'"></canvas>');
					break;

					case 'vml':
						self.tip.html('<vml:shape coordorigin="0 0" coordsize="'+self.size.width+' '+self.size.height+'" stroked="FALSE" ' +
							' style="behavior:url(#default#VML); display:inline-block; antialias:TRUE;' +
							' width:'+self.size.width+'px; height:'+self.size.height+'px; vertical-align:'+self.corner.y+';"></vml:shape>');
					break;

					case 'css':
						self.tip.addClass('ui-tooltip-tip-'+self.corner.string()).append('<div class="ui-tooltip-tip-inner"></div>');
					break;
				}

				return self;
			},

			update: function(corner)
			{
				var color, context, toSet, path, coords,
					inner = self.tip.children(':first'),
					regular = 'px solid ',
					transparent = 'px solid transparent',
					type = corner;

				// Re-determine tip if not already set
				if(!corner){
					corner = self.corner;
					type = self.type;
				}

				if(self.method !== 'css'){ coords = calculate(type.string(), self.size.width, self.size.height); }

				// Detect new tip colour and reset background to transparent
				color = self.tip.css('background-color', '').css('background-color');
				color = (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') ? qTip.elements.wrapper.css('border-top-color') : color;
				self.tip.css('background-color', 'transparent');
				regular += color;

				// Create tip element
				switch(self.method)
				{
					case 'canvas':
						// Setup canvas properties
						context = inner.get(0).getContext('2d');
						context.fillStyle = color;
						context.miterLimit = 0;

						// Draw the canvas tip (Delayed til after DOM creation)
						context.clearRect(0,0,3000,3000);
						context.beginPath();
						context.moveTo(coords[0][0], coords[0][1]);
						context.lineTo(coords[1][0], coords[1][1]);
						context.lineTo(coords[2][0], coords[2][1]);
						context.closePath();
						context.fill();
					break;

					case 'vml':
						// Create coordize and tip path using tip coordinates
						path = 'm' + coords[0][0] + ',' + coords[0][1] + ' l' + coords[1][0] +
							',' + coords[1][1] + ' ' + coords[2][0] + ',' + coords[2][1] + ' xe';

						// Set new attributes
						inner.attr({ 'path': path, 'fillcolor': color });
					break;

					case 'css':
						// Reset borders
						inner.removeAttr('style');

						// Determine what border corners to set
						toSet = {
							x: type.precedance === 'x' ? (type.x === 'left' ? 'right' : 'left') : type.x,
							y: type.precedance === 'y' ? (type.y === 'top' ? 'bottom' : 'top') : type.y
						};

						// Setup borders based on corner values
						if(type.x === 'center')
						{
							inner.css({
								borderLeft: (self.size.width / 2) + transparent,
								borderRight: (self.size.width / 2) + transparent
							})
							.css('border-'+toSet.y, self.size.height + regular);
						}
						else if(type.y === 'center')
						{
							inner.css({
								borderTop: (self.size.height / 2) + transparent,
								borderBottom: (self.size.height / 2) + transparent
							})
							.css('border-'+toSet.x, self.size.width + regular);
						}
						else
						{
							inner.css('border-width', (self.size.height / 2) + 'px ' + (self.size.width / 2) + 'px')
							.css('border-' + toSet.x, (self.size.width / 2) + regular)
							.css('border-' + toSet.y, (self.size.height / 2) + regular);
						}
					break;
				}

				// Update position
				position(corner);

				return self;
			},

			destroy: function()
			{
				// Remove previous tip if present
				if(self.tip) {
					self.tip.add(self.elements.qTip).removeData('qtip').remove();
				}

				// Remove bound events
				qTip.elements.tooltip.unbind('tooltipmove.tip');
			}
		});

		self.init();
	}

	$.fn.qtip.plugins.tip = function(qTip)
	{
		var api = qTip.plugins.tip,
			opts = qTip.options.style.tip;

		// Make sure tip options are present
		if(opts) {
			// An API is already present,
			if(api) {
				return api;
			}
			// No API was found, create new instance
			else {
				qTip.plugins.tip = new Tip(qTip);
				return qTip.plugins.tip;
			}
		}
	};

	// Initialize tip on render
	$.fn.qtip.plugins.tip.initialize = 'render';

	// Setup plugin sanitization options
	$.fn.qtip.plugins.tip.sanitize = function(opts)
	{
		if(opts.style !== undefined && opts.style.tip !== undefined) {
			if(typeof opts.style.tip !== 'object'){ opts.style.tip = { corner: opts.style.tip }; }
		}
	};
}(jQuery));