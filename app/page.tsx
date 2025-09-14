"use client";

import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/pagination";
import { useState, useEffect } from "react";

export default function Home() {
  const sortedPosts = allPosts.sort((a, b) => {
    return Date.parse(b.date) - Date.parse(a.date);
  });

  const {
    currentData: currentPosts,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    data: sortedPosts,
    itemsPerPage: 5,
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayPosts, setDisplayPosts] = useState(currentPosts);

  const handlePageChange = (page: number) => {
    if (page === currentPage) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentPage(page);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

  useEffect(() => {
    if (!isTransitioning) {
      setDisplayPosts(currentPosts);
    }
  }, [currentPosts, isTransitioning]);

  return (
    <div>
      <div 
        className={`prose dark:prose-invert transition-all duration-300 ease-in-out ${
          isTransitioning 
            ? 'opacity-0 transform translate-y-2 scale-98' 
            : 'opacity-100 transform translate-y-0 scale-100'
        }`}
        style={{
          transitionProperty: 'opacity, transform',
          transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {displayPosts.map((post) => (
          <article 
            key={post._id}
            className="transform transition-all duration-200 hover:translate-x-1"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            <Link href={post.slug} style={{ textDecoration: "none" }}>
              <h2
                style={{
                  fontFamily: "Merriweather, Georgia, serif",
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
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
