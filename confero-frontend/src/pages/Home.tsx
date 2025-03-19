import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home: React.FC = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(true); // Default to dark theme

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  return (
    <>
      <div className={`relative w-full min-h-screen ${isDarkTheme ? "bg-[#030103a8]" : "bg-[#fffff00]"}`}>
        {/* Header */}
        <Header />

        {/* Background Image - Fixed */}
        <div
          className="fixed top-0 left-0 w-full h-full bg-cover bg-center z-[-1] opacity-80"
          
        ></div>

        {/* Content Wrapper */}
        <div className="relative z-10 flex flex-col min-h-screen px-6 sm:px-12 pt-20">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="fixed top-20 right-6 z-20 p-2 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-all duration-300 shadow-md"
          >
            {isDarkTheme ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Hero Section */}
          <div className="mt-32 max-w-lg">
            <h1 className={`text-5xl sm:text-6xl font-bold leading-tight ${isDarkTheme ? "text-white" : "text-gray-900"}`}>
              Connect <br /> with <br /> Confidence
            </h1>
            <p className={`mt-4 text-lg ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Seamless meetings, effortless conversations. Confero makes connecting simple, fast, and engaging.
            </p>
            <button
              className={`mt-6 px-6 py-3 rounded-full shadow-md font-medium transition-all duration-300 ${
                isDarkTheme
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-indigo-500 text-white hover:bg-indigo-600"
              }`}
            >
              Get Started
            </button>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <h2 className={`text-3xl font-semibold text-center ${isDarkTheme ? "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent" : "text-gray-800"}`}>
              Why Choose Confero?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10 max-w-5xl mx-auto">
              <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-red-300 bg-opacity-60 backdrop-blur-md"} p-6 rounded-xl shadow-lg border ${isDarkTheme ? "border-gray-700" : null }`}>
                <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Instant Meetings</h3>
                <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                  Start or join meetings with a single click—no hassle, no delays.
                </p>
              </div>
              <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-white"} p-6 rounded-xl shadow-lg border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Crystal Clear Audio</h3>
                <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                  Experience high-quality sound for every conversation.
                </p>
              </div>
              <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-white"} p-6 rounded-xl shadow-lg border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Secure Connections</h3>
                <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                  Your privacy matters—end-to-end encryption keeps you safe.
                </p>
              </div>
            </div>
          </div>

          {/* Call to Action Section */}
          <div className="mt-20 text-center">
            <h2 className={`text-3xl font-semibold ${isDarkTheme ? "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent" : "text-gray-800"}`}>
              Ready to Connect?
            </h2>
            <p className={`mt-4 text-lg max-w-2xl mx-auto ${isDarkTheme ? "text-gray-300" : "text-gray-700"}`}>
              Join thousands of users already enjoying seamless communication. Sign up today and start connecting with confidence.
            </p>
            <button
              className={`mt-6 px-8 py-3 rounded-full shadow-md font-medium transition-all duration-300 ${
                isDarkTheme
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600"
              }`}
            >
              Sign Up Now
            </button>
          </div>

          {/* Bottom Cards Section */}
          <div className="mt-20 flex gap-8 justify-end pr-6 sm:pr-20">
            <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-white"} bg-opacity-60 backdrop-blur-md p-6 rounded-xl w-72 h-64 shadow-lg border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Community Hub</h3>
              <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                Engage with like-minded individuals in our vibrant community spaces.
              </p>
            </div>
            <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-white"} bg-opacity-60 backdrop-blur-md p-6 rounded-xl w-72 h-64 shadow-lg border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Custom Rooms</h3>
              <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                Create personalized meeting rooms tailored to your needs.
              </p>
            </div>
            <div className={`${isDarkTheme ? "bg-gray-800/90" : "bg-white"} bg-opacity-60 backdrop-blur-md p-6 rounded-xl w-72 h-64 shadow-lg border ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>Cross-Platform</h3>
              <p className={`mt-2 ${isDarkTheme ? "text-gray-300" : "text-gray-600"}`}>
                Access Confero from any device, anywhere, anytime.
              </p>
            </div>
          </div>

          {/* Spacer */}
          <div className="h-[20vh]"></div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;