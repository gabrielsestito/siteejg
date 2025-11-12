"use client";

import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectProps {
  categories: Category[];
  selectedCategoryId: string;
}

export function CategorySelect({ categories, selectedCategoryId }: CategorySelectProps) {
  const router = useRouter();

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const url = new URL(window.location.href);
    url.searchParams.set("category", e.target.value);
    router.push(url.toString());
  };

  return (
    <div className="relative w-full md:w-64">
      <select
        value={selectedCategoryId}
        onChange={handleCategoryChange}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white shadow-sm appearance-none"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-3 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
} 