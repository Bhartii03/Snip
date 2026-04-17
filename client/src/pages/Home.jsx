import { useState, useEffect } from 'react';
import api from '../api/client';

export default function Home() {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Track the most recently created link for the top highlight box
  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('snipResult');
    return saved ? JSON.parse(saved) : null;
  });

  // Track the history of all links created in this browser
  const [recentLinks, setRecentLinks] = useState(() => {
    const saved = localStorage.getItem('snipRecentLinks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const syncClicks = async () => {
      
      const saved = localStorage.getItem('snipRecentLinks');
      if (!saved) return;
      
      const currentLinks = JSON.parse(saved);
      if (currentLinks.length === 0) return;

      try {
        const ids = currentLinks.map(link => link.url.id);
        const res = await api.post('/urls/stats', { ids });
        
        let stateChanged = false;
        const updatedLinks = currentLinks.map(link => {
          const liveData = res.data.find(d => d.id === link.url.id);
          if (liveData && liveData.click_count !== link.url.click_count) {
            stateChanged = true;
            return { ...link, url: { ...link.url, click_count: liveData.click_count } };
          }
          return link;
        });

        if (stateChanged) {
          setRecentLinks(updatedLinks);
          localStorage.setItem('snipRecentLinks', JSON.stringify(updatedLinks));
          
          // Also update the highlighted top box if needed
          const currentResult = JSON.parse(sessionStorage.getItem('snipResult'));
          if (currentResult) {
            const updatedResult = updatedLinks.find(l => l.url.id === currentResult.url.id);
            if (updatedResult) {
              setResult(updatedResult);
              sessionStorage.setItem('snipResult', JSON.stringify(updatedResult));
            }
          }
        }
      } catch (err) {
        // Silently fail in the background so we don't spam the UI
      }
    };

    // 1. Run a check immediately when the page loads
    syncClicks();

    // 2. Start the radar: silently fetch new data every 3 seconds (3000 ms)
    const pingInterval = setInterval(syncClicks, 3000);

    // 3. Shut down the radar if the user navigates away to the Dashboard
    return () => clearInterval(pingInterval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/urls', { 
        originalUrl: url, 
        customAlias: alias || undefined 
      });
      
      const newLinkData = {
        ...res.data,
        createdAt: new Date().toISOString()
      };

      // Set the highlight box
      setResult(newLinkData);
      sessionStorage.setItem('snipResult', JSON.stringify(newLinkData));

      // Add to recent links list (keep the last 10)
      const updatedLinks = [newLinkData, ...recentLinks].slice(0, 10);
      setRecentLinks(updatedLinks);
      localStorage.setItem('snipRecentLinks', JSON.stringify(updatedLinks));

      setUrl('');
      setAlias('');
    } catch (err) {
      setError(err.response?.data?.error || 'System fault during link generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a temporary "Copied!" state here if you want!
  };

  const handleClearAll = () => {
    setRecentLinks([]);
    localStorage.removeItem('snipRecentLinks');
    setResult(null);
    sessionStorage.removeItem('snipResult');
  };

  return (
    <main className="max-w-4xl mx-auto mt-20 p-6">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="border border-[#c6ff00] text-[#c6ff00] text-[10px] px-4 py-1.5 tracking-[0.2em] mb-10 uppercase">
          Long URLs. Shortened. Tracked.
        </div>
        
        <h2 className="text-7xl md:text-9xl font-black tracking-tighter uppercase leading-[0.85] font-sans">
          <span className="text-transparent" style={{ WebkitTextStroke: '2px white' }}>Cut the</span><br />
          <span className="text-[#c6ff00] italic">clutter.</span>
        </h2>
        
        <p className="mt-8 text-gray-500 text-sm tracking-wide leading-relaxed">
          Paste any URL. Get a short, trackable link in milliseconds.<br/>
          Built for developers. Designed for everyone.
        </p>
      </div>

      {/* The Snip Input Bar */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex flex-col gap-4">
        <div className="flex w-full border border-gray-800 bg-[#0a0a0a] focus-within:border-[#c6ff00] transition-colors group">
          <div className="px-4 py-5 text-gray-600 border-r border-gray-800 flex items-center text-sm">
            https://
          </div>
          <input 
            type="url" 
            required 
            placeholder="paste your long URL here..." 
            className="flex-1 bg-transparent px-6 outline-none text-white placeholder-gray-700 text-sm"
            value={url} 
            onChange={(e) => setUrl(e.target.value)}
          />
          <button 
            disabled={loading}
            className="bg-[#c6ff00] text-black font-black uppercase px-8 tracking-widest text-sm hover:bg-[#e0ff4d] transition-colors disabled:opacity-50"
          >
            {loading ? 'WAIT...' : 'SNIP IT'}
          </button>
        </div>

        <div className="flex justify-end">
          <input 
            type="text" 
            placeholder="[optional custom alias]" 
            className="bg-transparent border-b border-gray-800 text-xs text-[#c6ff00] placeholder-gray-700 outline-none focus:border-[#c6ff00] px-2 py-1 text-right w-48 transition-colors"
            value={alias} 
            onChange={(e) => setAlias(e.target.value)}
          />
        </div>
      </form>

      {error && (
        <div className="max-w-3xl mx-auto mt-6 border border-red-500/50 bg-red-900/10 text-red-500 p-4 text-xs tracking-widest uppercase text-center">
          ERR: {error}
        </div>
      )}

      {/* NEW: Highlighted Result Box */}
      {result && (
        <div className="max-w-3xl mx-auto mt-12 border border-[#333] bg-[#0a0a0a] p-6 animate-fade-in">
          <p className="text-[#c6ff00] text-[10px] tracking-[0.2em] uppercase font-bold mb-4">Your Shortened Link</p>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="overflow-hidden">
              <a href={result.fullUrl} target="_blank" rel="noreferrer" className="text-2xl font-bold text-white hover:underline truncate block">
                {result.fullUrl}
              </a>
              <p className="text-gray-500 text-xs truncate mt-1">{result.url.original_url}</p>
            </div>
            <button 
              onClick={() => handleCopy(result.fullUrl)}
              className="border border-[#444] text-gray-300 hover:text-[#c6ff00] hover:border-[#c6ff00] transition-colors px-6 py-2 text-xs tracking-widest uppercase shrink-0"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      
      {/* NEW: Recent Links List */}
      {recentLinks.length > 0 && (
        <div className="max-w-3xl mx-auto mt-16 animate-fade-in">
          <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-4">
            <h3 className="text-xs text-gray-500 tracking-[0.2em] uppercase font-bold">Recent Links</h3>
            <button 
              onClick={handleClearAll} 
              className="text-[9px] text-gray-500 border border-gray-800 px-3 py-1 hover:text-white hover:border-gray-500 transition-colors uppercase tracking-widest"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {recentLinks.map((link, index) => (
              <div key={link.url.id + index} className="border border-[#222] bg-[#0a0a0a] p-4 flex justify-between items-center group hover:border-[#444] transition-colors">
                <div className="flex items-center gap-4 overflow-hidden">
                  <span className="text-gray-700 font-mono text-xs border border-gray-800 px-2 py-1">
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="truncate">
                    <a href={link.fullUrl} target="_blank" rel="noreferrer" className="text-[#c6ff00] font-bold text-sm hover:underline block truncate">
                      {link.fullUrl}
                    </a>
                    <p className="text-gray-600 text-[10px] truncate mt-1">
                      {link.url.original_url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 pl-4">
                  <div className="text-right hidden sm:block">
                    {/* Since this is local history, we start with 0 clicks. We'd need to query the DB for live updates! */}
                    <p className="text-white text-xs font-bold">{link.url.click_count || 0} clicks</p>
                    <p className="text-gray-600 text-[9px] uppercase tracking-wider mt-1">
                      {new Date(link.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCopy(link.fullUrl)}
                    className="border border-[#333] text-gray-400 text-[10px] px-4 py-2 uppercase tracking-widest hover:text-[#c6ff00] hover:border-[#c6ff00] transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Architecture Grid */}
      <div className="max-w-5xl mx-auto mt-24 border-t border-gray-900 pt-16 mb-20">
        <div className="flex justify-between items-end mb-8">
          <h3 className="text-xs text-gray-500 tracking-[0.2em] uppercase font-bold">System Architecture</h3>
        </div>
        
        {/* Simplified border logic: Top/Left on parent, Bottom/Right on children */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-gray-900">
          {[
            { step: '01', title: 'Hashing Engine', desc: 'Base62 encoding with collision-resistant database constraints.', tags: ['BASE62', 'COLLISION-SAFE'] },
            { step: '02', title: 'Storage Layer', desc: 'Redis handles L1 caching. PostgreSQL ensures ACID persistence.', tags: ['REDIS', 'POSTGRESQL'] },
            { step: '03', title: 'Redirect API', desc: 'HTTP 302 redirects decoupled from async telemetry background workers.', tags: ['REST API', 'HTTP 302', 'ASYNC'] },
            { step: '04', title: 'Rate Limiting', desc: 'Token bucket strategy prevents automated abuse via Redis TTL counters.', tags: ['TOKEN BUCKET', 'REDIS TTL'] },
            { step: '05', title: 'Analytics Engine', desc: 'Real-time IP-to-city geolocation mapping without blocking the redirect.', tags: ['GEO-IP', 'EVENT LOOP'] },
            { step: '06', title: 'Scalability', desc: 'Stateless Node.js backend with cache-aside graceful degradation.', tags: ['STATELESS', 'FAIL-SAFE'] }
          ].map((item, i) => (
            <div key={i} className="p-8 border-b border-r border-gray-900 hover:bg-[#0a0a0a] transition-colors duration-300">
              <h4 className="text-4xl font-black text-[#1a1a1a] mb-4 font-sans">{item.step}</h4>
              <h5 className="text-white font-bold mb-2 text-sm">{item.title}</h5>
              <p className="text-gray-500 text-xs leading-relaxed mb-6 h-12">{item.desc}</p>
              
              {/* Added flex-wrap just in case tags get too long on mobile */}
              <div className="flex flex-wrap gap-2 text-[9px] font-bold tracking-widest text-[#c6ff00]">
                {item.tags.map(tag => (
                  <span key={tag} className="border border-[#c6ff00]/30 px-2 py-1 bg-[#c6ff00]/5">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </main>
  );
}