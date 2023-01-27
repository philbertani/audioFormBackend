import axios from "axios"

//browser always complains unless we first create the AC after a button click 
//webkit is the mac/safari/ios version of this stuff
const AC = new (window.AudioContext || window.webkitAudioContext)();
let fudge = 0  //in seconds
let timeOffset = .05
let currentPlayPosition = 0

function playSound(source, time, fudge) {
  //connect to gainNodes to control relative volume
  source.connect(AC.destination);
  source.start(time, Math.max( currentPlayPosition + fudge, 0) )
}

function stopSound(source,time) {
  source.stop(time)
  source.disconnect()
}

const play2filesElem = document.getElementById('play2files')
play2filesElem.addEventListener('click',function() {play2() })
const increaseFudge = document.getElementById('nudgeForwards')
const decreaseFudge = document.getElementById('nudgeBackwards')
const fudgeOut = document.getElementById('fudge')

//increaseFudge.addEventListener('click',function(){ handleFudge(1) })
//decreaseFudge.addEventListener('click',function(){ handleFudge(-1)})
fudgeOut.addEventListener('change',function(){restart()})

function restart() {
  if ( !started ) return

  started = false
  play = 0

  const currentTime = AC.currentTime
  const src1 = sources[0]
  const src2 = sources[1]

  stopSound(src1,currentTime)
  stopSound(src2,currentTime)

  play2(0)
}

function handleFudge(direction) {

  fudge += direction * timeOffset
  fudgeOut.value = Math.round(fudge*100)/100

  if ( !started ) return

  started = false
  play = 0

  const currentTime = AC.currentTime
  const src1 = sources[0]
  const src2 = sources[1]

  stopSound(src1,currentTime)
  stopSound(src2,currentTime)
  //play2(currentTime)
}

let play = 0
let started = false

async function play2(restartTime) {

  if ( play === 1 ) {
    play = 0
    await AC.suspend()
    return
  }

  AC.resume()  //this controls them all at once

  play = 1

  if ( !started ) {

    const startTime = AC.currentTime + 0.5;
    const tempo = 80; // BPM (beats per minute)
    const eighthNoteTime = 60 / tempo / 2;
  
    sources.length = 0  //reset the array
    const src1 = AC.createBufferSource();
    src1.buffer = audioBuffers[0];
    const src2 = AC.createBufferSource();
    src2.buffer = audioBuffers[1]
    sources.push(src1,src2)

    fudge = fudgeOut.value
    console.log("fudge is:" , fudge)
    //all of the AudioBuffer timing is in seconds as opposed to the usual milliseconds
    playSound(src1, startTime, 0);
    playSound(src2, startTime, fudge);

    started = true
  }

};

console.log('trying to get 2 audio files')
const sources = []
const audioBuffers = []   //we actually need the whole audioBuffers since we need to recreate sources on changes

async function getFiles(filename, audioId) {

    try {

      console.log('getting from backend:', filename)
      const response = await axios.get("/audio/" + filename);

      const { data } = response;

      //atob is base64 string to binary
      //formData PUT with an audio file runs btoa at some point
      const raw = window.atob(data);

      const ab = new ArrayBuffer(raw.length);
      //ab is the backing store for binaryData

      const binaryData = new Uint8Array(ab);
      for (let i = 0; i < raw.length; i++) {
        binaryData[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([binaryData], { type: "audio/mpeg" });

      //we do not need the blob and regular audio elements if we 
      //are sending the binary array buffers straight to audio context
      //this is just for playing around 
      const audioURL = window.URL.createObjectURL(blob);
      const audioElem = document.getElementById("audio" + audioId);
      document.getElementById("audio" + audioId).src = audioURL;

      //here is the AudioContext way of doing things with sound...
      const source = AC.createBufferSource();
      //wait for both with Promises.all at some point
      const xxx = await AC.decodeAudioData(ab);
      //save them so we can use them later on button click
      audioBuffers.push(xxx)

    } catch (err) {}

}

Promise.all([getFiles('a1.mp3',1), getFiles('a2.mp3',2)])
  .then( values=>{
      console.log('done')
      play2filesElem.disabled = false

})



