import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductManager from '../ProductManager';

describe('ProductManager', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BACKEND_URL = 'http://localhost:5005';
  });

  it('loads and renders products from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          data: [
            {
              id: 1,
              name: 'Keyboard',
              comment: 'RGB',
              quantity: 2,
              company_id: '10',
              company: { name: 'Test Co' },
            },
          ],
        }),
      })
    );

    render(<ProductManager />);

    expect(await screen.findByText(/Keyboard/i)).toBeInTheDocument();
    expect(screen.getByText(/RGB/)).toBeInTheDocument();
    expect(screen.getByText(/Test Co/)).toBeInTheDocument();
  });

  it('adds a product and updates the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ data: [] }) })
      .mockResolvedValueOnce({
        json: async () => ({
          id: 2,
          name: 'Mouse',
          comment: 'Ergonomic',
          quantity: 4,
          company_id: '11',
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<ProductManager />);

    fireEvent.change(screen.getByPlaceholderText(/Product name/i), {
      target: { value: 'Mouse' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Comment/i), {
      target: { value: 'Ergonomic' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Quantity/i), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Company id/i), {
      target: { value: '11' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    expect(await screen.findByText(/Mouse/)).toBeInTheDocument();
  });

  it('blocks submission when required fields are missing', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: async () => ({ data: [] }) });
    vi.stubGlobal('fetch', fetchMock);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    render(<ProductManager />);

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields.');
    alertSpy.mockRestore();
  });
});
