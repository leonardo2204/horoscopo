import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

// PostHog tracking utilities
export const useAnalytics = () => {
  const posthog = usePostHog();
  
  return {
    track: (eventName: string, properties?: Record<string, any>) => {
      if (posthog) {
        posthog.capture(eventName, properties);
      }
    },
    identify: (userId: string, properties?: Record<string, any>) => {
      if (posthog) {
        posthog.identify(userId, properties);
      }
    },
    setPersonProperties: (properties: Record<string, any>) => {
      if (posthog) {
        posthog.setPersonProperties(properties);
      }
    }
  };
};

// Page view tracking hook
export const usePageView = (pageName: string, properties?: Record<string, any>) => {
  const { track } = useAnalytics();
  
  useEffect(() => {
    track('page_viewed', {
      page: pageName,
      ...properties
    });
  }, [pageName, track]);
};

// Event tracking constants
export const ANALYTICS_EVENTS = {
  // Home page events
  HOME_PAGE_VIEWED: 'home_page_viewed',
  SIGN_CARD_CLICKED: 'sign_card_clicked',
  CTA_BUTTON_CLICKED: 'cta_button_clicked',
  
  // Horoscope page events
  HOROSCOPE_PAGE_VIEWED: 'horoscope_page_viewed',
  CATEGORY_CLICKED: 'category_clicked',
  SIGN_NAVIGATION_CLICKED: 'sign_navigation_clicked',
  
  // Interaction events
  SCROLL_TO_SECTION: 'scroll_to_section',
  ERROR_RETRY_CLICKED: 'error_retry_clicked',
  
  // Category events
  CATEGORY_SCROLL: 'category_scroll',
} as const;