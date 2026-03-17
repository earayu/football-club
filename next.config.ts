import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nextConfig: any = {
  // Raise Server Actions body limit to allow multi-photo uploads (default: 1MB)
  experimental: {
    serverActionsBodySizeLimit: "20mb",
  },
};

export default withNextIntl(nextConfig);
