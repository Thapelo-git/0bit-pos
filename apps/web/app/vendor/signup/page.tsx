"use client";

import React, { useState } from "react";
import { vendorService } from "@/features/vendor/services/vendor.service";

export default function VendorSignupPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    phone: "",
    bankDetails: "",
    proofDocs: "",
    servicesOffered: "",
    locationText: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: string, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const missing = [
      "email",
      "password",
      "businessName",
      "phone",
      "bankDetails",
      "proofDocs",
      "servicesOffered",
      "locationText",
    ].find((key) => !form[key as keyof typeof form]?.trim());

    if (missing) {
      setError("Please complete all fields before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);
      await vendorService.signup(form);
      setMessage("Vendor registration submitted. Your account is pending approval.");
      setForm({
        email: "",
        password: "",
        businessName: "",
        phone: "",
        bankDetails: "",
        proofDocs: "",
        servicesOffered: "",
        locationText: "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to submit vendor registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-bg, #f4f6f8)", padding: "40px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto", backgroundColor: "#ffffff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 24px 80px rgba(17,24,39,0.08)" }}>
        <div style={{ padding: "40px", backgroundColor: "var(--color-primary, #1B2B4B)", color: "#ffffff" }}>
          <h1 style={{ margin: 0, fontSize: "32px", lineHeight: 1.1 }}>Vendor Signup</h1>
          <p style={{ margin: "16px 0 0", maxWidth: "640px", color: "rgba(255,255,255,0.8)", fontSize: "16px" }}>
            Create your vendor account and submit your profile for approval. Once approved, you can list services and accept orders.
          </p>
        </div>
        <div style={{ padding: "32px", display: "grid", gap: "28px" }}>
          {message && (
            <div style={{ padding: "18px 20px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "16px", color: "#166534" }}>
              {message}
            </div>
          )}
          {error && (
            <div style={{ padding: "18px 20px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "16px", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "20px" }}>
            <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1fr 1fr" }}>
              <FormField label="Business name" value={form.businessName} onChange={(value) => handleChange("businessName", value)} placeholder="Your business name" />
              <FormField label="Email address" type="email" value={form.email} onChange={(value) => handleChange("email", value)} placeholder="you@business.com" />
              <FormField label="Phone number" value={form.phone} onChange={(value) => handleChange("phone", value)} placeholder="+27 123 456 789" />
              <FormField label="Account password" type="password" value={form.password} onChange={(value) => handleChange("password", value)} placeholder="Create a strong password" />
            </div>

            <FormField label="Location" value={form.locationText} onChange={(value) => handleChange("locationText", value)} placeholder="City, province or neighborhood" />
            <FormField label="Bank / ID details" value={form.bankDetails} onChange={(value) => handleChange("bankDetails", value)} placeholder="Account number, bank, or ID details" textarea />
            <FormField label="Services offered" value={form.servicesOffered} onChange={(value) => handleChange("servicesOffered", value)} placeholder="Describe the services you offer" textarea />
            <FormField label="Proof documents" value={form.proofDocs} onChange={(value) => handleChange("proofDocs", value)} placeholder="Upload or link to license / ID documents" textarea />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ color: "var(--color-text-muted, #667085)", fontSize: "14px" }}>
                All applications are reviewed manually. Approved vendors receive an email and can list services immediately.
              </div>
              <button type="submit" disabled={isSubmitting} style={{ minWidth: "180px", padding: "14px 20px", borderRadius: "14px", border: "none", backgroundColor: isSubmitting ? "#94a3b8" : "var(--color-primary, #1B2B4B)", color: "#ffffff", fontWeight: 700, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text", textarea = false }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label style={{ display: "grid", gap: "10px", fontSize: "14px", color: "var(--color-text-primary, #111)" }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--color-border, #d4d4d8)", padding: "14px", fontSize: "14px", color: "var(--color-text-primary, #111)", resize: "vertical" }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          style={{ width: "100%", borderRadius: "14px", border: "1px solid var(--color-border, #d4d4d8)", padding: "14px", fontSize: "14px", color: "var(--color-text-primary, #111)" }}
        />
      )}
    </label>
  );
}
