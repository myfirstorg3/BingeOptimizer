import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="flex justify-center items-center px-6 py-4 border-t border-[#2A2A2A] text-sm text-gray-400 gap-8 text-[18px]">

      {/* Right Side - Links */}
      <div className="flex space-x-6">
        <div>
          &copy; {new Date().getFullYear()} &nbsp;&nbsp; Blastoise - All rights reserved
        </div>
        <Link to="/members" className="hover:text-white transition-colors duration-200">
          Members
        </Link>
        <Link to="/page-67" className="hover:text-white transition-colors duration-200">
          67
        </Link>
        <Link to="/terms" className="hover:text-white transition-colors duration-200">
          Terms of Service
        </Link>
        <Link to="/contact" className="hover:text-white transition-colors duration-200">
          Contact Us
        </Link>
      </div>
      
    </footer>
  );
}

export default Footer;