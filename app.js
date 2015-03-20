//globally defined variables
var connectionId = null;

var onGetDevices = function(ports) {
  for (var i=0; i<ports.length; i++) {
    console.log(ports[i].path);
  }
  //cant connect to when other services are polling it (i.e. coolterm) :(
  chrome.serial.connect("/dev/tty.usbmodem1411", {bitrate: 9600}, onConnect);
};

var onConnect = function(connectionInfo) {
   // The serial port has been opened. Save its id to use later.
   //console.log(connectionInfo);
   connectionId = connectionInfo.connectionId;
   console.log(connectionId);
   //try to conenct to the port
   chrome.serial.onReceive.addListener(onReceiveCallback);
   writeSerial("M");
   writeSerial("E");
   writeSerial("F");
};

var onReceiveCallback = function(info) {
      // console.log("This is the info   ");
      // console.log(bufferToString(info.data));
    if (info.connectionId == connectionId && info.data) {
      var str = "";
      var decimal_value = bufferToString(info.data);
      //value is more than one decimal value
      if (decimal_value.length>2) {
        var string_array = decimal_value.split(",");
        //console.log(string_array);
        for(x=0; x<string_array.length; x++){
          str+=String.fromCharCode(string_array[x]);
        }
      }
      //just one decimal value
      else {
        str = String.fromCharCode(decimal_value);
      }
      //logs the output to the user
      console.log(str);
    }
  };


var writeSerial=function(str) {
  chrome.serial.send(connectionId, convertStringToArrayBuffer(str), onReceiveCallback);
};


// Convert string to ArrayBuffer
var convertStringToArrayBuffer=function(str) {
  var buf=new ArrayBuffer(str.length);
  var bufView=new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i]=str.charCodeAt(i);
  }
  return buf;
};

//arraybuffer to string
function bufferToString( buf ) {
    var view = new Uint8Array( buf );
    return Array.prototype.join.call(view, ",");
}

$( document ).ready(function() {
   chrome.serial.getDevices(onGetDevices);
});
