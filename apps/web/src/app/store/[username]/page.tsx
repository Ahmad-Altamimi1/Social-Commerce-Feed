import MerchantStorePage from "../../../pages/MerchantStorePage";

export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <MerchantStorePage username={username} />;
}
