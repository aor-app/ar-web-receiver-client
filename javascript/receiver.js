/*! receiver.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
class ViewController {
    constructor(mode = 'OFF'){
        this.mode = mode;
        this.processState = 'IDLE';
        this.powerOn = false;
    }
    updateMode(mode){
        this.mode = mode;
    }
    isExecutable(mode){
        return this.mode == mode;
    }
    waitIDLE () {
        let current = this;
        if ( this.processState == 'IDLE' ){
            return null;
        }else{
            return new Promise((resolve) => {
                setTimeout(() => {
                    current.waitIDLE();
                    resolve();
                }, 1000);
            });
        }
    }
}
const DOTS = 80;
const SPACE_CHAR_CODE = parseInt(20, 16);
const RECEIVER_LOW_FREQUENCY = 0.1; //0.1MHz
const RECEIVER_HIGHT_FREQUENCY = 1300; //1300MHz
const viewController = new ViewController('OFF');
let inputFrequency = false;
let waterfall = null;
let spectrumChart = null;
let restore = null;
let arReceiver = null ;
let timesync = 'ON';
const restoreRceiverState = async (frequency) => {
    if (restore){
        if (restore.mode) {
            await arReceiver.setDemodulateMode(restore.mode);
        }
        if (frequency) {
            await arReceiver.setFrequency(frequency);
        }else if (restore.frequency) {
            await arReceiver.setFrequency(restore.frequency * 1000000);
        }
        if (restore.ifbw) {
            await arReceiver.setIFbandwidth(restore.ifbw);
        }
    }
};
const updateSpectrum = async (func) => {
    // stop spectrum;
    viewController.updateMode('OFF');
    await viewController.waitIDLE();
    // restore
    await restoreRceiverState();
    // update 
    await func();
    // update display
    const receiverState = await arReceiver.getReceiverState();
    const receiverViewInfo = await getReceiverViewInfo(receiverState);
    updateReceiverDisplay(receiverViewInfo);
    const result = setSpectrumMode();
    /* tab unit*/
    if (result){
        waterfall.initScale();
    }
};
const addUpdateFrequencyByStep = (step) => {
    if (viewController.powerOn) {
        if (viewController.mode == 'SPECTRUM'){
            updateSpectrum(() => {
                return arReceiver.addStepFrequency(step);
            });
        }else{
            arReceiver.addStepFrequency(step);
        }
    }
};
const initReceiverTimeScheduleProcess = () => {
    let nowTime = moment();
    let setTime = moment(nowTime).startOf('hour').add(1, 'hour'); // +1min
    let waitTime = moment.duration(setTime.diff(nowTime));
    setTimeout ( () => {
        if ( timesync === 'ON' ){
            arReceiver.setTime(setTime);
            initReceiverTimeScheduleProcess();
        }
    }, waitTime );
};
const togglePanel = (panelId) => {
    $('.view-panel').removeClass('panel-hidden');
    $('.view-panel').removeClass('panel-show');
    $('.view-panel').addClass('panel-hidden');
    $(`#${panelId}`).removeClass('panel-hidden');
    $(`#${panelId}`).addClass('panel-show');
};
const setIFBandwidthButton = (ifbwList) =>{
    $('#ifbw-buttons').empty();
    for (let i = 0; i < ifbwList.length; i++){
        let item = ifbwList[i];
        let button = $('<a>', {
            class: 'ui-btn ui-shadow ui-btn-inline',
            href: '#',
            id: `ifbw-${item.id}`,
            text: item.text
        });
        const func = () => {
            arReceiver.setIFbandwidth(item.id);
        };
        button.on('click', func);
        $('#ifbw-buttons').append(button);
    }
};

const setStepAdjustButton = (frequencyStep) => {
    $('#frequency-step-adj-buttons').empty();
    for(let i = 0; i < frequencyStep.step_adjust_frequency.length; i++){
        let item = frequencyStep.step_adjust_frequency[i];
        let button = $('<a>', {
            class: 'ui-btn ui-shadow ui-btn-inline',
            href: '#',
            text: item.text
        });
        let func = () => {
            arReceiver.setFrequencyStepAdjust(item.value);
        };
        button.on('click', func);
        $('#frequency-step-adj-buttons').append(button);
    }
};
const updateReceiverDisplay = (receiverState) => {
    if (receiverState.VFO){
        $('#vfo-A').removeClass();
        $('#vfo-B').removeClass();
        $('#vfo-Z').removeClass();
        const frequencyStr = receiverState.frequency.toFixed(5);
        switch(receiverState.VFO){
        case 'A':
            $('#vfo-A').addClass('vfo-main');
            $('#vfo-B').addClass('vfo-sub');
            $('#vfo-Z').addClass('vfo-sub');
            if ( !inputFrequency ) {
                $('#vfo-A dd').text(frequencyStr);
            }
            break;
        case 'B':
            $('#vfo-A').addClass('vfo-sub');
            $('#vfo-B').addClass('vfo-main');
            $('#vfo-Z').addClass('vfo-sub');
            if ( !inputFrequency ) {
                $('#vfo-B dd').text(frequencyStr);
            }
            break;
        case 'Z':
            $('#vfo-A').addClass('vfo-sub');
            $('#vfo-B').addClass('vfo-sub');
            $('#vfo-Z').addClass('vfo-main');
            if ( !inputFrequency ) {
                $('#vfo-Z dd').text(frequencyStr);
            }
            break;
        default:
            break;
        }
    }
    if (receiverState.smeter){
        if ( receiverState.smeter.squelchOpened ){
            $('#squelchOpened').css('visibility', 'visible');
        }else{
            $('#squelchOpened').css('visibility', 'hidden');
        }
        if (receiverState.smeter.value != ''){
            $('#smeter-value').empty();
            for(let i = 0; i< parseInt(receiverState.smeter.value); i++){
                $('#smeter-value').append($('<span>',{
                    class: 'display-icon',
                    html: '&nbsp;'
                }));
            }
        }
    }
    if (receiverState.stepFrequency){
        let stepFrequencyStr = String(receiverState.stepFrequency) + 'k';
        if (receiverState.stepAdjustFrequency){
            if (receiverState.stepAdjustFrequency != 0 ){
                stepFrequencyStr = stepFrequencyStr + '+';
            }
        }
        $('#stepFrequency').text(stepFrequencyStr);
    }
    if (receiverState.mode){
        if ( receiverState.mode.digitalDecodeSettingMode ){
            if ( receiverState.mode.digitalDecodeSettingMode.name == 'AUTO') {
                $('#auto').css('visibility', 'visible');
                $('#digital-decode-mode').text(receiverState.mode.digitalDecodeReadingMode.name);
                $('#digital-decode-mode').data('key', receiverState.mode.digitalDecodeReadingMode.key);
            }else{
                $('#auto').css('visibility', 'hidden');
                $('#digital-decode-mode').text(receiverState.mode.digitalDecodeSettingMode.name);
                $('#digital-decode-mode').data('key', receiverState.mode.digitalDecodeSettingMode.key);
            }
        }
        if ( receiverState.mode.digitalModeEnable ){
            $('#digital-enabled').css('visibility', 'visible');
        } else {
            $('#digital-enabled').css('visibility', 'hidden');
        }
        if (receiverState.mode.analogReceiveMode){
            $('#analog-receive-mode').text(receiverState.mode.analogReceiveMode.name);
            $('#analog-receive-mode').data('key', receiverState.mode.analogReceiveMode.key);
        }
    }
    if (receiverState.IFBW ){
        $('#ifbw').text(receiverState.IFBW.text);
        $('#ifbw').data('ifbw-id', receiverState.IFBW.id);
    }
    // following lines added 2019/01/07
    if (receiverState.mode && receiverState.IFBW){
        if (( !(receiverState.mode.digitalModeEnable) && receiverState.mode.analogReceiveMode.name == 'FM' && receiverState.IFBW.id > 2 ) || (receiverState.mode.digitalDecodeSettingMode.name == 'AUTO')){
            $('#ctcss-block').show();
            $('#dcs-block').show();
            if (receiverState.CTCSS){
                $('#ctcss').val(receiverState.CTCSS.value).selectmenu('refresh');
            }
            if (receiverState.CTCSSFrequency){
                const CTCSSFrequencySettingValue = receiverState.CTCSSFrequency.value.substr(0,2);
                let CTCSSFrequencyActivatingValue = null;
                if (CTCSSFrequencySettingValue == '99'){
                    CTCSSFrequencyActivatingValue = receiverState.CTCSSFrequency.value.substr(2,2);
                }else{
                    CTCSSFrequencyActivatingValue = CTCSSFrequencySettingValue;
                }
                if (CTCSSFrequencyActivatingValue == '00' ){
                    CTCSSFrequencyActivatingValue = '99';
                }
                let CTCSSFrequencyActivatingValueText = '';
                for (let i = 0; i < $('#ctcss-frequency').children().length; i++){
                    if ($('#ctcss-frequency').children().eq(i).val() == CTCSSFrequencyActivatingValue ){
                        CTCSSFrequencyActivatingValueText = $('#ctcss-frequency').children().eq(i).text();
                        break;
                    }
                }
                $('#ctcss-frequency').val(CTCSSFrequencySettingValue).selectmenu('refresh');
                $('#ctcss-val').text($('#ctcss option:selected').text() + ' / ' + CTCSSFrequencyActivatingValueText);
            }
            if (receiverState.DCS){
                $('#dcs').val(receiverState.DCS.value).selectmenu('refresh');
            }
            if (receiverState.DCSCode){
                const DCSCodeSettingValue = receiverState.DCSCode.value.substr(0,3);
                let DCSCodeActivatingValue = null;
                if (DCSCodeSettingValue == '999'){
                    DCSCodeActivatingValue = receiverState.DCSCode.value.substr(3,3);
                }else{
                    DCSCodeActivatingValue = DCSCodeSettingValue;
                }
                if (DCSCodeActivatingValue == '000'){
                    DCSCodeActivatingValue = '999';
                }
                let DCSCodeActivatingValueText = '';
                for (let i = 0; i < $('#dcs-code').children().length; i++){
                    if ($('#dcs-code').children().eq(i).val() == DCSCodeActivatingValue ){
                        DCSCodeActivatingValueText = $('#dcs-code').children().eq(i).text();
                        break;
                    }
                }

                $('#dcs-code').val(DCSCodeSettingValue).selectmenu('refresh');
                $('#dcs-val').text($('#dcs option:selected').text() + ' / ' + DCSCodeActivatingValueText);
            }
        }else{
            $('#ctcss-block').hide();
            $('#dcs-block').hide();
        }
        if ( receiverState.mode.digitalModeEnable ){
            if (receiverState.DCREncryptionCode){
                $('#dcr-encryption-code-disp').text(receiverState.DCREncryptionCode.value);
                $('#dcr-encryption-code-block').show();
            }
        }else{
            $('#dcr-encryption-code-block').hide();
        }
    }
// above lines added 2019/01/06
// following lines added 2019/03/26 for T-TC Slot button
    if (receiverState.mode && receiverState.IFBW){
        if (receiverState.mode.digitalDecodeSettingMode.name == 'T_TC'){
            $('#ttc-slot-block').show();
        }else{
            $('#ttc-slot-block').hide();
        }
    }
// above lines added 2019/03/26
};
const updateReceiverLog = (log) => {
    const durationText = (durationSec) => {
        if ( durationSec ){
            const min = Math.floor(durationSec / 60);
            const sec = durationSec - min * 60;
            return `${paddingZero(min)}:${paddingZero(sec)}`;
        } else {
            return '';
        }
    };
    const getAtStr = (at) => {
        const month = paddingZero(at.getMonth() + 1);
        const day = paddingZero(at.getDate());
        const hour = paddingZero(at.getHours());
        const minute = paddingZero(at.getMinutes());
        const second = paddingZero(at.getSeconds());
        return `${month}${day} ${hour}:${minute}:${second}`;
    };

    if ( !log ){
        return;
    }
    if ( log.endTime == null){
        return;
    }

    const tr = $('<tr>');
    const dateTime = $('<td>', {
        class: 'receiver-log-datetime',
        text: getAtStr(log.startTime)
    });
    const dur = $('<td>', {
        class: 'receiver-log-duration',
        text: durationText(log.duration)
    });
    const strFrequency = '0'.repeat(10 - String(log.frequency.toFixed(5)).length) + log.frequency.toFixed(5);
    const freq = $('<td>', {
        class: 'receiver-log-frequency',
        html: strFrequency
    });
    const mode = $('<td>', {
        class: 'receiver-log-mode',
        text: log.mode.name
    });
    const lev = $('<td>', {
        class: 'receiver-log-level',
        text: log.smeter
    });
    const degiInfo = $('<td>', {
        class: 'receiver-log-digitalInfo',
        text: (log.digitalAdditionalInfo == null ? '': log.digitalAdditionalInfo)
    });
    tr.append(
        dateTime,
        dur,
        freq,
        mode,
        lev,
        degiInfo
    );
    $('#receiver-log').append(tr);
    $('#receiver-log').scrollTop($('#receiver-log')[0].scrollHeight);
};
let log = null;
const receiveDigitalAdditionalInfo = async (data) => {
    const receiverState = await arReceiver.getReceiverState();
    const receiverViewInfo = await getReceiverViewInfo(receiverState, data);
    updateReceiverDisplay(receiverViewInfo);
    updateReceiverLog(receiverViewInfo.log);
};
const getReceiverViewInfo = async (data, digitalAdditionalInfo) => {
    //
    let mode = new ReceivingMode(data.mode);
    let stepAdjustFrequency = await arReceiver.getFrequencyStepAdjust();
    if (stepAdjustFrequency.code != 0) {
        stepAdjustFrequency = null;
    }else{
        stepAdjustFrequency = stepAdjustFrequency.value;
    }
    let ifbandwidth = await arReceiver.getIFbandwidth();
    if (ifbandwidth.code != 0){
        ifbandwidth = null;
    }else{
        ifbandwidth = mode.ifbw(ifbandwidth.value);
    }
// following lines added 2019/01/07
    let CTCSS = await arReceiver.getCTCSS();
    if (CTCSS.code != 0){
        CTCSS = null;
    }
    let CTCSSFrequency = await arReceiver.getCTCSSFrequency();
    if (CTCSSFrequency.code != 0){
        CTCSSFrequency = null;
    }
    let DCS = await arReceiver.getDCS();
    if (DCS.code != 0){
        DCS = null;
    }
    let DCSCode = await arReceiver.getDCSCode();
    if (DCSCode.code != 0){
        DCSCode = null;
    }
    let DCREncryptionCode = await arReceiver.getDCREncryptionCode();
    if (DCREncryptionCode.code != 0){
        DCREncryptionCode = null;
    }
// above lines added 2019/01/07
    const duration = (startTime, endTime) => {
        return  Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    };

    const now = new Date();
    if ( arReceiver.isSquelchOpened(data.smeter) ){
        if ( log ){
            if ( log.endTime ){
                // delete
                log = null;
            }else{
                // now logging
                if ( log.frequency != data.frequency ||
                     log.mode.name != mode.mode.name ){
                    //change frequency or mode --> end and start
                    // end
                    log.endTime = now;
                    log.duration = duration(log.startTime, log.endTime);
                }else{
                }
            }
        }else {
            // start logging
            log = {
                frequency: data.frequency,
                smeter: arReceiver.parseSmeter(data.smeter),
                mode: mode.mode,
                digitalAdditionalInfo: digitalAdditionalInfo,
                startTime: now,
                endTime: null,
                duration: null
            };
        }
    } else {
        if ( log ){
            if ( log.endTime ){
                // delete
                log = null;
            }else{
                // end logging
                log.endTime = now;
                log.duration = duration(log.startTime, log.endTime);
            }
        } else {
            // not logging
        }
    }

    return {
        VFO: data.vfo,
        frequency: data.frequency,
        stepFrequency: data.stepFrequency,
        stepAdjustFrequency: stepAdjustFrequency,
        IFBW: ifbandwidth,
        smeter: {
            squelchOpened: arReceiver.isSquelchOpened(data.smeter),
            value: arReceiver.parseSmeter(data.smeter)
        },
        mode: mode,
        // following lines added 2019/01/06
        CTCSS: CTCSS,
        CTCSSFrequency: CTCSSFrequency,
        DCS: DCS,
        DCSCode: DCSCode,
        DCREncryptionCode: DCREncryptionCode,
        // above lines added 2019/01/06
        log: log
    };
};
const updateReceiverViewProcess = async (data) => {
    const receiverViewInfo = await getReceiverViewInfo(data);
    updateReceiverDisplay(receiverViewInfo);
    updateReceiverLog(receiverViewInfo.log);
} ;
const setLogMode = async (frequency) => {
    let receiverStateId = null;
    viewController.updateMode('OFF');
    await viewController.waitIDLE();
    await restoreRceiverState(frequency);

    await arReceiver.setReceiverStateNotification('05', 2);
    await arReceiver.setDigitalDataOutput('1', 2);

    viewController.updateMode('LOG');
    restore = null;
    $('#spectrum-panel-tab').removeClass('ui-btn-active');
    $('#waterfall-panel-tab').removeClass('ui-btn-active');
    if (mute){
        // vol = 0!
        toggleMute(false);
    }

};
const updateSpectrumViewProcess = async (centerFrequency, span) => {
    const getSpectrumData = () => {
        const task = async () => {
            let data = [];
            let startFrequency = centerFrequency - span / 2;
            let endFrequency = centerFrequency + span / 2;
            let stepFrequency = span / DOTS;
            let wait_miri_sec = $('#spectrum-wait-time').val();
            if (!wait_miri_sec){
                wait_miri_sec = 50;
            }
            let mode = $('#spectrum-mode').text();
            if (!mode){
                mode = 'FM';
            }
            let ifbw = $('#spectrum-ifbw').val();
            let stepFrequencyKHz = stepFrequency * 1000; //MHZ -> KHz
            if (ifbw == 'default'){
                if (stepFrequencyKHz > 100 ){
                    ifbw = '0'; // 200
                }else if (stepFrequencyKHz > 50) {
                    ifbw = '1'; // 100
                }else if (stepFrequencyKHz > 12 ) {
                    ifbw = '2'; // 30
                }else if (stepFrequencyKHz > 6 ) {
                    ifbw = '3'; // 15
                }else {
                    ifbw = '4'; // 6
                }
            }

            await arReceiver.setDemodulateMode(mode);
            await arReceiver.setIFbandwidth(ifbw);

            for(let i = 0; i < DOTS; i++){
                if ( viewController.isExecutable('SPECTRUM')){
                    viewController.processState = 'BUSY';
                    let frequency = startFrequency + stepFrequency * i;
                    await arReceiver.setFrequency(frequency * 1000000);
                    await new Promise( (resolve) => {
                        setTimeout( async () => {
                            resolve();
                        },  wait_miri_sec);
                    });
                    let result = await arReceiver.getSmeter();
                    if (result && result.code == 0){
                        let state = result.value[0];
                        let smeter = parseInt(result.value.substr(1,2));
                        let char = String.fromCharCode(smeter + SPACE_CHAR_CODE);
                        data.push(char);
                    }else{
                        console.log('error');
                        data.push(null);
                    }
                }else{
                    viewController.processState = 'IDLE';
                    return { code: -1, message: 'canceled.'};
                }
            }

            return { code: 0, value: data.join('') };
        };
        return new Promise((resolve, reject) => {
            task().then(
                result => {
                    resolve(result);
                },
                error => {
                    reject(error);
                });
        });

    };
    const exe = () => {
        setTimeout( () => {
            if (viewController.isExecutable('SPECTRUM')){
                updateSpectrumViewProcess(centerFrequency, span);
                viewController.processState = 'BUSY';
            }else{
                // stoped
                viewController.processState = 'IDLE';
            }
        }, 500);
    };
    try {
        const result  = await getSpectrumData();
        if (result && result.code == 0){
            let spectrumData = new Array();
            let waterfallData = new Array();
            if ( result.value !== null ){
                for(let i = 0; i < result.value.length; i++){
                    let charCode = result.value.charCodeAt(i);
                    let spaceCharCode = parseInt(20, 16);
                    let dBNum = charCode - spaceCharCode;
                    spectrumData.push(dBNum -110); //-110dB
                    waterfallData.push(dBNum);
                }
                drawSpectrumChart(centerFrequency, span , spectrumData);
                drawWaterfall(waterfallData);
            }
            exe();
        } else {
            console.log('false');
            exe();
        }
    }catch(e){
        console.log('exception');
        console.log(e.message);
        exe();
    }
};
const drawSpectrumChart = (centerFrequency, bandwidth, spectrumData) => {
    if ( !spectrumChart ){
        let spectrumChartDom = $('#spectrum-chart');
        let frequencyList = new Array;
        let startFrequency = centerFrequency - bandwidth / 2 ;
        let step = bandwidth / DOTS;
        let borderColors = new Array();
        for(let i = 0; i < DOTS; i++) {
            let frequency = (Math.round((startFrequency + step * i) * 1000000) / 1000000 ).toString() + 'MHz';
            frequencyList.push(frequency);
            if (i / ( DOTS / 2 ) == 1){
                borderColors.push('red');
            }else{
                borderColors.push('#E5E5E5');
            }
        }
        spectrumChart = new Chart(spectrumChartDom, {
            type: 'line',
            data: {
                labels: frequencyList,
                datasets: [{
                    data: spectrumData,
                    pointRadius: 0,
                    showLine: true
                }]
            },
            options: {
                maintainAspectRaito: false,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            min: -110,
                            max: 0
                        }
                    }],
                    xAxes: [{
                        gridLines: {
                            drawBorder: false,
                            color: borderColors
                        },
                        ticks: {
/*                            callback: (value, index, values) => {
                                console.log(index);
                                if (index % 10 == 0 || index == values.length - 1){
                                    console.log(`print: ${index} : ${value}`);
                                    return value;
                                }else{
                                     return '';
                                }
                            } */
                        }
                    }]
                },
                events: ['click'],
                onClick: (e, el) => {
                    const datasetMeta = spectrumChart.getDatasetMeta(0);
                    let selectFrequency = null;
                    for(let i = 0; i < datasetMeta.data.length; i++){
                        let truncVal = Math.floor(datasetMeta.data[i]._model.x);
                        if (truncVal == e.offsetX){
                            selectFrequency = parseFloat(frequencyList[i].replace(/MHz/g, ''))* 1000000;
                            break;
                        }else if (truncVal > e.offsetX){
                            const minFrequency = parseFloat(frequencyList[i - 1].replace(/MHz/g, ''));
                            const minPosition = datasetMeta.data[i-1]._model.x;
                            const maxPosition = datasetMeta.data[i]._model.x;
                            const range = maxPosition - minPosition;
                            const position = ( e.offsetX - minPosition ) / range;
                            selectFrequency = step * 1000000 * position + minFrequency * 1000000;
                            break;
                        }else{
                            continue;
                        }
                    }
                    setLogMode(selectFrequency);
                }
            }
        });
    }else{
        for(let i = 0; i < spectrumData.length; i++){
            spectrumChart.data.datasets[0].data[i] = spectrumData[i];
        }
        spectrumChart.update();
    }
};
const drawWaterfall = (waterfallData) => {
    waterfall.waterfall_add_queue(waterfallData);
    waterfall.waterfall_dequeue();
};
const setSpectrumMode = async () => {
    const spectrumParamIsValid = (centerFrequency, span) => {
        let startFrequency = centerFrequency - span / 2;
        let endFrequency = centerFrequency + span / 2;
        if (startFrequency < RECEIVER_LOW_FREQUENCY ){
            return false;
        }
        if (endFrequency > RECEIVER_HIGHT_FREQUENCY){
            return false;
        }
        return true;
    };
    const panelWidth = $('.panel-show').width(); // becase waterfall panel width = 0
    const newCenterFrequency = $('dl.vfo-main dd').text();
    const newBandwidth = $('#spectrum-span').val();

    if (!spectrumParamIsValid(newCenterFrequency, newBandwidth)){
        let message = 'Spectrum\'s span exceeds AR-DV1\'s receivable frequency.<br/>AR-DV1\'s receivable frequency is 100kHz - 1300MHz.<br /> Please check "Settings"Tab\'s "SPECTRUM SPAN" or current Frequency.';
        showPopup('Error', message);
        return false;
    }

    viewController.updateMode('OFF');
    // for restore
    let restoreMode = null;
    if ($('#auto').css('visibility') == 'visible') {
        restoreMode = 'AUTO';
    }else if ($('#digital-decode-mode').text() != '') {
        restoreMode = $('#digital-decode-mode').data('key');
    }else {
        restoreMode = $('#analog-receive-mode').data('key');
    }
    let restoreFrequency =  newCenterFrequency;
    let ifbw = $('#ifbw').data('ifbw-id');
    restore = {
        mode: restoreMode,
        frequency: restoreFrequency,
        ifbw: ifbw
    };
    // init waterfall and spectrumchart
    waterfall = null;
   waterfall = new Waterfall(newBandwidth * Math.pow(10, 6),
                              newCenterFrequency * Math.pow(10, 6),
                              DOTS,
                              9,
                              panelWidth);
    waterfall.waterfallColorsDefault();
    if ( spectrumChart ){
        spectrumChart.destroy();
        spectrumChart = null;
    }

    await viewController.waitIDLE();
    /* set notification */
    await arReceiver.setReceiverStateNotification('00');
    await arReceiver.setDigitalDataOutput('0');
    viewController.updateMode('SPECTRUM');
    updateSpectrumViewProcess(newCenterFrequency, newBandwidth);
    if (!mute) {
        toggleMute(true);
    }

    return true;
};
const startARReceiverClient = async (session) => {
    const initReceiverTime = async () => {
        const setTimeToReceiver = (time, waitTime) => {
            return new Promise((resolve) => {
                setTimeout( async () => {
                    if ( timesync === 'ON'){
                        let result = await arReceiver.setTime(time);
                        if(result && result.code == 0){
                            resolve();
                        }else{
                            initReceiverTime();
                        }
                    }
                }, waitTime);
            });
        };
        let nowTime = moment();
        let setTime = moment(nowTime).startOf('minute').add(1, 'minute'); // +1min
        let waitTime = moment.duration(setTime.diff(nowTime));
        await setTimeToReceiver(setTime, waitTime);
    };
    /* start */
    showLoadingAnimation('Power on receiver...');
    viewController.updateMode('OFF');
    receiver_init();
    try {
        arReceiver = new ARReceiver();
        const result = await arReceiver.powerOn();
        if (result.code != 0){
            throw new Error(result.message);
        }
        const setVFOResult = await arReceiver.selectVFO('A');
        if (result.code != 0){
            throw new Error(result.message);
        }
        const volume = await arReceiver.getVolume();
        if (result.code != 0){
            throw new Error(result.message);
        }
        const vfoInfo = await arReceiver.getVFO();
        if (result.code != 0){
            throw new Error(result.message);
        }
        const squelch = await arReceiver.getLevelSquelch();
        if (result.code != 0){
            throw new Error(result.message);
        }
        const digitalDataOutput = await arReceiver.getDigitalDataOutput();
        if (result.code != 0){
            throw new Error(result.message);
        }
        const currentVFO = vfoInfo.value.find( (item) => {
            return item.vfo == 'A';
        });
        const receivingMode = new ReceivingMode(currentVFO.mode);
        viewController.powerOn = true;
        setIFBandwidthButton(receivingMode.ifbwList);
        let stepFrequency = null;
        for ( let key in FREQUENCY_STEP ) {
            let item = FREQUENCY_STEP[key];
            if  (parseFloat(item.value) == parseFloat(currentVFO.stepFrequency)) {
                stepFrequency = item;
                break;
            }
        }
        setStepAdjustButton(stepFrequency);
        for(let vfoinfo of vfoInfo.value){
            let frequnecy = '';
            if ( vfoinfo.frequency ){
                frequnecy = vfoinfo.frequency.toFixed(5);
            }
            $(`#vfo-${vfoinfo.vfo} dd > p`).text(frequnecy);
        }
        $('#digital-data-output').val(digitalDataOutput.value);
        $('#digital-data-output').flipswitch('refresh');

        $('#vol').val(volume.value);
        $('#vol').slider('refresh');
        $('#squelch-val').val(squelch.value);
        $('#squelch-val').slider('refresh');
        //
        if (mute){
            // vol = 0!
            toggleMute(false);
        }

        timesync = 'ON';
        initReceiverTime();
        //
        setLogMode();
        //
        initReceiverTimeScheduleProcess();
        hideLoadingAnimation();
    }catch (e) {
        hideLoadingAnimation();
        showPopup('Error', e.message);
    }
};
const initalizeSetting = () => {
    const setupFrequencyStepButton = () => {
        $('#frequency-step-buttons').empty();
        for( let key in FREQUENCY_STEP ){
            let item = FREQUENCY_STEP[key];
            let id = `frequency-step-${key}`;
            let button =  $('<a>', {
                href: '#',
                class: 'ui-btn ui-shadow ui-btn-inline',
                id: id,
                text: item.text
            });
            const func = () => {
                setStepAdjustButton(item);
                arReceiver.setFrequencyStep(item.value);
            };
            button.on('click', func );
            $('#frequency-step-buttons').append(button);
        }
    };
    const setupModeButton = () => {
        $('#mode-buttons').empty();
        for( let key in MODE ){
            let item = MODE[key];
            let id = `mode-${key}`;
            let button =  $('<a>', {
                href: '#',
                class: 'ui-btn ui-shadow ui-btn-inline',
                id: id,
                text: item.name
            });
            let func = () => {
                arReceiver.setDemodulateMode(key);
                setIFBandwidthButton(item.ifbw);
            };
            button.on('click', func );
            $('#mode-buttons').append(button);
        }
    };
    const setupKeypad = () => {
        $('.key-pad').on('tap', (event) => {
            const value = event.target.dataset.value;
            let frequency = $('.vfo-main dd').text();
            switch(value){
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
            case '0':
                if ( inputFrequency ){
                    $('.vfo-main dd').text(frequency + value);
                }else{
                    inputFrequency = true;
                    $('.vfo-main dd').text(value);
                }
                break;
            case '.':
                if ( !inputFrequency ){
                    return;
                }
                if ( frequency.length === 0 ||
                     frequency.match(/\./)
                   ){
                    return;
                }
                $('.vfo-main dd').text(frequency + value);
                break;
            case 'CLR':
                if ( !inputFrequency ){
                    return;
                }
                if ( frequency.length === 0 ){
                    return;
                }
                frequency = frequency.slice(0, -1);
                if ( frequency.length === 0 ){
                    inputFrequency = false;
                } else {
                    $('.vfo-main dd').text(frequency);
                }
                break;
            case 'ENT':
                if ( !inputFrequency ){
                    return;
                }
                if ( frequency.length === 0 ){
                    return;
                }
                if (viewController.powerOn) {
                    if (viewController.mode == 'SPECTRUM'){
                        updateSpectrum(() => {
                            frequency = parseFloat(frequency) * 1000000;
                            inputFrequency = false;
                            return arReceiver.setFrequency(frequency);
                        });
                    }else{
                        frequency = parseFloat(frequency) * 1000000;
                        inputFrequency = false;
                        arReceiver.setFrequency(frequency);
                    }
                }
                break;
            default:
                break;
            }
        });
    };
    const setupVFOButton = () => {
        $('.vfo-button').on('tap', (event) => {
            const value = event.target.dataset.value;
            if (viewController.powerOn) {
                if (viewController.mode == 'SPECTRUM'){
                    updateSpectrum(() => {
                        return arReceiver.selectVFO(value);
                    });
                }else{
                    arReceiver.selectVFO(value);
                }
            }
        });
    };
    setupFrequencyStepButton();
    setupModeButton();
    setupKeypad();
    setupVFOButton();
    togglePanel('settings-panel');
};
const stopARReceiverClient = async () => {
    viewController.updateMode('OFF');
    timesync = 'OFF';
    closeWebsocket();
    showLoadingAnimation('Power off receiver...');
    await viewController.waitIDLE();
    let result = await arReceiver.powerOff();
    viewController.powerOn = false;
    hideLoadingAnimation();
    if ( result == -99) {
        $('#power').val('1');
        showPopup('Error', result.message);
    } else if ( result.code == -2 ){
        $('#power').val('1');
        showPopup('Receiver', result.message);
    } else {
        showPopup('Receiver', 'Powered off complete.');
    }
};
$(document).on('pageshow', '#main', () => {
    initalizeSetting();
    checkSession();
});
$(document).on('click', '#fn-frequency-10up', () => {
    addUpdateFrequencyByStep(10);
});
$(document).on('click', '#fn-frequency-1up', () => {
    addUpdateFrequencyByStep(1);
});
$(document).on('click', '#fn-frequency-10down', () => {
    addUpdateFrequencyByStep(-10);
});
$(document).on('click', '#fn-frequency-1down', () => {
    addUpdateFrequencyByStep(-1);
});
$(document).on('click', '#settings-panel-tab', () => {
    if (viewController.powerOn) {
        setLogMode();
    }
    togglePanel('settings-panel');
});
$(document).on('click', '#spectrum-panel-tab', () => {
    if (viewController.powerOn) {
        let result = setSpectrumMode();
    }
    togglePanel('spectrum-panel');
});
$(document).on('click', '#log-panel-tab', () => {
    if (viewController.powerOn) {
        setLogMode();
    }
    togglePanel('log-panel');
});
$(document).on('click', '#waterfall-panel-tab', () => {
    let result = null;
    if (viewController.powerOn) {
        result = setSpectrumMode();
    }
    togglePanel('waterfall-panel');
    if (result){
        waterfall.initScale();
    }
});
$(document).on('change', '#digital-data-output', () => {
    arReceiver.setDigitalDataOutput($('#digital-data-output').val());
});
$(document).on('change', '#power', () => {
    if ($('#power').val() == '1') {
        startARReceiverClient();
    }else{
        stopARReceiverClient();
    }
});
$(document).on('slidestop', '#squelch-val', () => {
    arReceiver.setLevelSquelch(parseInt($('#squelch-val').val()));
});
$(document).on('slidestop', '#vol', () => {
    arReceiver.setVolume(parseInt($('#vol').val()));
});
$(window).on('resize', () => {
    if (waterfall){
        waterfall.resizeWaterfall($('.panel-show').width());
    }
});
$(document).on('keyup','#spectrum-span',() => {
    $('#spectrum-span').val($('#spectrum-span').val().replace(/[^0-9\.]/g, ''));
});
$(document).on('change', '#spectrum-span', () => {
    let input_value = null;
    if ($('#spectrum-span').val() == ''){
        input_value = '10.0';
    }else{
        input_value = $('#spectrum-span').val().split('.');
        if( input_value.length < 2 ){
            input_value = input_value[0] + '.0';
        }else{
            input_value = input_value[0] + '.' + input_value[1];
        }
    }
    let roundValue = round(parseFloat(input_value), 2);

    if ( roundValue > 10.0 ){
        $('#spectrum-span').val('10.0');
    }else if (roundValue < 0.4){
        $('#spectrum-span').val('0.4');
    }else{
        $('#spectrum-span').val(String(roundValue.toFixed(1)));
    }
});
$(document).on('keyup','#spectrum-wait-time',() => {
    $('#spectrum-wait-time').val($('#spectrum-wait-time').val().replace(/[^0-9]/g, ''));
});
$(document).on('beforeunload', () => {
    viewController.updateMode('OFF');
    timesync = 'OFF';
    closeWebsocket();
});
// following lines added 2019/01/06
$(document).on('change','#ctcss',() => {
    arReceiver.setCTCSS($('#ctcss option:selected').val());
});
$(document).on('change','#ctcss-frequency',() => {
    arReceiver.setCTCSSFrequency($('#ctcss-frequency option:selected').val());
});
$(document).on('change','#dcs',() => {
    arReceiver.setDCS($('#dcs option:selected').val());
});
$(document).on('change','#dcs-code',() => {
    arReceiver.setDCSCode($('#dcs-code option:selected').val());
});
$(document).on('keyup','#dcr-encryption-code',() => {
    $('#dcr-encryption-code').val($('#dcr-encryption-code').val().replace(/[^0-9]/g, ''));
});
$(document).on('change', '#dcr-encryption-code', () => {
    let input_value = $('#dcr-encryption-code').val();
    if ( input_value > 32767 ){
        $('#dcr-encryption-code').val('00000');
    }else{
        $('#dcr-encryption-code').val(('00000' + $('#dcr-encryption-code').val()).slice(-5));
    }
});
$(document).on('click', '#setDCREncryptionCode', () => {
    arReceiver.setDCREncryptionCode($('#dcr-encryption-code').val());
});
$(document).on('click', '#getDCREncryptionCode', () => {
    $('#dcr-encryption-code').val($('#dcr-encryption-code-disp').text());
});
// above lines added 2019/01/06
// following lines added 2019/03/26
$(document).on('click', '#T-TC-slot-auto', () => {
    arReceiver.setTTCSlot(0);
});
$(document).on('click', '#T-TC-slot-1', () => {
    arReceiver.setTTCSlot(1);
});
$(document).on('click', '#T-TC-slot-2', () => {
    arReceiver.setTTCSlot(2);
});
$(document).on('click', '#T-TC-slot-3', () => {
    arReceiver.setTTCSlot(3);
});
$(document).on('click', '#T-TC-slot-4', () => {
    arReceiver.setTTCSlot(4);
});
// above lines added 2019/03/26
