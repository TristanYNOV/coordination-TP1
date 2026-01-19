'use client';

import { useEffect, useState } from 'react';
import { Product } from '../../generated/graphql';

const hasuraUrl =
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL ?? 'http://localhost:8080/v1/graphql';

const PRODUCTS_QUERY = `
  query ProductList {
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
    const fetchProducts = async () => {
      try {
        const response = await fetch(hasuraUrl, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'X-Hasura-Role': 'user',
            'X-Hasura-User-Id': '1',
          },
          body: JSON.stringify({ query: PRODUCTS_QUERY }),
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}`);
        }

        const result = (await response.json()) as ProductsQueryResponse;
        setProducts(result.data.product);
      } catch (fetchError) {
        const message =
          fetchError instanceof Error ? fetchError.message : 'Erreur inconnue';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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
