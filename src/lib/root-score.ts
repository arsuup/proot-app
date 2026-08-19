export type RootNutriments = {
  'energy-kcal_100g'?: number;
  sugars_100g?: number;
  fat_100g?: number;
  salt_100g?: number;
  proteins_100g?: number;
  fiber_100g?: number;
  additives_n?: number;
  'saturated-fat_100g'?: number;
};

export type RootVerdict = {
  score: number;
  title: string;
  message: string;
  color: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Root adore tout ce qui est sucré, gras et salé. Ce score est une parodie :
 * il ne mesure pas la qualité réelle d'un produit.
 */
export function getRootVerdict(
  nutriments?: RootNutriments,
  productName?: string
): RootVerdict {
  const product = productName ? `« ${productName} »` : 'ce produit';

  if (!nutriments) {
    return {
      score: 50,
      title: 'ROOT EST PERPLEXE',
      message: `Root ne trouve pas assez d'infos sur ${product}. Il le classe donc dans la catégorie « mystérieusement suspect ».`,
      color: '#f59e0b',
    };
  }

  const sugar = nutriments.sugars_100g ?? 0;
  const fat = nutriments.fat_100g ?? 0;
  const saturatedFat = nutriments['saturated-fat_100g'] ?? 0;
  const salt = nutriments.salt_100g ?? 0;
  const additives = nutriments.additives_n ?? 0;

  const score = clamp(
    Math.round(sugar * 4 + fat * 1.4 + saturatedFat * 3 + salt * 12 + additives * 5),
    0,
    100
  );

  if (score >= 80) {
    return {
      score,
      title: 'ROOT APPROUVE',
      message: `${product} possède une énergie chaotique exceptionnelle. Root est très fier de ce niveau de désordre.`,
      color: '#ef4444',
    };
  }

  if (score >= 55) {
    return {
      score,
      title: 'ROOT EST INTRIGUÉ',
      message: `Pas encore assez chaotique pour Root, mais ${product} a clairement du potentiel.`,
      color: '#f59e0b',
    };
  }

  if (score >= 25) {
    return {
      score,
      title: 'ROOT HÉSITE',
      message: `Root soupçonne ${product} d'être presque raisonnable. Il ouvre une enquête immédiatement.`,
      color: '#decf4a',
    };
  }

  return {
    score,
    title: 'CATASTROPHE POUR ROOT',
    message: `${product} contient beaucoup trop de calme et de dignité. Root refuse de cautionner ça.`,
    color: '#22c55e',
  };
}
