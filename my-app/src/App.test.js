import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Google logo', () => {
  render(<App />);
  const logoElement = screen.getByLabelText(/google/i);
  expect(logoElement).toBeInTheDocument();
});
