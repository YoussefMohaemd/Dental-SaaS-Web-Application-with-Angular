import {
  AiConversation,
  AiFaqTopic,
  AiQuickAction,
  AiShortcutAction,
} from "@core/interfaces";

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export const AI_WELCOME_MESSAGE =
  "Hello, I am your Dental AI Assistant. I can help with services, pricing, standards, reports, and order workflows.";

export const AI_FAQ_PROMPTS: Record<AiFaqTopic, string> = {
  company: "Tell me about the company.",
  services: "List available services.",
  pricing: "Show service pricing.",
  standards: "What submission standards are required?",
};

export const AI_QUICK_ACTIONS: readonly AiQuickAction[] = [
  {
    id: "qa-about-company",
    title: "About company",
    description: "See a short company overview.",
    intent: "aboutCompany",
    prompt: AI_FAQ_PROMPTS.company,
  },
  {
    id: "qa-service-catalog",
    title: "Services",
    description: "List all available service lines.",
    intent: "serviceCatalog",
    prompt: AI_FAQ_PROMPTS.services,
  },
  {
    id: "qa-service-pricing",
    title: "Pricing",
    description: "Get pricing guidance for services.",
    intent: "servicePricing",
    prompt: AI_FAQ_PROMPTS.pricing,
  },
  {
    id: "qa-submit-standards",
    title: "Submit standards",
    description: "Check required case submission standards.",
    intent: "submissionStandards",
    prompt: AI_FAQ_PROMPTS.standards,
  },
  {
    id: "qa-create-order",
    title: "Create order",
    description: "Start a new order workflow.",
    intent: "createOrder",
    prompt: "Create a draft for a zirconia crown order and include required fields.",
    requiredCapability: "orders.create",
  },
  {
    id: "qa-update-order",
    title: "Update order",
    description: "Prepare an order update request.",
    intent: "updateOrder",
    prompt: "Update order ORD-245 with a revised due date and restoration notes.",
    requiredCapability: "orders.update",
  },
  {
    id: "qa-create-report",
    title: "Create report",
    description: "Generate a weekly operations report.",
    intent: "generateReport",
    prompt: "Generate a weekly operations report for completion, delay, and revenue.",
    requiredCapability: "reports.read",
  },
  {
    id: "qa-view-reports",
    title: "View reports",
    description: "Open the reports area directly.",
    intent: "openReports",
    prompt: "Open reports",
    requiredCapability: "reports.read",
  },
  {
    id: "qa-search-orders",
    title: "Search orders",
    description: "Open orders and search cases.",
    intent: "searchOrders",
    prompt: "Search orders for delayed cases this week.",
    requiredCapability: "orders.read",
  },
  {
    id: "qa-search-patients",
    title: "Search patients",
    description: "Open patient records and search.",
    intent: "searchPatients",
    prompt: "Search patients with active crown orders.",
    requiredCapability: "patients.read",
  },
];

const ordersShortcut: AiShortcutAction = {
  id: "open-orders",
  title: "Open Orders",
  description: "Go to active orders to continue this task.",
  intent: "openOrders",
  badge: "Navigate",
};

const reportsShortcut: AiShortcutAction = {
  id: "open-reports",
  title: "Open Reports",
  description: "View throughput and turnaround metrics.",
  intent: "openReports",
  badge: "Navigate",
};

export function createInitialConversations(): AiConversation[] {
  return [
    {
      id: "conv-100",
      title: "Weekly operations report",
      updatedAt: minutesAgo(14),
      showWelcomeActions: false,
      messages: [
        {
          id: "conv-100-msg-1",
          role: "user",
          text: "I need a quick summary for this week performance.",
          createdAt: minutesAgo(16),
        },
        {
          id: "conv-100-msg-2",
          role: "assistant",
          text:
            "I can guide a weekly review. Open Reports to inspect completion rate, delay reasons, and team throughput.",
          createdAt: minutesAgo(15),
          actions: [reportsShortcut],
          markdown: true,
          canCopy: true,
        },
      ],
    },
    {
      id: "conv-101",
      title: "Service pricing help",
      updatedAt: minutesAgo(53),
      showWelcomeActions: false,
      messages: [
        {
          id: "conv-101-msg-1",
          role: "user",
          text: "Share pricing for crown and veneers.",
          createdAt: minutesAgo(55),
        },
        {
          id: "conv-101-msg-2",
          role: "assistant",
          text:
            "Sample pricing:\n- Crown: 120 USD\n- Bridge unit: 95 USD\n- Veneer: 85 USD\n- Implant abutment: 150 USD\n\nFinal billing follows lab policy and insurance rules.",
          createdAt: minutesAgo(53),
          markdown: true,
          canCopy: true,
          actions: [ordersShortcut],
        },
      ],
    },
  ];
}
