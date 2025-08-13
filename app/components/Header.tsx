"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs";

const Header = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { theme, systemTheme } = useTheme();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/detect", label: "Detect" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="w-full flex justify-between items-center px-4 row-start-1 relative pt-10">
    
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center">
          <Image
            src={(theme === "light" || (theme === "system" && systemTheme === "light")) ? "/lightlogo.svg" : "/intruscan1.svg"}
            alt="intruScan Logo"
            width={100}
            height={100}
            priority
            className="h-10 w-40 md:w-auto"
          />
        </Link>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-6 items-center justify-center">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-blue-600 dark:hover:text-blue-400 ${
              pathname === link.href
                ? "text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4"
                : ""
            }`}
          >
            {link.label}
          </Link>
        ))}
        {isSignedIn ? (
          <UserButton />
        ) : (
          <SignInButton>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Sign In
            </button>
          </SignInButton>
        )}
      </nav>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
        {isSignedIn && (
          <div className="flex items-center">
            
            <UserButton />
          </div>
        )}
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${
          isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMenu}
      >
        <nav
          className={`fixed right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={`py-3 px-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  pathname === link.href
                    ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Authentication */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {isSignedIn ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <UserButton />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.firstName && user?.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user?.firstName || user?.username || "User"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                </div>
              ) : (
                <SignInButton>
                  <button
                    onClick={closeMenu}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
