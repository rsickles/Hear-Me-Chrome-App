//globally defined variables
var connectionId = null;

var onGetDevices = function(ports) {
  for (var i=0; i<ports.length; i++) {
    console.log(ports[i].path);
  }
  //cant connect to when other services are polling it (i.e. coolterm) :(
  chrome.serial.connect("/dev/tty.usbmodem1421", {bitrate: 9600}, onConnect);
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

var writeWavToSerial=function(str){
  chrome.serial.send(connectionId, sendOverWaveData(str), onReceiveCallback);
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

var sendOverWaveData=function(str){
  var buf=new ArrayBuffer(str.length);
  var bufView=new Uint8Array(buf);
  for (var i=0; i<str.length; i++) {
    bufView[i*256]=str.charCodeAt(i);
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

//dealing with the file below
document.getElementById('myFile').addEventListener('change', getFileInfo, false);
function getFileInfo(){
    var x = document.getElementById("myFile");
    var txt = "";
    if ('files' in x) {
        if (x.files.length === 0) {
            txt = "Select one or more files.";
        } else {
            for (var i = 0; i < x.files.length; i++) {
                txt += "<br><strong>" + (i+1) + ". file</strong><br>";
                var file = x.files[i];
                console.log(file);
                var reader = new FileReader();
                reader.readAsBinaryString(file); //file as binary string
                reader.onload = function(event) {
                  var wav_string = event.currentTarget.result; //wav file as binary string
                  var buf = new ArrayBuffer(wav_string.length*4); // 4 bytes for each char
                  var bufView = new Uint8Array(buf); //
                  //intiaties transfer
                  writeSerial("I");
                  //holds number of stories
                  writeSerial(String.fromCharCode(1));
                  //holds starting location
                  writeSerial(String.fromCharCode((0 >> 0) & 0xFF));
                  //holds file length
                  writeSerial(String.fromCharCode((wav_string.length >> 0) & 0xFF));
                  //now to send data over
                  writeSerial("D");
                  //holds starting location of story
                  writeSerial(String.fromCharCode((0 >> 0) & 0xFF));
                  //write the data over
                  writeWavToSerial(wav_string);
                  // bufView[0] = String.fromCharCode((0 >> 0) & 0xFF);
                  // for (var i=1, strLen=wav_string.length; i<strLen; i++) {
                  //   bufView[i] = wav_string.charCodeAt(i);
                  // }
                  // console.log(bufView);
                  //chrome.serial.send(connectionId, bufView, onReceiveCallback);
                }
                if ('name' in file) {
                    txt += "name: " + file.name + "<br>";
                }
                if ('size' in file) {
                    txt += "size: " + file.size + " bytes <br>";
                }
            }
        }
    }
    else {
        if (x.value === "") {
            txt += "Select one or more files.";
        } else {
            txt += "The files property is not supported by your browser!";
            txt  += "<br>The path of the selected file: " + x.value; // If the browser does not support the files property, it will return the path of the selected file instead.
        }
    }
    document.getElementById("data").innerHTML = txt;
}


