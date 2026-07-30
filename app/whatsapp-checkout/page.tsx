"use client";
import { useEffect, useMemo, useState } from "react";
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
  Sparkles,
  Trash2,
  Upload,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { COUNTRY_DIAL_CODES } from "@/lib/country-dial-codes";
import { PhoneInput } from "@/components/checkout/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getCheckoutData,
  saveCheckoutData,
  clearCheckoutData,
  type StoredMember,
} from "@/lib/checkout-storage";
import {
  saveFile,
  deleteFile,
  clearAllFiles,
  makeMemberFileKey,
  RECEIPT_FILE_KEY,
} from "@/lib/checkout-files";
import {
  generateCheckoutToken,
  signupUser,
  createOrder,
  saveAbandonedCheckout,
  uploadReceipt,
} from "@/lib/checkout-api";
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
  idFileKey?: string;
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

const PKR_RATE = 285;

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
  const [visibleSsn, setVisibleSsn] = useState<Record<string, boolean>>({});

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

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = getCheckoutData();
    if (saved) {
      if (saved.account) {
        if (saved.account.fullName !== undefined) setFullName(saved.account.fullName);
        if (saved.account.phone !== undefined) setPhoneValue(saved.account.phone);
        if (saved.account.email !== undefined) setEmail(saved.account.email);
        if (saved.account.terms !== undefined) setTerms(saved.account.terms);
      }
      if (saved.formation) {
        if (saved.formation.state) setFormationState(saved.formation.state);
        if (saved.formation.entityType) setEntityType(saved.formation.entityType);
        if (saved.formation.pkg) setPkg(saved.formation.pkg);
      }
      if (saved.business) {
        if (saved.business.businessName !== undefined) setBusinessName(saved.business.businessName);
        if (saved.business.website !== undefined) setWebsite(saved.business.website);
        if (saved.business.category !== undefined) setCategory(saved.business.category);
        if (saved.business.description !== undefined) setDescription(saved.business.description);
      }
      if (saved.members && saved.members.length > 0) {
        setMembers(
          saved.members.map((m) => ({
            id: m.id,
            responsible: m.responsible,
            fullLegalName: m.fullLegalName || "",
            homeAddress: m.homeAddress || "",
            city: m.city || "",
            stateProvince: m.stateProvince || "",
            country: m.country || "",
            zip: m.zip || "",
            ssn: "",
            idFileName: m.idFileName || "",
            idFileKey: m.idFileKey,
          })),
        );
      }
      if (saved.payment) {
        if (saved.payment.method) setPaymentMethod(saved.payment.method);
        if (saved.payment.whatsapp !== undefined) setWhatsapp(saved.payment.whatsapp);
        if (saved.payment.receiptFileName !== undefined) setReceiptFileName(saved.payment.receiptFileName);
      }
    }
    setHydrated(true);
  }, []);

  // Persist form state to localStorage (no secrets)
  useEffect(() => {
    if (!hydrated || submitted) return;
    const storedMembers: StoredMember[] = members.map((m) => ({
      id: m.id,
      responsible: m.responsible,
      fullLegalName: m.fullLegalName,
      homeAddress: m.homeAddress,
      city: m.city,
      stateProvince: m.stateProvince,
      country: m.country,
      zip: m.zip,
      idFileName: m.idFileName,
      idFileKey: m.idFileKey,
    }));
    saveCheckoutData({
      account: { fullName, phone: phoneValue, email, terms },
      formation: { state: formationState, entityType, pkg },
      business: { businessName, website, category, description },
      members: storedMembers,
      payment: { method: paymentMethod, whatsapp, receiptFileName },
    });
  }, [
    hydrated,
    submitted,
    fullName,
    phoneValue,
    email,
    terms,
    formationState,
    entityType,
    pkg,
    businessName,
    website,
    category,
    description,
    members,
    paymentMethod,
    whatsapp,
    receiptFileName,
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



  const priceUSD = pkg === "Starter" ? 249 : 349;
  const pricePKR = useMemo(() => (priceUSD * PKR_RATE).toLocaleString("en-US"), [priceUSD]);

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
    if (paymentMethod === "make" && !receiptFileName)
      e.receipt = "Please upload your payment receipt";
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
      'Initializing session',
      'Creating account',
      'Processing order',
      'Saving progress',
      'Completing checkout'
    ]);
    
    try {
      // Step 1: Generate checkout token
      setCurrentStep(1);
      console.log("[v0] Step 1: Generating checkout token...");
      const tokenData = await generateCheckoutToken(email);
      setCheckoutToken(tokenData.token);
      
      // Save abandoned checkout progress after step 1
      await saveAbandonedCheckout(email, 1, {
        account: { fullName, phone: phoneValue, email },
      }, tokenData.token);
      
      // Step 2: Sign up user
      setCurrentStep(2);
      console.log("[v0] Step 2: Creating user account...");
      const signupData = await signupUser(fullName, email, password, phoneValue);
      setUserId(signupData.userId);
      
      // Save abandoned checkout progress after step 2
      await saveAbandonedCheckout(email, 2, {
        account: { fullName, phone: phoneValue, email },
        formation: { state: formationState, entityType, pkg },
      }, tokenData.token);
      
      // Prepare member data
      const preparedMembers = members.map((m) => ({
        id: m.id,
        responsible: m.responsible,
        fullLegalName: m.fullLegalName,
        homeAddress: m.homeAddress,
        city: m.city,
        stateProvince: m.stateProvince,
        country: m.country,
        zip: m.zip,
        ssn: m.ssn,
        idFileName: m.idFileName,
      }));
      
      // Step 3: Create order with all data
      setCurrentStep(3);
      console.log("[v0] Step 3: Creating order...");
      const orderData = await createOrder({
        token: tokenData.token,
        account: {
          fullName,
          email,
          phone: phoneValue,
        },
        formation: {
          state: formationState,
          entity: entityType,
          package: pkg,
          priceUSD,
        },
        business: {
          businessName,
          website,
          category,
          description,
        },
        members: preparedMembers,
        payment: {
          method: paymentMethod,
          whatsapp: whatsapp || phoneValue,
          receiptFileName,
        },
      });
      setOrderId(orderData.orderId);
      
      console.log("[v0] Order created successfully:", orderData.orderId);
      
      // Step 4: Save progress
      setCurrentStep(4);
      await saveAbandonedCheckout(email, 5, {
        orderId: orderData.orderId,
        status: 'completed',
      }, tokenData.token);
      
      // Step 5: Complete
      setCurrentStep(5);
      clearCheckoutData();
      await clearAllFiles();
      setSubmitting(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during checkout';
      console.error("[v0] Checkout error:", message);
      setApiError(message);
      setSubmitting(false);
      setCurrentStep(0);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#8B1A1A] via-[#A52A2A] to-[#6B0000] text-white">
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary backdrop-blur">
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
            
            {submitting && (
              <div className="mb-6 rounded-lg border border-[#ff0d13]/20 bg-[#ff0d13]/5 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">Processing your order...</p>
                    <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${(currentStep / steps.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx < currentStep ? 'bg-green-500 text-white' :
                          idx === currentStep - 1 ? 'bg-primary text-white animate-pulse' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {idx < currentStep - 1 ? '✓' : idx === currentStep - 1 ? '...' : idx + 1}
                        </div>
                        <span className={`text-sm ${idx < currentStep ? 'text-muted-foreground line-through' : idx === currentStep - 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
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
                {errors.members && <p className="text-sm text-primary">{errors.members}</p>}
                <div className="space-y-5">
                  {members.map((m, i) => (
                    <div key={m.id} className="rounded-xl p-0 sm:p-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground">Member {i + 1}</h3>
                        {members.length > 1 && (
                          <button type="button" onClick={() => removeMember(m.id)} className="inline-flex cursor-pointer items-center gap-1 text-sm text-primary hover:underline">
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
                          {m.responsible && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
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

                        <Field label={<>Passport / National ID Card <span className="text-primary">*</span></>} error={errors[`m_${i}_id`]}>
                          {m.idFileName ? (
                            <div className={fileUploadCls}>
                              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{truncateFileName(m.idFileName)}</span>
                              <label className="shrink-0 cursor-pointer text-xs font-semibold text-primary hover:underline">
                                Replace
                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  const key = makeMemberFileKey(m.id);
                                  await saveFile(key, f);
                                  updateMember(m.id, { idFileName: f.name, idFileKey: key });
                                }} />
                              </label>
                              <button type="button" onClick={async () => {
                                if (m.idFileKey) await deleteFile(m.idFileKey);
                                updateMember(m.id, { idFileName: "", idFileKey: undefined });
                              }} className="shrink-0 cursor-pointer text-slate-400 hover:text-primary" aria-label="Remove file">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <label className={`${fileUploadCls} cursor-pointer`}>
                              <input
                                type="file"
                                onChange={async (e) => {
                                  const file = e.currentTarget.files?.[0];
                                  if (file && m.idFileKey === undefined) {
                                    const key = makeMemberFileKey(m.id);
                                    await saveFile(key, file);
                                    updateMember(m.id, { idFileName: file.name, idFileKey: key });
                                  }
                                }} />
                              <Upload className="h-4 w-4" /> Choose File
                            </label>
                          )}
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <div data-error={errors.terms ? "true" : undefined} className="rounded-xl border border-[#ff0d13]/20 bg-[#ff0d13]/8 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      Agreement & Authorization <span className="text-primary">*</span>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      I have read and agree to the{" "}
                      <a
                        href="https://www.buzzfiling.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                      >
                        Terms &amp; Conditions
                      </a>{" "}
                      and authorize Buzz Filing to proceed with my order.
                    </p>
                    <label className="mt-3 inline-flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="peer sr-only" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                      <span className="grid h-5 w-5 place-items-center rounded-md border border-slate-300 bg-white cursor-pointer transition-colors peer-checked:bg-[#ff0d13] peer-checked:border-[#ff0d13] peer-focus-visible:ring-2 peer-focus-visible:ring-[#ff0d13]/30">
                        {terms && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                      </span>
                      <span className="text-sm font-medium text-foreground">Yes I agree</span>
                    </label>
                    {errors.terms && <p className="mt-1 text-xs text-primary">{errors.terms}</p>}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-8">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button type="submit" disabled={submitting} className="group inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-extrabold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60 sm:flex-none sm:px-10 sm:py-5">
                    {submitting ? "Submitting…" : <>Complete Formation <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span></>}
                  </button>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> 256-bit SSL Secure</span>
                  <span className="inline-flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 100% Satisfaction Guarantee</span>
                  <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" /> Trusted by 10k+ Businesses</span>
                </div>
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
  "w-full min-h-[100px] max-h-[250px] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 rounded-lg resize-y overflow-y-auto text-sm focus:outline-none focus:ring-2 focus:ring-[#ff0d13]/20 focus:border-[#ff0d13] px-4 py-2.5";

const selectTriggerCls =
  "h-11 border-slate-200 bg-white text-slate-900 rounded-lg w-full shadow-none cursor-pointer overflow-hidden";

const fileUploadCls =
  "flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 min-h-11 transition-colors hover:border-slate-300";



function truncateFileName(name: string, keep = 5) {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : "";
  if (base.length <= keep) return name;
  return `${base.slice(0, keep)}…${ext}`;
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
    <button type="button" onClick={onClick} className={`text-left rounded-xl border-2 p-4 transition cursor-pointer sm:p-5 ${selected ? "border-[#ff0d13] bg-[#ff0d13]/10" : "border-border bg-card hover:border-[#ff0d13]/40"}`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary" : "border-border"}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b.label} className={`rounded-md px-2 py-0.5 text-xs font-bold ${b.solid ? "bg-[#ff0d13] text-white" : "bg-[#ff0d13]/15 text-[#ff0d13]"}`}>{b.label}</span>
            ))}
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-foreground">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted-foreground"><span className="font-bold text-foreground">Best for: </span>{bestFor}</p>
        </div>
      </div>
    </button>
  );
}


function PaymentOption({ selected, onClick, icon, title, desc }: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button type="button" onClick={onClick} className={`text-left rounded-xl border-2 p-4 transition cursor-pointer ${selected ? "border-[#ff0d13] bg-[#ff0d13]/10" : "border-border bg-card hover:border-[#ff0d13]/40"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary" : "border-border"}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
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

function MemberCountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${selectTriggerCls} flex items-center justify-between text-left cursor-pointer`}
        >
          <span className={value ? "text-foreground" : "text-muted-foreground/60"}>
            {value || "Select country"}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[min(calc(100vw-1rem),20rem)] p-0" align="start" collisionPadding={8}>
        <Command>
          
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c}
                  value={c}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === c ? "opacity-100" : "opacity-0")} />
                  {c}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
