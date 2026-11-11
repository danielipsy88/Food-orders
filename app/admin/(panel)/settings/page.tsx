import SettingsForm from "@/components/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/data";

export default async function SettingsPage() {
  await requireAdmin();
  return <SettingsForm s={await getSettings()} />;
}
