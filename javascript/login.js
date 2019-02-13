/*! ar_receiver.js | 2019/01 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
$(document).on('click', '#login', async () => {
    showLoadingAnimation('Login...');
    const result = await login($('#password').val());
    hideLoadingAnimation();
    if (result && result.code == 0){
//        const storage = localStorage;
//        storage.setItem('session', result.session);
//        window.location.href = `${ROOT_FILE_PATH}\\receiver.html`;
			window.location.href = 'receiver.html';
    }else{
        $('.login-error-message').remove();
        const errorMessageDiv = $('<div>', {class: 'login-error-message'});
        errorMessageDiv.append($('<p>',{text: result.message}));
        $('.login-div').prepend(errorMessageDiv);
    }
});