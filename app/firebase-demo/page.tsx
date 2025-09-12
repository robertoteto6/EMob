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
    loading: profilesLoading,
    error: profilesError,
    create: createProfile
  } = useFirestoreCollection(userProfileService, true);

  const {
    data: predictions,
    loading: predictionsLoading,
    error: predictionsError,
    refetch: refetchPredictions,
  } = useFirestoreQuery(
    userPredictionService,
    'userId',
    '==',
    user?.uid ?? '',
    undefined,
    Boolean(user)
  );

  const handleCreateProfile = async () => {
    if (!user) return;
    
    try {
      await createProfile({
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
        favoriteTeams: ['team1', 'team2'],
        preferences: {
          notifications: true,
          theme: 'dark',
          language: 'es'
        }
      });
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleCreatePrediction = async () => {
    if (!user) return;
    
    try {
      await userPredictionService.create({
        userId: user.uid,
        matchId: 'match_' + Date.now(),
        prediction: {
          winner: 'Team A',
          score: '2-1',
          confidence: 0.8
        },
        points: 0,
        resolved: false
      });
      refetchPredictions();
    } catch (error) {
      console.error('Error creating prediction:', error);
    }
  };

  const TabButton: React.FC<{ tab: string; label: string; isActive: boolean }> = ({ tab, label, isActive }) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`px-4 py-2 rounded-t-lg font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-green-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-4">
            🔥 Firebase Demo - EMob
          </h1>
          <p className="text-gray-300 text-lg">
            Demostración completa de Firebase Authentication y Firestore
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <TabButton tab="auth" label="Autenticación" isActive={activeTab === 'auth'} />
          <TabButton tab="profile" label="Perfiles" isActive={activeTab === 'profile'} />
          <TabButton tab="predictions" label="Predicciones" isActive={activeTab === 'predictions'} />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          {/* Tab de Autenticación */}
          {activeTab === 'auth' && (
            <div>
              <h2 className="text-2xl font-bold text-green-400 mb-6">Autenticación Firebase</h2>
              <AuthComponent />
              
              {user && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-300 mb-2">Estado del Usuario:</h3>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    {JSON.stringify({
                      uid: user.uid,
                      email: user.email,
                      displayName: user.displayName,
                      emailVerified: user.emailVerified
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab de Perfiles */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-400">Perfiles de Usuario</h2>
                {user && (
                  <button
                    onClick={handleCreateProfile}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors duration-200"
                  >
                    Crear Perfil
                  </button>
                )}
              </div>

              {profilesLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  <span className="ml-2">Cargando perfiles...</span>
                </div>
              )}

              {profilesError && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                  Error: {profilesError}
                </div>
              )}

              <div className="grid gap-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-300">{profile.displayName}</h3>
                    <p className="text-gray-300">{profile.email}</p>
                    <p className="text-sm text-gray-400">Equipos favoritos: {profile.favoriteTeams.join(', ')}</p>
                    <p className="text-sm text-gray-400">Tema: {profile.preferences.theme}</p>
                  </div>
                ))}
              </div>

              {profiles.length === 0 && !profilesLoading && (
                <div className="text-center py-8 text-gray-400">
                  No hay perfiles creados aún.
                </div>
              )}
            </div>
          )}

          {/* Tab de Predicciones */}
          {activeTab === 'predictions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-green-400">Predicciones</h2>
                {user && (
                  <button
                    onClick={handleCreatePrediction}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors duration-200"
                  >
                    Crear Predicción
                  </button>
                )}
              </div>

              {predictionsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  <span className="ml-2">Cargando predicciones...</span>
                </div>
              )}

              {predictionsError && (
                <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                  Error: {predictionsError}
                </div>
              )}

              <div className="grid gap-4">
                {predictions.map((prediction) => (
                  <div key={prediction.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-blue-300">Match: {prediction.matchId}</h3>
                        <p className="text-gray-300">Ganador predicho: {prediction.prediction.winner}</p>
                        <p className="text-gray-300">Marcador: {prediction.prediction.score}</p>
                        <p className="text-sm text-gray-400">Confianza: {(prediction.prediction.confidence * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          prediction.resolved ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {prediction.resolved ? 'Resuelto' : 'Pendiente'}
                        </span>
                        <p className="text-sm text-gray-400 mt-1">Puntos: {prediction.points}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {predictions.length === 0 && !predictionsLoading && (
                <div className="text-center py-8 text-gray-400">
                  No hay predicciones creadas aún.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
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
