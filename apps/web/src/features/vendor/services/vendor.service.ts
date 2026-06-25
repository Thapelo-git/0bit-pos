import apiClient from "@/api/client";
import { endpoints } from "@/api/endpoints";

export interface VendorSignupData {
  email: string;
  password: string;
  businessName: string;
  phone: string;
  bankDetails: string;
  proofDocs: string;
  servicesOffered: string;
  locationText: string;
}

export const vendorService = {
  async signup(data: VendorSignupData) {
    const { data: response } = await apiClient.post(endpoints.vendor.signup, data);
    return response;
  },
};
