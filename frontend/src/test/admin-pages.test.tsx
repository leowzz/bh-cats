import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    expect(screen.getByRole('link', { name: '猫档案列表' })).toHaveAttribute('href', '/admin/cats');
    expect(screen.getByRole('link', { name: '新增猫档案' })).toHaveAttribute('href', '/admin/cats/new');
    expect(screen.getByRole('link', { name: '轮播管理' })).toHaveAttribute('href', '/admin/banners');
  });

  it('loads admin cats and requires confirm dialog before deleting existing content', async () => {
    const user = userEvent.setup();
    let deleted = false;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/admin/cats') && method === 'GET') {
        return mockResponse({
          items: deleted
            ? []
            : [
                {
                  id: 1,
                  name: '奶油',
                  campus: 'east',
                  breed: '中华田园猫',
                  gender: 'female',
                  sterilized: true,
                  location: '图书馆附近',
                  personality_tags: ['亲人'],
                  description: '会蹭人。',
                  status: 'visible',
                  view_count: 1,
                  like_count: 2,
                  created_at: '2026-03-26T00:00:00Z',
                  updated_at: '2026-03-26T00:00:00Z',
                  images: [{ id: 11, file_path: 'cats/1/cover.webp', thumb_path: 'cats/1/cover_thumb.webp', is_cover: true }]
                }
              ],
          total: deleted ? 0 : 1
        });
      }

      if (url.endsWith('/api/admin/cats/1') && method === 'DELETE') {
        deleted = true;
        return mockResponse(undefined, 204);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'admin', token: 'admin-token' }}>
        <MemoryRouter initialEntries={['/admin/cats']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    expect(await screen.findByText('奶油')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '奶油封面' })).toHaveAttribute('src', '/media/cats/1/cover_thumb.webp');

    await user.click(screen.getByRole('button', { name: '删除奶油' }));
    expect(screen.getByText('确认删除这条内容吗？')).toBeInTheDocument();
    expect(screen.getByText('删除后不可恢复。')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/admin/cats/1',
      expect.objectContaining({
        method: 'DELETE'
      })
    );

    await user.click(screen.getByRole('button', { name: '取消删除' }));
    expect(screen.queryByText('确认删除这条内容吗？')).not.toBeInTheDocument();
    expect(screen.getByText('奶油')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '删除奶油' }));
    await user.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(screen.queryByText('奶油')).not.toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/cats/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Headers)
      })
    );
  });

  it('loads existing cat data, validates description, formats tags, and submits edit form', async () => {
    const user = userEvent.setup();
    let putCalls = 0;
    const currentCat = {
      id: 1,
      name: '奶油',
      campus: 'east',
      breed: '中华田园猫',
      gender: 'female',
      sterilized: true,
      location: '图书馆附近',
      personality_tags: ['亲人', '贪吃'],
      description: '喜欢晒太阳',
      status: 'visible',
      view_count: 1,
      like_count: 2,
      created_at: '2026-03-26T00:00:00Z',
      updated_at: '2026-03-26T00:00:00Z',
      images: []
    };
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/admin/cats/1') && method === 'GET') {
        return mockResponse(currentCat);
      }

      if (url.endsWith('/api/admin/cats/1') && method === 'PUT') {
        putCalls += 1;
        const body = init?.body as FormData;
        expect(body.get('description')).toBe('很会打呼噜');
        expect(body.get('personality_tags')).toBe('["亲人","会撒娇"]');
        expect(body.get('status')).toBe('visible');
        return mockResponse({
          ...currentCat,
          description: String(body.get('description')),
          personality_tags: ['亲人', '会撒娇']
        });
      }

      if (url.endsWith('/api/admin/cats') && method === 'GET') {
        return mockResponse({ items: [currentCat], total: 1 });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'admin', token: 'admin-token' }}>
        <MemoryRouter initialEntries={['/admin/cats/1/edit']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    const nameInput = await screen.findByDisplayValue('奶油');
    expect(nameInput).toBeInTheDocument();
    expect(screen.getByDisplayValue('亲人, 贪吃')).toBeInTheDocument();

    const descriptionInput = screen.getByPlaceholderText('简介');
    expect(descriptionInput).toBeRequired();

    await user.clear(descriptionInput);
    await user.click(screen.getByRole('button', { name: '保存档案' }));
    expect(await screen.findByText('简介不能为空')).toBeInTheDocument();
    expect(putCalls).toBe(0);

    await user.type(descriptionInput, '很会打呼噜');

    const tagsInput = screen.getByPlaceholderText('例如：亲人, 贪吃');
    await user.clear(tagsInput);
    await user.type(tagsInput, '亲人, 会撒娇');

    const file = new File(['cat-image'], 'cat.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('上传图片', { selector: 'input' });
    await user.upload(fileInput, file);
    expect(screen.getByText('已选择 1 张图片')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '保存档案' }));

    await waitFor(() => {
      expect(putCalls).toBe(1);
    });
    expect(await screen.findByText('猫档案管理')).toBeInTheDocument();
  });

  it('supports admin image preview, cover selection, and multi-remove when editing cats', async () => {
    const user = userEvent.setup();
    const currentCat = {
      id: 1,
      name: '奶油',
      campus: 'east',
      breed: '中华田园猫',
      gender: 'female',
      sterilized: true,
      location: '图书馆附近',
      personality_tags: ['亲人', '贪吃'],
      description: '喜欢晒太阳',
      status: 'visible',
      view_count: 1,
      like_count: 2,
      created_at: '2026-03-26T00:00:00Z',
      updated_at: '2026-03-26T00:00:00Z',
      images: [
        { id: 11, file_path: 'cats/1/cover.webp', thumb_path: 'cats/1/cover_thumb.webp', is_cover: true },
        { id: 12, file_path: 'cats/1/detail.webp', thumb_path: 'cats/1/detail_thumb.webp', is_cover: false },
        { id: 13, file_path: 'cats/1/side.webp', thumb_path: 'cats/1/side_thumb.webp', is_cover: false }
      ]
    };
    let putCalls = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/admin/cats/1') && method === 'GET') {
        return mockResponse(currentCat);
      }

      if (url.endsWith('/api/admin/cats/1') && method === 'PUT') {
        putCalls += 1;
        const body = init?.body as FormData;
        expect(body.get('remove_image_ids')).toBe('[11,13]');
        expect(body.get('cover_image_id')).toBe('12');
        expect(body.getAll('files')).toHaveLength(1);
        return mockResponse({
          ...currentCat,
          images: [
            { id: 12, file_path: 'cats/1/detail.webp', thumb_path: 'cats/1/detail_thumb.webp', is_cover: true },
            { id: 21, file_path: 'cats/1/new.webp', thumb_path: 'cats/1/new_thumb.webp', is_cover: false }
          ]
        });
      }

      if (url.endsWith('/api/admin/cats') && method === 'GET') {
        return mockResponse({ items: [currentCat], total: 1 });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'admin', token: 'admin-token' }}>
        <MemoryRouter initialEntries={['/admin/cats/1/edit']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    const previewButton = await screen.findByRole('button', { name: '查看奶油图片 2' });
    await user.click(previewButton);
    expect(await screen.findByRole('dialog', { name: '奶油图片预览' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '关闭预览' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '奶油图片预览' })).not.toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('移除奶油图片 1'));
    await user.click(screen.getByLabelText('移除奶油图片 3'));
    await user.click(screen.getByRole('button', { name: '设为奶油封面 2' }));

    const file = new File(['new-image'], 'cat-new.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('上传图片', { selector: 'input' });
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: '保存档案' }));

    await waitFor(() => {
      expect(putCalls).toBe(1);
    });
  });

  it('supports banner create, edit, and confirmed delete in admin page', async () => {
    const user = userEvent.setup();
    let nextId = 2;
    let banners = [
      {
        id: 1,
        title: '迎新周',
        subtitle: '来看看东校区猫猫',
        link_url: '/cats',
        sort_order: 1,
        is_active: true,
        created_at: '2026-03-26T00:00:00Z',
        updated_at: '2026-03-26T00:00:00Z',
        images: []
      }
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();

      if (url.endsWith('/api/admin/banners') && method === 'GET') {
        return mockResponse(banners);
      }

      if (url.endsWith('/api/admin/banners') && method === 'POST') {
        const body = init?.body as FormData;
        const created = {
          id: nextId += 1,
          title: String(body.get('title')),
          subtitle: String(body.get('subtitle')),
          link_url: String(body.get('link_url')),
          sort_order: Number(body.get('sort_order')),
          is_active: String(body.get('is_active')) === 'true',
          created_at: '2026-03-26T00:00:00Z',
          updated_at: '2026-03-26T00:00:00Z',
          images: []
        };
        banners = [...banners, created];
        return mockResponse(created, 201);
      }

      if (url.endsWith('/api/admin/banners/1') && method === 'PUT') {
        const body = init?.body as FormData;
        banners = banners.map((banner) =>
          banner.id === 1
            ? {
                ...banner,
                title: String(body.get('title')),
                subtitle: String(body.get('subtitle')),
                link_url: String(body.get('link_url')),
                sort_order: Number(body.get('sort_order')),
                is_active: String(body.get('is_active')) === 'true'
              }
            : banner
        );
        return mockResponse(banners.find((banner) => banner.id === 1));
      }

      if (url.endsWith('/api/admin/banners/1') && method === 'DELETE') {
        banners = banners.filter((banner) => banner.id !== 1);
        return mockResponse(undefined, 204);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppProviders authInitialState={{ role: 'admin', token: 'admin-token' }}>
        <MemoryRouter initialEntries={['/admin/banners']}>
          <AppRoutes />
        </MemoryRouter>
      </AppProviders>
    );

    expect(await screen.findByText('迎新周')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('标题'), '春日巡礼');
    await user.type(screen.getByPlaceholderText('副标题'), '南校区猫猫出镜');
    await user.type(screen.getByPlaceholderText('跳转链接，例如 /cats'), '/cats?campus=south');
    await user.clear(screen.getByPlaceholderText('排序'));
    await user.type(screen.getByPlaceholderText('排序'), '3');
    await user.click(screen.getByRole('button', { name: '新增轮播' }));

    expect(await screen.findByText('春日巡礼')).toBeInTheDocument();

    const existingBannerCard = screen.getByTestId('banner-card-1');
    await user.click(within(existingBannerCard).getByRole('button', { name: '编辑轮播 迎新周' }));

    const titleInput = screen.getByDisplayValue('迎新周');
    await user.clear(titleInput);
    await user.type(titleInput, '迎新周更新');
    await user.click(screen.getByRole('button', { name: '保存轮播' }));

    expect(await screen.findByText('迎新周更新')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '删除轮播 迎新周更新' }));
    expect(screen.getByText('确认删除这条内容吗？')).toBeInTheDocument();
    expect(screen.getByText('删除后不可恢复。')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(screen.queryByText('迎新周更新')).not.toBeInTheDocument();
    });
    expect(screen.getByText('春日巡礼')).toBeInTheDocument();
  });
});
