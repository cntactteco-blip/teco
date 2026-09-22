type CategoryLike = { id?: string; slug: string; label?: string; labelRu?: string };

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const INTENTS: Record<string, string[]> = {
  kituri: ["kit", "kituri", "set", "seturi", "complet", "complete"],
  alarme: ["alarma", "alarme", "alarm"],
};

/** Leagă URL-urile istorice de categoriile redenumite din panoul de administrare. */
export function resolveCategorySlug(requested: string, categories: CategoryLike[], productCategories: string[]): string {
  if (requested === "all" || productCategories.includes(requested)) return requested;

  const exactCategory = categories.find((category) => category.slug === requested || category.id === requested);
  if (exactCategory) {
    const exactProductKey = [exactCategory.slug, exactCategory.id].find((key): key is string => !!key && productCategories.includes(key));
    if (exactProductKey) return exactProductKey;
  }

  const requestedWords = INTENTS[requested] ?? normalize(requested).split(" ").filter(Boolean);
  const category = categories.find((candidate) => {
    const haystack = normalize([candidate.id, candidate.slug, candidate.label, candidate.labelRu].filter(Boolean).join(" "));
    return requestedWords.some((word) => haystack.includes(normalize(word)));
  });
  if (!category) return requested;

  const directKey = [category.slug, category.id].find((key): key is string => !!key && productCategories.includes(key));
  if (directKey) return directKey;

  const categoryWords = normalize([category.slug, category.label].filter(Boolean).join(" ")).split(" ").filter(Boolean);
  return productCategories.find((productCategory) => {
    const normalized = normalize(productCategory);
    return categoryWords.some((word) => word.length >= 3 && normalized.includes(word));
  }) ?? category.slug;
}
