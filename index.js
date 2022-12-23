const audioContext = new AudioContext(); 
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
oscillator.connect(audioContext.destination);

const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};
const badKeys = ["Audio", "Alt", "Launch", "Enter", "Meta", "Play", "Tab"];
let on = false;

let pressedKey; let index; let frequencies; let notes; let paused; let track;

const reader = new FileReader();
reader.onload = function(e) {
    const midi = new Midi(e.target.result);
    let notes = midi.tracks[track].notes;
    console.log(midi);
    for (let i = 0; i < notes.length; i++) {
        const pitch = notes[i].midi - 60;
        const frequency = 2 ** (pitch/12 + 8);
        frequencies.push(frequency);    
    } 
}

function resetVariables() {
    pressedKey = null; 
    index = 0; 
    frequencies = [];
    track = +document.getElementById("track").value;
    notes = document.getElementById("notes").files[0];
    if (notes) {
        reader.readAsArrayBuffer(notes);
    }
    paused = false;

}

resetVariables();

function down(e) {
    if (on && !badKeys.some(badKey => e.key.includes(badKey)) && !e.repeat 
            && (e.key != pressedKey) && (index < frequencies.length) 
            && !paused) {
        oscillator.frequency.value = frequencies[index];
        index++;
        pressedKey = e.key;
    }
}

function up(e) {
    if (on && (e.key === pressedKey) && !paused) {
        oscillator.frequency.value = 0;
        pressedKey = null;
    }
}

document.addEventListener("keydown", down);
document.addEventListener("keyup", up);

function startOscillatorIfNeccessary() {
    if (!on) { 
        oscillator.start();
        on = true;
    }
}

function start() {
    resetVariables();
    startOscillatorIfNeccessary();
}

function pause() {
    paused = true;
    oscillator.frequency.value = 0;
}

function resume() {
    paused = false;
}

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", pause);
document.getElementById("resume").addEventListener("click", resume);