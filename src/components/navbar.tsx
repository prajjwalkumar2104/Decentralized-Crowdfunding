"use client";

import { useState } from "react";
import { Menu, X, ChevronDown, Wallet } from "lucide-react";

const navLinks = [
  { label: "Explore", href: "/" },
  { label: "Rounds", href: "/" },
  { label: "How it Works", href: "" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-black font-bold text-sm">R</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">
            Radiant<span className="gradient-text">Fund</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="items-center hidden md:flex gap-8">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Wallet Button */}
        <div className="hidden md:flex items-center gap-3">
          {walletConnected ? (
            <button
              onClick={() => setWalletConnected(false)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium glass-card glass-card-hover text-foreground"
            >
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              0x1a2b...9f3e
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={() => setWalletConnected(true)}
              className="gradient-border rounded-lg px-5 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </button>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-foreground p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu - Corrected Positioning */}
      {mobileOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border/50 animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <hr className="border-border/50" />
            <button
              onClick={() => {
                setWalletConnected(!walletConnected);
                setMobileOpen(false);
              }}
              className="gradient-border rounded-xl px-5 py-3 text-sm font-semibold text-foreground flex items-center gap-2 justify-center"
            >
              <Wallet className="h-4 w-4" />
              {walletConnected ? "0x1a2b...9f3e" : "Connect Wallet"}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}