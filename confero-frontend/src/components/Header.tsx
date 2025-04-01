import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-transparent backdrop-blur-lg shadow-md py-3 px-6 flex items-center justify-between z-50">
      {/* Left: Logo */}
      <div className="text-white text-2xl font-bold">
        <Link to="/">Confero</Link>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex space-x-6">
        <Link to="/" className="text-white hover:text-blue-400">
          Home
        </Link>
        <Link to="/room" className="text-white hover:text-blue-400">
          Connect
        </Link>
        <Link to="/explore" className="text-white hover:text-blue-400">
          Explore
        </Link>
        <Link to="/call-history" className="text-white hover:text-blue-400">
          Call History
        </Link>
      </nav>

      {/* Right: Search Bar + Icons */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-1 rounded-lg bg-white/20 text-white placeholder-white focus:outline-none"
        />

        <Link to="/notification">
        <Bell className="text-white cursor-pointer hover:text-blue-400" size={24} />
        </Link>
        {/* Profile Icon */}
        <Link to="/profile">
          <User className="text-white cursor-pointer hover:text-blue-400" size={24} />
        </Link>
      </div>
    </header>
  );
};

export default Header;