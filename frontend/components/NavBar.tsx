import Link from 'next/link';
import { useRouter } from 'next/router';
import { Monitor, Users, ExternalLink, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getServerUrl } from '../lib/network';

const NAV = [
  { href: '/admin',    label: 'Admin CMS',       icon: Monitor },
  { href: '/operator', label: 'Operator Antrian', icon: Users   },
  { href: '/network',  label: 'Jaringan',         icon: Wifi    },
];

export default function NavBar() {
  const router = useRouter();
  const [serverUrl, setServerUrl] = useState('');

  useEffect(() => {
    setServerUrl(getServerUrl());
  }, []);

  const isRemote = serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1');

  return (
    <nav className="bg-gray-950 border-b border-gray-800/60 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
            <Monitor size={16} className="text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white">Digital Signage</div>
            <div className="text-xs text-gray-500">Pramitha CMS v2</div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = router.pathname === href;
            return (
              <Link
                key={href} href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-red-600/20 text-red-400 border border-red-700/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Icon size={15} />
                {label}
                {/* Show remote indicator on Jaringan link */}
                {href === '/network' && isRemote && (
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
              </Link>
            );
          })}

          {/* Player link */}
          <a
            href="/player?client=PRAMITHA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-white hover:bg-gray-800 transition-all"
          >
            <ExternalLink size={15} />
            Player
          </a>
        </div>

        {/* Server indicator */}
        {serverUrl && (
          <div className={`hidden lg:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            isRemote
              ? 'bg-green-900/30 border-green-700/50 text-green-400'
              : 'bg-gray-800 border-gray-700 text-gray-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isRemote ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
            {isRemote ? 'Remote' : 'Local'} · {serverUrl.replace('http://', '').replace('https://', '')}
          </div>
        )}
      </div>
    </nav>
  );
}
