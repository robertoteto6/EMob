'use client';
export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthComponent from '../components/AuthComponent';
import { useFirestoreCollection, useFirestoreQuery } from '../hooks/useFirestore';
import { userProfileService, userPredictionService } from '../lib/firestore';

const FirebaseDemoPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'auth' | 'profile' | 'predictions'>('auth');
  
  // Hooks de Firestore
  const {
    data: profiles,
    import { notFound } from 'next/navigation';

    export const dynamic = 'error';

    export default function FirebaseDemoPage() {
      notFound();
    }
          <h3 className="text-xl font-bold text-green-400 mb-4">🚀 Características Implementadas</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-2">Firebase Authentication</h4>
              <ul className="text-gray-300 space-y-1">
                <li>✅ Registro de usuarios</li>
                <li>✅ Inicio de sesión</li>
                <li>✅ Cierre de sesión</li>
                <li>✅ Estado de autenticación reactivo</li>
                <li>✅ Manejo de errores</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-300 mb-2">Firestore Database</h4>
              <ul className="text-gray-300 space-y-1">
                <li>✅ Operaciones CRUD</li>
                <li>✅ Actualizaciones en tiempo real</li>
                <li>✅ Consultas personalizadas</li>
                <li>✅ Hooks React personalizados</li>
                <li>✅ Servicio genérico reutilizable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirebaseDemoPage;
