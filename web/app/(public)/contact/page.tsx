import type { Metadata } from "next";
import ContactPage from "@/features/landing/contact/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us | Nesteeq Community & Apartment Management",
  description:
    "Get in touch with Nesteeq for residential community onboarding, management walkthroughs, billing inquiries, or technical support. Email us at nesteeq.dev@gmail.com.",
};

export default function Contact() {
  return <ContactPage />;
}
