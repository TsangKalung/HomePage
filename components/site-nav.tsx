"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function SiteNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const links = [
    { href: "/", label: "Home" },
    { href: "/blog", label: "Blog" },
    { href: "/translation", label: "Translation" },
    { href: "/about", label: "About" },
  ]

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex ml-auto text-sm font-medium space-x-8 items-center">
        {links.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link 
              key={href} 
              href={href}
              className={`relative py-1 font-heading text-lg italic font-bold tracking-tight transition-opacity duration-200 ${
                isActive 
                  ? "opacity-100" 
                  : "opacity-40 hover:opacity-100"
              }`}
            >
              {label}
              {isActive && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute left-0 right-0 -bottom-1 h-px bg-black dark:bg-white"
                  transition={{ 
                    type: "tween",
                    ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for "absolute smoothness"
                    duration: 0.3 
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden ml-auto p-2 focus:outline-none z-50 relative"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between items-end">
          <motion.span 
            animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 9 : 0, width: isOpen ? "100%" : "100%" }}
            className="w-full h-px bg-black dark:bg-white block"
          />
          <motion.span 
            animate={{ opacity: isOpen ? 0 : 1, width: "70%" }}
            className="w-full h-px bg-black dark:bg-white block"
          />
          <motion.span 
            animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -9 : 0, width: isOpen ? "100%" : "50%" }}
            className="w-full h-px bg-black dark:bg-white block"
          />
        </div>
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-white dark:bg-slate-950 md:hidden flex flex-col items-center justify-center space-y-8"
          >
            {links.map(({ href, label }) => {
              const isActive = pathname === href
              return (
                <Link 
                  key={href} 
                  href={href}
                  className={`text-4xl font-heading font-bold italic tracking-tighter ${
                    isActive ? "opacity-100" : "opacity-40"
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}