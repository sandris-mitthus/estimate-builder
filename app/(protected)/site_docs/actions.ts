"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { assertSystemAdminAccess } from "@/app/lib/site-admin/access";
import { SITE_DOCS_CACHE_TAG } from "@/app/lib/i18n/cache-tags";
import {
  createSiteDoc,
  createSiteDocCategory,
  deleteSiteDoc,
  deleteSiteDocCategory,
  reorderSiteDocs,
  updateSiteDoc,
  updateSiteDocCategory,
  type SiteDocCategoryInput,
  type SiteDocInput,
  type SiteDocReorderItem,
} from "@/app/lib/site-admin/repository";

function revalidateSiteDocs() {
  revalidateTag(SITE_DOCS_CACHE_TAG, "max");
  revalidatePath("/site_docs");
  revalidatePath("/docs");
  revalidatePath("/wiki");
}

export async function createSiteDocCategoryAction(input: SiteDocCategoryInput) {
  await assertSystemAdminAccess();

  const result = await createSiteDocCategory(input);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function updateSiteDocCategoryAction(
  categoryId: string,
  input: SiteDocCategoryInput,
) {
  await assertSystemAdminAccess();

  const result = await updateSiteDocCategory(categoryId, input);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function deleteSiteDocCategoryAction(categoryId: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteDocCategory(categoryId);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function createSiteDocAction(input: SiteDocInput) {
  await assertSystemAdminAccess();

  const result = await createSiteDoc(input);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function updateSiteDocAction(docId: string, input: SiteDocInput) {
  await assertSystemAdminAccess();

  const result = await updateSiteDoc(docId, input);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function deleteSiteDocAction(docId: string) {
  await assertSystemAdminAccess();

  const result = await deleteSiteDoc(docId);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}

export async function reorderSiteDocsAction(items: SiteDocReorderItem[]) {
  await assertSystemAdminAccess();

  const result = await reorderSiteDocs(items);
  if (result.ok) {
    revalidateSiteDocs();
  }

  return result;
}
