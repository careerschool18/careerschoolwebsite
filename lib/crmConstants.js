/**
 * Shared CRM dashboard constants: lead table columns, status options and filter field defs.
 * Status options mirror the backend's CourseFormService.STATUS_OPTIONS so the UI only offers
 * values the server accepts.
 */

/** Status choices offered by the Status column / filter (kept in sync with the backend list). */
export const STATUS_OPTIONS = [
  "Invited",
  "Concern",
  "Drop",
  "Duplicate",
  "Enrolled",
  "Feedback Pending",
  "Hot Lead",
  "In Interview Process",
  "Interview Drop",
  "Joined",
  "Joined & Drop",
  "Not Interested",
  "Profile on Hold",
  "Rejected",
  "Rescheduled",
  "Scheduled",
  "Select",
  "Select & Drop",
  "Workshop",
  "Yet To Join",
  "Follow Up",
  "Future Lead",
  "RNR",
  "Walk-In",
  "Warm Lead",
];

/** Channel values stored by the backend (mirrors CourseFormService / CrmLeadService). */
export const CHANNEL_OPTIONS = ["Pop-up form", "Training-enquiry-form", "Manual-Add"];

/** Training-mode values stored by the backend enum (ONLINE / OFFLINE). */
export const TRAINING_MODE_OPTIONS = ["ONLINE", "OFFLINE"];

/**
 * Experience options — kept identical to /training-enquiry-form so the CRM Add form
 * stores the same enum values the backend accepts (FRESHER, ONE_TO_TWO, ...).
 */
export const EXPERIENCE_OPTIONS = [
  { label: "Fresher", value: "FRESHER" },
  { label: "6 Months - 1 Year", value: "ONE_TO_TWO" },
  { label: "1 Year - 3 Years", value: "ONE_TO_THREE" },
  { label: "3 Years - 5 Years", value: "THREE_TO_FIVE" },
  { label: "5+ Years", value: "FIVE_PLUS" },
];

/** Source options — kept identical to /training-enquiry-form. */
export const SOURCE_OPTIONS = [
  { label: "WhatsApp", value: "WHATSAPP" },
  { label: "Google", value: "GOOGLE" },
  { label: "Referral", value: "REFERRAL" },
  { label: "LinkedIn", value: "LINKEDIN" },
  { label: "Facebook", value: "FACEBOOK" },
  { label: "Instagram", value: "INSTAGRAM" },
  { label: "YouTube", value: "YOUTUBE" },
];

/**
 * Lead table columns. `key` maps to a CrmLeadDto field; `filter` marks columns that get a
 * filter input. The Assign / Actions (delete) columns are appended by the panel based on role.
 */
export const LEAD_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "channel", label: "Channel" },
  { key: "createdAt", label: "Follow Up Time" },
  { key: "fullName", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "whatsappNumber", label: "Mobile" },
  { key: "countryCode", label: "Country Code" },
  { key: "enquiryType", label: "Enquiry Type" },
  { key: "degree", label: "Degree" },
  { key: "collegeOrCompany", label: "College / Company" },
  { key: "specialization", label: "Specialization" },
  { key: "preferredRole", label: "Preferred Role" },
  { key: "state", label: "State" },
  { key: "city", label: "City" },
  { key: "experience", label: "Experience" },
  { key: "trainingMode", label: "Training Mode" },
  { key: "course", label: "Course" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "assignedToName", label: "Assigned To" },
  { key: "remarks", label: "Remarks" },
];

/** Format an ISO timestamp as "28 Sept 2026, 03:12 PM" (matches the applications page). */
export function formatTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}
