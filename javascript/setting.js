/*! setting.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
const PASSWORD_CHAR = new RegExp(/[^\x21-\x7e]/); // ASCII
const PASSWORD_LENGTH = 8;
const COUNTRY_CODE_REGEXP = new RegExp(/^[A-Z]{2}$/g);
const SSID_LENGTH = { MIN: 3, MAX: 32};
const PASSPHRASE_LENGTH = {MIN: 8, MAX:63 };
const errorPopup = (message) => {
    showPopup('Error', message);
};
const completePopup = (message) => {
    showPopup('Complete', message);
};
const done = (message) => {
    completePopup(message);
};
const fail = () => {
    errorPopup('Error has occured.');
};
const setWireLessLanChannel = (operationMode, channel) => {
    $('#channel').empty();
    for( let item of WIFI_CHANNEL[operationMode].list) {
        const option  = $('<option>',{
            value: item.value,
            text: item.text
        });

        $('#channel').append(option);
    }
    $('#channel').selectmenu('refresh', true);
    if (channel){
        $('#channel').val(channel);
    }else{
        $('#channel').val(WIFI_CHANNEL[operationMode].default);
    }
    $('#channel').selectmenu('refresh', true);
};
$(document).on('pageshow', '#main', async () => {
    checkSession();
    const wifi = await getWifi();
    if (wifi.code == 0){
        if (wifi.value.operationMode){
            $('#operationMode').val(wifi.value.operationMode);
            $('#operationMode').selectmenu('refresh', true);
            if (wifi.value.channel){
                setWireLessLanChannel(wifi.value.operationMode, wifi.value.channel);
            }
        }
        if (wifi.value.countryCode){
            $('#country').val(wifi.value.countryCode);
        }
        if (wifi.value.ssid){
            $('#ssid').val(wifi.value.ssid);
        }
        if (wifi.value.passphrase){
            $('#passphrase').val(wifi.value.passphrase);
        }
    }
    const networkInterfaces = await getNetworkInterfaces();
    if (networkInterfaces.code == 0){
        if (networkInterfaces.value.wlan0){
            const wlan0 = networkInterfaces.value.wlan0[0];
            if (wlan0){
                $('#wlan0MACAddress').text(wlan0.mac);
                $('#wlan0IPAddress').text(wlan0.address);
            }
        }
        if (networkInterfaces.value.eth0){
            const eth0 = networkInterfaces.value.eth0[0];
            if (eth0){
                $('#eth0MACAddress').text(eth0.mac);
                $('#eth0IPAddress').text(eth0.address);
            }
        }
    }
});
$(document).on('click', '#security-submit', async () => {
    let password = $('#password-a').val();
    let passwordConfirm = $('#password-confirm').val();
    $('#password-error').removeClass();
    $('#password-error>p').text('');
    const setSecurityErrorMessage = (message) => {
        $('#password-error>p').text(message);
        $('#password-error').addClass('error-message');
    };
    if ( !password ) {
        setSecurityErrorMessage('Please input Password.');
        return;
    }
    if ( !passwordConfirm ) {
        setSecurityErrorMessage('Please input PasswordConfirm');
        return;
    }
    if ( password != passwordConfirm ) {
        setSecurityErrorMessage('Password and PasswordConfirm do not match.');
        return;
    }
    if ( PASSWORD_CHAR.test(password) ){
        setSecurityErrorMessage('Invalid characters are included.');
        $('#password-error>p').text();
        return;
    }
    if ( password.length < PASSWORD_LENGTH ){
        setSecurityErrorMessage('Password is too short.');
        return;
    }
    $('#message').text('');
    $('#message').parent().removeClass();

    showLoadingAnimation('Sending...');
    const result = await setSecurity(password);
    hideLoadingAnimation();
    if (result && result.code == 0){
        completePopup(result.message);
    }else{
        errorPopup(result.message);
    }

});
$(document).on('click', '#wifi-submit', async () => {
    let operationMode = $('#operationMode').val();
    let channel = $('#channel').val();
    let country = $('#country').val();
    let ssid = $('#ssid').val();
    let passphrase = $('#passphrase').val();
    let hasError = false;
    $('#wifi-error>ul').empty();
    $('#wifi-error').removeClass();
    const setErrorMessage = (message) => {
        $('#wifi-error>ul').append($('<li>', { text: message}));
        hasError = true;
    };
    if ( country ){
        if ( !country.match(COUNTRY_CODE_REGEXP)){
            setErrorMessage('Invalid country code.');
        }
    }else{
        setErrorMessage('Please input Country.');
    }

    if ( !operationMode ){
        setErrorMessage('Please input Operation mode.');
    }

    if ( ssid ){
        if ( ssid.length < SSID_LENGTH.MIN ){
            setErrorMessage('SSID too short.');
        }
        if ( ssid.length > SSID_LENGTH.MAX ){
            setErrorMessage('SSID too long.');
        }
    }else{
        setErrorMessage('Please input SSID.');
    }
    if ( passphrase ){
        if ( passphrase.length < PASSPHRASE_LENGTH.MIN ){
            setErrorMessage('Passphrase too short.');
        }
        if ( passphrase.length > PASSPHRASE_LENGTH.MAX ){
            setErrorMessage('Passphrase too long.');
        }
    }else{
        setErrorMessage('Please input passphrase.');
    }
    if ( hasError ) {
        $('#wifi-error').addClass('error-message');
        return;
    }
    $('#message').text('');
    $('#message').parent().removeClass();
    showLoadingAnimation('Sending...');
    const result = await setWifi(operationMode, channel, country, ssid, passphrase);
    hideLoadingAnimation();
    if (result && result.code == 0){
        completePopup(result.message);
    }else{
        errorPopup(result.message);
    }
});
$(document).on('click', '#fn-setting-popup-close', () => {
    closeSettingPopup();
});
$(document).on('click', '#ssh-on', async () => {
    console.log('ssh on');
    showLoadingAnimation('Setting...');
    const result = await setSSH('1');
    hideLoadingAnimation();
    if (result && result.code == 0){
        completePopup('SSH Service started.');
    }else{
        errorPopup(result.message);
    }
});
$(document).on('click', '#ssh-off', async () => {
    console.log('ssh off');
    showLoadingAnimation('Setting...');
    const result = await setSSH('0');
    hideLoadingAnimation();
    if (result && result.code == 0){
        completePopup('SSH Service stopped.');
    }else{
        errorPopup(result.message);
    }
});
const WIFI_CHANNEL = {
    'a': {
        list: [
            { value: "36", text: "36CH" },
            { value: "40", text: "40CH" },
            { value: "44", text: "44CH" },
            { value: "48", text: "48CH" }
        ],
        default: "36"
    },
    'b': {
        list: [
            { value: "1", text: "1CH" },
            { value: "2", text: "2CH" },
            { value: "3", text: "3CH" },
            { value: "4", text: "4CH" },
            { value: "5", text: "5CH" },
            { value: "6", text: "6CH" },
            { value: "7", text: "7CH" },
            { value: "8", text: "8CH" },
            { value: "9", text: "9CH" },
            { value: "10", text: "10CH" },
            { value: "11", text: "11CH" },
            { value: "12", text: "12CH" },
            { value: "13", text: "13CH" }
        ],
        default: "1"
    },
    'g': {
        list: [
            { value: "1", text: "1CH" },
            { value: "2", text: "2CH" },
            { value: "3", text: "3CH" },
            { value: "4", text: "4CH" },
            { value: "5", text: "5CH" },
            { value: "6", text: "6CH" },
            { value: "7", text: "7CH" },
            { value: "8", text: "8CH" },
            { value: "9", text: "9CH" },
            { value: "10", text: "10CH" },
            { value: "11", text: "11CH" },
            { value: "12", text: "12CH" },
            { value: "13", text: "13CH" }
        ],
        default: "1"
    }
};
$(document).on('change', '#operationMode', () => {
    const mode = $('#operationMode').val();
    setWireLessLanChannel(mode);
});
