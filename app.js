var onGetDevices = function(ports) {
  console.log("hehe");
  for (var i=0; i<ports.length; i++) {
    console.log(ports[i].path);
    //connect to serial port
  }
  //cant connect to when other services are polling it (i.e. coolterm) :(
  chrome.serial.connect("/dev/tty.usbmodem1411", {bitrate: 9600}, onConnect);
};

var onConnect = function(connectionInfo) {
   // The serial port has been opened. Save its id to use later.
   console.log(connectionInfo);
  //_this.connectionId = connectionInfo.connectionId;
  // Do whatever you need to do with the opened port.
};
// Connect to the serial port /dev/ttyS01



$( document ).ready(function() {
   chrome.serial.getDevices(onGetDevices);
});
