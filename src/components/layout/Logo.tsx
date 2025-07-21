import React from "react";

export function Logo() {
  return (
    <a
      href="/"
      className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      aria-label="Przejdź do strony głównej"
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 20V4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <ellipse
          cx="12"
          cy="12"
          rx="4"
          ry="8"
          transform="rotate(45 12 12)"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        <text x="7" y="17" fontFamily="sans-serif" fontSize="6" fill="currentColor">
          CO
        </text>
      </svg>
    </a>
  );
}
