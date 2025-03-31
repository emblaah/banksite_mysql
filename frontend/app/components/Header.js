"use client";
import Link from "next/link";

export default function Header({ loggedIn, handleLogout, focusLoginForm }) {
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md transition-colors duration-300 ease-in-out p-4">
      <ul className="flex justify-between items-center max-w-7xl mx-auto">
        <li>
          <Link href="/" className="group">
            <div
              className="bg-blue-600 dark:bg-blue-800 text-white py-2 px-4 rounded-lg transition-all duration-300 ease-in-out group-hover:bg-blue-700 dark:group-hover:bg-blue-900
              transform group-hover:scale-105 shadow-md group-hover:shadow-lg">
              <span className="font-semibold tracking-wider text-lg">
                VeloBank
              </span>
            </div>
          </Link>
        </li>
        <li>
          {loggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-red-600 transform hover:scale-105 shadow-md hover:shadow-lg cursor-default">
              Log out
            </button>
          ) : (
            <Link href="/">
              <button
                onClick={focusLoginForm}
                className="bg-green-500 text-white py-2 px-4 rounded-lg transition-all duration-300 ease-in-out hover:bg-green-600 transform hover:scale-105 shadow-md hover:shadow-lg cursor-default">
                Log in
              </button>
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
