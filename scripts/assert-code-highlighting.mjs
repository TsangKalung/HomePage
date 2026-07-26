import fs from "node:fs"

const postPath =
  ".contentlayer/generated/Post/posts__building-a-good-vertical-agent-cn.mdx.json"

const post = JSON.parse(fs.readFileSync(postPath, "utf8"))
const compiled = post.body.code

if (!compiled.includes("language-typescript")) {
  throw new Error("Expected the article fixture to contain a TypeScript code block.")
}

const hasBuildTimeHighlighting =
  compiled.includes('className:"hljs ') &&
  /className:"hljs-[^"]+"/.test(compiled)

if (!hasBuildTimeHighlighting) {
  throw new Error(
    "Expected compiled MDX code blocks to include syntax-highlighted token markup."
  )
}

if (!compiled.includes('children:"write_range"')) {
  throw new Error("Expected the article fixture to contain inline code markup.")
}

const css = fs.readFileSync("app/globals.css", "utf8")

if (!css.includes(".prose :where(:not(pre) > code)")) {
  throw new Error("Expected inline code to have a dedicated non-pre code style.")
}

const removesTypographyBackticks =
  css.includes(".prose :where(:not(pre) > code)::before") &&
  css.includes(".prose :where(:not(pre) > code)::after") &&
  css.includes("content: none")

if (!removesTypographyBackticks) {
  throw new Error(
    "Expected inline code styles to remove Tailwind Typography pseudo backticks."
  )
}
