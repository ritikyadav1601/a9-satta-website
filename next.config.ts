import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/desawar-result", destination: "/chart/disawar", permanent: true },
      { source: "/delhi-bazar", destination: "/chart/delhi-bazar", permanent: true },
      { source: "/shree-ganesh", destination: "/chart/shri-ganesh", permanent: true },
      { source: "/faridabad-result", destination: "/chart/faridabad", permanent: true },
      { source: "/ghaziabad-result", destination: "/chart/gaziabad", permanent: true },
      { source: "/gali-result", destination: "/chart/gali", permanent: true },
      { source: "/satta-king-chart", destination: "/#monthly-records", permanent: true },
      { source: "/monthly-records", destination: "/#monthly-records", permanent: true },
      {
        source: "/:path*",
        has: [{ type: "host", value: "a7satta.co" }],
        destination: "https://live-sattaking.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.a7satta.co" }],
        destination: "https://live-sattaking.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.live-sattaking.com" }],
        destination: "https://live-sattaking.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "sattaonlineresult.com" }],
        destination: "https://live-sattaking.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.sattaonlineresult.com" }],
        destination: "https://live-sattaking.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
