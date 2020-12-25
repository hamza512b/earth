
// The links was taken from Nasa Webstite, no copyright inframge
// the sounds have no copyright

import config from "../config";

// https://voyager.jpl.nasa.gov/golden-record/whats-on-the-record/sounds/
const sounds = ["spheres.wav", "volcanoes.wav", "mud.wav", "wind.wav", "crickets.wav", "birds.wav", "chimpanzee.wav", "wildog.wav", "footsteps.wav", "fire.wav", "first.wav", "tamedog.wav", "herding.wav", "tractor.wav", "morse.wav", "horse.wav", "train.wav", "bus.wav", "f-111.wav", "kiss.wav", "life.wav"];




let hidden, visibilityChange;
if (!document.hidden) {
  visibilityChange = "visibilitychange";
} else if (!document.msHidden) {
  visibilityChange = "msvisibilitychange";
} else if (!document.webkitHidden) {
  visibilityChange = "webkitvisibilitychange";
}

window.addEventListener(visibilityChange, () => {
    audio.pause();
})


// Sounds
const randomSound = () => "./sounds/" + sounds[Math.floor(Math.random() * sounds.length)];
let audio = new Audio(randomSound());
audio.volume = config.volume || 0.25;
audio.addEventListener("ended", () => {
    audio.src = randomSound();
    audio.load();
    audio.play();
});

export const playSound = () => {
    if (!audio.paused) return;
    audio.play();
}