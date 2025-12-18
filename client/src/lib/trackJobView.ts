/**
 * Utility for tracking job views with debouncing and source attribution
 */

export interface TrackJobViewParams {
  jobId: number;
  userId?: number;
}

/**
 * Generate a unique session ID for view tracking
 */
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('job_view_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('job_view_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Detect device type from user agent
 */
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Detect view source from referrer and URL parameters
 */
function getViewSource(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const utmSource = urlParams.get('utm_source');
  const ref = urlParams.get('ref');
  
  if (utmSource) {
    if (utmSource.includes('email')) return 'email';
    if (utmSource.includes('social')) return 'social';
    if (utmSource.includes('search')) return 'search';
    return utmSource;
  }
  
  if (ref) {
    return ref;
  }
  
  const referrer = document.referrer;
  if (!referrer || referrer.includes(window.location.hostname)) {
    return 'direct';
  }
  
  if (referrer.includes('google') || referrer.includes('bing') || referrer.includes('yahoo')) {
    return 'search';
  }
  
  if (referrer.includes('facebook') || referrer.includes('twitter') || referrer.includes('linkedin') || referrer.includes('instagram')) {
    return 'social';
  }
  
  return 'referral';
}

/**
 * Track a job view with the backend API
 * This function is debounced on the server side (5 minutes)
 */
export async function trackJobView(params: TrackJobViewParams, trpcClient: any): Promise<void> {
  try {
    const sessionId = getSessionId();
    const deviceType = getDeviceType();
    const source = getViewSource();
    const referrer = document.referrer || undefined;
    
    await trpcClient.job.trackJobView.mutate({
      jobId: params.jobId,
      userId: params.userId,
      sessionId,
      source,
      deviceType,
      referrer,
    });
  } catch (error) {
    // Silently fail - view tracking should not disrupt user experience
    console.error('Failed to track job view:', error);
  }
}
