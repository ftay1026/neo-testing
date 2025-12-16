"use client";

import { Home, Users, FileText, BarChart3, LogOut, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Dashboard', href: '/app/ops' },
  { icon: Users, label: 'Users', href: '/app/ops/users' },
  { icon: FileText, label: 'Credits', href: '/app/ops/credits' },
  { icon: BarChart3, label: 'Sales', href: '/app/ops/sales' },
  { icon: BarChart3, label: 'Financiais', href: '/app/ops/financiais' },
  { icon: LogOut, label: 'Logs', href: '/app/ops/logs' },
];



export default function OpsSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card text-white rounded-md hover:bg-secondary hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-5 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          max-w-72 w-72 bg-card text-gray-300 h-screen flex flex-col
          fixed lg:static top-0 left-0 z-40 transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 ">
          <h1 className="text-xl  text-white">Admin Dashboard</h1>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-3 mt-10 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-lg rounded-md hover:bg-secondary hover:text-white transition-colors"
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

       
      </aside>
    </>
  );
}