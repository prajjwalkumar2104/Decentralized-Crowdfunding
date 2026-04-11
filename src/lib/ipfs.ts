const DEFAULT_IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

export const getIpfsImageUrl = (value) => {
  if (!value) return "";

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || DEFAULT_IPFS_GATEWAY;
  const cid = value.startsWith("ipfs://") ? value.slice("ipfs://".length) : value;

  return `${gateway}${cid}`;
};
