/*! v1904B 2019/04 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
function e(what){ return document.getElementById(what); }
let audio_context = null;;
let initial_delay_sec = 0;
let scheduled_time = 0;
let audio_src;
let audio_compression="none";
let mute = false;
let volumeBeforeMute = 100.0;
let audio_flush_interval_ms=500; //the interval in which audio_flush() is called(not use)
let gainNode;
let volume;
const playChunk = (audio_src, scheduled_time) => {
    if (audio_src.start) {
        audio_src.start(scheduled_time);
    } else {
        audio_src.noteOn(scheduled_time);
    }
};
const audio_prepare = (audio_f32) => {
    var audio_buf = audio_context.createBuffer(1, audio_f32.length, 44100),
        audio_src = audio_context.createBufferSource(),
        current_time = audio_context.currentTime;
    audio_buf.getChannelData(0).set(audio_f32);

    audio_src.buffer = audio_buf;

    audio_src.connect(gainNode);
    gainNode.connect(audio_context.destination);
    gainNode.gain.value = volume;

    if (current_time < scheduled_time) {
        playChunk(audio_src, scheduled_time);
        scheduled_time += audio_buf.duration;
    } else {
        playChunk(audio_src, current_time);
        scheduled_time = current_time + audio_buf.duration + initial_delay_sec;
    }
};

const updateVolume = () => {
    // volume = parseFloat(e("receiver-volume").value) / 3276800.0;
    volume = parseFloat(e("vol").value) / 3276800.0;
};
const toggleMute = (arg) => {
    if ( typeof arg === "undefined" ) {
        //
    } else {
        mute = !arg;
    }
    if (mute) {
        mute = false;
        e("vol").value = volumeBeforeMute;
    } else {
        volumeBeforeMute = e("vol").value;
        e("vol").value=0;
        mute = true;
    }

    updateVolume();
};
const debug_audio = () => {
};
const on_ws_audio_recv = (evt) => {
    if(!(evt.data instanceof ArrayBuffer)) {
        console.log("on_ws_recv(): Not ArrayBuffer received...");
        console.log(evt.data);
    }else {
        const data = new Int16Array(evt.data);
        const buff = new Float32Array(data);
        audio_prepare(buff);
    }
};
const on_ws_audio_closed = () => {
    audio_node.disconnect();
};
/*const audio_flush = () => {
    flushed = true;
};*/
const audio_init1 = () => {
    try {
        window.AudioContext = window.AudioContext||window.webkitAudioContext;
        if ( audio_context == null ) {
            audio_context = new AudioContext( {
                sampleRate: 44100
            });
        }
        gainNode = audio_context.createGain();
    } catch (e) {
        console.log('Your browser does not support Web Audio API, which is required for WebRX to run. Please upgrade to a HTML5 compatible browser.', 1);
        return;
    }
};
const audio_init2 = () => {
    window.setTimeout(function(){window.setInterval(debug_audio,1000);},1000);
};
