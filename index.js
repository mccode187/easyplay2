const audioContext = new AudioContext();
const badKeys = ["Alt","Arrow","Audio","Enter","Launch","Meta","Play","Tab"];
const display = document.getElementById("display");
const emptyLine = " ".repeat(128 + 4);
const gainNode = new GainNode(audioContext);
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
const reader = new FileReader();
const state = document.getElementById("state");
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};

let tuningNote; let tuningPitch; let tuningOctave; let tuningFrequency;
let activePress; let frequencies = []; let index; let midi; let normalGain; 
let notes; let octave; let on = false; let paused; let track; 

oscillator.connect(gainNode).connect(audioContext.destination);
resetVariables();

function adjustDisplay() {
    function helper(d, start, end) {
        d.blur();
        d.selectionStart = d.selectionEnd = start;
        d.blur();
        d.focus();
        d.selectionStart = start;
        d.selectionEnd = end;
        d.scrollLeft = d.clientWidth / 2;
    }
    
    let displayWidth = 128 + 4 + 1;
    let start = (index * 2) * displayWidth;
    let end = (index * 2 + 1) * displayWidth;

    helper(display, start, end);

    if (activePress !== null) {
        helper(display, start + displayWidth, end + displayWidth);
    }
}

function backwards() { move(-1); }

function convertNotesToFrequencies() {
    if (document.getElementById("fileRadio").checked) {
        notes = midi.tracks[track].notes;
    }
    for (let i = 0; i < notes.length; i++) {
        let pitch; let indent; let noteText;
        if (document.getElementById("fileRadio").checked) {
            pitch = notes[i].midi - 60;
            indent = notes[i].midi;
            noteText = notes[i].name.toLowerCase();
            noteText += " ".repeat(4 - noteText.length);
        } else {
            const note = notes[i].split('');
            noteText = notes[i];
            if (+note.at(-1)) { 
                octave = +note.pop(); 
            } else {
                noteText += octave;
            }
            noteText += " ".repeat(4 - noteText.length);
            pitch = 0;
            while (note.length) {
                pitch += value[note.pop()];
            }
            indent = pitch + (octave + 1) * 12;

        }
        let frequency = tuningFrequency;
        frequency *= 2**((pitch - tuningPitch)/12 + octave - tuningOctave);
        frequencies.push(frequency);
        const line = " ".repeat(indent) + "." + " ".repeat(128-indent-1);
        display.value += line + noteText + "\n" + emptyLine;
        if (i < notes.length - 1) {
            display.value += "\n";
        }
    } 
    adjustDisplay();
    display.scrollTop = 0;
    display.scrollLeft = display.clientWidth / 2;
}

function down(e) {
    let press;
    if (e.type === "keydown") { press = e.key; } 
    else { press = e.changedTouches[0].identifier; }
    strPress = "" + press;
    if (on && !badKeys.some(badKey => strPress.includes(badKey)) && !paused
        && (index < frequencies.length) && !e.repeat && (press != activePress)
        && (document.activeElement.nodeName !== 'INPUT')) {
        if (activePress === null) {
            oscillator.frequency.value = frequencies[index];
            gainNode.gain.setTargetAtTime(normalGain, 
                audioContext.currentTime, 0.015);
        } else {
            oscillator.frequency.setTargetAtTime(frequencies[index], 
                audioContext.currentTime, 0.003)    
        }
        activePress = press;
        adjustDisplay();
        index++;
    } else if (strPress.includes("Arrow") && (activePress === null)) {
        if (strPress.includes("Up")) { move(-1) }
        else if (strPress.includes("Down")) { move(1); }
    }
}

function forwards() { move(1); }

function help() { location.href = "https://mcchu.com/easyplayhelp/"; }

function move(step) {
    const times = +document.getElementById("distance").value;
    for (let i = 0; i < times; i++) {
        index += step;
        if (index >= frequencies.length) { index = frequencies.length; }
        if (index < 0) { index = 0; }
        adjustDisplay();
    }
}

function pause() { paused = true; oscillator.frequency.value = 0; }

function resetVariables() {
    activePress = null; 
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
    display.value = emptyLine + "\n";
    paused = false;
}

function resume() { paused = false; }

function start() { 
    state.value = "Loading...";
    window.setTimeout(() => {
        resetVariables(); 
        convertNotesToFrequencies();
        startOscillatorIfNeccessary();
        state.value = "Ready";
    });
}

function startOscillatorIfNeccessary() {
    if (!on) { 
        oscillator.start();
        on = true;
    }
}

function up(e) {
    let press;
    if (e.type === "keyup") { press = e.key; } 
    else { press = e.changedTouches[0].identifier; }
    if (on && (press === activePress)) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
        activePress = null;
        adjustDisplay();
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
document.getElementById("backwards").addEventListener("click", backwards);
document.getElementById("forwards").addEventListener("click", forwards);
document.getElementById("help").addEventListener("click", help);
document.addEventListener("keydown", down);
document.addEventListener("keyup", up);
document.addEventListener("touchstart", down);
document.addEventListener("touchend", up);
display.addEventListener("keydown", function(e) {
    if (["Space","ArrowUp","ArrowDown"].indexOf(e.key) > -1) {
        e.preventDefault();
    }
}, false);
