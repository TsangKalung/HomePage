import { defineDocumentType, makeSource } from "contentlayer/source-files"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeHighlight from "rehype-highlight"

function remarkNormalizeAdmonitions() {
  const map = { tip: "Tip", warning: "Warning", error: "Error", success: "Success" }
  const walk = (n) => {
    if (!n || typeof n !== "object") return
    const isJsx = n.type === "mdxJsxFlowElement" || n.type === "mdxJsxTextElement"
    if (isJsx && typeof n.name === "string" && map[n.name]) n.name = map[n.name]
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  return (tree) => walk(tree)
}

/** @type {import('contentlayer/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: "string",
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: "string",
    resolve: (doc) => doc._raw.flattenedPath.split("/").slice(1).join("/"),
  },
}

export const Page = defineDocumentType(() => ({
  name: "Page",
  filePathPattern: `pages/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
  },
  computedFields,
}))

export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: `posts/**/*.mdx`,
  contentType: "mdx",
  fields: {
    title: {
      type: "string",
      required: true,
    },
    description: {
      type: "string",
    },
    date: {
      type: "date",
      required: true,
    },
    categories: {
      type: "list",
      of: { type: "string" },
    },
    comments: {
      type: "boolean",
      required: false,
    },
    draft: {
      type: "boolean",
      required: false,
    },
  },
  computedFields,
}))

export default makeSource({
  contentDirPath: "./content",
  documentTypes: [Post, Page],
  mdx: {
    remarkPlugins: [remarkNormalizeAdmonitions, remarkMath],
    rehypePlugins: [rehypeKatex, [rehypeHighlight, { ignoreMissing: true }]],
  },
})
