'use client';

import { useEffect, useState } from 'react';
import { Product } from '../../generated/graphql';

const hasuraUrl =
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL ?? 'http://localhost:8080/v1/graphql';

const hasuraWsUrl = hasuraUrl.startsWith('http')
  ? hasuraUrl.replace(/^http/, 'ws')
  : hasuraUrl;

const PRODUCTS_SUBSCRIPTION = `
  subscription ProductList {
    product(order_by: { id: asc }) {
      id
      name
      comment
      quantity
      company {
        id
        name
      }
    }
  }
`;

type ProductsQueryResponse = {
  data: {
    product: Product[];
  };
};

export default function ProductGraphqlList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const ws = new WebSocket(hasuraWsUrl, 'graphql-ws');

    const headers = {
      'X-Hasura-Role': 'user',
      'X-Hasura-User-Id': '1',
    };

    const handleError = (message: string) => {
      if (!isActive) return;
      setError(message);
      setLoading(false);
    };

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'connection_init',
          payload: { headers },
        }),
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as
        | { type: 'connection_ack' }
        | { type: 'connection_error'; payload?: { message?: string } }
        | { type: 'data'; payload: ProductsQueryResponse }
        | { type: 'error'; payload?: { message?: string } }
        | { type: 'complete' };

      switch (message.type) {
        case 'connection_ack':
          ws.send(
            JSON.stringify({
              id: 'product-list',
              type: 'start',
              payload: {
                query: PRODUCTS_SUBSCRIPTION,
              },
            }),
          );
          return;
        case 'data':
          if (!isActive) return;
          setProducts(message.payload.data.product);
          setLoading(false);
          return;
        case 'connection_error':
        case 'error':
          handleError(message.payload?.message ?? 'Erreur de souscription Hasura.');
          return;
        case 'complete':
          if (!isActive) return;
          setLoading(false);
          return;
        default:
          return;
      }
    };

    ws.onerror = () => {
      handleError('Impossible de se connecter à Hasura.');
    };

    return () => {
      isActive = false;
      ws.close(1000, 'component-unmount');
    };
  }, []);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Produits (Hasura)</h2>
      {loading && (
        <p className="text-sm text-gray-500">Chargement des produits (Hasura)...</p>
      )}
      {error && (
        <p className="text-sm text-red-600">
          Impossible de charger les produits via Hasura : {error}
        </p>
      )}
      {!loading && !error && (
        <ul className="space-y-2">
          {products.map((product) => (
            <li key={product.id} className="rounded border border-gray-200 p-3">
              <div className="font-semibold">{product.name}</div>
              <div className="text-sm text-gray-600">{product.comment}</div>
              <div className="text-sm text-gray-600">
                Quantité : {product.quantity ?? 0} — Société : {product.company.name}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
