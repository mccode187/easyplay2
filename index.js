const audioContext = new AudioContext(); 
const oscillator = new OscillatorNode(audioContext, {frequency: 0});
oscillator.connect(audioContext.destination);

const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};
const reader = new FileReader();

let on = false;

let pressedKey; let index; let frequencies; let notes; let channel;

reader.onload = function() {
    let buffer = reader.result; 
    let view = new Uint8Array(buffer);
    for (let i = 0; i < view.length - 1; i++) {
        if (view[i] === (144 + channel) ) {
            const pitch = view[i+1] - 60;
            const frequency = 2 ** (pitch/12 + 8);
            frequencies.push(frequency);    
        }
    }
    console.log(frequencies);
}

function resetVariables() {
    pressedKey = null; 
    index = 0; 
    frequencies = [];
    channel = +document.getElementById("channel").value;
    notes = document.getElementById("notes").files[0];
    if (notes) {
        reader.readAsArrayBuffer(notes);
    }

}

resetVariables();

function down(e) {
    if (on && !e.key.includes("Audio") && e.key != pressedKey && !e.repeat 
            && index < frequencies.length) {
        oscillator.frequency.value = frequencies[index];
        index++;
        pressedKey = e.key;
    }
}

function up(e) {
    if (on && (e.key === pressedKey)) {
        oscillator.frequency.value = 0;
        pressedKey = null;
    }
}

document.addEventListener("keydown", down);
document.addEventListener("keyup", up);

function convertNotesToFrequencies() {
    for (i = 0; i < notes.length; i++) {
        const note = notes[i].split('');
        if (+note.at(-1)) { 
            octave = +note.pop(); 
        }
        let pitch = 0;
        while (note.length) {
            pitch += value[note.pop()];
        }
        const frequency = 2 ** (pitch/12 + octave + 4);
        frequencies[0].push(frequency);
    }
}

function startOscillatorIfNeccessary() {
    if (!on) { 
        oscillator.start();
        on = true;
    }
}

function start() {
    resetVariables();
    convertNotesToFrequencies();
    startOscillatorIfNeccessary();
}

document.getElementById("start").addEventListener("click", start);