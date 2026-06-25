import React from "react";
import Link from "next/link";
export default function DealsPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>All Deals</h1>
      <p>Browse deals on the home page for now.</p>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
