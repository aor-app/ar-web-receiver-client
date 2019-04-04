/*! share.js | v1904B 2019/04 AOR, LTD. | www.aorja.com/receivers/ar-web-api/ */
const paddingZero = (value) => {
    return  ('00' + value ).slice(-2);
};
const showLoadingAnimation = (message) => {
    $('#main').addClass('ui-disabled');
    $.mobile.loading("show", {
        text: message,
        textVisible: true
    });
};
const hideLoadingAnimation = () =>{
    $('#main').removeClass('ui-disabled');
    $.mobile.loading("hide");
};
const showPopup = (title, message) => {
    $('#popup-title').text(title);
    $('#popup-message').html(message);
    $('#popup').popup('open');
};
const closePopup = () => {
    $('#popup').popup('close');
};
const calcFloatAdd = (startValue, additionalValue) => {
    let getDotPosition = (value) => {
        let dotPosition = 0;
        if(value.lastIndexOf('.') != -1){
            dotPosition = (value.length - 1) - value.lastIndexOf('.');
        }
        return dotPosition;
    };

    let floatStartValue = parseFloat(startValue);
    let floatAdditionalValue = parseFloat(additionalValue);

    let startValueDotPosition = getDotPosition(startValue);
    let additionalValueDotPosition = getDotPosition(additionalValue);

    let max = Math.max(startValueDotPosition, additionalValueDotPosition);

    let intStartValue = parseInt((floatStartValue.toFixed(max) + '').replace('.', ''));
    let intAdditionalValue = parseInt((floatAdditionalValue.toFixed(max) + '').replace('.', ''));

    let power = Math.pow(10, max);

    return ( intStartValue + intAdditionalValue ) / power;
};
const sendCommand = (method, target, command, value, param) => {
    return new Promise((resolve, reject) => {
        try {
            const HTTP_SERVER_URL = `http://${SERVER_URL}`;
            const xhr = new XMLHttpRequest();
            let url = `${HTTP_SERVER_URL}/api/${target}/${command}`;
            let json = null;
            if ( value ){
                json = JSON.stringify(value);
            }
            if (param) {
                let itemCount = 0;
                for(let item in param){
                    if (param[item]){
                        if (itemCount == 0){
                            url = `${url}?${item}=${param[item]}`;
                        }else{
                            url = `${url}&${item}=${param[item]}`;
                        }
                        itemCount++;
                    }
                }
            }
            xhr.open(method, url);
			xhr.withCredentials = true;
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			xhr.addEventListener('error', (evt) => {
				hideLoadingAnimation();
				showPopup('Network Error', 'Error occurred while communicating with the server.');
			});
//            xhr.setRequestHeader('Authorization', localStorage.session);
			xhr.onreadystatechange = () => {
                switch (xhr.readyState) {
                case 1:
                    break;
                case 4:
                    resolve(JSON.parse(xhr.responseText));
                    break;
                }
            };
            xhr.send(json);
        }catch (e){
            reject(e);
        }
    });
};
const checkSession = async () => {
    const loginProcess = async () => {
        showLoadingAnimation('Check session');
        const result = await login();
        hideLoadingAnimation();
        if (!result || result.code != 0){
            window.location.href = '/login.html';
        }else{
            //
        }
    };
    showLoadingAnimation('Check session');
    const result = await getAdapterStatus();
    hideLoadingAnimation();
    if (result.code != 0){
        const result = await loginProcess();
    }
};

function round(number, precision) {
  var shift = function (number, precision, reverseShift) {
    if (reverseShift) {
      precision = -precision;
    }  
    var numArray = ("" + number).split("e");
    return +(numArray[0] + "e" + (numArray[1] ? (+numArray[1] + precision) : precision));
  };
  return shift(Math.round(shift(number, precision, false)), precision, true);
}
/* api */
const login = (value='') => {
    return sendCommand('POST',
                       'adapter',
                       'login',
                       { password: value }
                      );
};
const getAdapterStatus = () => {
    return sendCommand('GET',
                       'adapter',
                       'receiver_status',
                       null
                      );
};
const powerOff = () => {
    return sendCommand('POST',
                       'adapter',
                       'shutdown',
                       null);
};
const reboot = () => {
    return sendCommand('POST',
                       'adapter',
                       'reboot',
                       null);
};
const getWifi = () => {
    return sendCommand('GET',
                       'adapter',
                       'wifi',
                       null);
};
const setWifi = (operationMode, channel, country, ssid, passphrase) => {
    return sendCommand('POST',
                       'adapter',
                       'wifi',
                       {
                           operationMode: operationMode,
                           channel: channel,
                           country: country,
                           ssid: ssid,
                           passphrase: passphrase
                       }
                      );
};
const getNetworkInterfaces = () => {
    return sendCommand('GET',
                       'adapter',
                       'network_interfaces',
                       null);
};
const setSecurity = (value) => {
    return sendCommand('POST',
                       'adapter',
                       'password',
                       { password: value }
                      );
};
const setSSH = (value) => {
    return sendCommand('POST',
                       'adapter',
                       'ssh',
                       { value: value }
                      );
};
