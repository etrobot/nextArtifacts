'use client'
import { ThemeToggle } from '@/components/theme-toggle';
import React, { useState } from 'react';
import Link from 'next/link';
import { TwitterX, Github } from '@/components/ui/social-icons';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  githubUrl?: string;
  twitterUrl?: string;
}

const Navbar: React.FC<NavbarProps> = ({ githubUrl, twitterUrl }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <header className=" top-0 z-50 flex items-center md:justify-between md:shrink-0  w-full p-2 bg-background bg-opacity-80">
      <div className="absolute sm:right-0 md:top-2 top-0 "><ThemeToggle /></div>
      <button 
            onClick={toggleMenu}
            className="md:hidden absolute right-2 top-2"
          >
            {isOpen ? <X /> : <Menu />}
          </button>
    <nav className="py-2 relative">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <ul className={`
            md:flex md:space-x-4 md:items-center
            ${isOpen ? 'mt-4 p-4 space-y-2' : 'hidden'}
          `}>
            {githubUrl && (
              <li key="github">
                <a href={githubUrl} target='_blank' rel="noopener noreferrer">
                  <Github width={20} height={20}/>
                </a>
              </li>
            )}
            {twitterUrl && (
              <li key="x">
                <a href={twitterUrl} target='_blank' rel="noopener noreferrer">
                  <TwitterX width={20} height={20}/>
                </a>
              </li>
            )}
            <li key="all">
              <Link className='title font-bold' href="https://aicube.fun" target='_blank'>
                AICUBE.FUN
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
    </header>
  );
}

export default Navbar;