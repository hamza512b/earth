
// The links was taken from Nasa Webstite
// https://voyager.jpl.nasa.gov/golden-record/whats-on-the-record/sounds/


import config from "../config";
import { Howl } from 'howler';

export const sounds = ["./sounds/spheres.wav", "./sounds/volcanoes.wav", "./sounds/mud.wav", "./sounds/wind.wav", "./sounds/crickets.wav", "./sounds/birds.wav", "./sounds/chimpanzee.wav", "./sounds/wildog.wav", "./sounds/footsteps.wav", "./sounds/fire.wav", "./sounds/first.wav", "./sounds/tamedog.wav", "./sounds/herding.wav", "./sounds/tractor.wav", "./sounds/morse.wav", "./sounds/horse.wav", "./sounds/train.wav", "./sounds/bus.wav", "./sounds/f-111.wav", "./sounds/kiss.wav", "./sounds/life.wav"]

const volume = config.volume || 0.25;
export const playSound = (i) => {
  const sound = new Howl({
    src: [sounds[i]],
    preload: true,
    volume: config.volume || 0.25,
    onend: () => {
      if (i + 1 == sounds.length) return;
      else playSound(i + 1)
    }
  })
  sound.play();
  sound.fade(0, volume, 20 * 1000);
};
