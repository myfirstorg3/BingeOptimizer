import React, { useState } from "react";
import {
  Home,
  Layers,
  BarChart2,
  Bookmark,
  Search,
  Settings,
} from "lucide-react";
import blastoiseLogo from "../assets/blastoise_logo.png"; 
import { Link } from "react-router-dom";

const Navbar = () => {
  const [active, setActive] = useState("Main");

 const menu = [
    { name: "Main", icon: <Home size={22} />, to: '' },
    { name: "Collections", icon: <Layers size={22} />, to: 'collection' },
    { name: "Tier Lists", icon: <BarChart2 size={22} />, to: 'tierlist' },
    { name: "Wishlist", icon: <Bookmark size={22} />, to: 'media/1003' },
    { name: "Search", icon: <Search size={22} />, to: 'search' },
    { name: "Settings", icon: <Settings size={22} />, to: 'media/1005' }, // For testing
  ];

  return (
    <div className="h-screen w-[84px] bg-[#121212] flex flex-col items-center pt-5 pb-6 border-r border-[#2A2A2A]">
      
      <div className="mb-8">
        <img 
          src={blastoiseLogo} 
          alt="Blastoise" 
          className="w-[60px]"
        />
      </div>

      <div className="flex flex-col gap-8 w-full">
        {menu.map((item) => (
          <Link
            key={item.name}
            to={item.to} 
            onClick={() => setActive(item.name)}
            className="flex flex-col items-center cursor-pointer group"
          >
            {/* Icon */}
            <div
              className={`transition-colors duration-200 ${
                active === item.name 
                  ? "text-[#1480d9]" 
                  : "text-[#737373] group-hover:text-gray-300" 
              }`}
            >
              {item.icon}
            </div>
            
            {/* Text Label */}
            <span 
              className={`mt-1.5 text-[11px] font-medium transition-colors duration-200 ${
                active === item.name 
                  ? "text-[#1480d9]" 
                  : "text-[#737373] group-hover:text-gray-300"
              }`}
            >
              {item.name}
            </span>
          </Link>
        ))}
      </div>
      
    </div>
  );
};

export default Navbar;