import path from "path";

const nextConfig = {
  webpack(config) {
    config.resolve.alias["@"] = path.resolve("./client/src");
    return config;
  },
};

export default nextConfig;