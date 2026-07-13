import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Analytics } from "@vercel/analytics/react";
import { LazyMotion, domAnimation } from 'framer-motion';

import App from './App.jsx';
import './index.css';
import { useGameStore } from './useGameStore';

async function initApp() {
  // 1. Reset de store para pruebas (opcional mediante env)
  if (import.meta.env.VITE_FORCE_PREMIUM === "true") {
    localStorage.removeItem("maneja-game-store");
    console.log("🛠️ Modo Dev: Store limpiado.");
  }

  const container = document.getElementById('root');
  const root = createRoot(container);

  try {
    const platform = Capacitor.getPlatform();

    if (platform === 'android') {
      // Forzar LOG_LEVEL.DEBUG solo si estamos en modo desarrollo
      if (import.meta.env.DEV) {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      }

      // IMPORTANTE: Asegúrate de que esta sea la clave goog_...
      // Si la versión anterior falló, es porque npx cap copy no se ejecutó.
      await Purchases.configure({ 
        apiKey: "goog_ilUuneDhvObGFqiHtCgOrTguMrz" 
      });

      // Sincronizar estado premium
      const customerInfo = await Purchases.getCustomerInfo();
      const isPremium = typeof customerInfo.entitlements.active['Maneja Pro'] !== "undefined";
      
      useGameStore.getState().setIsPremium(isPremium);
      console.log(`💎 Estado Premium inicial: ${isPremium}`);
    }
  } catch (error) {
    console.error('⚠️ RevenueCat Init Error:', error);
    // En caso de error, el store mantiene su valor por defecto (false)
  } finally {
    root.render(
      <StrictMode>
        <LazyMotion features={domAnimation}>
          <App />
        </LazyMotion>
        <Analytics />
      </StrictMode>
    );
  }
}

initApp();