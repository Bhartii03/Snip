import { useEffect, useState } from 'react';
import api from '../api/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Link as LinkIcon, Globe } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState({ stats: null, chartData: [], geoData: [] });

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data));
  }, []);

  if (!data.stats) {
    return (
      <div className="flex justify-center items-center h-64 text-[#c6ff00] text-sm tracking-[0.2em] uppercase animate-pulse">
        Establishing Telemetry Link...
      </div>
    );
  }

  // Custom Tooltip for the dark theme
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // NEW: Format the ugly database date string into "Apr 16, 2026"
      const formattedDate = new Date(label).toLocaleDateString(undefined, { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });

      return (
        <div className="bg-[#050505] border border-[#333] p-3 text-xs font-mono text-white">
          <p className="text-gray-500 mb-1">{formattedDate}</p>
          <p className="text-[#c6ff00] font-bold">{payload[0].value} redirects</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto mt-16 p-6">
      
      <div className="border-b border-gray-800 pb-4 mb-10 flex justify-between items-end">
        <h2 className="text-3xl font-black text-white tracking-widest uppercase">System Telemetry</h2>
        <span className="text-[10px] text-[#c6ff00] tracking-[0.3em] uppercase border border-[#c6ff00]/30 bg-[#c6ff00]/10 px-3 py-1 flex items-center gap-2">
          <Globe size={12} /> Global Feed Active
        </span>
      </div>
      
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[#0a0a0a] p-6 border border-gray-800 flex items-center space-x-6 hover:border-[#c6ff00]/50 transition-colors">
          <div className="p-4 bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00]">
            <LinkIcon size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] tracking-[0.2em] font-bold uppercase mb-1">Total Snips Generated</p>
            <p className="text-5xl font-black text-white">{data.stats.total_urls}</p>
          </div>
        </div>
        
        <div className="bg-[#0a0a0a] p-6 border border-gray-800 flex items-center space-x-6 hover:border-[#c6ff00]/50 transition-colors">
          <div className="p-4 bg-[#c6ff00]/10 border border-[#c6ff00]/20 text-[#c6ff00]">
            <Activity size={28} />
          </div>
          <div>
            <p className="text-gray-500 text-[10px] tracking-[0.2em] font-bold uppercase mb-1">Total Network Redirects</p>
            <p className="text-5xl font-black text-white">{data.stats.total_clicks}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Network Traffic Line Graph */}
        <div className="bg-[#0a0a0a] p-8 border border-gray-800 h-[400px] lg:col-span-2">
          <h3 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase mb-8">Network Traffic (7 Days)</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis dataKey="date" tick={{fill: '#6b7280', fontSize: 10, fontFamily: 'monospace'}} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} stroke="#374151" />
              <YAxis tick={{fill: '#6b7280', fontSize: 10, fontFamily: 'monospace'}} allowDecimals={false} stroke="#374151" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="clicks" stroke="#c6ff00" strokeWidth={3} dot={{r: 4, fill: '#0a0a0a', strokeWidth: 2, stroke: '#c6ff00'}} activeDot={{r: 7, fill: '#c6ff00', stroke: '#0a0a0a'}} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* NEW: City Origins Bar Chart */}
        <div className="bg-[#0a0a0a] p-8 border border-gray-800 h-[400px]">
          <h3 className="text-xs font-bold text-gray-500 tracking-[0.2em] uppercase mb-8">Top Cities</h3>
          {data.geoData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-700 text-xs font-mono uppercase tracking-widest">
              Awaiting Geographic Data...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.geoData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1f2937" />
                <XAxis type="number" hide />
                {/* Changed dataKey to "location" to match our new SQL query */}
                <YAxis dataKey="location" type="category" tick={{fill: '#6b7280', fontSize: 12, fontFamily: 'monospace'}} stroke="#374151" axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#111'}} />
                <Bar dataKey="clicks" fill="#c6ff00" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  );
}