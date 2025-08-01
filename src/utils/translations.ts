import i18n from '../i18n';

// Utility function to get stage description
export const getStageDescription = (stage: string): string => {
  return i18n.t(`stages.${stage}`, { defaultValue: stage });
};

// Utility function to get ship name
export const getShipName = (shipType: string): string => {
  return i18n.t(`ships.${shipType}`, { defaultValue: shipType });
};

// Utility function to get ship description
export const getShipDescription = (shipType: string): string => {
  const shipName = getShipName(shipType);
  const description = i18n.t(`shipDescriptions.${shipType}`, { defaultValue: '' });
  return `<p><b>${shipName}</b><br><br>${description}</p>`;
};
