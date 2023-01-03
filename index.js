const audioContext = new AudioContext();
const badKeys = ["Audio", "Alt", "Launch", "Enter", "Meta", "Play", "Tab"];
const gainNode = new GainNode(audioContext);
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
const reader = new FileReader();
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};

let tuningNote; let tuningPitch; let tuningOctave; let tuningFrequency;
let frequencies = []; let index; let midi; let on = false;
let paused; let pressedKey; let touchedFinger; let track; let normalGain;

oscillator.connect(gainNode).connect(audioContext.destination);
resetVariables();

function convertNotesToFrequencies() {
    const notes = midi.tracks[track].notes;
    for (let i = 0; i < notes.length; i++) {
        const pitch = notes[i].midi - 60;
        let frequency = tuningFrequency;
        frequency *= 2**((pitch - tuningPitch)/12 + 4 - tuningOctave);
        frequencies.push(frequency);
    }
}

function down(e) {
    if (on && !badKeys.some(badKey => e.key.includes(badKey)) && !e.repeat 
            && (e.key != pressedKey) && (index < frequencies.length) 
            && !paused && (document.activeElement.nodeName !== 'INPUT')) {
        if (pressedKey === null) {
            oscillator.frequency.value = frequencies[index];
            gainNode.gain.setTargetAtTime(normalGain, 
                audioContext.currentTime, 0.015);
        } else {
            oscillator.frequency.setTargetAtTime(frequencies[index], 
                audioContext.currentTime, 0.003)    
        }
        pressedKey = e.key;
        index++; 
    }
}

function pause() { paused = true; oscillator.frequency.value = 0; }

function release(e) {
    const touches = e.changedTouches;
    // console.log(touches.length);
    for (let i = 0; i < touches.length; i++) {
        console.log("up",touches.item(i).identifier);
        if (on && touches.item(i).identifier === touchedFinger) {
            gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
            //oscillator.frequency.value = 0;
            touchedFinger = null;
        }
    }
}

function resetVariables() {
    pressedKey = null; 
    index = 0;
    frequencies = [];
    tuningNote = document.getElementById("tuningNote").value;
    tuningNote = tuningNote.trim().toLowerCase().split('');
    if (+tuningNote.at(-1)) { 
        tuningOctave = +tuningNote.pop(); 
    } else {
        tuningOctave = 4;
    }
    tuningPitch = 0;
    while (tuningNote.length) {
        tuningPitch += value[tuningNote.pop()];
    }
    tuningFrequency = +document.getElementById("tuningFrequency").value;
    track = document.getElementById("track").selectedIndex;
    const proposedGain = +document.getElementById("gain").value;
    if (proposedGain <= 1 && proposedGain >= 0) {
        normalGain = +document.getElementById("gain").value;
    } else {
        normalGain = 0.15;
    }
    gainNode.gain.value = 0;
    paused = false;
}

function resume() { paused = false; }

function start() { resetVariables(); convertNotesToFrequencies();
    startOscillatorIfNeccessary(); }

function startOscillatorIfNeccessary() {
    if (!on) { 
        oscillator.start();
        on = true;
    }
}

function touch(e) {
    //console.log(e.target);
    const touches = e.changedTouches;
    // console.log(touches.length);
    for (let i = 0; i < touches.length; i++) {
        console.log("down",touches.item(i).identifier);
        if (on // && !(touches.item(i).identifier === touchedFinger)
            && !e.repeat && index < frequencies.length) {
                if (touchedFinger === null) {
                    oscillator.frequency.value = frequencies[index];
                    gainNode.gain.setTargetAtTime(normalGain, 
                        audioContext.currentTime, 0.015);
                } else {
                    oscillator.frequency.setTargetAtTime(frequencies[index], 
                        audioContext.currentTime, 0.003)    
                }
                console.log(frequencies[index]);
                //oscillator.frequency.value = frequencies[index];
                index++;
                touchedFinger = e.changedTouches.item(i).identifier;
        }
    }
}

function up(e) {
    if (on && (e.key === pressedKey)) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
        pressedKey = null;
    }
}

reader.onload = function(e) {
    midi = new Midi(e.target.result);
    const select = document.getElementById("track");
    while (select.options.length) { select.options.remove(0); }
    for (let i = 0; i < midi.tracks.length; i++) {
        let t = midi.tracks[i];
        const option = document.createElement("option");
        option.text = t.name;
        select.add(option);
    }
    console.log(midi);
}

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", () => {
    resetVariables();
    const file = fileInput.files[0];
    if (file) {reader.readAsArrayBuffer(file);}
});
document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", pause);
document.getElementById("resume").addEventListener("click", resume);
document.addEventListener("keydown", down);
document.addEventListener("keyup", up);
document.addEventListener("touchstart", touch);
//document.addEventListener("touchend", release);
