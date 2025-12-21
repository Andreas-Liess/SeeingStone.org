/**
 * NavigationTracker - Tracks entry page, journey, and referrer
 */
export class NavigationTracker {
  constructor() {
    this.storageKey = 'lv_journey';
    this.currentPage = this.getPageName();
    this.referrer = document.referrer;
  }

  init() {
    try {
      // Get existing journey from sessionStorage
      let journeyData = this.getJourneyData();

      // If no journey exists, initialize it
      if (!journeyData) {
        journeyData = {
          entryPage: this.currentPage,
          journey: [this.currentPage],
          referrer: this.extractDomain(this.referrer),
          timestamp: Date.now()
        };
      } else {
        // Add current page to journey if it's different from the last page
        const lastPage = journeyData.journey[journeyData.journey.length - 1];
        if (lastPage !== this.currentPage) {
          journeyData.journey.push(this.currentPage);
        }
      }

      // Save updated journey
      this.saveJourneyData(journeyData);
    } catch (error) {
      console.warn('NavigationTracker init failed:', error);
    }
  }

  getPageName() {
    const path = window.location.pathname;

    // For URLs like /pages/signup/index.html, extract the meaningful part
    const parts = path.split('/').filter(p => p);

    if (parts.length === 0) {
      return 'index.html';
    }

    // If it's a direct page like /index.html
    if (parts.length === 1) {
      return parts[0] === '' ? 'index.html' : parts[0];
    }

    // For nested pages like /pages/signup/index.html, return 'signup/index.html'
    // Get the last two parts (e.g., 'signup' and 'index.html')
    return parts.slice(-2).join('/');
  }

  extractDomain(url) {
    if (!url) return 'Direct';

    try {
      const urlObj = new URL(url);
      // Remove www. prefix if present
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      return 'Unknown';
    }
  }

  getJourneyData() {
    try {
      const data = sessionStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveJourneyData(data) {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save journey data:', error);
    }
  }

  formatJourney(journey) {
    const pageNames = {
      'index.html': 'Home',
      'signup/index.html': 'Signup',
      'features/index.html': 'Features',
      'security/index.html': 'Security'
    };

    return journey
      .map(page => pageNames[page] || page)
      .join(' → ');
  }

  getData() {
    try {
      const journeyData = this.getJourneyData();

      if (!journeyData) {
        return {
          entryPage: this.currentPage,
          journey: [this.currentPage],
          journeyFormatted: this.formatJourney([this.currentPage]),
          referrer: this.extractDomain(this.referrer)
        };
      }

      return {
        entryPage: journeyData.entryPage,
        journey: journeyData.journey,
        journeyFormatted: this.formatJourney(journeyData.journey),
        referrer: journeyData.referrer
      };
    } catch (error) {
      console.warn('NavigationTracker getData failed:', error);
      return {
        entryPage: 'Unknown',
        journey: [],
        journeyFormatted: 'Unknown',
        referrer: 'Unknown'
      };
    }
  }
}
