import FollowListClient from '../../../components/FollowListClient';

export default async function FollowersPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <FollowListClient username={username} initialTab="followers" />;
}
