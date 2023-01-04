const audioContext = new AudioContext();
const badKeys = ["Audio", "Alt", "Launch", "Enter", "Meta", "Play", "Tab"];
const gainNode = new GainNode(audioContext);
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
const reader = new FileReader();
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};

let tuningNote; let tuningPitch; let tuningOctave; let tuningFrequency;
let frequencies = []; let index; let midi; let normalGain; let notes; 
let octave; let on = false; let paused; let pressedKey; let touchedFinger; 
let track; 

oscillator.connect(gainNode).connect(audioContext.destination);
resetVariables();

function convertNotesToFrequencies() {
    if (document.getElementById("fileRadio").checked) {
        const notes = midi.tracks[track].notes;
        for (let i = 0; i < notes.length; i++) {
            const pitch = notes[i].midi - 60;
            let frequency = tuningFrequency;
            frequency *= 2**((pitch - tuningPitch)/12 + octave - tuningOctave);
            frequencies.push(frequency);
        }    
    } else {
        for (i = 0; i < notes.length; i++) {
            const note = notes[i].split('');
            if (+note.at(-1)) { 
                octave = +note.pop(); 
            }
            let pitch = 0;
            while (note.length) {
                pitch += value[note.pop()];
            }
            let frequency = tuningFrequency;
            frequency *= 2**((pitch - tuningPitch)/12 + octave - tuningOctave);
            frequencies.push(frequency);
        }
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

function previous() { if (index > 0) { index--; } }

function release(e) {
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        if (on && touches.item(i).identifier === touchedFinger) {
            gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
            touchedFinger = null;
        }
    }
}

function resetVariables() {
    pressedKey = null; 
    touchedFinger = null;
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
    notes = document.getElementById("notes").value;
    notes = notes.trim().toLowerCase().split(/\s+/);
    octave = 4;
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
    const touches = e.changedTouches;
    for (let i = 0; i < touches.length; i++) {
        if (on && !(touches.item(i).identifier === touchedFinger)
             && index < frequencies.length) {
                if (touchedFinger === null) {
                    oscillator.frequency.value = frequencies[index];
                    gainNode.gain.setTargetAtTime(normalGain, 
                        audioContext.currentTime, 0.015);
                } else {
                    oscillator.frequency.setTargetAtTime(frequencies[index], 
                        audioContext.currentTime, 0.003)    
                }
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
document.getElementById("previous").addEventListener("click", previous);
document.addEventListener("keydown", down);
document.addEventListener("keyup", up);
document.addEventListener("touchstart", touch);
document.addEventListener("touchend", release);
