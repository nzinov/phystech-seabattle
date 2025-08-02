import i18n from '../i18n';

// Get ship gender from translation data
export const getShipGender = (shipType: string): 'masculine' | 'feminine' => {
  return i18n.t(`shipGenders.${shipType}`, { defaultValue: 'masculine' }) as
    | 'masculine'
    | 'feminine';
};

// Get correctly gendered possessive pronoun
export const getPossessivePronoun = (
  shipType: string,
  player: string,
  currentPlayer: string
): string => {
  if (!i18n.language.startsWith('ru')) {
    // For English, use simple logic
    return player === currentPlayer ? i18n.t('log.your') : i18n.t('log.opponents');
  }

  const gender = getShipGender(shipType);
  const isYour = player === currentPlayer;

  if (isYour) {
    return gender === 'feminine' ? i18n.t('log.yourFeminine') : i18n.t('log.yourMasculine');
  } else {
    return gender === 'feminine'
      ? i18n.t('log.opponentsFeminine')
      : i18n.t('log.opponentsMasculine');
  }
};

// Get correctly gendered verb form
export const getGenderedVerb = (shipType: string, baseKey: string): string => {
  if (!i18n.language.startsWith('ru')) {
    // For English, no gender agreement needed
    return i18n.t(`log.${baseKey}`);
  }

  const gender = getShipGender(shipType);
  const feminineKey = `${baseKey}Feminine`;

  return gender === 'feminine'
    ? i18n.t(`log.${feminineKey}`, { defaultValue: i18n.t(`log.${baseKey}`) })
    : i18n.t(`log.${baseKey}`);
};
