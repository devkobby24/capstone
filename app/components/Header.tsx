"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Image from "next/image";

const Header = () => {
  const pathname = usePathname();

  return (
    <header className="w-full flex justify-between items-center px-4 row-start-1">
      <div className="flex items-center gap-3">
        <Image
          src="/intruscan1.svg"
          alt="intruScan Logo"
          width={100}
          height={100}
          priority
          className="h-10 w-auto"
        />
      </div>
      <nav className="hidden md:flex gap-6">
        <Link
          href="/"
          className={`hover:text-blue-600 dark:hover:text-blue-400 ${
            pathname === "/"
              ? "text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4"
              : ""
          }`}
        >
          Home
        </Link>
        <Link
          href="/about"
          className={`hover:text-blue-600 dark:hover:text-blue-400 ${
            pathname === "/about"
              ? "text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4"
              : ""
          }`}
        >
          About
        </Link>
        <Link
          href="#"
          className={`hover:text-blue-600 dark:hover:text-blue-400 ${
            pathname === "/documentation"
              ? "text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4"
              : ""
          }`}
        >
          Documentation
        </Link>
        <Link
          href="#"
          className={`hover:text-blue-600 dark:hover:text-blue-400 ${
            pathname === "/contact"
              ? "text-blue-600 dark:text-blue-400 font-medium underline underline-offset-4"
              : ""
          }`}
        >
          Contact
        </Link>
      </nav>
    </header>
  );
};

export default Header;
