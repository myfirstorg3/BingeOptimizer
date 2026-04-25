import React from 'react';

function Cards({ 
    title, 
    poster, 
    rating, 
    releaseDate, 
}) {
  return (
    <div className="bg-[#121212] rounded-xl overflow-hidden border border-[#2A2A2A] flex flex-col transition-transform hover:-translate-y-1 hover:border-[#1480d9] duration-300 group cursor-pointer">
      
      {/* Poster Image */}
      <div className="relative w-full aspect-[2/3] bg-[#1A1A1A]">
        <img 
          src={poster} 
          alt={title} 
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
        />
      </div>

      {/* Card Info */}
      <div className="p-3 flex flex-col flex-grow">
        <h2 className="text-white font-medium text-[15px] mb-1.5 line-clamp-1" title={title}>
          {title}
        </h2>
        
        {/* Meta Info */}
        <div className="flex justify-between items-center text-sm text-[#737373] mt-auto">
          <span>{releaseDate}</span>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium text-gray-300">{rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cards;