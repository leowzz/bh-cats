import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { AppProviders } from '../app/providers';
import { AppRoutes } from '../app/router';


describe('Admin pages', () => {
  it('redirects guests from admin routes to login', () => {
    render(
      <AppProviders authInitialState={{ role: null }}>
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );
    expect(screen.getByText('登录账号')).toBeInTheDocument();
  });

  it('renders admin dashboard for admins', () => {
    render(
      <AppProviders authInitialState={{ role: 'admin' }}>
        <MemoryRouter initialEntries={['/admin']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );
    expect(screen.getByText('管理仪表盘')).toBeInTheDocument();
  });
});
