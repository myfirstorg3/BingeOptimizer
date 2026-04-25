import React from 'react';

function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-6 text-white min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-8 border-b border-[#2A2A2A] pb-4">Terms of Service</h1>
      <div className="space-y-6 text-gray-400">
        <p>
          <strong className="text-white">1. Acceptance of Terms:</strong> By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
        </p>
        <p>
          <strong className="text-white">2. User Guidelines:</strong> We reserve the right to ban any user who violates our community guidelines.
        </p>
        {/* Add more terms as needed */}
      </div>
    </div>
  );
}

export default Terms;