import { Link } from "react-router-dom";
import { MdFacebook } from "react-icons/md";
import { SiX, SiInstagram, SiYoutube } from "react-icons/si";

const Footer = () => {
  return (
    <footer className="w-full bg-gradient-to-t from-[#0a0a0a] via-[#121212] to-[#1a102f] border-t border-[#2b2b2b] py-4 sm:py-5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4 text-center md:text-left">
        {/* Left side: Links */}
        <div className="flex flex-wrap justify-center md:justify-start gap-4 text-gray-400 text-xs sm:text-sm font-medium">
          <Link to="/terms-of-service" className="hover:text-purple-400 transition">
            Terms
          </Link>
          <Link to="/privacy-policy" className="hover:text-purple-400 transition">
            Privacy
          </Link>
          <Link to="/contact" className="hover:text-purple-400 transition">
            Contact
          </Link>
        </div>

        {/* Center: Copyright */}
        <div className="text-gray-600 text-[11px] sm:text-xs order-last md:order-none">
          © {new Date().getFullYear()} <span className="text-gray-400">Pinball Race</span>. All rights reserved.
        </div>

        {/* Right side: Social icons */}
        <div className="flex justify-center md:justify-end gap-4 sm:gap-5">
          <a
            href="https://www.facebook.com/profile.php?id=61581004837026"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-blue-500 transition transform hover:scale-110"
          >
            <MdFacebook size={18} />
          </a>

          <a
            href="https://x.com/PinballRace"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-white transition transform hover:scale-110"
          >
            <SiX size={16} />
          </a>

          <a
            href="https://www.instagram.com/pinballraceuk/"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-pink-500 transition transform hover:scale-110"
          >
            <SiInstagram size={16} />
          </a>

          <a
            href="https://www.youtube.com/@PinballRace"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-red-500 transition transform hover:scale-110"
          >
            <SiYoutube size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;




