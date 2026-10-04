import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const lightColors = {
  ...MD3LightTheme.colors,
  primary: '#456B4E',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D7EBD6',
  onPrimaryContainer: '#173820',
  secondary: '#A45132',
  secondaryContainer: '#FFDBCC',
  tertiary: '#42677A',
  tertiaryContainer: '#CBE7F3',
  background: '#F6F7F1',
  surface: '#FFFFFF',
  surfaceVariant: '#E8EDE4',
  outline: '#778477',
};

const darkColors = {
  ...MD3DarkTheme.colors,
  primary: '#A9D8AA',
  onPrimary: '#173820',
  primaryContainer: '#2F5238',
  onPrimaryContainer: '#D7EBD6',
  secondary: '#F4B79A',
  secondaryContainer: '#6E3926',
  tertiary: '#A8D2E4',
  tertiaryContainer: '#2C4F60',
  background: '#111813',
  surface: '#1B241E',
  surfaceVariant: '#303A32',
  outline: '#849087',
};

export const habitLightTheme = { ...MD3LightTheme, colors: lightColors, roundness: 16 };
export const habitDarkTheme = { ...MD3DarkTheme, colors: darkColors, roundness: 16 };
