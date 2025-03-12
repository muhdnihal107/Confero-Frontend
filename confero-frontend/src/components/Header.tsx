import { Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full bg-transparent backdrop-blur-lg shadow-md py-3 px-6 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="text-white text-2xl font-bold">Confero</div>

      {/* Center: Navigation Links */}
      <nav className="hidden md:flex space-x-6">
        <Link to="/" className="text-white hover:text-blue-400">Home</Link>
        <Link to="/connect" className="text-white hover:text-blue-400">Connect</Link>
        <Link to="/explore" className="text-white hover:text-blue-400">Explore</Link>
        <Link to="/call-history" className="text-white hover:text-blue-400">Call History</Link>
      </nav>

      {/* Right: Search Bar + Icons */}
      <div className="flex items-center space-x-4">
        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search..."
          className="px-4 py-1 rounded-lg bg-white/20 text-white placeholder-white focus:outline-none"
        />

        {/* Notification Icon */}
        <Bell className="text-white cursor-pointer hover:text-blue-400" size={24} />

        {/* Profile Image */}
        <div className="w-10 h-10 rounded-full border-2 border-white cursor-pointer">
        <User className="text-white cursor-pointer hover:text-blue-400" size={24}></User>
        </div>
        {/* <img
          src="/src/assets/profile.jpg" // Change to your image path
          alt="Profile"
          className="w-10 h-10 rounded-full border-2 border-white cursor-pointer"
        /> */}
      </div>
    </header>
  )
}

export default Header