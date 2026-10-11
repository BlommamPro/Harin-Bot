export const emojis = {
  // Emojis animados
  a_on: "<a:on_animate:1558655566329548910>",
  a_off: "<a:off_animate:1558655899315216495>",
  load: "<a:loading:1558654640097067080>",
  pingconnetion: "<a:ping:1558654558148890624>",
  timersand: "<a:hourglass:1558654741519540344>",
  check: "<a:check:1558654875359780946>",
  cross: "<a:stop:1558655151181668413>",
  warning: "<a:danger:1558655384997068891>",
  infor: "<a:info:1558656056459010149>",
  unlocker: "<a:unlock:1558656139246444665>",
  locker: "<a:locke:1558656228497031258>",
  clear: "<a:bin:1558656291348676699>",
  coin: "<a:dollar:1558656348156334201>",
  bank: "<a:bank:1558656429135626240>",

  // Emojis estáticos

  on: "<:on:1558655817312636959>",
  off: "<:off:1558655952226484265>",
  harin: "<:harin:1557877320684015666>",

  // Emojis de moderación
  ban: "<a:kick:1558656510102601798>",
  mute: "<a:mute:1558656577399955506>",
};

// Helper para usar emojis fácilmente
export function e(name) {
  return emojis[name] || "";
}
