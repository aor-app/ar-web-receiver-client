/*! menu.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
const infoPopup = (message) => {
    showPopup('Info', message);
};
$(document).on('click', '#shutdown', async () => {
    showLoadingAnimation('Sending...');
    const result = await powerOff();
    hideLoadingAnimation();
    if (result && result.code == 0){
        infoPopup('Web Adapter\'s shutdown request has been accepted..');
    }else{
        infoPopup(result.message);
    }
});
$(document).on('click', '#reboot', async () => {
    showLoadingAnimation('Sending...');
    const result = await reboot();
    hideLoadingAnimation();
    if (result && result.code == 0){
        infoPopup('Web Adapter\'s reboot request has been accepted.');
    }else{
        infoPopup(result.message);
    }
});
$(document).on('click', '#adapter-settings-button', () => {
    window.location.href = 'settings.html';
});
$(document).on('click', '#receiver-button', () => {
    window.location.href = 'receiver.html';
});
