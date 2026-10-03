import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from '../App';

jest.mock('react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const ReactNative = jest.requireActual('react-native');
  const TestModal = ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    (visible ? React.createElement(ReactNative.View, null, children) : null);

  return new Proxy(ReactNative, {
    get(target, property, receiver) {
      return property === 'Modal' ? TestModal : Reflect.get(target, property, receiver);
    },
  });
});

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

describe('HabitPulse', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('shows the daily habit list and current completion state', async () => {
    await render(<App />);

    expect(await screen.findByText('Drink a glass of water')).toBeTruthy();
    expect(screen.getByText('Read for 10 minutes')).toBeTruthy();
    expect(screen.getByText('4 daily habits')).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Mark incomplete Drink a glass of water' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Complete Morning stretch' })).toBeTruthy();
  });

  it('adds a habit and ignores a blank name', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: 'Add a habit' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit →' }));
    expect(screen.queryByText('4 daily habits')).toBeTruthy();

    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Take a short walk'), '  Journal for five minutes  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit →' }));

    expect(await screen.findByText('Journal for five minutes')).toBeTruthy();
    expect(screen.getByText('5 daily habits')).toBeTruthy();
    expect(screen.getByText('Your next streak starts today')).toBeTruthy();
  });

  it('marks a habit complete, updates its streak, and allows undo', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: 'Add a habit' }));
    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Take a short walk'), 'Journal');
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit →' }));

    const incompleteControl = await screen.findByRole('checkbox', { name: 'Complete Journal' });
    await fireEvent.press(incompleteControl);

    expect(await screen.findByRole('checkbox', { name: 'Mark incomplete Journal' })).toBeTruthy();
    expect(screen.getAllByText('✦  1 day in a row')).toHaveLength(2);

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Mark incomplete Journal' }));

    expect(await screen.findByRole('checkbox', { name: 'Complete Journal' })).toBeTruthy();
    expect(screen.getByText('Your next streak starts today')).toBeTruthy();
  });

  it('edits a habit name without losing its completion history', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: 'Edit Drink a glass of water' }));
    expect(screen.getByText('Edit your ritual')).toBeTruthy();
    await fireEvent.changeText(screen.getByDisplayValue('Drink a glass of water'), 'Drink more water');
    await fireEvent.press(screen.getByRole('button', { name: 'Save changes →' }));

    expect(await screen.findByText('Drink more water')).toBeTruthy();
    expect(screen.queryByText('Drink a glass of water')).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Mark incomplete Drink more water' })).toBeTruthy();
  });

  it('deletes a habit after the destructive confirmation is accepted', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: 'Delete Drink a glass of water' }));

    expect(alertSpy).toHaveBeenCalledWith(
      'Delete habit?',
      'Remove "Drink a glass of water" and its streak history?',
      expect.any(Array),
    );
    expect(screen.queryByText('Drink a glass of water')).toBeNull();
    expect(screen.getByText('3 daily habits')).toBeTruthy();
  });

  it('switches between light and dark themes', async () => {
    await render(<App />);

    await fireEvent.press(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(await screen.findByRole('button', { name: 'Switch to light mode' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(await screen.findByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  });

  it('restores habits, completion, and theme after the app is remounted', async () => {
    const firstLaunch = await render(<App />);
    await fireEvent.press(screen.getByRole('button', { name: 'Switch to dark mode' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Add a habit' }));
    await fireEvent.changeText(screen.getByPlaceholderText('e.g. Take a short walk'), 'Journal');
    await fireEvent.press(screen.getByRole('button', { name: 'Add habit →' }));

    await fireEvent.press(await screen.findByRole('checkbox', { name: 'Complete Journal' }));

    await waitFor(async () => {
      const saved = await AsyncStorage.getItem('habitpulse.v1');
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved ?? '{}')).toMatchObject({
        darkMode: true,
        habits: expect.arrayContaining([
          expect.objectContaining({ name: 'Journal', completions: expect.any(Array) }),
        ]),
      });
    });

    await firstLaunch.unmount();
    await render(<App />);

    expect(await screen.findByText('Journal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: 'Mark incomplete Journal' })).toBeTruthy();
  });
});