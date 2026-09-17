import React, { useState } from 'react';
import {
  InventoryItem,
  EquippedItems,
  ItemRarity,
} from '../types';
import {
  X,
  ShieldAlert,
  Sword,
  Sparkles,
  FlaskConical,
  Package,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  equippedItems: EquippedItems;
  onEquip: (item: InventoryItem) => void;
  onUnequip: (slot: 'weapon' | 'summonRelic') => void;
  onUseItem: (item: InventoryItem) => void;
}

const getRarityBadge = (rarity: ItemRarity) => {
  switch (rarity) {
    case 'comum':
      return {
        label: 'Comum',
        border: 'border-emerald-500/60',
        bg: 'bg-emerald-950/40 text-emerald-300',
        glow: 'shadow-emerald-900/30',
      };
    case 'incomum':
      return {
        label: 'Incomum',
        border: 'border-sky-500/60',
        bg: 'bg-sky-950/40 text-sky-300',
        glow: 'shadow-sky-900/30',
      };
    case 'raro':
      return {
        label: 'Raro',
        border: 'border-amber-500/60',
        bg: 'bg-amber-950/40 text-amber-300',
        glow: 'shadow-amber-900/40',
      };
    case 'lendario':
      return {
        label: 'Lendário',
        border: 'border-purple-500/80',
        bg: 'bg-purple-950/50 text-purple-300',
        glow: 'shadow-purple-900/50',
      };
  }
};

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  equippedItems,
  onEquip,
  onUnequip,
  onUseItem,
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  if (!isOpen) return null;

  // Selected item fallback to first item if null
  const currentItem = selectedItem || (inventory.length > 0 ? inventory[0] : null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-950/95 border-2 border-amber-500/70 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto font-sans">
        {/* Close Button */}
        <button
          id="close-inventory-modal-btn"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 pb-3 border-b border-amber-500/30">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-300 font-serif font-bold text-xl">
            囊
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-200 font-serif tracking-wide">
              Bolsa de Itens & Relíquias Espirituais
            </h2>
            <p className="text-xs text-slate-400">
              Gerencie equipamentos do Invocador, relíquias de invocações e poções medicinais
            </p>
          </div>
        </div>

        {/* Content Layout: Left = Equipped Slots, Center = Bag Grid, Right = Item Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Column 1: Equipped Slots (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Equipamentos Ativos
            </h3>

            {/* Slot 1: Weapon */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5 text-sky-400" /> Arma do Invocador
                </span>
                {equippedItems.weapon && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                    Equipado
                  </span>
                )}
              </div>

              {equippedItems.weapon ? (
                <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-sky-500/40">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-sky-900/30 border border-sky-400 flex items-center justify-center shrink-0">
                      <Sword className="w-5 h-5 text-sky-300" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-sky-200 truncate">
                        {equippedItems.weapon.name}
                      </h4>
                      <p className="text-[10px] text-emerald-400 font-mono">
                        {equippedItems.weapon.effectText}
                      </p>
                    </div>
                  </div>
                  <button
                    id="unequip-weapon-btn"
                    onClick={() => onUnequip('weapon')}
                    className="text-[10px] px-2 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 rounded-lg text-red-200 transition"
                  >
                    Desequipar
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                  Nenhuma arma celestial equipada
                </div>
              )}
            </div>

            {/* Slot 2: Summon Relic */}
            <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Relíquia dos Summons
                </span>
                {equippedItems.summonRelic && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Equipado
                  </span>
                )}
              </div>

              {equippedItems.summonRelic ? (
                <div className="flex items-center justify-between gap-2 bg-slate-950/60 p-2 rounded-xl border border-amber-500/40">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-amber-900/30 border border-amber-400 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-amber-200 truncate">
                        {equippedItems.summonRelic.name}
                      </h4>
                      <p className="text-[10px] text-amber-300 font-mono">
                        {equippedItems.summonRelic.effectText}
                      </p>
                    </div>
                  </div>
                  <button
                    id="unequip-relic-btn"
                    onClick={() => onUnequip('summonRelic')}
                    className="text-[10px] px-2 py-1 bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 rounded-lg text-red-200 transition"
                  >
                    Desequipar
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                  Nenhuma relíquia equipada nas invocações
                </div>
              )}
            </div>

            {/* Quick Info Box */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-3 text-[11px] text-amber-200/90 leading-relaxed">
              💡 <strong>Dica do Invocador:</strong> Derrote monstros para obter espólios celestiais! Pressione <strong>[Q]</strong> a qualquer momento para beber uma Poção de Cura rapidamente durante a luta.
            </div>
          </div>

          {/* Column 2: Inventory Grid (4 cols) */}
          <div className="md:col-span-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Mochila ({inventory.length} itens)
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-900/50 border border-slate-800 p-2.5 rounded-2xl min-h-[220px]">
              {inventory.map((item) => {
                const rarityInfo = getRarityBadge(item.rarity);
                const isSelected = currentItem?.id === item.id;
                const isEquipped =
                  equippedItems.weapon?.id === item.id ||
                  equippedItems.summonRelic?.id === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-950/40 shadow-md ring-1 ring-amber-400'
                        : `${rarityInfo.border} bg-slate-950/80 hover:bg-slate-800`
                    }`}
                  >
                    {item.type === 'consumable' ? (
                      <FlaskConical className="w-6 h-6 text-emerald-400" />
                    ) : item.type === 'weapon' ? (
                      <Sword className="w-6 h-6 text-sky-400" />
                    ) : (
                      <ShieldAlert className="w-6 h-6 text-amber-400" />
                    )}

                    <span className="text-[10px] font-bold text-slate-200 mt-1 truncate max-w-[70px] text-center">
                      {item.name}
                    </span>

                    {/* Quantity badge for consumables */}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 bg-slate-900/90 border border-slate-700 text-amber-300 text-[9px] font-mono px-1 rounded-full font-bold">
                        x{item.quantity}
                      </span>
                    )}

                    {/* Equipped check icon */}
                    {isEquipped && (
                      <span className="absolute top-1 right-1 text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Empty placeholder slots */}
              {Array.from({ length: Math.max(0, 9 - inventory.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/30 min-h-[64px]"
                >
                  <span className="text-[10px] text-slate-700 font-mono">-</span>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Selected Item Details & Actions (4 cols) */}
          <div className="md:col-span-4 bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between">
            {currentItem ? (
              (() => {
                const rarityInfo = getRarityBadge(currentItem.rarity);
                const isEquipped =
                  equippedItems.weapon?.id === currentItem.id ||
                  equippedItems.summonRelic?.id === currentItem.id;

                return (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
                      <div className={`w-12 h-12 rounded-xl ${rarityInfo.bg} border ${rarityInfo.border} flex items-center justify-center shrink-0`}>
                        {currentItem.type === 'consumable' ? (
                          <FlaskConical className="w-7 h-7 text-emerald-300" />
                        ) : currentItem.type === 'weapon' ? (
                          <Sword className="w-7 h-7 text-sky-300" />
                        ) : (
                          <ShieldAlert className="w-7 h-7 text-amber-300" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-amber-200">
                          {currentItem.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${rarityInfo.bg}`}>
                            {rarityInfo.label}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {currentItem.type === 'consumable'
                              ? 'Consumível'
                              : currentItem.type === 'weapon'
                              ? 'Arma Celestial'
                              : 'Relíquia Espiritual'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Effect Highlight */}
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                        Efeito Místico:
                      </span>
                      <p className="text-xs text-emerald-300 font-mono leading-relaxed">
                        {currentItem.effectText}
                      </p>
                    </div>

                    {/* Lore description */}
                    <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                      "{currentItem.description}"
                    </p>

                    {/* Action Button */}
                    <div className="mt-2">
                      {currentItem.type === 'consumable' ? (
                        <button
                          id="use-potion-btn"
                          onClick={() => {
                            onUseItem(currentItem);
                            soundManager.playPotionDrink();
                          }}
                          className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <FlaskConical className="w-4 h-4" /> Beber Poção (+350 HP)
                        </button>
                      ) : isEquipped ? (
                        <button
                          id="unequip-current-btn"
                          onClick={() => onUnequip(currentItem.type === 'weapon' ? 'weapon' : 'summonRelic')}
                          className="w-full py-2 bg-red-900/40 hover:bg-red-800/60 border border-red-500/60 text-red-200 font-bold rounded-xl text-xs transition shadow flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Desequipar Item
                        </button>
                      ) : (
                        <button
                          id="equip-item-btn"
                          onClick={() => {
                            onEquip(currentItem);
                            soundManager.playItemPickup();
                          }}
                          className="w-full py-2 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Equipar Item
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center p-4">
                <Package className="w-8 h-8 mb-2 opacity-40" />
                Selecione um item da mochila para inspecionar seus poderes e raridade.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition"
          >
            Fechar Mochila
          </button>
        </div>
      </div>
    </div>
  );
};
