import { render, screen } from '@testing-library/react';

import { AppProviders } from '../app/providers';
import { AppRouter } from '../app/router';


describe('App shell', () => {
  it('renders the main navigation', () => {
    render(
      <AppProviders>
        <AppRouter />
      </AppProviders>
    );
    expect(screen.getByText('北华大学猫猫档案')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '社区' })).toBeInTheDocument();
  });
});
