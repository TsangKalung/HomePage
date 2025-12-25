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
    !post.categories || !post.categories.includes("translation")
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
    <div style={{ position: 'relative' }}>
      <motion.div
        key={currentPage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="prose dark:prose-invert"
      >
        {currentPosts.map((post) => (
          <article 
            key={post._id}
            className="transform transition-all duration-200 hover:translate-x-1"
          >
            <Link href={post.slug} style={{ textDecoration: "none" }}>
              <h2
                className="font-title"
                style={{
                  fontWeight: 900,
                  textRendering: "optimizeLegibility"
                }}
              >
                {post.title}
              </h2>
            </Link>
            {post.description && <p>{post.description}</p>}
          </article>
        ))}
      </motion.div>
      
      <div style={{ position: 'relative', zIndex: 100 }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

