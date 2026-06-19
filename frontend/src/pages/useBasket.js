import { useState } from 'react';

function loadBasket(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function saveBasket(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * useBasket — persistent basket state for a single entity type.
 *
 * @param {string} storageKey  — localStorage key (e.g. 'orion_instBasket')
 * @param {string} idKey       — primary key field (e.g. 'institution_id')
 * @param {string[]} pickFields — fields to store per item (e.g. ['institution_id','name','country','type'])
 * @returns {{ basket, addToBasket, addManyToBasket, removeFromBasket, clearBasket }}
 */
export default function useBasket(storageKey, idKey, pickFields) {
  const [basket, setBasketRaw] = useState(() => loadBasket(storageKey));

  const setBasket = updater => {
    setBasketRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveBasket(storageKey, next);
      return next;
    });
  };

  const addToBasket = row => {
    setBasket(prev => {
      if (prev.find(b => b[idKey] === row[idKey])) return prev;
      const item = Object.fromEntries(pickFields.map(f => [f, row[f] ?? null]));
      return [...prev, item];
    });
  };

  const addManyToBasket = rows => {
    setBasket(prev => {
      const existingIds = new Set(prev.map(b => b[idKey]));
      const newItems = rows
        .filter(r => !existingIds.has(r[idKey]))
        .map(r => Object.fromEntries(pickFields.map(f => [f, r[f] ?? null])));
      return newItems.length ? [...prev, ...newItems] : prev;
    });
  };

  const removeFromBasket = id => {
    setBasket(prev => prev.filter(b => b[idKey] !== id));
  };

  const clearBasket = () => {
    setBasket([]);
  };

  return { basket, addToBasket, addManyToBasket, removeFromBasket, clearBasket };
}
