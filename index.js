const audioContext = new AudioContext();
const badKeys = ["Audio", "Alt", "Launch", "Enter", "Meta", "Play", "Tab"];
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
const reader = new FileReader();
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};

let frequencies = []; let index; let midi; let notes; let on = false;
let paused; let pressedKey; let track; 

oscillator.connect(audioContext.destination); resetVariables();

function convertNotesToFrequencies() {
    let notes = midi.tracks[track].notes;
    for (let i = 0; i < notes.length; i++) {
        const pitch = notes[i].midi - 60;
        const frequency = 2 ** (pitch/12 + 8);
        frequencies.push(frequency);    
    }
}

function down(e) {
    if (on && !badKeys.some(badKey => e.key.includes(badKey)) && !e.repeat 
            && (e.key != pressedKey) && (index < frequencies.length) 
            && !paused) {
        oscillator.frequency.value = frequencies[index];
        index++; pressedKey = e.key;
    }
}

function pause() { paused = true; oscillator.frequency.value = 0; }

function resetVariables() {pressedKey = null; index = 0; paused = false;
    track = +document.getElementById("track").value;}

function resume() { paused = false; }

function start() { resetVariables(); convertNotesToFrequencies();
    startOscillatorIfNeccessary(); }

function startOscillatorIfNeccessary() {
    if (!on) { oscillator.start(); on = true; }
}

function up(e) {
    if (on && (e.key === pressedKey) && !paused) {
        oscillator.frequency.value = 0; pressedKey = null;
    }
}

reader.onload = function(e) {
    midi = new Midi(e.target.result);
    document.getElementById("viewTracks").innerHTML = "Tracks:";
    for (let i = 0; i < midi.tracks.length; i++) {
        let t = midi.tracks[i];
        document.getElementById("viewTracks").innerHTML += "<br>" + i + ": " 
            + t.name;
    }
    console.log(midi);
}

document.getElementById("notes").addEventListener("change", () => {
    notes = document.getElementById("notes").files[0];
    if (notes) {reader.readAsArrayBuffer(notes);}
});

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", pause);
document.getElementById("resume").addEventListener("click", resume);
document.addEventListener("keydown", down);
document.addEventListener("keyup", up);