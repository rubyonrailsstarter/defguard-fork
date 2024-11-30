export const avaliableThemes: ThemeKey[] = ['light', 'dark'];
export type ThemeKey = 'light' | 'dark';

export type ThemeColors = {
  textButtonSecondary: string;
  textBodyPrimary: string;
  surfaceDefaultModal: string;
  textButtonPrimary: string;
  surfaceIconPrimary: string;
  surfacePositiveAccent: string;
  surfaceAlertSecondary: string;
  surfaceAlertPrimary: string;
  textButtonTertiary: string;
  surfaceImportantAccent: string;
  surfaceModalAccent: string;
  surfaceScrollInactive: string;
  surfaceInfoModal: string;
  surfaceIconSecondary: string;
  textAlert: string;
  surfaceTeoniteLogo: string;
  surfaceFrameBg: string;
  surfaceTagModal: string;
  surfaceMainSecondary: string;
  surfacePositivePrimary: string;
  borderSeparator: string;
  surfaceButton: string;
  surfaceScrollActive: string;
  borderSecondary: string;
  surfacePositiveSecondary: string;
  textPositive: string;
  surfaceMainPrimary: string;
  surfaceDfgLogoFlat: string;
  textBodySecondary: string;
  borderAlert: string;
  surfaceNavBg: string;
  textBodyTertiary: string;
  surfaceImportant: string;
  textImportant: string;
  surfaceAlertAccent: string;
  borderPrimary: string;
};

export const themeLight = {
  textBodyPrimary: 'rgba(34, 34, 34, 1)',
  surfacePositivePrimary: 'rgba(20, 188, 110, 1)',
  textImportant: 'rgba(184, 143, 48, 1)',
  surfaceImportant: 'rgba(184, 143, 48, 1)',
  surfaceIconSecondary: 'rgba(255, 255, 255, 1)',
  surfaceButton: 'rgba(249, 249, 249, 1)',
  surfaceInfoModal: 'rgba(249, 249, 249, 1)',
  surfacePositiveSecondary: 'rgba(16, 161, 94, 1)',
  textButtonSecondary: 'rgba(255, 255, 255, 1)',
  surfaceTeoniteLogo: 'rgba(0, 0, 0, 1)',
  surfaceDefaultModal: 'rgba(255, 255, 255, 1)',
  borderSeparator: 'rgba(196, 196, 196, 1)',
  textBodyTertiary: 'rgba(137, 156, 168, 1)',
  borderAlert: 'rgba(203, 63, 63, 1)',
  textPositive: 'rgba(20, 188, 110, 1)',
  surfaceAlertPrimary: 'rgba(203, 63, 63, 1)',
  surfaceIconPrimary: 'rgba(137, 156, 168, 1)',
  surfaceImportantAccent: 'rgba(251, 245, 231, 1)',
  surfaceFrameBg: 'rgba(249, 249, 249, 1)',
  surfaceScrollInactive: 'rgba(203, 211, 216, 1)',
  surfaceModalAccent: 'rgba(203, 211, 216, 1)',
  surfacePositiveAccent: 'rgba(215, 248, 233, 1)',
  surfaceMainPrimary: 'rgba(12, 140, 224, 1)',
  borderSecondary: 'rgba(232, 232, 232, 1)',
  surfaceNavBg: 'rgba(255, 255, 255, 1)',
  surfaceMainSecondary: 'rgba(8, 118, 190, 1)',
  textAlert: 'rgba(203, 63, 63, 1)',
  textBodySecondary: 'rgba(97, 118, 132, 1)',
  surfaceDfgLogoFlat: 'rgba(255, 255, 255, 1)',
  textButtonPrimary: 'rgba(72, 89, 100, 1)',
  textButtonTertiary: 'rgba(12, 140, 224, 1)',
  borderPrimary: 'rgba(232, 232, 232, 1)',
  surfaceAlertSecondary: 'rgba(181, 48, 48, 1)',
  surfaceAlertAccent: 'rgba(252, 238, 238, 1)',
  surfaceScrollActive: 'rgba(137, 156, 168, 1)',
  surfaceTagModal: 'rgba(232, 232, 232, 1)',
};

export const themeDark = {
  textButtonTertiary: 'rgba(12, 140, 224, 1)',
  surfaceScrollInactive: 'rgba(203, 211, 216, 1)',
  surfacePositiveAccent: 'rgba(34, 34, 34, 1)',
  textAlert: 'rgba(203, 63, 63, 1)',
  surfaceTagModal: 'rgba(72, 89, 100, 1)',
  surfacePositiveSecondary: 'rgba(16, 161, 94, 1)',
  surfaceFrameBg: 'rgba(34, 34, 34, 1)',
  surfaceTeoniteLogo: 'rgba(255, 255, 255, 1)',
  surfaceImportant: 'rgba(184, 143, 48, 1)',
  surfaceNavBg: 'rgba(47, 50, 51, 1)',
  borderSeparator: 'rgba(72, 89, 100, 1)',
  surfaceIconSecondary: 'rgba(255, 255, 255, 1)',
  borderPrimary: 'rgba(72, 89, 100, 1)',
  textPositive: 'rgba(20, 188, 110, 1)',
  surfaceMainPrimary: 'rgba(12, 140, 224, 1)',
  surfaceInfoModal: 'rgba(72, 89, 100, 1)',
  surfaceButton: 'rgba(47, 50, 51, 1)',
  surfaceIconPrimary: 'rgba(255, 255, 255, 1)',
  borderAlert: 'rgba(203, 63, 63, 1)',
  surfaceAlertSecondary: 'rgba(181, 48, 48, 1)',
  surfaceDefaultModal: 'rgba(47, 50, 51, 1)',
  surfacePositivePrimary: 'rgba(20, 188, 110, 1)',
  textBodyPrimary: 'rgba(255, 255, 255, 1)',
  textImportant: 'rgba(184, 143, 48, 1)',
  surfaceImportantAccent: 'rgba(48, 39, 18, 1)',
  textBodySecondary: 'rgba(196, 196, 196, 1)',
  surfaceModalAccent: 'rgba(203, 211, 216, 1)',
  textButtonSecondary: 'rgba(255, 255, 255, 1)',
  surfaceAlertPrimary: 'rgba(203, 63, 63, 1)',
  surfaceDfgLogoFlat: 'rgba(255, 255, 255, 1)',
  borderSecondary: 'rgba(232, 232, 232, 1)',
  surfaceMainSecondary: 'rgba(8, 118, 190, 1)',
  surfaceScrollActive: 'rgba(137, 156, 168, 1)',
  textBodyTertiary: 'rgba(137, 156, 168, 1)',
  textButtonPrimary: 'rgba(255, 255, 255, 1)',
  surfaceAlertAccent: 'rgba(34, 34, 34, 1)',
};
