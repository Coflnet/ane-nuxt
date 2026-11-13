/** Clothing vectors are only indexed when extraction identifies a garment type. */
export function hasClothingStyleReference(product: { attributes?: Record<string, unknown> | null } | null | undefined): boolean {
  const garment = product?.attributes?.garment_type
  return typeof garment === 'string' && !!garment.trim() && !/^(unknown|unspecific|unspecified|none|null|n\/a|-)$/i.test(garment.trim())
}
