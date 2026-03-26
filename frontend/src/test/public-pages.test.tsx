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
});
