// Cores do logo no tema claro do blog: legíveis no console claro e no escuro
const LOGO_COLORS = { icon: '#7c3aed', name: '#64748b', dev: '#7c3aed' };

export function printConsoleGreeting(): void {
  const font = 'font: 700 20px "Fira Code", monospace';
  console.log(
    '%c</> %cALISSONLIMA%cDEV',
    `${font}; color: ${LOGO_COLORS.icon}`,
    `${font}; color: ${LOGO_COLORS.name}`,
    `${font}; color: ${LOGO_COLORS.dev}`,
  );
  // Texto comum sem cor (segue o tema do console); só as ênfases em roxo
  const text = 'font: 13px "Fira Code", monospace; line-height: 1.6';
  const accent = `${text}; font-weight: 700; color: ${LOGO_COLORS.icon}`;
  console.log(
    '%croot@alissonlimadev:~#%c cat contato.txt\n\n' +
      '%cCurioso pelo código?%c Ele é aberto: https://github.com/alissonlimabr/portfolio\n' +
      '%cBora conversar:%c alissonlimabr.dev@gmail.com · https://www.linkedin.com/in/alissonlimadev',
    accent,
    text,
    accent,
    text,
    accent,
    text,
  );
}
