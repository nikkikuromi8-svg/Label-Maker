import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    serverExternalPackages: ['xlsx', 'jspdf', 'html-to-image', 'html2canvas'],
};

export default nextConfig;


