const audioContext = new AudioContext();
const badKeys = ["Alt","Arrow","Audio","Enter","Launch","Meta","Play","Tab"];
const display = byId("display");
const emptyLine = " ".repeat(128 + 4);
const fileInput = byId("fileInput");
const gainNode = new GainNode(audioContext);
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
const reader = new FileReader();
const select = byId("track");
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};

let activePress; let frequencies; let index; let indents; let midi; 
let normalGain; let notes; let octave; let on = false; let paused; let press; 
let tuning;

oscillator.connect(gainNode).connect(audioContext.destination); resetVars();

function adjustDisplay() {
    function goTo() {
        display.blur();
        display.selectionStart = display.selectionEnd = start + indents[index];
        display.blur(); display.focus();
        display.selectionStart = start + indents[index];
        display.selectionEnd = start + indents[index] + 1;
    }
    const width = 128 + 4 + 1; let start = (index * 2) * width; goTo();
    if (activePress !== null) {
        document.getElementById("simpleDisplay").value = notes[index];
        start += width; 
        goTo();
    } else {
        document.getElementById("simpleDisplay").value = "";
    }
}

function backwards() { move(-1,+byId("distance").value); }

function byId(id) { return document.getElementById(id); };

function convertNotesToFrequencies() {
    octave = 4;
    for (let i = 0; i < notes.length; i++) {
        const note = unbundle(notes[i]);
        frequencies.push(tuning.frequency * 2**((note.pitch - tuning.pitch)/12 
                            + note.octave - tuning.octave));
        const indent = note.pitch + (note.octave + 1) * 12;
        indents.push(indent);
        display.value += " ".repeat(indent) + "." + " ".repeat(128-indent-1) 
            + note.text + " ".repeat(4 - note.text.length) + "\n" + emptyLine;        
        if (i < notes.length - 1) {display.value += "\n";}
    } 
    adjustDisplay(); display.scrollTop = 0;
}

function down(e) {
    const strPress = "" + press;
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
        activePress = press; adjustDisplay(); index++;
    } else if (strPress.includes("Arrow") && (activePress === null)) {
        if (strPress.includes("Up")) { move(-1,1); }
        else if (strPress.includes("Down")) { move(1,1); }
    }
}

function format(x) {return x.trim().toLowerCase();}

function forwards() {move(1,+byId("distance").value);}

function help() {window.open("help", "_blank");}

function key(e) { 
    if (e.type.includes("key")) {press = e.key;} 
    else {press = e.changedTouches[0].identifier;}
    if (["keydown","touchstart"].includes(e.type)) {down(e);} else {up(e);}
}

function move(step, times) {
    for (let i = 0; i < times; i++) {
        index += step;
        if (index >= frequencies.length) { index = frequencies.length; }
        if (index < 0) { index = 0; }
        adjustDisplay();
    }
}

function pause() { paused = true; oscillator.frequency.value = 0; }

function resetVars() {
    activePress = null; frequencies = []; index = 0; indents = []; octave = 4; 
    paused = false;
    tuning = unbundle(byId("tuningNote").value);
    tuning.frequency = +byId("tuningFrequency").value;
    if (byId("fileRadio").checked) {
        const track = byId("track").selectedIndex;
        notes = midi.tracks[track].notes.map(x => format(x.name));
    } else {
        notes = format(byId("notes").value).split(/\s+/);
    }
    const proposedGain = +byId("gain").value;
    if (proposedGain <= 1 && proposedGain >= 0) {normalGain = proposedGain;} 
    else {normalGain = 0.15;}
    gainNode.gain.value = 0;
    display.value = emptyLine + "\n";
    document.getElementById("simpleDisplay").value = "";
}

function resume() { paused = false; }

function start() { 
    byId("state").value = "Loading...";
    window.setTimeout(() => {
        resetVars(); convertNotesToFrequencies();
        if (!on) {oscillator.start(); on = true;}
        byId("state").value = "Ready";
    });
}

function unbundle(note) {
    let text = format(note); note = text.split('');
    if (+note.at(-1)) {octave = +note.pop();} else {text += octave;}
    let pitch = 0; while (note.length) { pitch += value[note.pop()]; }
    return {pitch:pitch, octave:octave, text:text};
}

function up(e) {
    if (on && (press === activePress)) {
        gainNode.gain.setTargetAtTime(0, audioContext.currentTime, 0.015);
        activePress = null; adjustDisplay();
    }
}

display.addEventListener("keydown", (e) => {
    if (["Space","ArrowUp","ArrowDown"].includes(e.key)) {e.preventDefault();}
});
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0]; if (file) {reader.readAsArrayBuffer(file);}
});
reader.addEventListener("load", (e) => {
    midi = new Midi(e.target.result);
    while (select.options.length) {select.options.remove(0);}
    for (let i = 0; i < midi.tracks.length; i++) {
        const option = document.createElement("option");
        option.text = midi.tracks[i].name; select.add(option);
    }
});
const touchstart = (e) => {keydown(e);}; const touchend = (e) => {keyup(e);};
const buttonFuncs = [start,pause,resume,backwards,forwards,help];
const docEventTypes = ["keydown","keyup","touchstart","touchend"];
for (f of buttonFuncs) {byId(f.name).addEventListener("click", f);} 
for (et of docEventTypes) {document.addEventListener(et, key);}