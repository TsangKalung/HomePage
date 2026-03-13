import Image from "next/image"
import { useMDXComponent } from "next-contentlayer/hooks"

const Callout = ({ children }: { children: React.ReactNode; type?: string }) => {
  return (
    <div className="not-prose relative my-8 rounded-lg border-l-[3px] border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/50 px-5 py-4">
      <div className="prose dark:prose-invert antialiased max-w-none text-[0.938rem] leading-[1.85] tracking-[0.005em] text-slate-600 dark:text-slate-400 prose-p:my-3 prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-headings:tracking-[0.004em] prose-headings:text-[0.938rem] prose-headings:font-semibold prose-headings:mt-0 prose-headings:mb-2">
        {children}
      </div>
    </div>
  )
}

const callout = (t: string) => {
  const Comp = (props: any) => <Callout type={t} {...props} />
  Comp.displayName = `Callout(${t})`
  return Comp
}

const components = {
  Image,
  tip: callout("tip"),
  Tip: callout("tip"),
  warning: callout("warning"),
  Warning: callout("warning"),
  error: callout("error"),
  Error: callout("error"),
  success: callout("success"),
  Success: callout("success"),
}

interface MdxProps {
  code: string
}

export function Mdx({ code }: MdxProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
