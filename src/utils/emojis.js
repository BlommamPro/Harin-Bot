export const emojis = {
  // Emojis animados
  a_on: "<a:on_animate:1546598989950877756>",
  a_off: "<a:off_animate:1546604947187966082>",
  load: "<a:loading:1546586900234633337>",
  pingconnetion: "<a:ping:1546583923230777474>",
  timersand: "<a:hourglass:1546588264473825310>",
  check: "<a:check:1546589403995185182>",
  cross: "<a:stop:1546591501755359273>",
  warning: "<a:danger:1546591959844655144>",
  infor: "<a:info:1546605527486832701>",
  unlocker: "<a:unlock:1546656310173507674>",
  locker: "<a:locke:1546656636813185077>",
  clear: "<a:bin:1546657294379651193>",
  coin: "<a:dollar:1546658197371228230>",
  bank: "<a:bank:1546659171221635132>",

  // Emojis estáticos

  on: "<:on:1546602883712163870>",
  off: "<:off:1546605000749486163>",

  // Emojis de moderación
  ban: "<a:kick:1546660580633608192>",
  mute: "<a:mute:1546661623366680656>",
};

// Helper para usar emojis fácilmente
export function e(name) {
  return emojis[name] || "";
}
