/*! waterfall_class.js | v1904B 2019/04 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
const DOT_PER_SIZE = 5;
const scaleLineWidth = 0;
//******* envelope object *******
// for drawing the filter envelope above scale
class Envelope {
    constructor(waterfall, parent){
        this.parent = parent;
        this.waterfall = waterfall;
    }
    draw ( range, center_freq, visible_range ) {
        this.visible_range = visible_range;
        let demod_envelope_draw = (range, from, to, color, line) => {
            //                                               ____
            // Draws a standard filter envelope like this: _/    \_
            // Parameters are given in offset frequency (Hz).
            // Envelope is drawn on the scale canvas.
            // A "drag range" object is returned, containing information about the draggable areas of the envelope
            // (beginning, ending and the line showing the offset frequency).
            if ( typeof color == "undefined" ){
                color="#ffff00"; //yellow
            }
            let env_bounding_line_w = 5;   //
            let env_att_w = 5;              //     _______   ___env_h2 in px   ___|_____
            let env_h1 = 17;                //   _/|      \_ ___env_h1 in px _/   |_    \_
            let env_h2 = 5;                 //   |||env_att_line_w                |_env_lineplus
            let env_lineplus = 1;           //   ||env_bounding_line_w
            let env_line_click_area = 6;
            //range=get_visible_freq_range();
            let from_px = this.waterfall.scale_px_from_freq(from,range) + scaleLineWidth;
            let to_px = this.waterfall.scale_px_from_freq(to,range) + scaleLineWidth;
            if ( to_px < from_px ) {
                /* swap'em */
                let temp_px = to_px;
                to_px = from_px;
                from_px = temp_px;
            }

            /*from_px-=env_bounding_line_w/2;
              to_px+=env_bounding_line_w/2;*/
            from_px -= ( env_att_w + env_bounding_line_w );
            to_px += ( env_att_w + env_bounding_line_w );
            // do drawing:
            this.waterfall.scale_ctx.lineWidth = 3;
            this.waterfall.scale_ctx.strokeStyle = color;
            this.waterfall.scale_ctx.fillStyle = color;
            var drag_ranges = { envelope_on_screen: false,
                                line_on_screen: false };
            if( !( to_px < 0 ||
                   from_px > window.innerWidth ) ){
                // out of screen?
                drag_ranges.beginning = { x1: from_px,
                                          x2: from_px + env_bounding_line_w + env_att_w
                                        };
                drag_ranges.ending = { x1: to_px - env_bounding_line_w - env_att_w,
                                       x2: to_px
                                     };
                drag_ranges.whole_envelope = { x1: from_px,
                                               x2: to_px
                                             };
                drag_ranges.envelope_on_screen = true;
                this.waterfall.scale_ctx.beginPath();
                this.waterfall.scale_ctx.moveTo( from_px, env_h1 );
                this.waterfall.scale_ctx.lineTo( from_px + env_bounding_line_w, env_h1 );
                this.waterfall.scale_ctx.lineTo( from_px + env_bounding_line_w + env_att_w, env_h2 );
                this.waterfall.scale_ctx.lineTo( to_px - env_bounding_line_w - env_att_w, env_h2 );
                this.waterfall.scale_ctx.lineTo( to_px - env_bounding_line_w, env_h1 );
                this.waterfall.scale_ctx.lineTo( to_px, env_h1 );
                this.waterfall.scale_ctx.globalAlpha = 0.3;
                this.waterfall.scale_ctx.fill();
                this.waterfall.scale_ctx.globalAlpha = 1;
                this.waterfall.scale_ctx.stroke();
            }
            if ( typeof line != "undefined") {
                // out of screen?
                let line_px = this.waterfall.scale_px_from_freq( line, range );
                if ( ! ( line_px < 0 ||
                         line_px > window.innerWidth ) ) {
                    drag_ranges.line = { x1: line_px - env_line_click_area / 2,
                                         x2: line_px + env_line_click_area / 2
                                       };
                    drag_ranges.line_on_screen = true;
                    this.waterfall.scale_ctx.moveTo( line_px + scaleLineWidth, env_h1 + env_lineplus );
                    this.waterfall.scale_ctx.lineTo( line_px + scaleLineWidth , env_h2 - env_lineplus );
                    this.waterfall.scale_ctx.stroke();
                }
            }
            return drag_ranges;
        };
        this.drag_ranges = demod_envelope_draw( range ,
                                                center_freq + this.parent.offset_frequency + this.parent.low_cut,
                                                center_freq + this.parent.offset_frequency + this.parent.high_cut,
                                                this.color,
                                                center_freq + this.parent.offset_frequency
                                              );
    }
    // event handlers
    drag_start ( x, key_modifiers ) {
        let demod_envelope_where_clicked = (x, drag_ranges, key_modifiers) => {
            // Check exactly what the user has clicked based on ranges returned by demod_envelope_draw().
            let in_range = ( x, range ) => {
                return range.x1 <= x && range.x2 >= x;
            };
            let dr = Demodulator.draggable_ranges;

            if( key_modifiers.shiftKey ) {
                //Check first: shift + center drag emulates BFO knob
                if( drag_ranges.line_on_screen &&
                    in_range( x, drag_ranges.line ) ){
                    return dr.bfo;
                }
                //Check second: shift + envelope drag emulates PBF knob
                if( drag_ranges.envelope_on_screen &&
                    in_range( x, drag_ranges.whole_envelope ) ){
                    return dr.pbs;
                }
            }
            if( drag_ranges.envelope_on_screen ){
                // For low and high cut:
                if( in_range( x, drag_ranges.beginning ) ){
                    return dr.beginning;
                }
                if( in_range( x, drag_ranges.ending ) ){
                    return dr.ending;
                }
                // Last priority: having clicked anything else on the envelope, without holding the shift key
                if( in_range( x, drag_ranges.whole_envelope ) ){
                    return dr.anything_else;
                }
            }
            return dr.none; //User doesn't drag the envelope for this demodulator
        };

        this.key_modifiers = key_modifiers;
        this.dragged_range = demod_envelope_where_clicked( x, this.drag_ranges, key_modifiers );
        //console.log("dragged_range: "+this.dragged_range.toString());
        this.drag_origin = {
            x: x,
            low_cut: this.parent.low_cut,
            high_cut: this.parent.high_cut,
            offset_frequency: this.parent.offset_frequency
        };
        return this.dragged_range != Demodulator.draggable_ranges.none;
    }
    drag_move( bandwidth, x ) {
        let dr = Demodulator.draggable_ranges;
        if( this.dragged_range == dr.none ){
            return false; // we return if user is not dragging (us) at all
        }
        let freq_change = Math.round( this.visible_range.hps * ( x - this.drag_origin.x ) );
        /*if(this.dragged_range==dr.beginning||this.dragged_range==dr.ending)
          {
          //we don't let the passband be too small
          if(this.parent.low_cut+new_freq_change<=this.parent.high_cut-this.parent.filter.min_passband) this.freq_change=new_freq_change;
          else return;
          }
          var new_value;*/

        //dragging the line in the middle of the filter envelope while holding Shift does emulate
        //the BFO knob on radio equipment: moving offset frequency, while passband remains unchanged
        //Filter passband moves in the opposite direction than dragged, hence the minus below.
        let minus = ( this.dragged_range == dr.bfo ) ? -1 : 1;
        //dragging any other parts of the filter envelope while holding Shift does emulate the PBS knob
        //(PassBand Shift) on radio equipment: PBS does move the whole passband without moving the offset
        //frequency.
        if( this.dragged_range == dr.beginning ||
            this.dragged_range == dr.bfo ||
            this.dragged_range == dr.pbs) {
            //we don't let low_cut go beyond its limits
            let new_value = this.drag_origin.low_cut + minus * freq_change;
            if( new_value < this.parent.filter.low_cut_limit ){
                return true;
            }
            //nor the filter passband be too small
            if( this.parent.high_cut - new_value < this.parent.filter.min_passband ){
                return true;
            }
            //sanity check to prevent GNU Radio "firdes check failed: fa <= fb"
            if( new_value >= this.parent.high_cut ){
                return true;
            }
            this.parent.low_cut = new_value;
        }
        if( this.dragged_range == dr.ending ||
            this.dragged_range == dr.bfo ||
            this.dragged_range == dr.pbs ) {
            let new_value = this.drag_origin.high_cut + minus * freq_change;
            //we don't let high_cut go beyond its limits
            if( new_value > this.parent.filter.high_cut_limit ){
                return true;
            }
            //nor the filter passband be too small
            if( new_value - this.parent.low_cut < this.parent.filter.min_passband ){
                return true;
            }
            //sanity check to prevent GNU Radio "firdes check failed: fa <= fb"
            if( new_value <= this.parent.low_cut ){
                return true;
            }
            this.parent.high_cut = new_value;
        }
        if( this.dragged_range == dr.anything_else ||
            this.dragged_range == dr.bfo ) {
            //when any other part of the envelope is dragged, the offset frequency is changed (whole passband also moves with it)
            let new_value = this.drag_origin.offset_frequency + freq_change;
            if( new_value > bandwidth / 2 ||
                new_value < -bandwidth / 2 ){
                return true; //we don't allow tuning above Nyquist frequency :-)
            }
            this.parent.offset_frequency = new_value;
        }
        //now do the actual modifications:
        this.waterfall.mkenvelopes( this.visible_range );
        this.parent.set();
        //will have to change this when changing to multi-demodulator mode:
/*        e("webrx-actual-freq").innerHTML=format_frequency("{x} MHz",center_freq+this.parent.offset_frequency,1e6,4);*/
        return true;
    }

    drag_end ( x ) {
        //in this demodulator we've already changed values in the drag_move() function so we shouldn't do too much here.
      //  demodulator_buttons_update();
        let to_return = this.dragged_range != Demodulator.draggable_ranges.none; //this part is required for cliking anywhere on the scale to set offset
        this.dragged_range = Demodulator.draggable_ranges.none;
        return to_return;
    }
};

let demodulator_color_index = 0;
let demodulator_colors = ["#ffff00", "#00ff00", "#00ffff", "#058cff", "#ff9600", "#a1ff39", "#ff4e39", "#ff5dbd"];

class Demodulator {
    constructor(offset_frequency){
        let demodulators_get_next_color = () => {
            if ( demodulator_color_index >= demodulator_colors.length ){
                demodulator_color_index = 0;
            }
            return ( demodulator_colors[demodulator_color_index++] );
        };

        this.offset_frequency = offset_frequency;
        this.has_audio_output = true;
        this.has_text_output = false;
        this.envelope = {};
        this.color = demodulators_get_next_color();
        this.stop = () => {};
    }
    //ranges on filter envelope that can be dragged:
    static draggable_ranges () {
        return {
            none: 0,
            beginning:1 /*from*/,
            ending: 2 /*to*/,
            anything_else: 3,
            bfo: 4 /*line (while holding shift)*/,
            pbs: 5
        };//to which parameter these correspond in demod_envelope_draw()
    }
}
class DemoduratorDefaultAnalog extends Demodulator {
    constructor( offset_frequency, subtype, waterfall ) {
        //console.log("hopefully this happens");
        //http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
        //demodulator.call( this, offset_frequency );
        super(offset_frequency);
        this.waterfall = waterfall;
        this.subtype = subtype;
        //Subtypes only define some filter parameters and the mod string sent to server,
        //so you may set these parameters in your custom child class.
        //Why? As of demodulation is done on the server, difference is mainly on the server side.
        this.server_mod = subtype;
        if(subtype == "lsb") {
            this.low_cut = -3000;
            this.high_cut = -300;
            this.server_mod = "ssb";
        } else if(subtype == "usb") {
            this.low_cut = 300;
            this.high_cut = 3000;
            this.server_mod = "ssb";
        } else if(subtype == "cw") {
            this.low_cut = 700;
            this.high_cut = 900;
            this.server_mod = "ssb";
        } else if(subtype == "nfm") {
            this.low_cut = -4000;
            this.high_cut = 4000;
        } else if(subtype == "am") {
            this.low_cut = -4000;
            this.high_cut = 4000;
        }

        this.wait_for_timer = false;
        this.set_after = false;
        this.set = () => {
            //set() is a wrapper to call doset(), but it ensures that doset won't execute more frequently than demodulator_response_time
            let demodulator_response_time = 50;
            //in ms; if we don't limit the number of SETs sent to the server, audio will underrun (possibly output buffer is cleared on SETs in GNU Radio.
            if( !this.wait_for_timer ) {
       //         this.doset(false);
                this.set_after = false;
                this.wait_for_timer = true;
                let timeout_this = this; //http://stackoverflow.com/a/2130411
                window.setTimeout(() => {
                    timeout_this.wait_for_timer = false;
                    if( timeout_this.set_after ){
                        timeout_this.set();
                    }
                }, demodulator_response_time );
            } else {
                this.set_after = true;
            }
        };

     //   this.doset(true); //we set parameters on object creation
        this.envelope = new Envelope(this.waterfall, this);
    }
}

class Waterfall {
    constructor( bandwidth, centerFrequency, fftSize, fftFps , panelWidth){
        this.webrx_canvas_container_width = panelWidth;
        let canvas_container_mouseout = ( evt ) => {
            this.canvas_end_drag();
        };

        /* start --*/
        this.bandwidth = bandwidth;
        this.centerFrequency = centerFrequency;
        this.fftSize = fftSize * DOT_PER_SIZE;
        this.fftFps = fftFps;
        /* initialize */
        this.is_firefox = navigator.userAgent.indexOf("Firefox") != -1;
        this.canvases = [];
        this.canvas_default_height = 200;
        this.canvas_actual_line = null; // for every canvas
        this.zoom_levels = [1];
        this.zoom_level = 0;
        this.zoom_offset_px = 0;
        this.waterfall_setup_done = 0;
        this.mathbox = null;
        this.zoom_levels_count = 14;
        this.zoom_max_level_hps = 33; //Hz/pixel
        this.zoom_center_rel = 0;
        this.zoom_center_where = 0;
        this.scale_canvas = null;
        this.scale_canvas_drag_params = {
            mouse_down: false,
            drag: false,
            start_x: 0,
            key_modifiers: {shiftKey:false, altKey: false, ctrlKey: false}
        };
        this.demodulators = [];

        this.scale_ctx = null;
        this.range = null;
        this.scale_min_space_bw_small_markers = 7; // const
        this.relativeX = null;
        this.canvas_mouse_down = false;
        this.canvas_drag = false;
        this.canvas_drag_min_delta = 1;
        this.canvas_drag_start_x = null;
        this.canvas_drag_start_y = null;
        this.canvas_drag_last_x = null;
        this.canvas_drag_last_y = null;
        this.waterfall_measure_minmax = false;
        this.waterfall_measure_minmax_now = false;
        this.waterfall_measure_minmax_min = 1e100;
        this.waterfall_measure_minmax_max = -1e100;
        this.waterfall_queue = [];
        this.waterfall_min_level = null;
        this.waterfall_max_level = null;
        this.canvas_maxshift = 0;

        /* param?? */
        this.waterfall_colors = [
            0x000000ff,
            0x0000ffff,
            0x00ffffff,
            0x00ff00ff,
            0xffff00ff,
            0xff0000ff,
            0xff00ffff,
            0xffffffff
        ];
        this.waterfall_min_level_default = '0';
        this.waterfall_max_level_default = '255'; // sメータが0x00-0xff か、0 - 110??
        this.waterfall_auto_level_margin = '[5,40]';

        /* init_canvas_container(); */
        this.canvas_container = $("#webrx-canvas-container");
        this.canvas_container.empty();
        this.mathbox_container = $("#openwebrx-mathbox-container");
        this.canvas_container.off("mouseout");
        this.canvas_container.on("mouseout", canvas_container_mouseout );
        this.canvas_phantom = $("#openwebrx-phantom-canvas");
        this.canvas_phantom.off("mouseover");
        this.canvas_phantom.on("mouseover", this.canvas_mouseover);
        this.canvas_phantom.off("mouseout");
        this.canvas_phantom.on("mouseout", this.canvas_mouseout);
        this.canvas_phantom.off("mousemove");
        this.canvas_phantom.on("mousemove", this.canvas_mousemove);
        this.canvas_phantom.off("mouseup");
        this.canvas_phantom.on("mouseup", this.canvas_mouseup);
        this.canvas_phantom.off("mousedown");
        this.canvas_phantom.on("mousedown", this.canvas_mousedown);
        this.canvas_phantom.off("wheel");
        this.canvas_phantom.on("wheel", this.canvas_mousewheel);
        this.canvas_phantom.css('width', this.webrx_canvas_container_width + "px");
        this.add_canvas();

        this.resize_waterfall_container(false);
        this.resize_canvases();

        //        scale_setup();
        //        this.mkzoomlevels();
        //this.waterfall_setup_done = 1;
    }
    add_canvas () {
        let openwebrx_top = ( -this.canvas_default_height + 1 );
        let new_canvas = $('<canvas>').attr({
            width: this.fftSize,
            height: this.canvas_default_height
        });
        new_canvas.css('width', ( this.webrx_canvas_container_width * this.zoom_levels[this.zoom_level] ).toString() + "px");
/*        console.log(`$("#webrx-canvas-container"): ${$("#webrx-canvas-container").innerWidth()}`);
        console.log(`new_canvas_width: ${( this.webrx_canvas_container_width * this.zoom_levels[this.zoom_level] )}`);
        console.log(`new_canvas_width_canvascontainer_innerWidth: ${this.webrx_canvas_container_width}`);
        console.log(`new_canvas_width_zoomlevel: ${this.zoom_levels[this.zoom_level]}`);*/
        new_canvas.css('left', this.zoom_offset_px.toString() + "px");
        new_canvas.css('height', this.canvas_default_height.toString() + "px");
        new_canvas.css('top', openwebrx_top.toString() + "px");
        new_canvas.openwebrx_top = openwebrx_top;

        this.canvas_actual_line = this.canvas_default_height - 1;
        this.canvas_context = new_canvas[0].getContext( "2d" );
        this.canvas_container.append( new_canvas );
        new_canvas.on( "mouseover", this.canvas_mouseover);
        new_canvas.on( "mouseout", this.canvas_mouseout);
        new_canvas.on( "mousemove", this.canvas_mousemove);
        new_canvas.on( "mouseup", this.canvas_mouseup);
        new_canvas.on( "mousedown", this.canvas_mousedown);
        new_canvas.on( "wheel", this.canvas_mousewheel);
        this.canvases.push( new_canvas );
    }

    resize_canvases ( zoom ) {
        let zoom_calc = () => {
            let winsize = this.webrx_canvas_container_width;
            let canvases_new_width = winsize * this.zoom_levels[this.zoom_level];
            this.zoom_offset_px = - ( ( canvases_new_width * ( 0.5 + this.zoom_center_rel / this.bandwidth ) ) - ( winsize * this.zoom_center_where ) );
            if( this.zoom_offset_px > 0 ){
                this.zoom_offset_px = 0;
            }
            if( this.zoom_offset_px < winsize - canvases_new_width){
                this.zoom_offset_px = winsize - canvases_new_width;
            }
        };

        if ( typeof zoom == "undefined" ){
            zoom = false;
        }
        if( !zoom ) {
            this.mkzoomlevels();
        }
        zoom_calc();
        let new_width = ( this.webrx_canvas_container_width * this.zoom_levels[this.zoom_level] ).toString() + "px";
        let zoom_value = this.zoom_offset_px.toString() + "px";

        this.canvases.forEach( ( p ) => {
            p.css('width', new_width );
            p.css('left', zoom_value );
        });
        this.canvas_phantom.css('width', new_width);
        this.canvas_phantom.css('left', zoom_value);
    };
    mkzoomlevels ()  {
        let get_zoom_coeff_from_hps = ( hps ) => {
            let shown_bw = ( window.innerWidth * hps );
            return this.bandwidth / shown_bw;
        };

        this.zoom_levels = [1];
        let maxc = get_zoom_coeff_from_hps( this.zoom_max_level_hps );
        if( maxc < 1 ){
            return;
        }
        // logarithmic interpolation
        let zoom_ratio = Math.pow( maxc, 1 / this.zoom_levels_count );
        for(let i = 1; i < this.zoom_levels_count; i++ ){
            this.zoom_levels.push( Math.pow( zoom_ratio, i ) );
        }
    };
    get_visible_freq_range () {
        let out = {};
        let fcalc = ( x ) => {
            return Math.round( ( ( - this.zoom_offset_px + x ) / this.canvases[0].innerWidth() ) * this.bandwidth )
                + ( this.centerFrequency - this.bandwidth / 2 );
        };
        out.start = fcalc( 0 );
        out.center = fcalc( this.webrx_canvas_container_width / 2 );
        out.end = fcalc( this.webrx_canvas_container_width );
        out.bw = out.end - out.start;
        out.hps = out.bw / this.webrx_canvas_container_width;
        return out;
    };
    demodulator_set_offset_frequency ( which , to_what ) {
        if( to_what > this.bandwidth / 2 ||
            to_what < - this.bandwidth / 2 ){
            return;
        }
        this.demodulators[0].offset_frequency = Math.round( to_what );
        this.demodulators[0].set();
        this.mkenvelopes( this.get_visible_freq_range() );
    };
    mkenvelopes ( visible_range ) {
        //called from mkscale
        //clear the upper part of the canvas (where filter envelopes reside)
        this.scale_ctx.clearRect( 0,
                                  0,
                                  this.scale_ctx.canvas.width,
                                  22);
        for(let i = 0; i < this.demodulators.length; i++){
            this.demodulators[i].envelope.draw( this.range, this.centerFrequency, visible_range );
        }
    };
    scale_px_from_freq ( f, range ) {
        return Math.round( ( ( f - range.start ) / range.bw ) * this.webrx_canvas_container_width);
    };
    mkscale () {
        let scale_min_space_bw_texts = 50;

        let get_scale_mark_spacing = ( range ) => {
            let scale_markers_levels = [
                {
                    "large_marker_per_hz":10000000, //large
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":0
                },
                {
                    "large_marker_per_hz":5000000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":0
                },
                {
                    "large_marker_per_hz":1000000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":0
                },
                {
                    "large_marker_per_hz":500000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":1
                },
                {
                    "large_marker_per_hz":100000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":1
                },
                {
                    "large_marker_per_hz":50000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":2
                },
                {
                    "large_marker_per_hz":10000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":2
                },
                {
                    "large_marker_per_hz":5000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":3
                },
                {
                    "large_marker_per_hz":1000,
                    "estimated_text_width":70,
                    "format":"{x} MHz",
                    "pre_divide":1000000,
                    "decimals":1
                }
            ];
            let out = {};
            let fcalc = ( freq ) => {
                out.numlarge = ( range.bw / freq );
                out.large = this.webrx_canvas_container_width / out.numlarge; //distance between large markers (these have text)
                out.ratio = 5; //(ratio-1) small markers exist per large marker
                out.small = out.large / out.ratio; //distance between small markers
                if ( out.small < this.scale_min_space_bw_small_markers ){
                    return false;
                }
                if ( out.small / 2 >= this.scale_min_space_bw_small_markers &&
                     freq.toString()[0] != "5" ) {
                    out.small /= 2;
                    out.ratio *= 2;
                }
                out.smallbw = freq / out.ratio;
                return true;
            };
            let mp = null;
            for ( let i = scale_markers_levels.length - 1; i >= 0; i--){
                mp = scale_markers_levels[i];
                if ( !fcalc( mp.large_marker_per_hz ) ){
                    continue;
                }
                if ( out.large - mp.estimated_text_width > scale_min_space_bw_texts){
                    break;
                }
            }
            out.params = mp;
            return out;
        };
        //clear the lower part of the canvas (where frequency scale resides; the upper part is used by filter envelopes):
        this.range = this.get_visible_freq_range();
        this.mkenvelopes( this.range ); //when scale changes we will always have to redraw filter envelopes, too
        this.scale_ctx.clearRect( 0 , 22 , this.scale_ctx.canvas.width , this.scale_ctx.canvas.height - 22);
        this.scale_ctx.strokeStyle = "#fff";
        this.scale_ctx.font = "bold 11px sans-serif";
        this.scale_ctx.textBaseline = "top";
        this.scale_ctx.fillStyle = "#fff";
        let spacing = get_scale_mark_spacing(this.range);
        let marker_hz = Math.ceil( this.range.start / spacing.smallbw ) * spacing.smallbw;
        let text_h_pos = 22 + 10 + ( ( this.is_firefox ) ? 3 : 0 );
        let text_to_draw;
        let ftext  =  (f) => {
            text_to_draw = this.format_frequency(spacing.params.format,
                                                 f,
                                                 spacing.params.pre_divide,
                                                 spacing.params.decimals);
        };
        let last_large;
        let first_large = null;
        for( ; ; ){
            /* debug */
            let x = this.scale_px_from_freq( marker_hz, this.range );
            if ( x > window.innerWidth ){
                break;
            }
            //debug 
            //break;
            this.scale_ctx.beginPath();
            this.scale_ctx.moveTo(x + scaleLineWidth, 22);
            if ( marker_hz % spacing.params.large_marker_per_hz == 0 ){
                //large marker
                if ( first_large === null ){
                    first_large = marker_hz;
                }
                last_large = marker_hz;
                this.scale_ctx.lineWidth = scaleLineWidth;
                this.scale_ctx.lineTo( x + scaleLineWidth , 22 + 11 );
                ftext( marker_hz );
                let text_measured = this.scale_ctx.measureText( text_to_draw );
                this.scale_ctx.textAlign = "center";
                //advanced text drawing begins
                if( this.zoom_level == 0 &&
                    ( this.range.start + spacing.smallbw * spacing.ratio > marker_hz ) &&
                    ( x < text_measured.width / 2 )
                  ){
                    //if this is the first overall marker when zoomed out...
                    //and if it would be clipped off the screen...
                    if ( this.scale_px_from_freq( marker_hz + spacing.smallbw * spacing.ratio , this.range )
                         - text_measured.width >= scale_min_space_bw_texts ){
                        //and if we have enough space to draw it correctly without clipping
                        this.scale_ctx.textAlign = "left";
                        this.scale_ctx.fillText(text_to_draw, 0, text_h_pos);
                    }
                }else if ( this.zoom_level == 0 &&
                           ( this.range.end - spacing.smallbw * spacing.ratio < marker_hz ) &&
                           ( x > window.innerWidth - text_measured.width / 2 ) ) {
                    //if this is the last overall marker when zoomed out...
                    //and if it would be clipped off the screen...
                    if ( window.innerWidth
                         - text_measured.width
                         - this.scale_px_from_freq( marker_hz - spacing.smallbw * spacing.ratio , this.range )
                         >= scale_min_space_bw_texts ) {
                        //and if we have enough space to draw it correctly without clipping
                        this.scale_ctx.textAlign = "right";
                        this.scale_ctx.fillText(text_to_draw, window.innerWidth, text_h_pos);
                    }
                } else {
                    this.scale_ctx.fillText(text_to_draw, x, text_h_pos); //draw text normally
                }
            } else {
                //small marker
                this.scale_ctx.lineWidth = 2;
                this.scale_ctx.lineTo( x + scaleLineWidth , 22 + 8 );
            }
            marker_hz += spacing.smallbw;
            this.scale_ctx.stroke();
        }
        if( this.zoom_level != 0 ) {
            // if zoomed, we don't want the texts to disappear because their markers can't be seen
            // on the left side
            this.scale_ctx.textAlign = "center";
            let f = first_large - spacing.smallbw * spacing.ratio;
            let x = this.scale_px_from_freq( f , this.range );
            ftext(f);
            let w = this.scale_ctx.measureText( text_to_draw ).width;
            if( x + w / 2 > 0 ){
                this.scale_ctx.fillText(text_to_draw, x, 22 + 10);
            }
            // on the right side
            f = last_large + spacing.smallbw * spacing.ratio;
            x = this.scale_px_from_freq( f , this.range );
            ftext(f);
            w = this.scale_ctx.measureText( text_to_draw ).width;
            if( x - w / 2 < window.innerWidth ){
                this.scale_ctx.fillText(text_to_draw, x, 22 + 10);
            }
        }
    };
    format_frequency (format, freq_hz, pre_divide, decimals) {
        let out = format.replace("{x}", ( freq_hz / pre_divide ).toFixed( decimals ) );
        let at = out.indexOf(".") + 4;
        while( decimals > 3 ) {
            out = out.substr( 0, at ) + "," + out.substr( at );
            at += 4;
            decimals -= 3;
        }
        return out;
    };
    canvas_get_frequency ( relativeX ) {
        return this.centerFrequency + this.canvas_get_freq_offset( relativeX );
    }
    canvas_mouseover ( evt ) {
        if( !this.waterfall_setup_done ){
            return;
        }
    }
    canvas_mouseout ( evt ) {
        if( !this.waterfall_setup_done ){
            return;
        }
    }
    canvas_mousemove ( evt ) {
        if ( !this.waterfall_setup_done ){
            return;
        }
        this.relativeX = ( evt.offsetX ) ? evt.offsetX : evt.layerX;
        if( this.canvas_mouse_down ){
            if( !this.canvas_drag &&
                Math.abs( evt.pageX - this.canvas_drag_start_x ) > this.canvas_drag_min_delta ){
                this.canvas_drag = true;
                this.canvas_container.css('cursor', 'move');
            }
            if( this.canvas_drag ){
                let deltaX = this.canvas_drag_last_x - evt.pageX;
                let deltaY = this.canvas_drag_last_y - evt.pageY;
                //zoom_center_where=zoom_center_where_calc(evt.pageX);
                let dpx = this.range.hps * deltaX;
                if(
                    !( this.zoom_center_rel + dpx >
                       ( this.bandwidth / 2 - this.webrx_canvas_container_width * ( 1 - this.zoom_center_where ) * this.range.hps ) ) &&
                        !( this.zoom_center_rel + dpx <
                           - this.bandwidth / 2 + this.webrx_canvas_container_width * this.zoom_center_where * this.range.hps )) {
                    this.zoom_center_rel += dpx;
                }
                //-((canvases_new_width*(0.5+zoom_center_rel/bandwidth))-(winsize*zoom_center_where));
                this.resize_canvases(false);
                this.canvas_drag_last_x = evt.pageX;
                this.canvas_drag_last_y = evt.pageY;
                this.mkscale();
            }
        } else {
            $("#webrx-mouse-freq").innerHTML = this.format_frequency("{x} MHz",
                                                               this.canvas_get_frequency(this.relativeX),
                                                               1e6,
                                                               4);
        }
    }
    canvas_mouseup ( evt ) {
        if( !this.waterfall_setup_done ){
            return;
        }

        this.relativeX = ( evt.offsetX ) ? evt.offsetX : evt.layerX;
        if( !this.canvas_drag ){
            this.demodulator_set_offset_frequency(0, this.canvas_get_freq_offset( this.relativeX ));
            $("#webrx-actual-freq").innerHTML = this.format_frequency("{x} MHz",
                                                                this.canvas_get_frequency( this.relativeX ),
                                                                1e6,
                                                                4);
        } else {
            this.canvas_end_drag();
        }
        this.canvas_mouse_down = false;
    }
    canvas_end_drag () {
        this.canvas_container.css('cursor', "crosshair");
        this.canvas_mouse_down = false;
    }
    canvas_mousedown ( evt ) {
        this.canvas_mouse_down = true;
        this.canvas_drag = false;
        this.canvas_drag_last_x = this.canvas_drag_start_x = evt.pageX;
        this.canvas_drag_last_y = this.canvas_drag_start_y = evt.pageY;
        evt.preventDefault(); //don't show text selection mouse pointer
    };
    canvas_mousewheel ( evt ) {
        let zoom_step = ( out, where, onscreen ) => {
            if( ( out && this.zoom_level == 0 ) ||
                ( !out && this.zoom_level >= this.zoom_levels_count - 1 ) ){
                return;
            }
            if( out ){
                --this.zoom_level;
            }else{
                ++this.zoom_level;
            }
            this.zoom_center_rel = this.canvas_get_freq_offset( where );
            this.zoom_center_where = onscreen;
            this.resize_canvases( true );
            this.mkscale();
        };
        let zoom_center_where_calc = ( screenposX ) => {
            return screenposX / this.webrx_canvas_container_width;
        };

        if( !this.waterfall_setup_done ){
            return;
        }
        this.relativeX = ( evt.offsetX ) ? evt.offsetX : evt.layerX;
        let dir = ( evt.deltaY / Math.abs( evt.deltaY ) ) > 0;
        zoom_step(dir,
                  this.relativeX,
                  zoom_center_where_calc( evt.pageX ));
        evt.preventDefault();
    }
    canvas_get_freq_offset ( relativeX ) {
        let rel = ( relativeX / this.canvases[0].innerWidth() );
        return Math.round( ( this.bandwidth * rel ) - ( this.bandwidth / 2 ) );
    }

    waterfall_add_queue ( what ) { /* call */
        let  waterfall_measure_minmax_do = ( what ) => {
            this.waterfall_measure_minmax_min = Math.min( this.waterfall_measure_minmax_min,
                                                     Math.min.apply( Math,what ));
            this.waterfall_measure_minmax_max = Math.max( this.waterfall_measure_minmax_max,
                                                     Math.max.apply( Math,what ));
        };
        let waterfallColorsAuto = () => {
            let updateWaterfallColors = ( which ) => {
                let wfmax = $("#openwebrx-waterfall-color-max");
                let wfmin = $("#openwebrx-waterfall-color-min");
                if( parseInt( wfmin.value ) >= parseInt( wfmax.value ) ){
                    if( !which ){
                        wfmin.value = ( parseInt( wfmax.value ) - 1 ).toString();
                    } else {
                        wfmax.value = ( parseInt( wfmin.value ) + 1 ).toString();
                    }
                }
                this.waterfall_min_level = parseInt( wfmin.value );
                this.waterfall_max_level = parseInt( wfmax.value );
            };

            $("#openwebrx-waterfall-color-min").value =
                ( this.waterfall_measure_minmax_min - this.waterfall_auto_level_margin[0] ).toString();
            $("#openwebrx-waterfall-color-max").value =
                ( this.waterfall_measure_minmax_max + this.waterfall_auto_level_margin[1] ).toString();
            updateWaterfallColors(0);
        };

        if( this.waterfall_measure_minmax ){
            waterfall_measure_minmax_do(what);
        }
        if( this.waterfall_measure_minmax_now ){
            waterfall_measure_minmax_do( what );
            this.waterfall_measure_minmax_now = false;
            waterfallColorsAuto();
        }
        this.waterfall_queue.push(what);
    };

    waterfallColorsDefault () { /* call */
        this.waterfall_min_level = this.waterfall_min_level_default;
        this.waterfall_max_level = this.waterfall_max_level_default;
        $("#openwebrx-waterfall-color-min").value = this.waterfall_min_level.toString();
        $("#openwebrx-waterfall-color-max").value = this.waterfall_max_level.toString();
    }
    waterfall_dequeue () {
        let waterfall_add = ( data ) => {
            let waterfall_mkcolor = (db_value, waterfall_colors_arg) => {
                let color_between = ( first , second , percent ) => {
                    let output = 0;
                    for(let i = 0; i < 4; i++) {
                        let add = (((( first & ( 0xff << ( i * 8 ))) >>> 0 ) * percent ) +
                                   ((( second & ( 0xff << ( i * 8 ))) >>> 0 ) * ( 1 - percent ))) & ( 0xff << ( i * 8 ));
                        output |= add >>> 0;
                    }
                    return output >>> 0;
                };

                if( typeof waterfall_colors_arg === 'undefined' ){
                    waterfall_colors_arg = this.waterfall_colors;
                }
                if( db_value < this.waterfall_min_level ) {
                    db_value = this.waterfall_min_level;
                }
                if( db_value > this.waterfall_max_level ) {
                    db_value = this.waterfall_max_level;
                }
                let full_scale = this.waterfall_max_level - this.waterfall_min_level;
                let relative_value = db_value - this.waterfall_min_level;
                let value_percent = relative_value / full_scale;
                let percent_for_one_color = 1 / ( waterfall_colors_arg.length - 1 );
                let index = Math.floor( value_percent / percent_for_one_color );
                let remain = ( value_percent - percent_for_one_color * index ) / percent_for_one_color;

                return color_between( waterfall_colors_arg[index + 1],
                                      waterfall_colors_arg[index],
                                      remain);
            };
            let shift_canvases = () => {
                this.canvases.forEach( ( p ) => {
                    p.css('top', ( p.openwebrx_top++ ).toString() + "px");
                });
                this.canvas_maxshift++;

                if( this.canvas_container.innerHeight() > this.canvas_maxshift ) {
                    this.canvas_phantom.css('top', this.canvas_maxshift.toString() + "px");
                    this.canvas_phantom.css('height', ( this.canvas_container.innerHeight() - this.canvas_maxshift ).toString() + "px");
                    this.canvas_phantom.css('display', 'block');
                } else {
                    this.canvas_phantom.css('display', 'none');
                }
            };

            if( !this.waterfall_setup_done ){
                return;
            }
            let  w = this.fftSize;
            //Add line to waterfall image
            let oneline_image = this.canvas_context.createImageData( w ,1 );
            for(let x = 0; x < data.length; x++) {
                let color =  waterfall_mkcolor(data[x]);
                let colorData = [];
                for(let i = 0; i < 4; i++) {
                    colorData.push(( ( color >>> 0 ) >> ( ( 3 - i ) * 8 ) ) & 0xff);
                }
                for(let j = 0; j < DOT_PER_SIZE; j++){
                    if (x == data.length / 2 ) {
                        if( j == 0 ) {
                        oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + 0 ] = 255;
                        oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + 1 ] = 0;
                        oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + 2 ] = 0;
                            oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + 3 ] = 255;
                        }else{
                            for(let i = 0; i < colorData.length; i++){
                                oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + i ] = colorData[i];
                            }
                        }
                    } else {
                        for(let i = 0; i < colorData.length; i++){
                            oneline_image.data[ ( x * DOT_PER_SIZE + j ) * 4 + i ] = colorData[i];
                        } 
                    }
                }
            }
            //Draw image
            this.canvas_context.putImageData(oneline_image, 0, this.canvas_actual_line--);
            shift_canvases();
            if( this.canvas_actual_line < 0 ){
                this.add_canvas();
            }
        };

        if( this.waterfall_queue.length ){
            waterfall_add( this.waterfall_queue.shift() );
        }
        if( this.waterfall_queue.length > Math.max( this.fftFps / 2 , 20 ) ) {
            //in case of emergency
            console.log("waterfall queue length:", this.waterfall_queue.length);
            // add_problem("fft overflow");
            while( this.waterfall_queue.length ){
                waterfall_add( this.waterfall_queue.shift() );
            }
        }
    }
    initScale () {
        let scale_setup = () => {
            let scale_offset_freq_from_px = ( x, visible_range ) => {
                if( typeof visible_range === "undefined" ){
                    visible_range = this.get_visible_freq_range();
                }
                return (visible_range.start + visible_range.bw * ( x / this.webrx_canvas_container_width ) ) - this.centerFrequency;
            };
            let scale_canvas_end_drag = ( x ) => {
                this.canvas_container.css('cursor', "default");
                this.scale_canvas_drag_params.drag = false;
                this.scale_canvas_drag_params.mouse_down = false;
                let event_handled = false;
                for (let i = 0; i < this.demodulators.length; i++){
                    event_handled |= this.demodulators[i].envelope.drag_end(x);
                }
                if ( !event_handled ){
                    let offsetFrequency = scale_offset_freq_from_px( x );
                    this.demodulator_set_offset_frequency( 0, offsetFrequency );
                    setLogMode(this.centerFrequency + Math.floor(offsetFrequency));
                }
            };

            let scale_canvas_mousedown = ( evt ) => {
                this.scale_canvas_drag_params.mouse_down = true;
                this.scale_canvas_drag_params.drag = false;
                this.scale_canvas_drag_params.start_x = evt.pageX;
                this.scale_canvas_drag_params.key_modifiers.shiftKey = evt.shiftKey;
                this.scale_canvas_drag_params.key_modifiers.altKey = evt.altKey;
                this.scale_canvas_drag_params.key_modifiers.ctrlKey = evt.ctrlKey;
                evt.preventDefault();
            };
            let scale_canvas_mousemove = ( evt ) => {
                let event_handled;
                //we can use the main drag_min_delta thing of the main canvas
                if( this.scale_canvas_drag_params.mouse_down &&
                    !this.scale_canvas_drag_params.drag &&
                    Math.abs( evt.pageX - this.scale_canvas_drag_params.start_x ) > this.canvas_drag_min_delta ) {
                    this.scale_canvas_drag_params.drag = true;
                    //call the drag_start for all demodulators (and they will decide if they're dragged, based on X coordinate)
                    for (let i = 0;i < this.demodulators.length;i++){
                        event_handled |= this.demodulators[i].envelope.drag_start( evt.pageX, this.scale_canvas_drag_params.key_modifiers );
                    }
                    this.scale_canvas.css('cursor', 'mode');
                } else if( this.scale_canvas_drag_params.drag ) {
                    //call the drag_move for all demodulators (and they will decide if they're dragged)
                    for (let i = 0; i < this.demodulators.length;i++){
                        event_handled |= this.demodulators[i].envelope.drag_move(this.bandwidth, evt.pageX);
                    }
                    if (!event_handled) {
                        this.demodulator_set_offset_frequency( 0, scale_offset_freq_from_px(evt.pageX) );
                    }
                }
            };
            let scale_canvas_mouseup = ( evt ) => {
                scale_canvas_end_drag(evt.offsetX);
            };
//            $("#webrx-actual-freq").innerHTML = this.format_frequency("{x} MHz",
  //                                                                    this.canvas_get_frequency( window.innerWidth / 2 ), 1e6, 4);
            this.scale_canvas = $("#openwebrx-scale-canvas");
            this.scale_ctx = this.scale_canvas[0].getContext("2d");
            this.scale_canvas.off("mousedown");
            this.scale_canvas.on("mousedown", scale_canvas_mousedown);
            this.scale_canvas.off("mousemove");
            this.scale_canvas.on("mousemove", scale_canvas_mousemove);
            this.scale_canvas.off("mouseup");
            this.scale_canvas.on("mouseup", scale_canvas_mouseup);
            this.resize_scale();
        };

        if (this.waterfall_setup_done != 1) {
            scale_setup();
           this.mkzoomlevels();
            this.demodulators.push(new DemoduratorDefaultAnalog(0, 'nfm', this));
            this.mkenvelopes( this.get_visible_freq_range()); 
        }
        this.waterfall_setup_done = 1;
    }
    setDemodurator() {
        /* for demodurator */
        this.demodulators.push(new DemoduratorDefaultAnalog(0, 'nfm', this));

    }
    resize_scale () {
        //        this.scale_ctx.canvas.width  = window.innerWidth;
        this.scale_ctx.canvas.width  = this.webrx_canvas_container_width;
        this.scale_ctx.canvas.height =  47;
        this.mkscale();
    }
    resize_waterfall_container ( check_init ) {
        if( check_init && !this.waterfall_setup_done ){
            return;
        }
        let numHeight;

        this.mathbox_container.height(
            ( numHeight = window.innerHeight
              - $("#webrx-top-container").innerHeight()
              - $("#openwebrx-scale-container").innerHeight() ).toString() + "px");
        this.canvas_container.height = ( this.mathbox_container.height() );
        if( this.mathbox ){
            this.mathbox.three.renderer.setSize( document.body.offsetWidth, numHeight );
        }
    }
    resizeWaterfall (panelWidth) {
        this.webrx_canvas_container_width = panelWidth;
        this.resize_canvases();
        this.resize_waterfall_container(true);
        this.resize_scale();
        //check_top_bar_congestion();
    }
}
