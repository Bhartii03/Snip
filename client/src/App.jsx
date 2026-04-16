import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      {/* This wrapper applies the dark theme, monospace font, and the subtle grid background pattern!
      */}
      <div 
        className="min-h-screen bg-[#050505] text-gray-300 font-mono selection:bg-[#c6ff00] selection:text-black"
        style={{
          backgroundImage: `linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Dark Terminal-style Navigation */}
        <nav className="border-b border-[#222] bg-[#050505]/90 backdrop-blur-sm px-8 py-6 flex justify-between items-center sticky top-0 z-50">
          <Link to="/" className="text-3xl font-black text-[#c6ff00] tracking-tighter uppercase font-sans">
            SNIP.
          </Link>
          <div className="flex items-center space-x-8 text-xs font-bold tracking-widest uppercase">
             <Link to="/dashboard" className="text-gray-400 hover:text-[#c6ff00] transition-colors">Dashboard</Link>
             <span className="text-gray-600 border border-gray-800 px-3 py-1">URL SHORTENER V1.0</span>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;