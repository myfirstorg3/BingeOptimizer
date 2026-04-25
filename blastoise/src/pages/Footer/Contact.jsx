import React from 'react';

function Contact() {
  return (
    <div className="flex items-center justify-center min-h-[80vh] text-white">
      <div className="bg-[#2A2A2A] p-10 rounded-lg shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-6">Have questions? We'd love to hear from you.</p>
        
        <a 
          href="mailto:support@blastoise.com" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded transition-colors duration-200"
        >
          Email Support
        </a>
      </div>
    </div>
  );
}

export default Contact;