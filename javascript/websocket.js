/*! websocket.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
let ws = null;
const ws_url = `ws://${SERVER_URL}`;
const receiver_init = () => {
    open_websocket();
    /* audio init */
    audio_init1();
    audio_init2();
    toggleMute(true);
};
const closeWebsocket = () => {
    ws.close();
};
const on_ws_opened = () =>{
    console.log("WebSocket opened to "+ws_url);
};
const on_ws_recv = (evt) => {
    if(!(evt.data instanceof ArrayBuffer)) {
        const data = JSON.parse(evt.data);
        switch(data.command){
        case 'RX':
            updateReceiverViewProcess(data.data, null);
            break;
        case 'DK':
            receiveDigitalAdditionalInfo(data.data);
            break;
        default:
            break;
        }
    }else {
        on_ws_audio_recv(evt);
    }
};
const on_ws_closed = () => {
    try {
        on_ws_audio_closed();
    } catch (e) {
        // don't care
    }
    console.log("WebSocket has closed unexpectedly. Please reload the page.", 1);
};
const on_ws_error = (event) => {
    console.log("WebSocket error.",1);
};
const open_websocket = () => {
    if (!("WebSocket" in window))
        console.log("Your browser does not support WebSocket, which is required for WebRX to run. Please upgrade to a HTML5 compatible browser.");
    ws = new WebSocket(ws_url);
    ws.onopen = on_ws_opened;
    ws.onmessage = on_ws_recv;
    ws.onclose = on_ws_closed;
    ws.binaryType = "arraybuffer";
    window.onbeforeunload = function() {
        ws.onclose = function () {};
        ws.close();
    };
    ws.onerror = on_ws_error;
};
