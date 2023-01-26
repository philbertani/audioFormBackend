import axios from "axios"

//browser always complains unless we first create the AC after a button click 
//webkit is the mac/safari/ios version of this stuff
const AC = new (window.AudioContext || window.webkitAudioContext)();

function playSound(source, time) {
  //connect to gainNodes to control relative volume
  source.connect(AC.destination);
  //source[source.start ? "start" : "noteOn"](time);
  source.start(time)
}

const play2filesElem = document.getElementById('play2files')
play2filesElem.addEventListener('click',function() {play2() })

function play2() {
  var startTime = AC.currentTime + 0.5;
  var tempo = 80; // BPM (beats per minute)
  var eighthNoteTime = 60 / tempo / 2;

  //this was the wrong direction, we needed the binary arraybuffer
  //const src1 = AC.createMediaElementSource(audioElems[0])
  //const src2 = AC.createMediaElementSource(audioElems[1])

  const src1 = sources[0]
  const src2 = sources[1]

  //console.log(src1)
  playSound(src1, startTime + 0.25);
  playSound(src2, startTime);
};

console.log('trying to get 2 audio files')
const sources = []

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

      source.buffer = xxx;
      source.connect(AC.destination);

      //save them so we can use them later on button click
      sources.push(source);
      console.log(xxx);

    } catch (err) {}

}

getFiles('a1.mp3',1)
getFiles('a2.mp3',2)



