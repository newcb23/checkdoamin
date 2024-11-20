import { useState } from 'react';
import Head from 'next/head';
import toast, { Toaster } from 'react-hot-toast';

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

  const handleCheck = async () => {
    if (!domains.trim()) {
      toast.error('Please enter at least one domain');
      return;
    }

    setLoading(true);
    try {
      // 处理输入的域名，去除前缀（如www.）和后缀
      const domainList = domains
        .split('\n')
        .map(domain => domain.trim())
        .filter(Boolean)
        .map(domain => {
          let cleanDomain = domain.toLowerCase();
          // 移除 http:// 或 https:// 前缀
          cleanDomain = cleanDomain.replace(/^https?:\/\//i, '');
          // 移除 www. 前缀
          cleanDomain = cleanDomain.replace(/^www\./i, '');
          // 移除路径和查询参数
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Domain Availability Checker</title>
        <meta name="description" content="Check multiple domain names availability" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Domain Availability Checker
          </h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Enter domain names (one per line):
              </label>
              <textarea
                className="w-full h-40 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={domains}
                onChange={(e) => setDomains(e.target.value)}
                placeholder="example.com&#10;example.net&#10;example.org"
              />
            </div>

            <button
              onClick={handleCheck}
              disabled={loading}
              className={`w-full bg-primary text-white font-bold py-3 px-4 rounded-lg 
                ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
            >
              {loading ? 'Checking...' : 'Check Domains'}
            </button>

            {results.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Results:</h2>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg ${
                        result.error
                          ? 'bg-yellow-50 border border-yellow-200'
                          : result.available
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{result.domain}</span>
                          {result.error ? (
                            <span className="text-yellow-600">{result.error}</span>
                          ) : (
                            <span
                              className={`font-medium ${
                                result.available ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {result.available ? 'Available' : 'Not Available'}
                            </span>
                          )}
                        </div>
                        {!result.error && (
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-1 ${result.methods.dns ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span>DNS</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-1 ${result.methods.whois ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span>WHOIS</span>
                            </div>
                            <div className="flex items-center">
                              <span className={`w-2 h-2 rounded-full mr-1 ${result.methods.http ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span>HTTP</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
