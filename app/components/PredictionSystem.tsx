"use client";

import { useState, useEffect } from "react";

export interface Prediction {
  id: string;
  matchId: number;
  userId: string;
  predictedWinner: 'radiant' | 'dire';
  confidence: number;
  points?: number;
  createdAt: number;
  resolvedAt?: number;
  isCorrect?: boolean;
  matchTitle: string;
  game: string;
}

interface PredictionSystemProps {
  matchId: number;
  matchTitle: string;
  game: string;
  radiantTeam: string;
  direTeam: string;
  isFinished: boolean;
  actualWinner?: 'radiant' | 'dire' | null;
  startTime: number;
}

export default function PredictionSystem({
  matchId,
  matchTitle,
  game,
  radiantTeam,
  direTeam,
  isFinished,
  actualWinner,
  startTime
}: PredictionSystemProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [userPrediction, setUserPrediction] = useState<Prediction | null>(null);
  const [selectedWinner, setSelectedWinner] = useState<'radiant' | 'dire' | null>(null);
  const [confidence, setConfidence] = useState(50);
  const [showPredictionModal, setShowPredictionModal] = useState(false);

  const userId = "user-" + (localStorage.getItem('user-id') || Date.now().toString());

  useEffect(() => {
    if (!localStorage.getItem('user-id')) {
      localStorage.setItem('user-id', Date.now().toString());
    }
  }, []);

  useEffect(() => {
    // Cargar predicciones desde localStorage
    const saved = localStorage.getItem('match-predictions');
    if (saved) {
      try {
        const allPredictions = JSON.parse(saved);
        setPredictions(allPredictions);
        
        // Buscar predicción del usuario para este partido
        const existing = allPredictions.find((p: Prediction) => 
          p.matchId === matchId && p.userId === userId
        );
        setUserPrediction(existing || null);
      } catch (error) {
        console.error('Error loading predictions:', error);
      }
    }
  }, [matchId, userId]);

  useEffect(() => {
    // Guardar predicciones en localStorage
    localStorage.setItem('match-predictions', JSON.stringify(predictions));
  }, [predictions]);

  useEffect(() => {
    // Resolver predicciones cuando el partido termine
    if (isFinished && actualWinner && userPrediction && userPrediction.isCorrect === undefined) {
      const isCorrect = userPrediction.predictedWinner === actualWinner;
      const points = isCorrect ? Math.round(userPrediction.confidence / 10) : 0;
      
      setPredictions(prev => 
        prev.map(p => 
          p.id === userPrediction.id 
            ? { 
                ...p, 
                isCorrect, 
                points, 
                resolvedAt: Date.now() 
              }
            : p
        )
      );
    }
  }, [isFinished, actualWinner, userPrediction]);

  const canPredict = () => {
    const now = Date.now() / 1000;
    return !isFinished && !userPrediction && startTime > now;
  };

  const submitPrediction = () => {
    if (!selectedWinner || userPrediction) return;

    const newPrediction: Prediction = {
      id: `${matchId}-${userId}-${Date.now()}`,
      matchId,
      userId,
      predictedWinner: selectedWinner,
      confidence,
      createdAt: Date.now(),
      matchTitle,
      game
    };

    setPredictions(prev => [...prev, newPrediction]);
    setUserPrediction(newPrediction);
    setShowPredictionModal(false);
    setSelectedWinner(null);
    setConfidence(50);
  };

  const getPredictionStats = () => {
    const userPredictions = predictions.filter(p => p.userId === userId);
    const resolved = userPredictions.filter(p => p.isCorrect !== undefined);
    const correct = resolved.filter(p => p.isCorrect);
    const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);

    return {
      total: userPredictions.length,
      resolved: resolved.length,
      correct: correct.length,
      accuracy: resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : 0,
      points: totalPoints
    };
  };

  const stats = getPredictionStats();
  const now = Date.now() / 1000;
  const matchStarted = startTime <= now;

  return (
    <div className="space-y-3">
      {/* Prediction Status */}
      {userPrediction ? (
        <div className={`p-3 rounded-lg border ${
          userPrediction.isCorrect === true ? 'bg-green-900/30 border-green-500' :
          userPrediction.isCorrect === false ? 'bg-red-900/30 border-red-500' :
          'bg-blue-900/30 border-blue-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">Tu predicción:</span>
              <div className="text-lg font-bold text-white">
                {userPrediction.predictedWinner === 'radiant' ? radiantTeam : direTeam}
              </div>
              <div className="text-xs text-gray-400">
                Confianza: {userPrediction.confidence}%
              </div>
            </div>
            <div className="text-right">
              {userPrediction.isCorrect === true && (
                <div className="text-green-400 font-bold">
                  ✅ +{userPrediction.points} pts
                </div>
              )}
              {userPrediction.isCorrect === false && (
                <div className="text-red-400 font-bold">
                  ❌ 0 pts
                </div>
              )}
              {userPrediction.isCorrect === undefined && (
                <div className="text-blue-400">
                  ⏳ Pendiente
                </div>
              )}
            </div>
          </div>
        </div>
      ) : canPredict() ? (
        <button
          onClick={() => setShowPredictionModal(true)}
          className="w-full p-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all"
        >
          🎯 Hacer Predicción
        </button>
      ) : (
        <div className="p-3 bg-gray-800 rounded-lg text-center text-gray-400">
          {isFinished ? "Partido finalizado" : 
           matchStarted ? "El partido ya comenzó" : 
           "Las predicciones están cerradas"}
        </div>
      )}

      {/* User Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#1a1a1a] p-2 rounded text-center">
            <div className="text-blue-400 font-bold">{stats.total}</div>
            <div className="text-gray-400">Predicciones</div>
          </div>
          <div className="bg-[#1a1a1a] p-2 rounded text-center">
            <div className="text-green-400 font-bold">{stats.accuracy}%</div>
            <div className="text-gray-400">Precisión</div>
          </div>
          <div className="bg-[#1a1a1a] p-2 rounded text-center">
            <div className="text-yellow-400 font-bold">{stats.points}</div>
            <div className="text-gray-400">Puntos</div>
          </div>
          <div className="bg-[#1a1a1a] p-2 rounded text-center">
            <div className="text-purple-400 font-bold">{stats.correct}/{stats.resolved}</div>
            <div className="text-gray-400">Aciertos</div>
          </div>
        </div>
      )}

      {/* Prediction Modal */}
      {showPredictionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-[#1a1a1a] rounded-lg p-6 w-full max-w-md border border-[#333]">
            <h3 className="text-lg font-bold text-white mb-4">Hacer Predicción</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  ¿Quién ganará?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedWinner('radiant')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedWinner === 'radiant'
                        ? 'border-green-500 bg-green-900/30 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">{radiantTeam}</div>
                  </button>
                  <button
                    onClick={() => setSelectedWinner('dire')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedWinner === 'dire'
                        ? 'border-red-500 bg-red-900/30 text-white'
                        : 'border-gray-600 bg-gray-800 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">{direTeam}</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Nivel de confianza: {confidence}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Poca confianza (1-3 pts)</span>
                  <span>Mucha confianza (8-10 pts)</span>
                </div>
              </div>

              <div className="bg-[#111] p-3 rounded-lg">
                <div className="text-sm text-gray-300">
                  <strong>Puntos potenciales:</strong> {Math.round(confidence / 10)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Los puntos se otorgan solo si aciertas. Mayor confianza = más puntos.
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPredictionModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitPrediction}
                disabled={!selectedWinner}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Confirmar Predicción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para estadísticas globales de predicciones
export function usePredictionStats() {
  const [stats, setStats] = useState({
    totalPredictions: 0,
    correctPredictions: 0,
    totalPoints: 0,
    accuracy: 0,
    rank: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('match-predictions');
    if (saved) {
      try {
        const predictions: Prediction[] = JSON.parse(saved);
        const userId = "user-" + (localStorage.getItem('user-id') || '');
        const userPredictions = predictions.filter(p => p.userId === userId);
        const resolved = userPredictions.filter(p => p.isCorrect !== undefined);
        const correct = resolved.filter(p => p.isCorrect);
        const totalPoints = userPredictions.reduce((sum, p) => sum + (p.points || 0), 0);

        setStats({
          totalPredictions: userPredictions.length,
          correctPredictions: correct.length,
          totalPoints,
          accuracy: resolved.length > 0 ? Math.round((correct.length / resolved.length) * 100) : 0,
          rank: Math.floor(totalPoints / 10) + 1 // Rank simple basado en puntos
        });
      } catch (error) {
        console.error('Error calculating prediction stats:', error);
      }
    }
  }, []);

  return stats;
}
