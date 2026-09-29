import FollowListClient from '../../../components/FollowListClient';

export default async function FollowingPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <FollowListClient username={username} initialTab="following" />;
}
