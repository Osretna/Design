import React from "react";
import { ShoppingBag, Star, Zap } from "lucide-react";
import { Product } from "../types";

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onAddToCart: (p: Product) => void;
  onDirectBuy: (p: Product) => void;
  language: "ar" | "en";
}

export default function ProductCard({ product, onAddToCart, onDirectBuy, language }: ProductCardProps) {
  const isAr = language === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const desc = isAr ? product.descriptionAr : product.descriptionEn;
  const category = isAr ? product.categoryAr : product.categoryEn;

  const t = {
    ar: {
      buyNow: "شراء مباشر",
      addToCart: "أضف للسلة",
      currency: "ج.م"
    },
    en: {
      buyNow: "Quick Buy",
      addToCart: "Add to Bag",
      currency: "EGP"
    }
  }[language];

  // Render yellow/gray stars
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starVal = i + 1;
    const rating = product.rating || 4.5;
    return (
      <Star
        key={i}
        className={`w-4 h-4 ${
          starVal <= Math.round(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-zinc-300 dark:text-zinc-600"
        }`}
      />
    );
  });

  return (
    <div className="group relative flex flex-col justify-between bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      
      {/* Category Pill */}
      <span className="absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/90 text-white shadow-sm backdrop-blur-sm">
        {category}
      </span>

      {/* Image container with zoom hover */}
      <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
        <img
          src={product.image}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Details body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">{stars}</div>
          <span className="text-xs text-zinc-400 font-medium">({product.ratingCount || 10})</span>
        </div>

        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-100 line-clamp-1 mb-1">
          {name}
        </h3>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-relaxed flex-1">
          {desc}
        </p>

        {/* Pricing + Action row */}
        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {product.price} {t.currency}
            </span>
          </div>

          <div className="flex gap-1.5">
            {/* Add to Cart icon */}
            <button
              onClick={() => onAddToCart(product)}
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              title={t.addToCart}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>

            {/* Direct Buy button */}
            <button
              onClick={() => onDirectBuy(product)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-yellow-200 text-yellow-200" />
              <span>{t.buyNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
