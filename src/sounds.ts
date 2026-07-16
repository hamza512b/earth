// The links was taken from Nasa Webstite
// https://voyager.jpl.nasa.gov/golden-record/whats-on-the-record/sounds/

export const sounds = [
  new Audio("./sounds/spheres.wav"),
  new Audio("./sounds/volcanoes.wav"),
  new Audio("./sounds/mud.wav"),
  new Audio("./sounds/wind.wav"),
  new Audio("./sounds/crickets.wav"),
  new Audio("./sounds/birds.wav"),
  new Audio("./sounds/chimpanzee.wav"),
  new Audio("./sounds/wildog.wav"),
  new Audio("./sounds/footsteps.wav"),
  new Audio("./sounds/fire.wav"),
  new Audio("./sounds/first.wav"),
  new Audio("./sounds/tamedog.wav"),
  new Audio("./sounds/herding.wav"),
  new Audio("./sounds/tractor.wav"),
  new Audio("./sounds/morse.wav"),
  new Audio("./sounds/horse.wav"),
  new Audio("./sounds/train.wav"),
  new Audio("./sounds/bus.wav"),
  new Audio("./sounds/f-111.wav"),
  new Audio("./sounds/kiss.wav"),
  new Audio("./sounds/life.wav"),
];

export async function playSound() {
  for (const sound of sounds) {
    sound.volume = 0.25;
    await playAudio(sound);
  }
}

function playAudio(audio: HTMLAudioElement) {
  return new Promise((resolve, reject) => {
    audio.addEventListener("ended", resolve, { once: true });
    audio.addEventListener("error", reject, { once: true });
    audio.play().catch(reject);
  });
}
