var onGetDevices = function(ports) {
  for (var i=0; i<ports.length; i++) {
    console.log(ports[i].path);
    //connect to serial port
    chrome.serial.connect(ports[i].path, {bitrate: 115200}, onConnect);
  }
};

var onConnect = function(connectionInfo) {
   // The serial port has been opened. Save its id to use later.
  _this.connectionId = connectionInfo.connectionId;
  // Do whatever you need to do with the opened port.
  //send a T & and get return value == transfer protocol version
  chrome.serial.send(connectionId, convertStringToArrayBuffer("T"), function(err, data
  	{
  		if(!err){
          var transfer_protocl = data;
  		}
  		chrome.serial.flush(connectionId, nil);
  	}));
  //send a F and get firmware version
    chrome.serial.send(connectionId, convertStringToArrayBuffer("F"), function(err, data
  	{
  		if(!err){
          var transfer_protocl = data;
  		}
  		chrome.serial.flush(connectionId, nil);
  	}));
  //send a H and get hardware version
    chrome.serial.send(connectionId, convertStringToArrayBuffer("H"), function(err, data
  	{
  		if(!err){
          var transfer_protocl = data;
  		}
  		chrome.serial.flush(connectionId, nil);
  	}));
};


$( document ).ready(function() {
   chrome.serial.getDevices(onGetDevices);
});
