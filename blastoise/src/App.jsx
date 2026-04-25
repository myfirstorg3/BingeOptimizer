import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; 
import { Outlet, useLocation } from "react-router-dom";
import { useMovieDetails } from "./hooks/useMovieApi";

const App = () => {
  const location = useLocation();
  
  const isMediaPage = location.pathname.startsWith("/media/");
  const movieId = isMediaPage ? location.pathname.split("/")[2] : null;

  const { movie } = useMovieDetails(movieId);

  const getPageTitle = () => {
    if (isMediaPage) {
      return movie ? movie.title : "Loading...";
    } 
    
    // Switch statement is cleaner here for matching your footer links
    switch (location.pathname) {
      case "/tierlist": 
        return "Tierlist";
      case "/members":
        return "Members";
      case "/page-67":
        return "Route 67";
      case "/terms":
        return "Terms of Service";
      case "/contact":
        return "Contact Us";
      case "/":
        return "Main";
      default:
        return "Main"; // Fallback title
    }
  };
  
  const isWobbleTime = location.pathname === "/page-67";

  return (
    <div className={`flex bg-black text-white h-screen w-full transform transition-all duration-300 ${isWobbleTime ? 'animate-wobble' : ''}`}>
      
      {/* Sidebar */}
      <Navbar />

      {/* Main Section */}
      <div className="flex flex-col flex-1 py-[10px] overflow-hidden text-white">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#2A2A2A]">
          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          
          <div className="p-6 text-gray-400 flex-1">
            {/* The Outlet renders Home, MediaDetail, Terms, Contact, etc. */}
            <Outlet />
          </div>
          
          {/* Footer */}
          <Footer />
          
        </div>
        
      </div>
    </div>
  );
};

export default App;