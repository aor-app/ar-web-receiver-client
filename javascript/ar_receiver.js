/*! ar_receiver.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
class ARReceiver {
    constructor(){
        this.log = null;
    }
    async sendCommand (method, command, value, retryCount=0,param=null) {
        const _sendCommand = (method, command, value, param) => {
            return sendCommand(method, 'receiver', command, value, param);
        };
        let result = await _sendCommand(method, command, value, param);
        if (result.code == -1){
            console.log('code -1');
            throw new Error(result.message);
        }
        if ( result.code != 0 && retryCount > 0){
            return new Promise((resolve)=> {
                setTimeout(async () => {
                    await this.sendCommand(method, command, value, retryCount--, param);
                    resolve();
                });
            });
        }else{
            return result;
        }
    }
    powerOn (retryCount=0) {
        return this.sendCommand('POST', 'power', { value: '1'}, retryCount);
    }
    powerOff (retryCount=0) {
        return this.sendCommand('POST', 'power', { value: '0'}, retryCount);
    }
    setFrequency (value, retryCount=0){
        const frequency = (value / 1000000);
        return this.sendCommand('POST', 'frequency', { value: frequency}, retryCount);
    }
    addStepFrequency (value, retryCount=0) {
        return this.sendCommand('POST', 'frequency', { step: value}, retryCount);
    }
    setTime (value, retryCount) {
        const timeStr = value.format('YYMMDDHHmm');
        return this.sendCommand('POST', 'time', { value: timeStr}, retryCount);
    }
    setVolume (value, retryCount=0){
        return this.sendCommand('POST', 'volume', { value: value }, retryCount);
    }
    setReceiverStateNotification(value, retryCount=0){
        return this.sendCommand('POST', 'receiver_state_notification', { value: value }, retryCount);
    }
    setLevelSquelch (value, retryCount=0){
        return this.sendCommand('POST', 'level_squelch', { value: value }, retryCount);
    }
    setDigitalDataOutput (value, retryCount=0){
        return this.sendCommand('POST', 'digital_data_output', { value: value }, retryCount);
    }
    setFrequencyStepAdjust (value,retryCount=0){
        return this.sendCommand('POST', 'frequency_step_adjust', { value: value }, retryCount);
    }
    selectVFO (value, retryCount=0) {
        return this.sendCommand('POST', 'vfo', { value: value },retryCount);
    }
    setFrequencyStep (value, retryCount=0){
        return this.sendCommand('POST', 'frequency_step', { value: value }, retryCount);
    }
    setDemodulateMode (value, retryCount=0){
        let setModeCode = '';
        switch (value){
        case 'AUTO':
            setModeCode = '000';
            break;
        case 'DSTR':
            setModeCode = '010';
            break;
        case 'YAES':
            setModeCode = '020';
            break;
        case 'ALIN':
            setModeCode = '030';
            break;
        case 'D_CR':
            setModeCode = '040';
            break;
        case 'P_25':
            setModeCode = '050';
            break;
        case 'DPMR':
            setModeCode = '060';
            break;
        case 'DMR':
            setModeCode = '070';
            break;
        case 'T_DM':
            setModeCode = '080';
            break;
        case 'FM':
            setModeCode = '0F0';
            break;
        case 'AM':
            setModeCode = '0F1';
            break;
        case 'SAH':
            setModeCode = '0F2';
            break;
        case 'SAL':
            setModeCode = '0F3';
            break;
        case 'USB':
            setModeCode = '0F4';
            break;
        case 'LSB':
            setModeCode = '0F5';
            break;
        case 'CW':
            setModeCode = '0F6';
            break;
        default:
        }

        return this.sendCommand('POST', 'demodulate_mode', { value: setModeCode }, retryCount);
    }
    setIFbandwidth (value, retryCount=0) {
        return this.sendCommand('POST', 'ifbandwidth', { value: value }, retryCount);
    }
    getVolume (retryCount=0) {
        return this.sendCommand('GET', 'volume', null, retryCount);
    }
    getVFO (retryCount=0) {
        return this.sendCommand('GET', 'vfo', null,retryCount);
    }
    getLevelSquelch (retryCount=0) {
        return this.sendCommand('GET', 'level_squelch', null, retryCount);
    }
// following lines added 2019/01/06
    setCTCSS (value, retryCount=0) {
        return this.sendCommand('POST', 'ctcss', { value: value }, retryCount);
    }
    getCTCSS (retryCount=0) {
        return this.sendCommand('GET', 'ctcss', null, retryCount);
    }
    setCTCSSFrequency (value, retryCount=0) {
        return this.sendCommand('POST', 'ctcss_frequency', { value: value }, retryCount);
    }
    getCTCSSFrequency (retryCount=0) {
        return this.sendCommand('GET', 'ctcss_frequency', null, retryCount);
    }
    setDCS (value, retryCount=0) {
        return this.sendCommand('POST', 'dcs', { value: value }, retryCount);
    }
    getDCS (retryCount=0) {
        return this.sendCommand('GET', 'dcs', null, retryCount);
    }
    setDCSCode (value, retryCount=0) {
        return this.sendCommand('POST', 'dcs_code', { value: value }, retryCount);
    }
    getDCSCode (retryCount=0) {
        return this.sendCommand('GET', 'dcs_code', null, retryCount);
    }
    setDCREncryptionCode (value, retryCount=0) {
        return this.sendCommand('POST', 'dcr_encryption_code', { value: value }, retryCount);
    }
    getDCREncryptionCode (retryCount=0) {
        return this.sendCommand('GET', 'dcr_encryption_code', null, retryCount);
    }
// above lines added 2019/01/06
    getDigitalDataOutput (retryCount=0) {
        return this.sendCommand('GET', 'digital_data_output', null, retryCount);
    }
    getSpectrumSpan (retryCount=0) {
        return this.sendCommand('GET', 'spectrum_span', null,retryCount);
    }
    getSpectrumCenter (retryCount=0) {
        return this.sendCommand('GET', 'spectrum_center', null, retryCount);
    }
    getReceiverState (retryCount=0) {
        return this.sendCommand('GET', 'receiver_state', null, retryCount);
    }
    getSpectrumData (retryCount=0) {
        return this.sendCommand('GET', 'spectrum_data', null,retryCount);
    }
    getSmeter(retryCount=0) {
        return this.sendCommand('GET', 'smeter', null, retryCount);
    }
    getFrequencyStepAdjust (retryCount=0) {
        return this.sendCommand('GET', 'frequency_step_adjust', null, retryCount);
    }
    getDigitalAdditionalInfo (retryCount=0) {
        return this.sendCommand('GET', 'digital_additional_info', null, retryCount);
    }
    getIFbandwidth (retryCount=0) {
        return this.sendCommand('GET', 'ifbandwidth', null, retryCount);
    }
    isSquelchOpened (smeter) {
        let squelchState = smeter.substr(3,1);
                let squelchOpened = false;
                if ( squelchState == '0') {
                    squelchOpened = false;
                } else {
                    squelchOpened = true;
                }
                return squelchOpened;
    }
    parseSmeter(smeter){
        let value = smeter.substr(0,3);
        let smeterValue = Number(value);
        let smeterDisplayValue = '';
        if ( smeterValue >= 140 ) {
            smeterDisplayValue = '0';
        } else if ( smeterValue >= 130 ) {
            smeterDisplayValue = '1';
        } else if ( smeterValue >= 120 ) {
            smeterDisplayValue = '2';
        } else if ( smeterValue >= 110 ) {
            smeterDisplayValue = '3';
        }else if ( smeterValue >= 100 ) {
            smeterDisplayValue = '4';
        }else if ( smeterValue >= 90 ) {
            smeterDisplayValue = '5';
        }else if ( smeterValue >= 80 ) {
            smeterDisplayValue = '6';
        }else if ( smeterValue >= 70 ) {
            smeterDisplayValue = '7';
        }else if ( smeterValue >= 60 ) {
            smeterDisplayValue = '8';
        }else {
            smeterDisplayValue = '9';
        }
        return smeterDisplayValue;

    }
}
class ReceivingMode {
    constructor(mode){
        this._mode = mode;
    }
    get mode () {
        if ( ( this._mode.substr(1,1) == '0' &&
               this._mode.substr(0,1) == '0' ) ||
             ( this._mode.substr(1,1) == 'F' &&
               this._mode.substr(0,1) == '0' ) ) {
            return this.analogReceiveMode;
        } else {
            return this.digitalDecodeReadingMode;
        }

    }
    get digitalDecodeReadingMode (){
        let result = null;
        for(let key in DIGITAL_DECODE_READING_MODE){
            if (DIGITAL_DECODE_READING_MODE[key].code == this._mode.substr(0,1)){
                result = DIGITAL_DECODE_READING_MODE[key];
                break;
            }
        }
        return result;
    }
    get digitalDecodeSettingMode(){
        let result = null;
        for(let key in DIGITAL_DECODE_SETTING_MODE){
            if (DIGITAL_DECODE_SETTING_MODE[key].code == this._mode.substr(1,1)){
                result = DIGITAL_DECODE_SETTING_MODE[key];
                break;
            }
        }
        return result;
    }
    get analogReceiveMode () {
        let result = null;
        for(let key in ANALOG_RECEIVE_MODE){
            if (ANALOG_RECEIVE_MODE[key].code == this._mode.substr(2,1)){
                result = ANALOG_RECEIVE_MODE[key];
                break;
            }
        }
        return result;
    }
    get digitalModeEnable() {
        if ( this._mode.substr(1,1) == 'F' ) {
            return false;
        }else{
            return true;
        }
    }
    get ifbwList(){
        let list = null;
        let mode = null;
        if ( this._mode.substr(1,1) == 'F' ){
            mode = this.analogReceiveMode.name;
        }else {
            mode = this.digitalDecodeSettingMode.name;
        }
        for ( let key in MODE ){
            let item = MODE[key];
            if ( item.name == mode ){
                list = item.ifbw;
                break;
            }
        }
        return list;
    }
    ifbw(id) {
        if (!id){
            return null;
        }
        const ifbwLists = this.ifbwList;
        let ifbwValue = null;
        for(let i in ifbwLists){
            if (ifbwLists[i].id == id) {
                ifbwValue = ifbwLists[i];
                break;
            }
        }
        return ifbwValue;
    }
}
