"use client";

import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination";
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Blog() {
  // 过滤出不包含 translation 类别的文章（即博客文章）
  const blogPosts = useMemo(() => allPosts.filter((post) => 
    !post.draft && (!post.categories || !post.categories.includes("translation"))
  ), []);

  const sortedPosts = useMemo(() => {
    return [...blogPosts].sort((a, b) => {
      return Date.parse(b.date) - Date.parse(a.date);
    });
  }, [blogPosts]);

  const {
    currentData: currentPosts,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    data: sortedPosts,
    itemsPerPage: 5,
  });

  return (
    <div className="relative">
      <div className="prose dark:prose-invert">
        <div className="space-y-8 post-list-container">
          {currentPosts.map((post) => (
            <article 
              key={post._id}
              className="transition-opacity duration-500 ease-out"
            >
              <Link href={post.slug} className="no-underline group">
                <h2
                  className="font-title text-2xl mb-2 group-hover:text-black dark:group-hover:text-white transition-colors"
                  style={{
                    fontWeight: 900,
                    textRendering: "optimizeLegibility"
                  }}
                >
                  {post.title}
                </h2>
                {post.description && (
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {post.description}
                  </p>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>
      
      <div className="relative z-10">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
