import { Purchases } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { useGameStore } from './useGameStore';

const REVENUECAT_API_KEY = 'goog_ilUuneDhvObGFqiHtCgOrTguMrz';
const ENTITLEMENT_ID = 'Maneja Pro'; // ← un solo lugar, consistente con RevenueCat dashboard

function isNative() {
  return Capacitor.getPlatform() === 'android';
}

// Guard para no llamar configure() más de una vez
let _configured = false;

async function ensureConfigured() {
  if (_configured) return;
  console.log('🔧 RevenueCat: configurando...');
  await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  _configured = true;
  console.log('✅ RevenueCat: configurado');
}

/**
 * Verifica si el usuario tiene premium activo.
 * Llama configure() si no se hizo todavía.
 */
export async function checkPremiumStatus() {
  if (!isNative()) return false;
  try {
    await ensureConfigured();
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    useGameStore.getState().setIsPremium(isPremium);
    console.log(`💎 Premium status: ${isPremium}`);
    return isPremium;
  } catch (e) {
    console.error('❌ checkPremiumStatus error:', e);
    return false;
  }
}

/**
 * Obtiene los offerings disponibles de RevenueCat.
 * Retorna null si no hay offerings o si no es plataforma nativa.
 */
export async function getOfferings() {
  if (!isNative()) return null;
  try {
    await ensureConfigured();
    const offerings = await Purchases.getOfferings();
    console.log('📦 Offerings raw:', JSON.stringify(offerings?.current?.availablePackages?.map(p => p.identifier)));

    if (offerings.current !== null && offerings.current.availablePackages.length > 0) {
      return {
        availablePackages: offerings.current.availablePackages.map(pkg => ({
          productId: pkg.product.identifier,
          title: pkg.product.title,
          priceString: pkg.product.priceString,
          _raw: pkg // objeto Package nativo de RevenueCat, requerido por purchasePackage
        }))
      };
    }

    console.warn('⚠️ No hay packages en el offering actual de RevenueCat');
    return null;
  } catch (e) {
    console.error('❌ getOfferings error:', e);
    return null;
  }
}

/**
 * Inicia el flujo de compra de Google Play para el package dado.
 * pkg debe venir de getOfferings() (tiene la propiedad _raw).
 */
export async function purchasePro(pkg) {
  if (!isNative()) return false;
  try {
    await ensureConfigured();
    console.log('💳 Iniciando compra:', pkg.productId);

    // IMPORTANTE: purchases-capacitor espera { aPackage: ... }, no el package directo
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg._raw });

    const isPremium = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    console.log(`✅ Compra completada. isPremium: ${isPremium}`);

    if (isPremium) {
      useGameStore.getState().setIsPremium(true);
    }

    return isPremium;
  } catch (e) {
    if (e.userCancelled) {
      console.log('🚫 Usuario canceló la compra');
    } else {
      console.error('❌ purchasePro error:', e);
    }
    return false;
  }
}