
import React from "react";
import Header from "../components/Header";


const Home: React.FC = () => {
  return (
    
    <div className="relative w-full min-h-screen overflow-y-auto">
    {/* Background Image - Fixed */}
    <div className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1]" 
         style={{ backgroundImage: "url('/src/assets/remote-office-3d-rendering-concept-illustration.jpg')" }}>
    </div>

    {/* Content Wrapper */}
    <div className="relative z-10 flex flex-col min-h-screen px-12">
      {/* Left Section - Hero Text */}
      <div className="mt-32 max-w-lg text-white">
        <h1 className="text-6xl font-bold leading-tight">
          Connect <br /> with <br /> Confidence.
        </h1>
        <p className="mt-4 text-lg text-gray-300">
          Seamless meetings, effortless conversations. Confero makes connecting simple, fast, and engaging.
        </p>
        <button className="mt-6 px-6 py-3 bg-white text-black rounded-full shadow-md">
          Connect
        </button>
      </div>

      {/* Spacer - Ensures Scrollability */}
      <div className="h-[60vh]"></div>

      {/* Bottom Cards Section - Adjusted to Right */}
      <div className="relative flex gap-8 justify-end pr-20">
        <div className="bg-red-300 bg-opacity-60 backdrop-blur-md p-6 rounded-lg w-72 h-64 shadow-lg">
          <h3 className="text-xl font-bold">Dummy Heading</h3>
          <p>Heloo, this is a dummy text for testing project home page.</p>
        </div>
        <div className="bg-red-300 bg-opacity-60 backdrop-blur-md p-6 rounded-lg w-72 h-64 shadow-lg">
          <h3 className="text-xl font-bold">Dummy Heading</h3>
          <p>Heloo, this is a dummy text for testing project home page.</p>
        </div>
        <div className="bg-red-300 bg-opacity-60 backdrop-blur-md p-6 rounded-lg w-72 h-64 shadow-lg">
          <h3 className="text-xl font-bold">Dummy Heading</h3>
          <p>Heloo, this is a dummy text for testing project home page.</p>
        </div>
      </div>

      {/* Spacer - More Scrollable Area */}
      <div className="h-[50vh]"></div>
    </div>
  </div>
  );
};

export default Home;
