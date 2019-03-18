# AR-WEB-RECEIVER-CLIENT v1902  
AR-WEB-RECEIVER-CLIENT is a sample web app for the Web API of AR-DV1 Web Adapter in VFO mode.  
You can control AR-DV1 and listen to the received audio, through your iOS tablet’s web browser.  
Suitable for iPad Safari but not tuned to other browsers or small display sizes.  

## Instalation  
 - Install on /home/aor/ar-web-receiver-client of your web adapter or on any web server.  
 - If installing on your web server outside the adapter, describe the URL of the web API accessed from your tablet in the ** *javascript/init.js* ** of the web application as follows.  
	e.g. const SERVER_URL=‘192.168.1.25:3000’;  
