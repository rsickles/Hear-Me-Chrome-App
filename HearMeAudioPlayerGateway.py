import sys
import glob
import serial
import time
import signal
import wave
from datetime import datetime
from time import gmtime, strftime, mktime
import time


def serial_ports():
    """Lists serial ports
        
        :raises EnvironmentError:
        On unsupported or unknown platforms
        :returns:
        A list of available serial ports
        """
    if sys.platform.startswith('win'):
        ports = ['COM' + str(i + 1) for i in range(256)]
    
    elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
        # this is to exclude your current terminal "/dev/tty"
        ports = glob.glob('/dev/tty[A-Za-z]*')
    
    elif sys.platform.startswith('darwin'):
        ports = glob.glob('/dev/tty.*')
    
    else:
        raise EnvironmentError('Unsupported platform')
    
    result = []
    for port in ports:
        try:
            s = serial.Serial(port)
            s.close()
            result.append(port)
        except (OSError, serial.SerialException):
            pass
    return result

def connectToPlayer(s):
    connectionTimeOutTimer = 0
    s.flushInput()
    while( connectionTimeOutTimer < 50):
        if s.read() == 'H':
            if s.read() == 'R':
                s.write("ME")
                time.sleep(0.5)
                s.flushInput()
                return 1
        connectionTimeOutTimer += 1
    return 0

def getVer(send,s):
    s.flushInput()
    s.write(send)
    time.sleep(0.5)
    command = s.read()
    ver = s.read()
    return ver

def getPlays(s):
    st = ""
    plays = []
    s.flushInput()
    s.write("P")
    time.sleep(0.5)
    while(1):
        x = s.read()
        if x == '\r':
            vals = st.split('P')
            plays = vals[1].split(',')
            return plays
        else:
            st += str(x)
    return plays

gotPort = 0

ver = "2"

try:
    print "**********************************************************"
    print "***** Welcome to the Hear Me Audio Player Gateway v"+ver+" *****"
    print "**********************************************************"
    print ""
    print "Looking for the player..."
    sp = serial_ports()
    
    for x in range(0,len(sp)):
        ser = serial.Serial(sp[x],115200,timeout = 0.1)
        if 'usbmodem' in sp[x]:
            print "Opening Port: " + sp[x]
            gotPort = 1
            #ser = serial.Serial(sp[x],115200,timeout = 0.1)
            break

    if not gotPort:
        print "Port not detected. Please try again..."
    else:
        print "Port open"

        print "Connecting to Player"
        while (not connectToPlayer(ser)):
            time.sleep(1)
        print "Connected!"
        print "Transfer Protocol Version: " + getVer("T",ser)
        print "Firmware Version: " + getVer("F",ser)
	HWVer = getVer("H",ser)
        print "Hardware Version: " + HWVer

        plays = getPlays(ser)
        print "Total number of plays Ever: " + str(plays[0])
        print "Number of plays since last connect: " + str(plays[1])

        if len(sys.argv) > 1:
            
            if sys.argv[1] == "delete":
                print "Deleting stories"
                ser.write('I')
                ser.write(chr(0x00))    #number of stories
            
                time.sleep(2)
            else:
                numberOfStories = len(sys.argv) - 1
                print "Number of stories: "+ str(numberOfStories)
                
                fileStartAddress = 0
                fileEndAddress = 0

                wavFileNameList = []
                fileOkList = []
                numberOfPacketsList = []
                numberOfSectorsList = []
                fileLengthList = []
                fileStartAddressList = []
                fileEndAddressList = []
                dataList = [[] for _ in range(250)]
                
                
            
                    
                print ""
                for storyNumber in range(0,numberOfStories):
                
                    print "##################################################"
                    wavFileNameList.append(sys.argv[storyNumber+1])
                    print "Story "+str(storyNumber)+": " + wavFileNameList[storyNumber]
                    
                    try:
                    #get the list of wave file attributes im interested in (channels, famerate, frames number...)
                        fileOk = 1

                        wav = wave.open(wavFileNameList[storyNumber],'rb')
                        params = wav.getparams()
                        if str(params[0]) != "1":
                            print "Story "+str(storyNumber)+": Number of channels is wrong. Is " + str(params[0]) + ", but should be 1"
                            fileOk = 0
                        if str(params[1]) != "2":
                            print "Story "+str(storyNumber)+": Sample width is wrong. Is " + str(params[1]) + ", but should be 2 bytes/sample"
                            fileOk = 0
                        if str(params[2]) != "16000":
                            print "Story "+str(storyNumber)+": Frame rate is wrong. Is " + str(params[2]) + ", but should be 16000 samples/second"
                            fileOk = 0
                    
                        if fileOk:
                            fileOkList.append(1)
                            
                            numberOfPacketsToTransfer = params[3]/128
                            if params[3]%128 != 0:
                                numberOfPacketsToTransfer += 1
                            numberOfPacketsList.append(numberOfPacketsToTransfer)
                            
                            fileLengthList.append(params[3] * 2)
                    
                            numberOfSectors = numberOfPacketsToTransfer/16
                            if numberOfPacketsToTransfer%256 != 0:
                                 numberOfSectors+=1
                            numberOfSectorsList.append(numberOfSectors)
                    
                    
                            fileEndAddress  = fileStartAddress+(numberOfSectors*4096) - 1
                            fileEndAddressList.append(fileEndAddress)

                            fileStartAddressList.append(fileStartAddress)
                                     
                                
                            print "Story "+str(storyNumber)+": File OK!"
                            print "Story "+str(storyNumber)+": File length:          " + str(fileLengthList[storyNumber])
                            print "Story "+str(storyNumber)+": Break it into         "+ str(numberOfPacketsList[storyNumber]) +" packets"
                            print "Story "+str(storyNumber)+": Number Of Sectors:    "+str(numberOfSectorsList[storyNumber])
                            print "Story "+str(storyNumber)+": Story Start Location: "+str(fileStartAddressList[storyNumber])
                            print "Story "+str(storyNumber)+": Story End Location:   "+str(fileEndAddressList[storyNumber])

                            for i in range(0,numberOfPacketsList[storyNumber]):
                                dataList[storyNumber].append(wav.readframes(128))
                            
                            fileStartAddress += numberOfSectors*4096
                        else :
                            fileOkList.append(0)
                            print "Story "+str(storyNumber)+": File structure is bad, please retry"
                                
                    except:
                        print(wave.error)
                    wav.close()

                print "##################################################"
                print ""
                filesWillAllFit = 0
                filesAllCorrectFormat = 1
                for s in fileOkList:
                    if s != 1:
                        filesAllCorrectFormat = 0

                if HWVer == "4":
                    if fileEndAddress < 8380416:
                        filesWillAllFit = 1
                else:
                    if fileEndAddress < 16769024:
                        filesWillAllFit = 1



                if not filesAllCorrectFormat:
                    print "Not all Stories are correct format... please try again"

                elif not filesWillAllFit:
                    print "Files are too long... please try again"
                elif numberOfStories > 20:
                    print "Too many files... why do you need that many?"
                else:
                    print "Everything checks out. Starting upload!"
                    
                   
                    ser.write('I')
                    ser.write(chr(numberOfStories))    #number of stories
                    
                    for i in range(0,numberOfStories):
                        
                        ser.write(chr((fileStartAddressList[i] >> 24) & 0xFF))   #location
                        ser.write(chr((fileStartAddressList[i] >> 16) & 0xFF))
                        ser.write(chr((fileStartAddressList[i] >> 8)  & 0xFF))
                        ser.write(chr((fileStartAddressList[i] >> 0)  & 0xFF))
                        
                        ser.write(chr((fileLengthList[i] >> 24) & 0xFF))   #length
                        ser.write(chr((fileLengthList[i] >> 16) & 0xFF))
                        ser.write(chr((fileLengthList[i] >> 8)  & 0xFF))
                        ser.write(chr((fileLengthList[i] >> 0)  & 0xFF))
                        
                    time.sleep(0.5)

                    for w in range(0,(numberOfStories)):
                        startTime = int(time.mktime(datetime.utcnow().timetuple()))
                        
                        lastProgress = 100
                        numberOfBytesTransfered = 0
                            
                        ser.flush()
                        ser.close()
                        ser.open()
                        for i in range(0,numberOfPacketsList[w]):
                            tmpData = dataList[w][i]
                            
                            frameLocation = 256*i+fileStartAddressList[w]
                            ser.write('D')
                            ser.write(chr((frameLocation >> 24) & 0xFF))   #location
                            ser.write(chr((frameLocation >> 16) & 0xFF))
                            ser.write(chr((frameLocation >> 8)  & 0xFF))
                            ser.write(chr((frameLocation >> 0)  & 0xFF))
                            
                            s = bytearray(tmpData)
                            counter = 0
                            for y in s:
                                ser.write(chr(y))
                                counter+=1
                            if counter < 256:
                                while counter < 260:
                                    ser.write(chr(0x00))
                                    counter+=1
                        
                            numberOfBytesTransfered+=1
                            if (numberOfBytesTransfered%1000) == 0:
                                ser.flush()
                                ser.close()
                                ser.open()
                                        
                        
                            currentProgress = (i+1)*100/numberOfPacketsList[w]
                            if currentProgress != lastProgress:
                                t = "Story "+str(w)+" Progress: ["
                                for i in range(0,currentProgress):
                                    t+="*"
                                for i in range(currentProgress,100):
                                    t+=" "
                                t+="] "
                                print  str(t) + str(currentProgress)+"%"
                                lastProgress = currentProgress
                        ser.flush()
                        endTime = int(time.mktime(datetime.utcnow().timetuple()))
                        print "Story "+str(w)+" Progress: Complete, took "+str(endTime-startTime+1)+" Seconds"
                        time.sleep(1)
                        print ""
                        
                        
                        
                        
        else:
            print "no stories included"




except:
    print "Unexpected error:", sys.exc_info()[0]
    if gotPort:
        if ser.isOpen():
            ser.write("R")
            ser.flush()
            ser.close()
    
if gotPort:
    if ser.isOpen():
        ser.write("R")
        ser.flush()
        ser.close()

print "**********************************************************"
sys.exit()
    


