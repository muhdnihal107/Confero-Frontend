import React from "react";
//import { FaFacebook, FaTwitter, FaInstagram, FaGithub } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Logo & Description */}
        <div>
          <h2 className="text-2xl font-bold text-teal-400">BrandName</h2>
          <p className="mt-2 text-gray-400">
            Elevating your experience with cutting-edge design and innovation.
          </p>
        </div>

        {/* Navigation Links */}
        <div>
          <h3 className="text-lg font-semibold text-teal-400">Quick Links</h3>
          <ul className="mt-3 space-y-2">
            <li><a href="#" className="hover:text-teal-300">Home</a></li>
            <li><a href="#" className="hover:text-teal-300">About Us</a></li>
            <li><a href="#" className="hover:text-teal-300">Services</a></li>
            <li><a href="#" className="hover:text-teal-300">Contact</a></li>
          </ul>
        </div>

        {/* Social Media Icons */}
        <div>
          <h3 className="text-lg font-semibold text-teal-400">Follow Us</h3>
          <div className="flex space-x-4 mt-3">
            <a href="#" className="text-xl hover:text-teal-300">
              {/* <FaFacebook /> */}
            </a>
            <a href="#" className="text-xl hover:text-teal-300">
              {/* <FaTwitter /> */}
            </a>
            <a href="#" className="text-xl hover:text-teal-300">
              {/* <FaInstagram /> */}
            </a>
            <a href="#" className="text-xl hover:text-teal-300">
              {/* <FaGithub /> */}
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-10 text-center border-t border-gray-700 pt-5 text-gray-500">
        <p>&copy; {new Date().getFullYear()} BrandName. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
