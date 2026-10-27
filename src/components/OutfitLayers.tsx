import { findOutfit } from '../lib/outfits';

type OutfitLayersProps = {
  where: 'dress' | 'record';
  clothIds: string[];
  itemIds: string[];
};

export function OutfitLayers({ where, clothIds, itemIds }: OutfitLayersProps) {
  const ids = [...clothIds, ...itemIds].filter(Boolean);
  return (
    <>
      {ids.map((id) => {
        const outfit = findOutfit(id);
        if (!outfit) return null;
        const spot = where === 'dress' ? outfit.dress : outfit.record;
        return (
          <img
            key={id}
            className="outfit-layer"
            src={where === 'dress' ? outfit.dressSrc : outfit.recordSrc}
            alt=""
            draggable={false}
            style={{ left: `${spot.x}%`, top: `${spot.y}%`, width: `${spot.width}%` }}
          />
        );
      })}
    </>
  );
}
