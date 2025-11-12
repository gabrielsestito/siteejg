import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import Link from "next/link";
import { CategorySelect } from "@/components/CategorySelect";
import { ProductImageWithFallback } from "@/components/ProductImageWithFallback";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
}

interface ProductsPageProps {
  searchParams: {
    page?: string;
    search?: string;
    category?: string;
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const page = Number(searchParams.page) || 1;
  const search = searchParams.search || "";
  const categoryId = searchParams.category || "";
  const itemsPerPage = 9;

  const [products, totalProducts, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          },
          categoryId ? { categoryId } : {},
        ],
      },
      include: {
        category: true,
      },
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
    }),
    prisma.product.count({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          },
          categoryId ? { categoryId } : {},
        ],
      },
    }),
    prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Nossos Produtos</h1>
              <p className="text-gray-600">Encontre os melhores produtos para você</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <CategorySelect categories={categories} selectedCategoryId={categoryId} />
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm"
                />
                <button className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product: Product, index: number) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-w-16 aspect-h-9 overflow-hidden bg-gray-100">
                  <ProductImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{product.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {product.category.name}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-green-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                    <Link
                      href={`/products/${product.id}`}
                      className="bg-green-600 text-white px-6 py-2 rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/products?page=${pageNum}${
                        search ? `&search=${search}` : ""
                      }${categoryId ? `&category=${categoryId}` : ""}`}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        page === pageNum
                          ? "bg-green-600 text-white shadow-md"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {pageNum}
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 