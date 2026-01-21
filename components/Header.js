"use client";

import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [testMenuOpen, setTestMenuOpen] = useState(false);

  // WhatsApp links
  const hireStudentsLink = "https://wa.me/7305014818";
  const contactLink = "https://wa.me/7708938866";

  // ✅ Test routes (Pages Router paths)
  const testRoutes = [
    { label: "Python Test", path: "/test/python" },
    { label: "Java Test", path: "/test/java" },
    { label: "Web Development Test", path: "/test/web-development" },
    { label: "Data Analytics Test", path: "/test/data-analytics" },
    { label: "Aptitude Test", path: "/test/aptitude" },
  ];

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const goToTest = (path) => {
    setMenuOpen(false);
    setTestMenuOpen(false);
    router.push(path);
  };

  return (
    <header className="w-full bg-white shadow relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">

        {/* LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <img src="/Nav Logo/CSHR - Nav Logo.png" className="h-8 sm:h-10" />
          <img src="/Nav Logo/CSIT - Nav Logo.png" className="h-8 sm:h-10" />
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-3 ml-auto mr-4">

          <button
            onClick={() => scrollToSection("courses")}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-sm"
          >
            Courses
          </button>

          <button
            onClick={() => scrollToSection("meet-our-stars")}
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-sm"
          >
            Success Story
          </button>

          {/* TAKE TEST */}
          <div className="relative group">
            <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-sm flex items-center gap-1">
              Take Test <ChevronDown size={18} />
            </button>

            <div className="absolute hidden group-hover:flex flex-col bg-white shadow-md rounded mt-1 w-56 z-50">
              {testRoutes.map((test) => (
                <button
                  key={test.path}
                  onClick={() => goToTest(test.path)}
                  className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-100"
                >
                  {test.label}
                </button>
              ))}
            </div>
          </div>

          <a
            href={hireStudentsLink}
            target="_blank"
            className="bg-blue-100 text-blue-700 px-4 py-2 rounded font-semibold text-sm"
          >
            Hire Students
          </a>
        </nav>

        {/* CONTACT */}
        <div className="hidden md:block">
          <a href={contactLink} target="_blank">
            <button className="bg-blue-600 text-white px-5 py-2 rounded font-semibold text-sm">
              Contact Us
            </button>
          </a>
        </div>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-md flex flex-col items-center gap-4 py-6">

          <button
            onClick={() => {
              scrollToSection("courses");
              setMenuOpen(false);
            }}
            className="bg-blue-100 text-blue-700 px-6 py-2 rounded"
          >
            Courses
          </button>

          <button
            onClick={() => {
              scrollToSection("meet-our-stars");
              setMenuOpen(false);
            }}
            className="bg-blue-100 text-blue-700 px-6 py-2 rounded"
          >
            Success Story
          </button>

          {/* MOBILE TAKE TEST */}
          <button
            onClick={() => setTestMenuOpen(!testMenuOpen)}
            className="bg-blue-100 text-blue-700 px-6 py-2 rounded flex items-center gap-1"
          >
            Take Test <ChevronDown size={16} />
          </button>

          {testMenuOpen &&
            testRoutes.map((test) => (
              <button
                key={test.path}
                onClick={() => goToTest(test.path)}
                className="text-blue-700 text-sm font-medium"
              >
                {test.label}
              </button>
            ))}

          <a href={hireStudentsLink} target="_blank">
            <button className="bg-blue-100 text-blue-700 px-6 py-2 rounded">
              Hire Students
            </button>
          </a>

          <a href={contactLink} target="_blank">
            <button className="bg-blue-600 text-white px-6 py-2 rounded font-bold">
              Contact Us
            </button>
          </a>
        </div>
      )}
    </header>
  );
}
