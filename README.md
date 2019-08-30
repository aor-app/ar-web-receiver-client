# AR-WEB-RECEIVER-CLIENT develop-dv10support v1908AM  

AR-WEB-RECEIVER-CLIENT is a sample web app for the Web API of AR-DV1 Web Adapter in VFO mode.  
You can control AR-DV1 and listen to the received audio, through your iOS tablet’s web browser.  
Suitable for iPad Safari but not tuned to other browsers or small display sizes.

---

## RELEASE NOTES  
### v1908AM  
Added selectSquelch as SQL TYPE.  
Added NSQ slider to support AR-DV10.  
M at the end of the version number means AR-DV10 support.

### v1904C  
A paragraph on receiver firmware version information compatible with T-TC and some comments were deleted from the receiver page.  

### v1904B  
The following bugs have been fixed:  
 - fixed the shadow of T-TC slot button.  
 - Cleaned up the code.  

### v1903A  
The following feature has been added:  
 - Addition of T-TC mode (for Tetra Traffic Channel).  
 This function is compatible with AR-DV1 firmware 1903A or later.  
 - Added CSS for display tablet smaller than iPad.  

The following bugs have been fixed:  
 - fixed restore mode.  

---
## Installation  
 - Install on /home/aor/ar-web-receiver-client of your web adapter or on any web server.  
 - If installing on your web server outside the adapter, describe the URL of the web API accessed from your tablet in the ** *javascript/init.js* ** of the web application as follows.  
	e.g. const SERVER_URL=‘192.168.1.25:3000’;  
