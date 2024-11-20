import { useState, useRef } from 'react';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type DomainResult = {
  domain: string;
  available: boolean;
  methods: {
    dns: boolean;
    whois: boolean;
    http: boolean;
  };
  error?: string;
};

export default function Home() {
  const [domains, setDomains] = useState('');
  const [results, setResults] = useState<DomainResult[]>([]);
  const [loading, setLoading] = useState(false);
  const availableDomainsRef = useRef<HTMLTextAreaElement>(null);

  const handleCheck = async () => {
    if (!domains.trim()) {
      toast.error('Please enter at least one domain');
      return;
    }

    setLoading(true);
    setResults([]); // 清除之前的结果
    
    try {
      const domainList = domains
        .split('\n')
        .map(domain => domain.trim())
        .filter(Boolean)
        .map(domain => {
          let cleanDomain = domain.toLowerCase();
          cleanDomain = cleanDomain.replace(/^https?:\/\//i, '');
          cleanDomain = cleanDomain.replace(/^www\./i, '');
          cleanDomain = cleanDomain.split('/')[0];
          return cleanDomain;
        });

      const response = await fetch('/api/check-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domains: domainList }),
      });

      if (!response.ok) {
        throw new Error('Failed to check domains');
      }

      const data = await response.json();
      setResults(data);
      toast.success('Domain check completed!');
    } catch (error) {
      toast.error('Failed to check domains');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDomains = () => {
    return results
      .filter(result => result.available && !result.error)
      .map(result => result.domain)
      .join('\n');
  };

  const copyAvailableDomains = () => {
    if (availableDomainsRef.current) {
      availableDomainsRef.current.select();
      document.execCommand('copy');
      toast.success('Available domains copied to clipboard!');
    }
  };

  const availableCount = results.filter(r => r.available && !r.error).length;
  const unavailableCount = results.filter(r => !r.available && !r.error).length;
  const errorCount = results.filter(r => r.error).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Head>
        <title>Domain Availability Checker</title>
        <meta name="description" content="Check multiple domain names availability" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-5xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-2">
            Domain Checker
          </h1>
          <p className="text-center text-gray-400 mb-12">
            Check the availability of multiple domain names instantly
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 输入区域 */}
            <div className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-2xl shadow-2xl p-8 border border-gray-700">
              <div className="mb-8">
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Enter domain names (one per line):
                </label>
                <div className="relative">
                  <textarea
                    className="w-full h-[400px] p-4 bg-gray-900 border border-gray-700 rounded-xl 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      text-gray-300 placeholder-gray-500 transition-all duration-200"
                    value={domains}
                    onChange={(e) => setDomains(e.target.value)}
                    placeholder="example.com&#10;example.net&#10;example.org"
                  />
                  <div className="absolute bottom-3 right-3 text-sm text-gray-500">
                    {domains.split('\n').filter(d => d.trim()).length} domains
                  </div>
                </div>
              </div>

              <motion.button
                onClick={handleCheck}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 px-6 rounded-xl font-medium text-white
                  transition-all duration-200 relative overflow-hidden
                  ${loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600'
                  }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking Domains...
                  </div>
                ) : 'Check Availability'}
              </motion.button>
            </div>

            {/* 结果区域 */}
            <div className="bg-gray-800 backdrop-blur-lg bg-opacity-50 rounded-2xl shadow-2xl p-8 border border-gray-700">
              <AnimatePresence>
                {results.length > 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-200">Results</h2>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-emerald-400">Available: {availableCount}</span>
                        <span className="text-red-400">Unavailable: {unavailableCount}</span>
                        <span className="text-yellow-400">Errors: {errorCount}</span>
                      </div>
                    </div>

                    {/* 可用域名区域 */}
                    {availableCount > 0 && (
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium text-emerald-400">Available Domains</h3>
                          <motion.button
                            onClick={copyAvailableDomains}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-3 py-1 bg-emerald-500 bg-opacity-20 text-emerald-400 rounded-lg text-sm hover:bg-opacity-30 transition-all duration-200"
                          >
                            Copy All
                          </motion.button>
                        </div>
                        <textarea
                          ref={availableDomainsRef}
                          readOnly
                          value={getAvailableDomains()}
                          className="w-full h-24 p-3 bg-gray-900 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm focus:outline-none"
                        />
                      </div>
                    )}

                    {/* 所有结果列表 */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {results.map((result, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`p-4 rounded-xl border backdrop-blur-lg transition-all duration-200
                            ${result.error
                              ? 'bg-yellow-500 bg-opacity-10 border-yellow-500/30'
                              : result.available
                              ? 'bg-emerald-500 bg-opacity-10 border-emerald-500/30'
                              : 'bg-red-500 bg-opacity-10 border-red-500/30'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{result.domain}</span>
                            {result.error ? (
                              <span className="text-yellow-400 text-sm">{result.error}</span>
                            ) : (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium
                                  ${result.available 
                                    ? 'bg-emerald-500 bg-opacity-20 text-emerald-400' 
                                    : 'bg-red-500 bg-opacity-20 text-red-400'
                                  }`}
                              >
                                {result.available ? 'Available' : 'Not Available'}
                              </span>
                            )}
                          </div>
                          {!result.error && (
                            <div className="flex items-center space-x-4 mt-2 text-xs">
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${result.methods.dns ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className="text-gray-400">DNS</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${result.methods.whois ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className="text-gray-400">WHOIS</span>
                              </div>
                              <div className="flex items-center">
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${result.methods.http ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className="text-gray-400">HTTP</span>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No results yet. Enter domains and click check to start.
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>

      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#1F2937',
            color: '#fff',
            border: '1px solid #374151',
          },
        }}
      />
    </div>
  );
}
