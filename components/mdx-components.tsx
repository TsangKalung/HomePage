import Image from "next/image"
import { useMDXComponent } from "next-contentlayer/hooks"

const Callout = ({ children }: { children: React.ReactNode; type?: string }) => {
  const p = {
    bgFrom: "from-neutral-50/90 dark:from-[#0a0a0a]/60",
    bgTo: "to-white/80 dark:to-black/50",
    bar: "from-black/40 via-black/30 to-black/20",
    glow: "bg-black/10",
    ring: "ring-black/10",
    shadow: "shadow-[0_16px_40px_-24px_rgba(0,0,0,0.5)]",
  }

  return (
    <div className={`not-prose relative my-8 overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br ${p.bgFrom} ${p.bgTo} p-6 ${p.shadow} ring-1 ring-inset ${p.ring} backdrop-blur-[2px]`}>
      <div className={`pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b ${p.bar} opacity-70`} />
      <div className={`pointer-events-none absolute -top-12 -right-10 h-28 w-28 rounded-full ${p.glow} blur-2xl`} />
      <div className="prose dark:prose-invert antialiased max-w-none text-[1rem] leading-[1.92] tracking-[0.006em] prose-p:my-3.5 prose-headings:tracking-[0.004em]">
        {children}
      </div>
    </div>
  )
}

const callout = (t: string) => (props: any) => <Callout type={t} {...props} />

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
