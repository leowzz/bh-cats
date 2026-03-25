import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppProviders } from '../app/providers';
import { AppRoutes } from '../app/router';


describe('Public pages', () => {
  it('renders the archive page copy', () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/cats']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );
    expect(screen.getByText('猫猫档案')).toBeInTheDocument();
    expect(screen.getByText('东校区')).toBeInTheDocument();
  });

  it('renders the register page', () => {
    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );
    expect(screen.getByText('注册账号')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建账号' })).toBeInTheDocument();
  });
});
