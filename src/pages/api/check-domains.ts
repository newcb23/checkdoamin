import type { NextApiRequest, NextApiResponse } from 'next';
import dns from 'dns';
import { promisify } from 'util';
import net from 'net';
import https from 'https';

const resolveDns = promisify(dns.resolve);
const dnsLookup = promisify(dns.lookup);

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

async function checkDNS(domain: string): Promise<boolean> {
  try {
    await resolveDns(domain);
    return false; // 域名存在，不可用
  } catch (error: any) {
    if (error.code === 'ENOTFOUND') {
      return true; // 域名不存在，可用
    }
    throw error;
  }
}

async function checkWhoisPort(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 2000; // 2秒超时

    socket.setTimeout(timeout);

    socket.on('error', () => {
      socket.destroy();
      resolve(true); // 连接失败，可能域名可用
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false); // 超时，假设域名已注册
    });

    socket.connect(43, 'whois.internic.net', () => {
      socket.destroy();
      resolve(false); // 能连接，说明域名已注册
    });
  });
}

async function checkHTTP(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = 3000; // 3秒超时
    const req = https.get(
      {
        hostname: domain,
        path: '/',
        timeout: timeout,
      },
      (res) => {
        res.destroy();
        resolve(false); // 有响应，域名已被使用
      }
    );

    req.on('error', () => {
      resolve(true); // 请求失败，域名可能未被使用
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(true);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DomainResult[]>
) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const { domains } = req.body;

  if (!Array.isArray(domains)) {
    res.status(400).end();
    return;
  }

  try {
    const results = await Promise.all(
      domains.map(async (domain) => {
        try {
          // 并行执行所有检查方法
          const [dnsResult, whoisResult, httpResult] = await Promise.all([
            checkDNS(domain).catch(() => false),
            checkWhoisPort(domain).catch(() => false),
            checkHTTP(domain).catch(() => false),
          ]);

          // 综合判断结果
          // 如果至少两种方法认为域名可用，则认为域名可用
          const methodResults = {
            dns: dnsResult,
            whois: whoisResult,
            http: httpResult,
          };

          const availableCount = Object.values(methodResults).filter(
            (result) => result
          ).length;

          return {
            domain,
            available: availableCount >= 2,
            methods: methodResults,
          };
        } catch (error) {
          return {
            domain,
            available: false,
            methods: {
              dns: false,
              whois: false,
              http: false,
            },
            error: 'Unable to check domain availability',
          };
        }
      })
    );

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json([]);
  }
}
