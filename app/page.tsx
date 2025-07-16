import { allPosts } from "@/.contentlayer/generated";
import Link from "next/link";

export default function Home() {
  return (
    <div className="prose dark:prose-invert">
      {allPosts
        .sort((a, b) => {
          return Date.parse(b.date) - Date.parse(a.date);
        })
        .map((post) => (
          <article key={post._id}>
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
  );
}
