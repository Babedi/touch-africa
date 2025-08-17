/**
 * Sample News Data Generator for NeighbourGuard™
 * Creates realistic news items for testing the news ticker
 * To be stored in Firebase path: /services/neighbourGuardService/news
 */

export const sampleNewsData = [
  {
    title: "🚨 Emergency Response System Enhanced with AI-Powered Detection",
    content:
      "Our latest update includes advanced AI algorithms that can detect emergency situations with 99.5% accuracy, reducing false alarms by 80%.",
    category: "system",
    priority: "high",
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    isActive: true,
    author: "NeighbourGuard™ Tech Team",
    url: "https://blog.neighbourguard.co.za/ai-emergency-detection",
  },
  {
    title: "🏢 New Multi-Tenant Dashboard Features Now Available",
    content:
      "Enhanced dashboard with real-time analytics, customizable widgets, and improved user management capabilities.",
    category: "feature",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isActive: true,
    author: "Product Team",
    url: null,
  },
  {
    title: "🔧 Scheduled Maintenance: October 15, 2025 (02:00 - 04:00 SAST)",
    content:
      "Brief maintenance window to upgrade our infrastructure for better performance and reliability.",
    category: "maintenance",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    isActive: true,
    author: "Operations Team",
    expiresAt: new Date("2025-10-16T00:00:00.000Z").toISOString(),
  },
  {
    title: "🎉 NeighbourGuard™ Wins 'Best Security Platform 2025' Award",
    content:
      "Recognized by the South African Security Association for excellence in emergency response technology.",
    category: "award",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isActive: true,
    author: "Communications Team",
    url: "https://neighbourguard.co.za/awards-2025",
  },
  {
    title: "📱 Mobile App Update: Enhanced Push Notifications",
    content:
      "New push notification system ensures you never miss critical alerts, even in low connectivity areas.",
    category: "mobile",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    isActive: true,
    author: "Mobile Team",
  },
  {
    title: "🛡️ Security Update: Two-Factor Authentication Now Mandatory",
    content:
      "Enhanced security measures: All users must enable 2FA by November 1st, 2025 for continued access.",
    category: "security",
    priority: "high",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    isActive: true,
    author: "Security Team",
    url: "https://help.neighbourguard.co.za/2fa-setup",
  },
  {
    title: "🌍 Expanding to New Regions: Durban & Cape Town Coverage",
    content:
      "NeighbourGuard™ service now available in Durban and Cape Town with dedicated response teams.",
    category: "expansion",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    isActive: true,
    author: "Business Development",
  },
  {
    title: "📊 Monthly Statistics: 15,000+ Emergencies Handled Successfully",
    content:
      "September 2025 highlights: 99.8% response rate, average response time of 2.3 minutes.",
    category: "statistics",
    priority: "low",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week ago
    isActive: true,
    author: "Analytics Team",
  },
  {
    title: "🤝 Partnership with Emergency Medical Services Strengthened",
    content:
      "New protocols established with national EMS providers for faster medical emergency response.",
    category: "partnership",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    isActive: true,
    author: "Partnerships Team",
  },
  {
    title: "🔄 API v2.0 Released with Enhanced Integration Capabilities",
    content:
      "New REST API version with better documentation, webhook support, and improved rate limiting.",
    category: "api",
    priority: "normal",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 weeks ago
    isActive: true,
    author: "API Team",
    url: "https://developers.neighbourguard.co.za/v2",
  },
];

/**
 * Firestore News Document Structure:
 *
 * /services/neighbourGuardService/news/{newsId}
 * {
 *   title: string,
 *   content: string,
 *   category: string ('system', 'feature', 'maintenance', 'security', 'expansion', etc.),
 *   priority: string ('high', 'normal', 'low'),
 *   publishedAt: timestamp (ISO string),
 *   isActive: boolean,
 *   author: string,
 *   url?: string (optional external link),
 *   expiresAt?: timestamp (optional expiration date)
 * }
 */

// Helper function to create Firestore-compatible data
export function createFirestoreNewsData() {
  return sampleNewsData.map((item, index) => ({
    id: `NEWS_${Date.now()}_${index.toString().padStart(3, "0")}`,
    ...item,
  }));
}

// Console output for easy copying to Firestore
console.log("=== Sample News Data for Firestore ===");
console.log("Path: /services/neighbourGuardService/news");
console.log("Documents:");
console.log(JSON.stringify(createFirestoreNewsData(), null, 2));
