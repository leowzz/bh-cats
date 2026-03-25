import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('submits the login form without hitting the FormData event bug', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'token-123',
        user: { role: 'user' }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/login']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    await user.type(screen.getByPlaceholderText('邮箱'), 'leo03wq@163.com');
    await user.type(screen.getByPlaceholderText('密码'), 'Secret123!');
    fireEvent.submit(screen.getByRole('button', { name: '登录' }).closest('form')!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST'
      })
    );
  });
});
