"use server";

import { revalidatePath } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import {
  createSiteAnnouncement,
  deleteSiteAnnouncement,
  updateSiteAnnouncement,
  updateSiteAnnouncementEnabled,
  type SiteAnnouncementInput,
} from "@/app/lib/announcements/repository";

function revalidateAnnouncementPaths() {
  revalidatePath("/site_announcements");
  revalidatePath("/", "layout");
}

export async function createSiteAnnouncementAction(input: SiteAnnouncementInput) {
  await assertSystemAdminAccess();

  const result = await createSiteAnnouncement(input);

  if (result.ok) {
    revalidateAnnouncementPaths();
  }

  return result;
}

export async function updateSiteAnnouncementAction(
  id: string,
  input: SiteAnnouncementInput,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteAnnouncement(id, input);

  if (result.ok) {
    revalidateAnnouncementPaths();
  }

  return result;
}

export async function updateSiteAnnouncementEnabledAction(
  id: string,
  isEnabled: boolean,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteAnnouncementEnabled(id, isEnabled);

  if (result.ok) {
    revalidateAnnouncementPaths();
  }

  return result;
}

export async function deleteSiteAnnouncementAction(id: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteAnnouncement(id);

  if (result.ok) {
    revalidateAnnouncementPaths();
  }

  return result;
}
