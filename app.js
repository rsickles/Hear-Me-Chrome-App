
 //globally defined variables
var connectionId = null;
  //holds location of first story
  var story_loc = 0;
  //holds index of wav string that is being sent over in chunks
  var string_starting_point = 0;

  //initalize the number of chunks to send
  var num_packets_to_send = 0;
  var wav_file_string = "";

var onGetDevices = function(ports) {
  for (var i=0; i<ports.length; i++) {
    console.log(ports[i].path);
  }
  //cant connect to when other services are polling it (i.e. coolterm) :(
  chrome.serial.connect("/dev/tty.usbmodem1421", {bitrate: 9600}, onConnect);
};

var onConnect = function(connectionInfo) {
   // The serial port has been opened. Save its id to use later.
   console.log("The connection id on connect is %s", connectionInfo.connectionId);
   connectionId = connectionInfo.connectionId;
   //try to conenct to the port
   //chrome.serial.onReceive.addListener(onReceiveCallback);
   chrome.serial.onReceive.addListener(sendDataCallback);
   chrome.serial.onReceiveError.addListener(errorcallback);
   writeSerial("M");
   writeSerial("E");
   writeSerial("F");
};

var errorcallback = function(info){
  console.log("ERROR RECIEVING!!");
  console.log(info);
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


var sendDataCallback = function(info) {
      // console.log("This is the info   ");
      // console.log(bufferToString(info.data));
      console.log("Callback called");
      console.log(info);
      console.log("The connection id on callback is %s", info.connectionId);
      console.log(info.data);
    if (info.connectionId == connectionId-1 && info.data) {
      var str = "";
      var decimal_value = bufferToString(info.data);
      //value is more than one decimal value
      if (decimal_value.length>1) {
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
      console.log("Checking num packets %s", num_packets_to_send);
      if(num_packets_to_send > 0){
        num_packets_to_send-=1;
        console.log("calling sendWavData function again with one less packet being sent");
        chrome.serial.flush(connectionId, function callback(result) {
            sendWavData(wav_file_string);
        });
      }
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
  for (var i=0; i<bufView.length; i++) {
    bufView[i]=str.charCodeAt(i);
  }
  return buf;
};

var sendOverWaveData=function(str){
  //holds location of first story
  // var story_loc = 0;
  // //holds index of wav string that is being sent over in chunks
  // var string_starting_point = 0;
  // //create initial arraybuffer to hold 256 bytes of file
  // var buf = new ArrayBuffer(256);
  // //bufview to read/write to arraybuffer
  // var bufView = new Uint8Array(buf);
  // //initalize the number of chunks to send
  // var num_packets_to_send = 0;

  //below calculates whether an extra chunk needs to added
  var num_packets = (str.length/256 % 256);
  if(num_packets!==0){
    num_packets_to_send = Math.floor(str.length/256) + 1;
  }
  else {
    num_packets_to_send = Math.floor(str.length/256);
  }
  wav_file_string = str;
  console.log("This number of packets to send is" + num_packets_to_send);
  console.log("found string now sending over data");
  sendWavData(wav_file_string);
  //starts to send each chunk of wav string data
  //for(var x = 0; x<num_packets_to_send; x++){
    //initialize new buffer for each chunk to send over


  //}
  // NOTES //
  //length/256 % 256 if left over send (+ 1 to total number of packets (total_num_packets = length/256) so evenly send over certain amount and just pad zeros at the end of each chunk) is number of packets i need to send
  //send over string[0-255] (pad with zeros if needed) 0-255, keep track of address
  //send another d after first chunk is sent and then send new location (last_loc + 256)
  //test using audacity
};

function sendWavData(str){
    console.log("sending over data");
      //below is own function
    //create initial arraybuffer to hold 256 bytes of file
    var buf = new ArrayBuffer(256);
    //bufview to read/write to arraybuffer
    var bufView = new Uint8Array(buf);
    //send data over
    writeSerial("D");
    //send starting location of story
    writeSerial(String.fromCharCode((story_loc >> 24)  & 0xFF));
    writeSerial(String.fromCharCode((story_loc >> 16)  & 0xFF));
    writeSerial(String.fromCharCode((story_loc >> 8) & 0xFF));
    writeSerial(String.fromCharCode((story_loc >> 0) & 0xFF));
    //holds index location of bufview
    var location = 0;
    //add parts of wav string data to byte array
    for (var i=string_starting_point; i<(string_starting_point+256); i++){
       //check for zeros
       var character;
       if(i>str.length-1){
          character = String.fromCharCode(0);
       }else{
          character = str.charCodeAt(i);
       }
       bufView[location] = character;
       location+=1;
    }
    //move next chunk starting location
    story_loc += 256;
    //increase string index location
    string_starting_point += 256;
    //send over data in arraybuffer
    console.log("This is the string starting location index %s", string_starting_point);
    console.log("This is the story starting location %s", story_loc);
    console.log("This is the length of the bufview %s", bufView.length);
    chrome.serial.send(connectionId, buf, function(){console.log('i am the send callback');});
}

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
                  //intiaties transfer
                  writeSerial("I");
                  //holds number of stories
                  writeSerial(String.fromCharCode(1));
                  //holds starting location
                  writeSerial(String.fromCharCode((0 >> 24)  & 0xFF));
                  writeSerial(String.fromCharCode((0 >> 16)  & 0xFF));
                  writeSerial(String.fromCharCode((0 >> 8) & 0xFF));
                  writeSerial(String.fromCharCode((0 >> 0) & 0xFF));
                  //holds file length
                  writeSerial(String.fromCharCode((wav_string.length >> 24)  & 0xFF));
                  writeSerial(String.fromCharCode((wav_string.length >> 16)  & 0xFF));
                  writeSerial(String.fromCharCode((wav_string.length >> 8) & 0xFF));
                  writeSerial(String.fromCharCode((wav_string.length >> 0) & 0xFF));
                  console.log(wav_string.length);
                  //now to send data over
                  //write the data over
                  sendOverWaveData(wav_string);
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


