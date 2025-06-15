
const Header = () => (
  <header className="w-full bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 text-white py-5 px-8 shadow-lg flex items-center justify-between">
    <div className="flex items-center gap-3">
      <span className="font-bold text-2xl tracking-tight">JobAgent</span>
      <span className="ml-2 rounded-full bg-white/20 px-3 py-1 text-xs uppercase font-semibold tracking-widest">AI-Powered</span>
    </div>
    <nav>
      <a
        href="#"
        className="hover:underline text-white font-medium px-3 text-sm"
      >
        About
      </a>
    </nav>
  </header>
);

export default Header;
