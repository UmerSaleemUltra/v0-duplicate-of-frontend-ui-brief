"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { COUNTRY_DIAL_CODES } from "@/lib/country-dial-codes";
import { PhoneInput } from "@/components/checkout/phone-input";
import { Input } from "@/components/ui/input";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { authService } from "@/lib/auth";
import { packagePricing } from "@/lib/pricing";
import { STATE_FEES } from "@/lib/constants";
import {
  getCheckoutData,
  saveCheckoutData,
  clearCheckoutData,
  initCheckoutData,
  getSavedStep,
  saveCheckoutStep,
  clearCompletedOrderData,
  type CheckoutData,
} from "@/lib/checkout-storage";
const buzzFilingLogo = { url: "/images/buzz-filing-logo-white.png" };


type Member = {
  id: string;
  responsible: boolean;
  fullLegalName: string;
  homeAddress: string;
  city: string;
  stateProvince: string;
  country: string;
  zip: string;
  ssn: string;
  idFileName: string;
  idFile?: File | null;
};

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming",
];

const CATEGORIES = [
  "E-Commerce & Online Selling",
  "Amazon FBA",
  "Dropshipping",
  "Import & Export",
  "General Trading",
  "Wholesale & Distribution",
  "Technology & Software Development",
  "Mobile App Development",
  "Web Design & Development",
  "Graphic Design",
  "Digital Marketing",
  "Social Media Marketing",
  "SEO Services",
  "AI & Automation Services",
  "Business Consulting",
  "IT Consulting",
  "Accounting & Bookkeeping",
  "Virtual Assistant Services",
  "Data Entry Services",
  "Call Center & BPO Services",
  "Recruitment & Staffing",
  "Education & Online Coaching",
  "Medical Billing Services",
  "Healthcare Services",
  "Truck Dispatch Services",
  "Logistics & Transportation",
  "Real Estate Services",
  "Digitizing & Embroidery Services",
  "Content Creation & Media",
  "Other",
];

const COUNTRIES = COUNTRY_DIAL_CODES.map((c) => c.name);



function newMember(responsible = false): Member {
  return {
    id: Math.random().toString(36).slice(2),
    responsible,
    fullLegalName: "",
    homeAddress: "",
    city: "",
    stateProvince: "",
    country: "",
    zip: "",
    ssn: "",
    idFileName: "",
  };
}

export default function Page() {
  // Account
  const [fullName, setFullName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);

  // State & Package
  const [formationState, setFormationState] = useState("Wyoming");
  const [entityType, setEntityType] = useState<"LLC" | "C-Corp">("LLC");
  const [pkg, setPkg] = useState<"Starter" | "Advance">("Starter");

  // Business
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  // Members
  const [members, setMembers] = useState<Member[]>([newMember(true)]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"already" | "make">("already");
  const [whatsapp, setWhatsapp] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [visibleSsn, setVisibleSsn] = useState<Record<string, boolean>>({});

  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [hydrated, setHydrated] = useState(false);
  
  // API state
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [steps, setSteps] = useState<string[]>([]);




  // ── Hydrate from localStorage on mount ─────────────────────────────────────
  useEffect(() => {
    console.log("[v0] WA checkout: initialising localStorage...");
    initCheckoutData();
    const saved = getCheckoutData();
    console.log("[v0] WA checkout: loaded saved data →", saved);

    if (!saved) {
      console.log("[v0] WA checkout: no saved data found, starting fresh");
      setHydrated(true);
      return;
    }

    try {
      if (saved.account?.name)    setFullName(saved.account.name);
      if (saved.account?.phone)   setPhoneValue(saved.account.phone);
      if (saved.account?.email)   setEmail(saved.account.email);
      if (saved.state?.state)     setFormationState(saved.state.state);
      if (saved.state?.entityType) {
        // stored as "llc"/"s-corp" — normalise to "LLC"/"C-Corp"
        const et = saved.state.entityType.toUpperCase() as "LLC" | "C-Corp";
        setEntityType(et === "LLC" ? "LLC" : "C-Corp");
      }
      if (saved.state?.packageType) {
        const pt = saved.state.packageType;
        setPkg(pt === "advanced" ? "Advance" : "Starter");
      }
      if (saved.businessInfo?.businessName)        setBusinessName(saved.businessInfo.businessName);
      if (saved.businessInfo?.businessCategory)    setCategory(saved.businessInfo.businessCategory);
      if (saved.businessInfo?.businessDescription) setDescription(saved.businessInfo.businessDescription);
      if ((saved as any).website)                  setWebsite((saved as any).website);
      if (saved.payment?.method) {
        const m = saved.payment.method as "already" | "make";
        if (m === "already" || m === "make") setPaymentMethod(m);
      }
      if ((saved as any).whatsapp) setWhatsapp((saved as any).whatsapp);

      // Members
      const savedMembers = Array.isArray(saved.members) ? saved.members : [];
      if (savedMembers.length > 0) {
        setMembers(
          savedMembers.map((m: any) => ({
            id: m.id || Math.random().toString(36).slice(2),
            responsible: m.responsible ?? false,
            fullLegalName: m.fullLegalName || m.name || "",
            homeAddress: m.homeAddress || m.address || "",
            city: m.city || "",
            stateProvince: m.stateProvince || m.state || "",
            country: m.country || "",
            zip: m.zip || "",
            ssn: "",            // never persist SSN
            idFileName: m.idFileName || "",
            idFile: null,       // File objects can't be stored
          }))
        );
      }
      console.log("[v0] WA checkout: hydration complete");
    } catch (err) {
      console.error("[v0] WA checkout: hydration error →", err);
    }

    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist form state to localStorage on every change ─────────────────────
  useEffect(() => {
    if (!hydrated || submitted) return;

    const payload: Partial<CheckoutData> & { website?: string; whatsapp?: string } = {
      account: {
        name: fullName,
        phone: phoneValue,
        email: email,
      },
      state: {
        state: formationState,
        entityType: entityType.toLowerCase() as "llc" | "s-corp",
        packageType: (pkg === "Advance" ? "advanced" : "starter") as "starter" | "advanced",
      },
      businessInfo: {
        businessName,
        businessCategory: category,
        businessDescription: description,
      },
      website,
      whatsapp,
      payment: {
        method: paymentMethod,
        status: "pending",
      },
      members: members.map((m) => ({
        id: m.id,
        responsible: m.responsible,
        fullLegalName: m.fullLegalName,
        homeAddress: m.homeAddress,
        city: m.city,
        stateProvince: m.stateProvince,
        country: m.country,
        zip: m.zip,
        // ssn intentionally omitted
        idFileName: m.idFileName,
      })),
      status: "draft",
    };

    try {
      saveCheckoutData(payload as Partial<CheckoutData>);
      console.log("[v0] WA checkout: persisted to localStorage →", payload);
    } catch (err) {
      console.error("[v0] WA checkout: persist error →", err);
    }
  }, [
    hydrated, submitted,
    fullName, phoneValue, email,
    formationState, entityType, pkg,
    businessName, website, category, description,
    members, paymentMethod, whatsapp,
  ]);

  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) {
      window.location.href = "https://www.buzzfiling.com/login";
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, countdown]);





  const updateMember = (id: string, patch: Partial<Member>) => {
    setMembers((arr) => arr.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };
  const removeMember = (id: string) =>
    setMembers((arr) => (arr.length > 1 ? arr.filter((m) => m.id !== id) : arr));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!phoneValue) {
      e.phone = "Phone number is required";
    } else if (!isValidPhoneNumber(phoneValue)) {
      e.phone = "Enter a valid phone number";
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Valid email is required";
    if (password.length < 8) e.password = "Password must be at least 8 characters";
    if (!terms) e.terms = "You must accept the terms";
    if (!businessName.trim()) e.businessName = "Business name is required";
    if (description.trim().length < 20)
      e.description = "Description must be at least 20 characters";
    members.forEach((m, i) => {
      if (!m.fullLegalName.trim()) e[`m_${i}_name`] = "Required";
      if (!m.homeAddress.trim()) e[`m_${i}_addr`] = "Required";
      if (!m.city.trim()) e[`m_${i}_city`] = "Required";
      if (!m.zip.trim()) e[`m_${i}_zip`] = "Required";
      if (!m.idFileName) e[`m_${i}_id`] = "ID upload required";
    });
    if (!members.some((m) => m.responsible))
      e.members = "At least one Responsible Party is required";
    // "Already paid" → WhatsApp required, receipt optional
    if (paymentMethod === "already") {
      if (!whatsapp.trim()) {
        e.whatsapp = "WhatsApp number is required";
      } else {
        const wDigits = whatsapp.replace(/\D/g, "");
        if (!/^\+?[\d\s\-()]+$/.test(whatsapp.trim())) {
          e.whatsapp = "Enter a valid WhatsApp number";
        } else if (wDigits.length < 7 || wDigits.length > 15) {
          e.whatsapp = "WhatsApp number must be 7-15 digits";
        }
      }
    }
    // "Will make payment" → receipt required, WhatsApp optional (but validate if filled)
    if (paymentMethod === "make") {
      if (!receiptFileName) {
        e.receipt = "Please upload your payment receipt";
      }
      if (whatsapp.trim()) {
        const wDigits = whatsapp.replace(/\D/g, "");
        if (!/^\+?[\d\s\-()]+$/.test(whatsapp.trim())) {
          e.whatsapp = "Enter a valid WhatsApp number";
        } else if (wDigits.length < 7 || wDigits.length > 15) {
          e.whatsapp = "WhatsApp number must be 7-15 digits";
        }
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      const first = document.querySelector("[data-error='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setApiError(null);
    setCurrentStep(0);
    setSteps([
      "Initializing session",
      "Creating account",
      "Uploading documents",
      "Creating company & order",
      "Completing checkout",
    ]);

    console.log("[v0] WA checkout: submit started", { email, fullName, formationState, entityType, pkg, memberCount: members.length });

    try {
      // ── Step 1: Checkout token ────────────────────────────────────────────
      setCurrentStep(1);
      console.log("[v0] Step 1: requesting checkout token for email →", email);
      const tokenResponse = await fetch("/api/checkout/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!tokenResponse.ok) {
        const err = await tokenResponse.json();
        throw new Error(err.error || "Failed to initialize checkout session");
      }
      const { data: tokenData } = await tokenResponse.json();
      const checkoutTokenValue = tokenData.checkoutToken;
      setCheckoutToken(checkoutTokenValue);
      console.log("[v0] Step 1: checkout token received →", checkoutTokenValue);

      // ── Step 2: Signup / Login ────────────────────────────────────────────
      setCurrentStep(2);
      console.log("[v0] Step 2: checking existing auth session...");
      let currentToken: string | null = null;
      let resolvedUserId: string | null = null;

      // Check if user is already logged in
      const existingToken = authService.getToken();
      if (existingToken) {
        try {
          const meRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${existingToken}` },
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            const serverUserId = meData?.data?.id || meData?.id;
            if (serverUserId) {
              currentToken = existingToken;
              resolvedUserId = serverUserId;
              console.log("[v0] Step 2: reusing existing session for userId →", serverUserId);
            }
          }
        } catch {
          // ignore — fall through to signup
        }
      }

      if (!resolvedUserId || !currentToken) {
        console.log("[v0] Step 2: no existing session, attempting signup →", email);
        const signupResponse = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            name: fullName,
            phone: phoneValue,
            role: "client",
            checkoutToken: checkoutTokenValue,
          }),
        });
        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          if (
            signupData.error?.includes("already exists") ||
            signupData.error?.includes("already registered")
          ) {
            // Email exists — try login
            console.log("[v0] Step 2: email already exists, falling back to login →", email);
            const loginResponse = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email, password }),
            });
            const loginData = await loginResponse.json();
            if (!loginResponse.ok) {
              throw new Error(loginData.error || "Login failed. Check your password and try again.");
            }
            currentToken = loginData.data.token;
            resolvedUserId = loginData.data.user.id;
            authService.setAuth(currentToken!, loginData.data.user);
            if (typeof window !== "undefined") {
              localStorage.setItem("user_data", JSON.stringify(loginData.data.user));
              localStorage.setItem("user_id", loginData.data.user.id);
            }
            console.log("[v0] Step 2: login success, userId →", resolvedUserId);
          } else {
            throw new Error(signupData.error || "Account creation failed");
          }
        } else {
          currentToken = signupData.data.token;
          resolvedUserId = signupData.data.user.id;
          authService.setAuth(currentToken!, signupData.data.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("user_data", JSON.stringify(signupData.data.user));
            localStorage.setItem("user_id", signupData.data.user.id);
          }
          console.log("[v0] Step 2: signup success, userId →", resolvedUserId);
        }
      }

      setUserId(resolvedUserId);

      if (!resolvedUserId || !currentToken) {
        throw new Error("Authentication failed — userId or token missing.");
      }

      // ── Step 3: Upload passport per member ───────────────────────────────
      setCurrentStep(3);
      console.log("[v0] Step 3: uploading passports for", members.length, "member(s)");
      const updatedMembers = await Promise.all(
        members.map(async (m) => {
          if (!m.idFile) {
            console.log("[v0] Step 3: member", m.fullLegalName, "- no idFile, skipping upload");
            return { ...m, passportUrl: null, passportKey: null };
          }
          console.log("[v0] Step 3: uploading passport for member →", m.fullLegalName, "file →", m.idFile.name);
          const fd = new FormData();
          fd.append("file", m.idFile);
          fd.append("memberId", m.id);
          fd.append("userId", resolvedUserId!);
          const uploadRes = await fetch("/api/passports/upload", {
            method: "POST",
            headers: { Authorization: `Bearer ${currentToken}` },
            body: fd,
          });
          if (!uploadRes.ok) {
            const err = await uploadRes.json();
            throw new Error(err.error || `Passport upload failed for ${m.fullLegalName}`);
          }
          const { data: passportData } = await uploadRes.json();
          console.log("[v0] Step 3: passport uploaded for", m.fullLegalName, "→", passportData);
          return {
            ...m,
            passportUrl: passportData.fileUrl ?? passportData.url ?? null,
            passportKey: passportData.fileKey ?? passportData.key ?? m.idFileName,
          };
        })
      );

      // ── Step 4: Create company with embedded order ────────────────────────
      setCurrentStep(4);
      console.log("[v0] Step 4: building company payload", { businessName, entityType, formationState, pkg });
      // Normalize pkg → pricing key ("Starter"→"starter", "Advance"→"advanced")
      const packageKey = pkg === "Advance" ? "advanced" : "starter";
      const packagePrice = packagePricing[packageKey] ?? packagePricing.starter;
      const stateFilingFee = STATE_FEES[formationState] ?? 0;
      const totalAmount = packagePrice + stateFilingFee;
      const transactionId = `WHATSAPP-${Date.now()}`;

      // ── Upload receipt FIRST so its URL is saved on the order ─────────────
      let uploadedReceiptUrl: string | null = null;
      if (receiptFile) {
        console.log("[v0] Step 4: uploading receipt →", receiptFile.name);
        const rfd = new FormData();
        rfd.append("receipt", receiptFile); // API expects "receipt" key
        rfd.append("userId", resolvedUserId);
        const receiptRes = await fetch("/api/payment-receipt/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
          body: rfd,
        });
        if (!receiptRes.ok) {
          const err = await receiptRes.json().catch(() => ({}));
          console.error("[v0] Receipt upload failed →", err);
          toast({
            title: "Receipt upload failed",
            description: err.error || "Could not upload your receipt. Please try a different file.",
            variant: "destructive",
          });
        } else {
          const { data: rData } = await receiptRes.json();
          uploadedReceiptUrl = rData.url ?? rData.fileUrl ?? null;
          console.log("[v0] Step 4: receipt uploaded, url →", uploadedReceiptUrl);
        }
      }

      const companyPayload = {
        name: businessName,
        type: entityType,
        state: formationState,
        email,
        address: { street: "", city: "", state: formationState, zip: "" },
        businessCategory: category,
        businessDescription: description,
        businessWebsite: website,
        packageType: packageKey,
        members: updatedMembers.map((m) => ({
          id: m.id,
          // Display-layer aliases (MembersCard reads these)
          name: m.fullLegalName,
          address: m.homeAddress,
          state: m.stateProvince,
          isResponsiblePerson: m.responsible,
          responsiblePerson: m.responsible,
          // Original fields kept for API / DB
          responsible: m.responsible,
          fullLegalName: m.fullLegalName,
          homeAddress: m.homeAddress,
          city: m.city,
          stateProvince: m.stateProvince,
          country: m.country,
          zip: m.zip,
          ssn: m.ssn,
          passportUrl: (m as any).passportUrl ?? null,
          passportKey: (m as any).passportKey ?? null,
        })),
        status: "active",
        transactionReference: transactionId,
        purchasedAddons: [],
        userId: resolvedUserId,
        orderData: {
          orderType: `${entityType} Formation`,
          packageType: packageKey as "starter" | "advanced",
          state: formationState,
          status: "pending",
          packagePrice,
          stateFilingFee,
          addonsTotal: 0,
          subtotal: totalAmount,
          total: totalAmount,
          promoCode: null,
          referralSource: "whatsapp",
          selectedAddons: [],
          paymentMethod,
          paymentStatus: "pending",
          whatsappPhone: whatsapp || phoneValue,
          receiptUrl: uploadedReceiptUrl,
          transactionId,
          passportDocuments: updatedMembers
            .filter((m) => (m as any).passportUrl)
            .map((m) => ({
              id: Date.now().toString(),
              memberId: m.id,
              memberName: m.fullLegalName,
              fileName: (m as any).passportKey ?? m.idFileName,
              fileUrl: (m as any).passportUrl,
              fileType: "application/pdf",
              fileSize: 0,
              uploadedAt: new Date().toISOString(),
            })),
        },
      };

      const companyResponse = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(companyPayload),
      });
      const companyData = await companyResponse.json();
      console.log("[v0] Step 4: company API response →", companyData);
      if (!companyResponse.ok) {
        throw new Error(companyData.error || "Failed to create company");
      }
      const createdCompanyId = companyData.data?.id ?? null;
      setOrderId(createdCompanyId);
      console.log("[v0] Step 4: company created, id →", createdCompanyId);

      // Persist orderId to localStorage
      saveCheckoutData({ orderId: createdCompanyId, status: "completed" } as Partial<CheckoutData>);

      // ── Step 5: Complete ──────────────────────────────────────────────────
      setCurrentStep(5);
      clearCompletedOrderData();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("checkout-completed"));
      }
      // Clear all uploaded file states
      setReceiptFileName("");
      setReceiptFile(null);
      setMembers((prev) =>
        prev.map((m) => ({ ...m, idFileName: "", idFile: null }))
      );
      const receiptInput = document.getElementById("receipt-upload") as HTMLInputElement | null;
      if (receiptInput) receiptInput.value = "";
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred during checkout";
      console.error("[v0] WA checkout: submission error →", message, error);
      setApiError(message);
      toast({
        title: "Submission failed",
        description: message,
        variant: "destructive",
      });
      setSubmitting(false);
      setCurrentStep(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#ff0d13] to-[#880000] text-white">
        {/* Grid lines pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Glowing orbs */}
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle,oklch(1_0_0/0.25),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,oklch(0_0_0/0.35),transparent_70%)] blur-2xl" />
        {/* Diagonal shine */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, oklch(1 0 0) 0px, oklch(1 0 0) 1px, transparent 1px, transparent 14px)`,
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-4 sm:px-8 sm:pb-10 sm:pt-6">
          <img
            src={buzzFilingLogo.url}
            alt="Buzz Filing"
            className="-ml-2 sm:-ml-3 h-16 w-auto sm:h-20 md:h-24 drop-shadow-md"
          />

          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#ff0d13] backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Place Your Order
            </span>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Launch your US company in minutes
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">
              Simple, guided checkout. Your progress is auto-saved.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {submitted ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#ff0d13]/15 text-[#ff0d13]">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="mt-5 text-3xl font-bold text-foreground">Thank you!</h1>
            <p className="mt-2 text-muted-foreground">
              Your submission has been received successfully. Redirecting to your dashboard in {countdown} seconds...
            </p>
          </div>
        ) : (
          <div>
            {apiError && (
              <div className="mb-6 rounded-lg border border-[#ff0d13]/50 bg-[#ff0d13]/10 p-4 text-[#ff0d13]">
                <p className="font-medium">Error during checkout:</p>
                <p className="text-sm mt-1">{apiError}</p>
              </div>
            )}
            
            <form onSubmit={onSubmit} className="space-y-6" style={{ pointerEvents: submitting ? 'none' : 'auto', opacity: submitting ? 0.5 : 1 }}>







              {/* 1. Account */}
              <Section id="1" title="Create Your Account" subtitle="Set up your account to track your formation progress and manage your business.">
                <>
                  <Field label="Full Name" error={errors.fullName}>
                    <InputWrap icon={<User className="h-4 w-4" />}>
                      <input className={inputCls} placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                    </InputWrap>
                  </Field>

                  <Field label="Phone Number" error={errors.phone}>
                    <PhoneInput
                      defaultCountry="PK"
                      value={phoneValue}
                      onChange={(val) => setPhoneValue(val ?? "")}
                      placeholder="300 1234567"
                      className="h-11"
                    />
                    <p className="mt-1.5 text-xs text-slate-500">We&apos;ll use this to contact you about your order</p>
                  </Field>


                  <Field label="Email Address" error={errors.email}>
                    <InputWrap icon={<Mail className="h-4 w-4" />}>
                      <input type="email" className={inputCls} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </InputWrap>
                  </Field>

                  <Field label="Password" error={errors.password}>
                    <InputWrap icon={<Lock className="h-4 w-4" />} right={
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="cursor-pointer text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }>
                      <input type={showPassword ? "text" : "password"} className={inputCls} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                    </InputWrap>
                  </Field>
                </>

              </Section>

              {/* 2. State & Package */}
              <Section id="2" title="Formation Details" subtitle="Select your formation state and entity type.">
                <Field label="Formation State">
                  <Select value={formationState} onValueChange={setFormationState}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select a state" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <div>
                  <Label>Entity Type</Label>
                  <div className="mt-2 grid gap-3">
                    <EntityOption
                      selected={entityType === "LLC"}
                      onClick={() => setEntityType("LLC")}
                      title="LLC — Limited Liability Company"
                      badges={[{ label: "POPULAR", solid: true }, { label: "Cost-effective" }]}
                      features={[]}
                      bestFor="General purpose, consultants, e-commerce, agencies"
                    />
                    <EntityOption
                      selected={entityType === "C-Corp"}
                      onClick={() => setEntityType("C-Corp")}
                      title="C Corporation"
                      badges={[{ label: "Growth" }]}
                      features={[]}
                      bestFor="Startups seeking investment, businesses planning to go public"
                    />
                  </div>
                </div>

              </Section>

              {/* 3. Business */}
              <Section id="3" title="Business Information" subtitle="Tell us about your business. This information will appear on your formation documents.">
                <Field label="Business Name" error={errors.businessName}>
                  <InputWrap icon={<Building2 className="h-4 w-4" />}>
                    <input className={inputCls} placeholder="BS Tech Solutions LLC" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </InputWrap>
                  <Hint>Include LLC or Inc in business name</Hint>
                </Field>

                <Field label={<>Business Website <span className="text-muted-foreground font-normal">(Optional)</span></>}>
                  <InputWrap icon={<Globe className="h-4 w-4" />}>
                    <input className={inputCls} placeholder="www.example.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </InputWrap>
                  <Hint>Your business website or online presence</Hint>
                </Field>

                <Field label="Business Category">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={selectTriggerCls}>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Business Description" error={errors.description}>
                  <textarea rows={4} className={textareaCls} placeholder="Provide a brief overview of your business activities (minimum 20 characters)" value={description} onChange={(e) => setDescription(e.target.value)} />
                  <Hint>Provide a brief overview of your business activities (minimum 20 characters)</Hint>
                </Field>
              </Section>

              {/* 4. Members */}
              <Section id="4" title="Member Information" subtitle="Add all members or owners of the business. At least one must be designated as the Responsible Party.">
                {errors.members && <p className="text-sm text-[#ff0d13]">{errors.members}</p>}
                <div className="space-y-5">
                  {members.map((m, i) => (
                    <div key={m.id} className="rounded-xl p-0 sm:p-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">Member {i + 1}</h3>
                        {members.length > 1 && (
                          <button type="button" onClick={() => removeMember(m.id)} className="inline-flex cursor-pointer items-center gap-1 text-sm text-[#ff0d13] hover:underline">
                            <Trash2 className="h-4 w-4" /> Remove
                          </button>
                        )}
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-lg bg-[#ff0d13]/8 p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={m.responsible}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setMembers((arr) =>
                              arr.map((mm) => ({
                                ...mm,
                                responsible: mm.id === m.id ? checked : false,
                              }))
                            );
                          }}
                        />
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-slate-300 bg-white cursor-pointer transition-colors peer-checked:bg-[#ff0d13] peer-checked:border-[#ff0d13] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff0d13]/30">
                          {m.responsible && <Check className="h-3.5 w-3.5 text-white" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-foreground">Responsible Party / Authorized Person</span>
                          <span className="block text-sm text-muted-foreground">This person serves as the company's CEO and authorized representative.</span>
                        </span>
                      </label>

                      <div className="mt-5 grid gap-4">
                        <Field label="Full Legal Name" error={errors[`m_${i}_name`]}>
                          <InputWrap icon={<User className="h-4 w-4" />}>
                            <input className={inputCls} placeholder="Muhammad Ahmed Khan" value={m.fullLegalName} onChange={(e) => updateMember(m.id, { fullLegalName: e.target.value })} />
                          </InputWrap>
                        </Field>

                        <Field label="Home Address" error={errors[`m_${i}_addr`]}>
                          <InputWrap icon={<MapPin className="h-4 w-4" />}>
                            <input className={inputCls} placeholder="House 123, Street 4, F-7 Markaz" value={m.homeAddress} onChange={(e) => updateMember(m.id, { homeAddress: e.target.value })} />
                          </InputWrap>
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="City" error={errors[`m_${i}_city`]}>
                            <input className={inputCls} placeholder="Islamabad" value={m.city} onChange={(e) => updateMember(m.id, { city: e.target.value })} />
                          </Field>
                          <Field label="State / Province">
                            <input className={inputCls} placeholder="Punjab" value={m.stateProvince} onChange={(e) => updateMember(m.id, { stateProvince: e.target.value })} />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Country">
                            <MemberCountrySelect value={m.country} onChange={(v) => updateMember(m.id, { country: v })} />
                          </Field>
                          <Field label="ZIP Code" error={errors[`m_${i}_zip`]}>
                            <input className={inputCls} placeholder="44000" value={m.zip} onChange={(e) => updateMember(m.id, { zip: e.target.value })} />
                          </Field>
                        </div>

                        <Field label={<>SSN or ITIN <span className="text-muted-foreground font-normal">(optional)</span></>}>
                          <InputWrap
                            icon={<Shield className="h-4 w-4" />}
                            right={
                              <button
                                type="button"
                                onClick={() => setVisibleSsn((v) => ({ ...v, [m.id]: !v[m.id] }))}
                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                aria-label={visibleSsn[m.id] ? "Hide SSN/ITIN" : "Show SSN/ITIN"}
                              >
                                {visibleSsn[m.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            }
                          >
                            <input
                              type={visibleSsn[m.id] ? "text" : "password"}
                              className={inputCls}
                              placeholder="•••••••••"
                              value={m.ssn}
                              onChange={(e) => updateMember(m.id, { ssn: e.target.value })}
                            />
                          </InputWrap>
                          <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Your information is encrypted &amp; secure.</p>
                        </Field>

                        <Field label={<>Passport / National ID Card <span className="text-red-600">*</span></>} error={errors[`m_${i}_id`]}>
                          <div className="space-y-2">
                            <div className="relative">
                              <Upload className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                id={`passport-${m.id}`}
                                type="file"
                                accept="image/*,.pdf"
                                className="pl-10 h-11 cursor-pointer file:text-sm file:font-medium"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  updateMember(m.id, { idFileName: file.name, idFile: file });
                                }}
                              />
                            </div>
                            {m.idFileName && (
                              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                                <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-700">{truncateFileName(m.idFileName)}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateMember(m.id, { idFileName: "", idFile: null });
                                    const input = document.getElementById(`passport-${m.id}`) as HTMLInputElement;
                                    if (input) input.value = "";
                                  }}
                                  className="shrink-0 cursor-pointer text-red-500 hover:text-red-700"
                                  aria-label="Remove file"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMembers((arr) => [...arr, newMember(false)])}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#ff0d13]/40 bg-[#ff0d13]/5 py-3 text-sm font-semibold text-[#ff0d13] transition hover:border-[#ff0d13] hover:bg-[#ff0d13]/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Member
                </button>
              </Section>

              {/* 5. Payment */}
              <Section id="5" title="Payment Details" subtitle="Choose how you have paid or will pay for your order.">
                {/* Payment method toggle */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["already", "make"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all cursor-pointer ${
                        paymentMethod === method
                          ? "border-[#ff0d13] bg-[#ff0d13]/5"
                          : "border-slate-200 bg-white hover:border-[#ff0d13]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
                          paymentMethod === method ? "border-[#ff0d13] bg-[#ff0d13]" : "border-slate-300 bg-white"
                        }`}>
                          {paymentMethod === method && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">
                            {method === "already" ? "I already paid" : "I will make payment"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {method === "already"
                              ? "WhatsApp required, receipt optional"
                              : "Receipt required after bank transfer"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bank account details — shown only for "make payment" */}
                {paymentMethod === "make" && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#ff0d13]">
                        <Lock className="h-4 w-4 text-white" />
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Bank Account Details</p>
                        <p className="text-xs text-slate-500">Please use these details to complete your payment</p>
                      </div>
                    </div>
                    {[
                      { label: "Bank Name",       value: "United Bank Limited (UBL)" },
                      { label: "Account Title",   value: "BUZZ FILING" },
                      { label: "Account Number",  value: "1176314943776" },
                      { label: "IBAN",            value: "PK22UNIL0109000314943776" },
                    ].map((row, idx, arr) => (
                      <div
                        key={row.label}
                        className={`flex flex-col gap-0.5 px-4 py-3 bg-white ${idx < arr.length - 1 ? "border-b border-slate-100" : ""}`}
                      >
                        <span className="text-xs text-slate-500 uppercase tracking-wide">{row.label}</span>
                        <span className="break-all text-sm font-bold text-slate-900">{row.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* WhatsApp — required for "already paid", optional for "make payment" */}
                <Field
                  label={
                    <>
                      WhatsApp Number{" "}
                      {paymentMethod === "already"
                        ? <span className="text-[#ff0d13]">*</span>
                        : <span className="text-slate-400 font-normal text-xs">(optional)</span>}
                    </>
                  }
                  error={errors.whatsapp}
                >
                  <InputWrap icon={<MessageSquare className="h-4 w-4" />}>
                    <input
                      type="tel"
                      className={inputCls}
                      placeholder="+1 234 567 8900"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </InputWrap>
                  <Hint>
                    {paymentMethod === "already"
                      ? "We'll confirm your payment via this WhatsApp number"
                      : "Optional — we'll send updates to this number"}
                  </Hint>
                </Field>

                {/* Receipt — required for "make payment", optional for "already paid" */}
                <Field
                  label={
                    <>
                      Payment Receipt{" "}
                      {paymentMethod === "make"
                        ? <span className="text-[#ff0d13]">*</span>
                        : <span className="text-slate-400 font-normal text-xs">(optional)</span>}
                    </>
                  }
                  error={errors.receipt}
                >
                  <div className="space-y-2">
                    <div className="relative">
                      <Upload className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="receipt-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="pl-10 h-11 cursor-pointer file:text-sm file:font-medium"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setReceiptFileName(file.name);
                          setReceiptFile(file);
                        }}
                      />
                    </div>
                    {receiptFileName && (
                      <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-emerald-700">{truncateFileName(receiptFileName)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptFileName("");
                            setReceiptFile(null);
                            const input = document.getElementById("receipt-upload") as HTMLInputElement;
                            if (input) input.value = "";
                          }}
                          className="shrink-0 cursor-pointer text-[#ff0d13] hover:text-[#cc0000]"
                          aria-label="Remove receipt"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <Hint>
                    {paymentMethod === "make"
                      ? "Upload your bank transfer screenshot after payment (image or PDF)"
                      : "Upload your payment receipt if you have one (image or PDF)"}
                  </Hint>
                </Field>
              </Section>

              {/* Agreement */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex items-start gap-3 mb-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ff0d13]" />
                  <h2 className="text-xl font-bold text-slate-900 sm:text-2xl leading-tight">
                    Agreement &amp; Authorization <span className="text-[#ff0d13]">*</span>
                  </h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-1">
                  To ensure a smooth experience, please review our terms and conditions here:{" "}
                  <a
                    href="https://www.buzzfiling.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#ff0d13] underline underline-offset-2 hover:text-[#cc0000]"
                  >
                    Buzz Filing Terms &amp; Conditions
                  </a>
                  . By proceeding, you acknowledge and accept these terms.
                </p>
                <label className="mt-4 inline-flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                  />
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded border-2 border-slate-300 bg-white transition-colors peer-checked:bg-[#ff0d13] peer-checked:border-[#ff0d13] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff0d13]/30 cursor-pointer">
                    {terms && <Check className="h-3 w-3 text-white" />}
                  </span>
                  <span className="text-sm font-medium text-slate-900">Yes I agree</span>
                </label>
                {errors.terms && <p className="mt-2 text-xs text-red-600">{errors.terms}</p>}
              </div>

              {/* Submit */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button type="submit" disabled={submitting} className="group inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#ff0d13] px-6 py-4 text-base font-extrabold text-white shadow-lg transition hover:bg-[#cc0a0f] disabled:opacity-60 sm:flex-none sm:px-10 sm:py-5">
                  {submitting ? "Submitting…" : <>Complete Formation <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></>}
                </button>
              </div>
            </form>
          </div>
          )}
        </div>


    </div>
  );
}

/* ===== Helpers ===== */

const inputCls =
  "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 focus:border-[#ff0d13] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 hover:border-slate-300";

const textareaCls =
  "w-full min-h-[100px] max-h-[250px] border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg resize-y overflow-y-auto text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 focus:border-[#ff0d13] px-4 py-2.5 hover:border-slate-300 transition-colors";

const selectTriggerCls =
  "h-11 border border-slate-200 bg-white text-slate-900 rounded-lg w-full shadow-none cursor-pointer overflow-hidden hover:border-slate-300 transition-colors";





function truncateFileName(name: string, keep = 5) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  if (base.length <= keep) return name;
  return `${base.slice(0, keep)}���${ext}`;
}


function Section({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section id={`section-${id}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 scroll-mt-6">
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-950 break-words">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 leading-relaxed">{subtitle}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-900">{children}</label>;
}

function Field({ label, error, children }: { label: React.ReactNode; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5" data-error={error ? "true" : undefined}>
      <Label>{label}</Label>
      <div>{children}</div>
      {error && <p className="text-xs text-red-600 break-words">{error}</p>}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500 break-words">{children}</p>;
}

function InputWrap({ icon, right, children }: { icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className={`${icon ? "[&>*]:pl-10" : ""} ${right ? "[&>*]:pr-10" : ""}`.trim()}>{children}</div>
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
          {icon}
        </span>
      )}
      {right && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">{right}</span>}
    </div>
  );
}

function SelectWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="[&>*]:pr-9 [&>select]:appearance-none">{children}</div>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  );
}

function EntityOption({ selected, onClick, title, badges, features, bestFor }: { selected: boolean; onClick: () => void; title: string; badges: { label: string; solid?: boolean }[]; features: string[]; bestFor: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all cursor-pointer sm:p-5 ${
        selected
          ? "border-[#ff0d13] bg-[#ff0d13]/5"
          : "border-slate-200 bg-white hover:border-[#ff0d13]/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          selected ? "border-[#ff0d13] bg-[#ff0d13]" : "border-slate-300 bg-white"
        }`}>
          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <span key={b.label} className={`rounded-md px-2 py-0.5 text-xs font-bold ${b.solid ? "bg-[#ff0d13] text-white" : "bg-[#ff0d13]/12 text-[#ff0d13]"}`}>{b.label}</span>
            ))}
          </div>
          {features.length > 0 && (
            <ul className="mt-2.5 space-y-1 text-sm text-slate-700">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#ff0d13] shrink-0" /> {f}</li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-sm text-slate-500"><span className="font-semibold text-slate-700">Best for: </span>{bestFor}</p>
        </div>
      </div>
    </button>
  );
}


function PaymentOption({ selected, onClick, icon, title, desc }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-xl border-2 p-4 transition cursor-pointer ${selected ? "border-[#ff0d13] bg-[#ff0d13]/5" : "border-slate-200 bg-white hover:border-[#ff0d13]/50"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#ff0d13] text-white">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-[#ff0d13]" : "border-slate-300"}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#ff0d13]" />}
        </span>
      </div>
    </button>
  );
}


function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold text-foreground break-all sm:text-right">{value}</span>
    </div>
  );
}

function countryFlag(code: string) {
  if (!code || code.length !== 2) return "🏳";
  const A = 0x1f1e6;
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65));
}

function MemberCountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = COUNTRY_DIAL_CODES.find((c) => c.name === value);

  const filtered = query.trim()
    ? COUNTRY_DIAL_CODES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase())
      )
    : COUNTRY_DIAL_CODES;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQuery(""); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${selectTriggerCls} flex items-center justify-between px-3 text-left`}
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            {selected ? (
              <>
                <span className="text-base leading-none shrink-0">{countryFlag(selected.code)}</span>
                <span className="text-sm text-slate-900 truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-sm text-slate-400">Select country</span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[min(calc(100vw-1rem),22rem)] p-0" align="start" collisionPadding={8}>
        <div className="flex items-center border-b border-slate-200 px-3">
          <input
            autoFocus
            placeholder="Search country..."
            value={query}
            className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent outline-none"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No country found.</p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c.name); setOpen(false); setQuery(""); }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="text-base leading-none shrink-0">{countryFlag(c.code)}</span>
                <span className="flex-1 text-sm text-slate-900 truncate">{c.name}</span>
                {value === c.name && <Check className="h-4 w-4 text-[#ff0d13] shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
