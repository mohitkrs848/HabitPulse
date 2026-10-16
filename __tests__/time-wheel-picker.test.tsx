import { fireEvent, render } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import TimeWheelPicker from '../src/components/TimeWheelPicker';
import { habitLightTheme } from '../src/theme/paperTheme';

const Wrapper = ({ children }: React.PropsWithChildren) => <PaperProvider theme={habitLightTheme}>{children}</PaperProvider>;

describe('TimeWheelPicker', () => {
  it('reports the hour when the hour wheel settles on a new value', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<TimeWheelPicker value="09:30" onChange={onChange} />, { wrapper: Wrapper });

    fireEvent(getByTestId('time-wheel-picker-hour'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 14 * 40 } } });

    expect(onChange).toHaveBeenCalledWith('14:30');
  });

  it('reports the minute when the minute wheel settles on a new value', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<TimeWheelPicker value="07:15" onChange={onChange} />, { wrapper: Wrapper });

    fireEvent(getByTestId('time-wheel-picker-minute'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 45 * 40 } } });

    expect(onChange).toHaveBeenCalledWith('07:45');
  });

  it('ignores settle events that land on the already selected value', async () => {
    const onChange = jest.fn();
    const { getByTestId } = await render(<TimeWheelPicker value="23:59" onChange={onChange} />, { wrapper: Wrapper });

    fireEvent(getByTestId('time-wheel-picker-hour'), 'momentumScrollEnd', { nativeEvent: { contentOffset: { y: 999 * 40 } } });

    expect(onChange).not.toHaveBeenCalled();
  });
});