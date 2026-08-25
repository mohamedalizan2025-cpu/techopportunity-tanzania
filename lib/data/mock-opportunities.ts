import type { Opportunity } from "../types";

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "mock-001",
    slug: "mock-tanzania-ai-hackathon",
    title: "[MOCK] Tanzania AI Hackathon 2026",
    category: "hackathon",
    organization: "Example Innovation Hub",
    description:
      "Temporary placeholder used only to verify the UI while no database is connected.",
    url: "https://example.org/mock-ai-hackathon",
    deadline: "2026-10-31T23:59:00Z",
    location: "Dar es Salaam",
    imageUrl: null,
    status: "published",
    createdAt: "2026-08-25T00:00:00Z",
  },
  {
    id: "mock-002",
    slug: "mock-women-in-stem-scholarship",
    title: "[MOCK] Women in STEM Scholarship Fund",
    category: "scholarship",
    organization: "Example Foundation",
    description:
      "Temporary placeholder used only to verify the UI while no database is connected.",
    url: "https://example.org/mock-scholarship",
    deadline: "2026-09-30T23:59:00Z",
    location: "Remote",
    imageUrl: null,
    status: "published",
    createdAt: "2026-08-25T00:00:00Z",
  },
  {
    id: "mock-003",
    slug: "mock-open-source-internship",
    title: "[MOCK] Open Source Internship Programme",
    category: "internship",
    organization: "Example Software Ltd",
    description:
      "Temporary placeholder used only to verify the UI while no database is connected.",
    url: "https://example.org/mock-internship",
    deadline: null,
    location: "Dodoma",
    imageUrl: null,
    status: "published",
    createdAt: "2026-08-25T00:00:00Z",
  },
];
