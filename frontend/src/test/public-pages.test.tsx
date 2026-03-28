import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { AppProviders } from '../app/providers';
import { AppRoutes } from '../app/router';

type MockJson = Record<string, unknown> | Array<unknown> | string | number | boolean | null | undefined;

function mockResponse(data: MockJson, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data ?? null))
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

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
    expect(screen.getByPlaceholderText('用户名')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '创建账号' })).toBeInTheDocument();
  });

  it('submits username during registration', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 1,
        username: 'mimi_cat',
        email: 'user@example.com',
        nickname: 'mimi',
        role: 'user',
        is_active: true,
        created_at: '2026-03-26T00:00:00Z'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/register']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    await user.type(screen.getByPlaceholderText('用户名'), 'mimi_cat');
    await user.type(screen.getByPlaceholderText('昵称'), 'mimi');
    await user.type(screen.getByPlaceholderText('邮箱'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('密码'), 'Secret123!');
    fireEvent.submit(screen.getByRole('button', { name: '创建账号' }).closest('form')!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          username: 'mimi_cat',
          nickname: 'mimi',
          email: 'user@example.com',
          password: 'Secret123!'
        })
      })
    );
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

    await user.type(screen.getByPlaceholderText('用户名或邮箱'), 'leo03wq@163.com');
    await user.type(screen.getByPlaceholderText('密码'), 'Secret123!');
    fireEvent.submit(screen.getByRole('button', { name: '登录' }).closest('form')!);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          account: 'leo03wq@163.com',
          password: 'Secret123!'
        })
      })
    );
  });

  it('renders hot-cat cover thumbnails on the home page', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/home')) {
        return mockResponse({
          stats: { total_cats: 12, active_cats_today: 3 },
          today_best: null,
          banners: [],
          latest_posts: [],
          hot_cats: [
            {
              id: 1,
              name: '奶油',
              like_count: 8,
              view_count: 88,
              images: [{ id: 11, file_path: 'cats/1/cover.webp', thumb_path: 'cats/1/cover_thumb.webp', is_cover: true }]
            }
          ]
        });
      }
      throw new Error(`Unhandled request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    const hotImage = await screen.findByRole('img', { name: '奶油封面' });
    expect(hotImage).toHaveAttribute('src', '/media/cats/1/cover_thumb.webp');
  });

  it('allows guest users to like a cat from the archive page', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/cats') && method === 'GET') {
        return mockResponse({
          items: [
            {
              id: 1,
              name: '奶油',
              campus: 'east',
              breed: '中华田园猫',
              location: '图书馆附近',
              personality_tags: ['亲人'],
              like_count: 3,
              images: [{ thumb_path: 'cats/1/cover_thumb.webp', file_path: 'cats/1/cover.webp' }]
            }
          ],
          total: 1
        });
      }

      if (url.endsWith('/api/likes/toggle') && method === 'POST') {
        expect(JSON.parse(String(init?.body))).toMatchObject({
          target_type: 'cat',
          target_id: 1,
          device_id: expect.any(String)
        });
        return mockResponse({ liked: true, like_count: 4 });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/cats']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    const likeButton = await screen.findByRole('button', { name: '点赞奶油' });
    expect(likeButton).toHaveTextContent('3');

    await user.click(likeButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '取消点赞奶油' })).toHaveTextContent('4');
    });
  });

  it('opens a minimal lightbox when previewing cat detail images', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/api/cats/1')) {
        return mockResponse({
          id: 1,
          name: '奶油',
          campus: 'east',
          breed: '中华田园猫',
          gender: 'female',
          sterilized: true,
          location: '图书馆附近',
          personality_tags: ['亲人'],
          description: '喜欢晒太阳',
          view_count: 12,
          like_count: 5,
          images: [
            { id: 11, file_path: 'cats/1/cover.webp', thumb_path: 'cats/1/cover_thumb.webp', is_cover: true },
            { id: 12, file_path: 'cats/1/detail.webp', thumb_path: 'cats/1/detail_thumb.webp', is_cover: false }
          ]
        });
      }
      throw new Error(`Unhandled request: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders>
        <MemoryRouter initialEntries={['/cats/1']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    const thumb = await screen.findByRole('button', { name: '查看奶油图片 2' });
    await user.click(thumb);

    expect(await screen.findByRole('dialog', { name: '奶油图片预览' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '奶油大图 2' })).toHaveAttribute('src', '/media/cats/1/detail.webp');

    await user.click(screen.getByRole('button', { name: '关闭预览' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '奶油图片预览' })).not.toBeInTheDocument();
    });
  });

  it('lets a logged-in user change password from the profile page', async () => {
    const user = userEvent.setup();
    let changePasswordCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/auth/me') && method === 'GET') {
        return mockResponse({
          id: 1,
          username: 'mimi_cat',
          email: 'user@example.com',
          nickname: 'mimi',
          role: 'user'
        });
      }

      if (url.endsWith('/api/auth/change-password') && method === 'POST') {
        changePasswordCalls += 1;
        expect(init?.body).toBe(
          JSON.stringify({
            current_password: 'Secret123!',
            new_password: 'BrandNew123!'
          })
        );
        return mockResponse(undefined, 204);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'user', token: 'user-token' }}>
        <MemoryRouter initialEntries={['/profile']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    expect(await screen.findByText('用户名：mimi_cat')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('当前密码'), 'Secret123!');
    await user.type(screen.getByPlaceholderText('新密码'), 'BrandNew123!');
    await user.type(screen.getByPlaceholderText('确认新密码'), 'BrandNew123!');
    await user.click(screen.getByRole('button', { name: '修改密码' }));

    await waitFor(() => {
      expect(changePasswordCalls).toBe(1);
    });
    expect(screen.getByText('密码修改成功，请使用新密码重新登录。')).toBeInTheDocument();
  });

  it('blocks password change when the confirmation password does not match', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/auth/me') && method === 'GET') {
        return mockResponse({
          id: 1,
          username: 'mimi_cat',
          email: 'user@example.com',
          nickname: 'mimi',
          role: 'user'
        });
      }

      if (url.endsWith('/api/auth/change-password')) {
        throw new Error('change-password should not be called when confirmation mismatches');
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'user', token: 'user-token' }}>
        <MemoryRouter initialEntries={['/profile']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    await screen.findByText('用户名：mimi_cat');

    await user.type(screen.getByPlaceholderText('当前密码'), 'Secret123!');
    await user.type(screen.getByPlaceholderText('新密码'), 'BrandNew123!');
    await user.type(screen.getByPlaceholderText('确认新密码'), 'Mismatch123!');
    await user.click(screen.getByRole('button', { name: '修改密码' }));

    expect(screen.getByText('两次输入的新密码不一致')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
