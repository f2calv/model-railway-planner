export type Sound = 'snap' | 'disconnect' | 'delete';

let context: AudioContext | undefined;

export async function playSound(sound: Sound): Promise<void> {
  if (typeof AudioContext === 'undefined')
    throw new Error('This browser does not support track sounds.');
  context ??= new AudioContext();
  await context.resume();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const frequency = sound === 'snap' ? 660 : sound === 'disconnect' ? 330 : 150;
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, now + 0.08);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
  oscillator.start(now);
  oscillator.stop(now + 0.11);
}
