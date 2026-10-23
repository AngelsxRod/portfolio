import { getAdminProfile } from "@/lib/admin-api";
import { ProfileForm } from "./profile-form";

export default async function AdminProfile() {
  const profile = await getAdminProfile();
  return <ProfileForm profile={profile} />;
}
