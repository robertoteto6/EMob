// Sistema de analytics y monitoreo para EMob
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';
export class Analytics {
  private static instance: Analytics;
  private initialized = false;

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Inicializar analytics
  init(config: { gtag?: string; hotjar?: string }) {
    if (this.initialized || typeof window === 'undefined') return;

    // Google Analytics 4
    if (config.gtag) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gtag}`;
      script.async = true;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer!.push(args);
      }
      gtag('js', new Date());
      gtag('config', config.gtag);
      
      (window as any).gtag = gtag;
    }

    // Hotjar (opcional)
    if (config.hotjar) {
      (function(h: any, o: any, t: any, j: any, a?: any, r?: any) {
        h.hj = h.hj || function(...args: any[]) { (h.hj.q = h.hj.q || []).push(args); };
        h._hjSettings = { hjid: config.hotjar, hjsv: 6 };
        a = o.getElementsByTagName('head')[0];
        r = o.createElement('script'); r.async = 1;
        r.src = t + h._hjSettings.hjid + j + h._hjSettings.hjsv;
        a.appendChild(r);
      })(window, document, 'https://static.hotjar.com/c/hotjar-', '.js?sv=');
    }

    this.initialized = true;
  }

  // Eventos personalizados
  track(eventName: string, parameters?: Record<string, any>) {
    if (typeof window === 'undefined' || !this.initialized) return;

    try {
      (window as any).gtag?.('event', eventName, {
        event_category: 'EMob',
        event_label: parameters?.label,
        value: parameters?.value,
        ...parameters
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  // Eventos específicos para esports
  trackMatchView(matchId: string, game: string) {
    this.track('match_view', {
      match_id: matchId,
      game_type: game,
      category: 'Match'
    });
  }

  trackTeamFollow(teamId: string, action: 'follow' | 'unfollow') {
    this.track('team_follow', {
      team_id: teamId,
      action,
      category: 'Team'
    });
  }

  trackPlayerView(playerId: string, game: string) {
    this.track('player_view', {
      player_id: playerId,
      game_type: game,
      category: 'Player'
    });
  }

  trackSearch(query: string, results: number, type: 'match' | 'team' | 'player') {
    this.track('search', {
      search_term: query,
      results_count: results,
      search_type: type,
      category: 'Search'
    });
  }

  trackNotificationClick(type: string) {
    this.track('notification_click', {
      notification_type: type,
      category: 'Notification'
    });
  }

  trackError(error: string, page: string) {
    this.track('error', {
      error_message: error,
      page_location: page,
      category: 'Error'
    });
  }

  // Web Vitals tracking
  trackWebVitals() {
    if (typeof window === 'undefined') return;

    try {
      onCLS((metric: Metric) => this.track('web_vital', { name: 'CLS', value: metric.value }));
      onINP((metric: Metric) => this.track('web_vital', { name: 'INP', value: metric.value }));
      onFCP((metric: Metric) => this.track('web_vital', { name: 'FCP', value: metric.value }));
      onLCP((metric: Metric) => this.track('web_vital', { name: 'LCP', value: metric.value }));
      onTTFB((metric: Metric) => this.track('web_vital', { name: 'TTFB', value: metric.value }));
    } catch (error) {
      console.error('Web vitals tracking error:', error);
    }
  }
}

// Hook de React para analytics
export const useAnalytics = () => {
  const analytics = Analytics.getInstance();

  return {
    trackMatchView: analytics.trackMatchView.bind(analytics),
    trackTeamFollow: analytics.trackTeamFollow.bind(analytics),
    trackPlayerView: analytics.trackPlayerView.bind(analytics),
    trackSearch: analytics.trackSearch.bind(analytics),
    trackNotificationClick: analytics.trackNotificationClick.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    track: analytics.track.bind(analytics)
  };
};

// Declaraciones para TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    hj?: (...args: any[]) => void;
  }
}
