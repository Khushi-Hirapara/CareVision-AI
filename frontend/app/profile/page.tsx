"use client";

import { ProfileView } from "@/components/profile/ProfileView";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return <ProfileView user={user} />;
}
