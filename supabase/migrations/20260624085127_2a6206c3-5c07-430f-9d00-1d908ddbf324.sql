-- ============ OFFICIAL SOURCES ============
CREATE TABLE public.official_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  authority text NOT NULL,
  source_url text NOT NULL,
  category text,
  jurisdiction text DEFAULT 'India',
  status text NOT NULL DEFAULT 'unverified',
  last_verified_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.official_sources TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.official_sources TO authenticated;
GRANT ALL ON public.official_sources TO service_role;
ALTER TABLE public.official_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Official sources are readable by everyone"
  ON public.official_sources FOR SELECT USING (true);
CREATE POLICY "Admins manage official sources"
  ON public.official_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ FAQS ============
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text,
  question text NOT NULL,
  answer text NOT NULL,
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  jurisdiction text DEFAULT 'India',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQs are readable by everyone"
  ON public.faqs FOR SELECT USING (true);
CREATE POLICY "Admins manage faqs"
  ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SCHEMES ============
CREATE TABLE public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  eligibility text,
  benefits text,
  application_process text,
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  jurisdiction text DEFAULT 'India',
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.schemes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schemes TO authenticated;
GRANT ALL ON public.schemes TO service_role;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schemes are readable by everyone"
  ON public.schemes FOR SELECT USING (true);
CREATE POLICY "Admins manage schemes"
  ON public.schemes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ GLOSSARY ============
CREATE TABLE public.glossary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  definition text NOT NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.glossary TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.glossary TO authenticated;
GRANT ALL ON public.glossary TO service_role;
ALTER TABLE public.glossary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Glossary is readable by everyone"
  ON public.glossary FOR SELECT USING (true);
CREATE POLICY "Admins manage glossary"
  ON public.glossary FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ COMPLAINT TEMPLATES ============
CREATE TABLE public.complaint_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  description text,
  template_body text NOT NULL,
  fields jsonb DEFAULT '[]'::jsonb,
  jurisdiction text DEFAULT 'India',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.complaint_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_templates TO authenticated;
GRANT ALL ON public.complaint_templates TO service_role;
ALTER TABLE public.complaint_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Complaint templates are readable by everyone"
  ON public.complaint_templates FOR SELECT USING (true);
CREATE POLICY "Admins manage complaint templates"
  ON public.complaint_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ updated_at triggers ============
CREATE TRIGGER trg_official_sources_updated BEFORE UPDATE ON public.official_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_faqs_updated BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_schemes_updated BEFORE UPDATE ON public.schemes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_glossary_updated BEFORE UPDATE ON public.glossary
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_complaint_templates_updated BEFORE UPDATE ON public.complaint_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SEED: official sources ============
INSERT INTO public.official_sources (title, authority, source_url, category, jurisdiction, status, last_verified_at) VALUES
  ('PM-KISAN Official Portal', 'Ministry of Agriculture & Farmers Welfare', 'https://pmkisan.gov.in', 'Scheme', 'India', 'verified', now()),
  ('Pradhan Mantri Awas Yojana', 'Ministry of Housing and Urban Affairs', 'https://pmaymis.gov.in', 'Scheme', 'India', 'verified', now()),
  ('Ayushman Bharat (PM-JAY)', 'National Health Authority', 'https://pmjay.gov.in', 'Scheme', 'India', 'verified', now()),
  ('MUDRA Loan Portal', 'Micro Units Development & Refinance Agency', 'https://www.mudra.org.in', 'Scheme', 'India', 'verified', now()),
  ('Startup India', 'Department for Promotion of Industry and Internal Trade', 'https://www.startupindia.gov.in', 'Scheme', 'India', 'verified', now()),
  ('Skill India / NSDC', 'Ministry of Skill Development and Entrepreneurship', 'https://www.skillindia.gov.in', 'Scheme', 'India', 'verified', now());

-- ============ SEED: schemes ============
INSERT INTO public.schemes (title, slug, description, eligibility, benefits, application_process, jurisdiction, category, source_id)
SELECT v.title, v.slug, v.description, v.eligibility, v.benefits, v.application_process, 'India', v.category, s.id
FROM (VALUES
  ('PM Kisan Samman Nidhi', 'pm-kisan',
   'A central scheme providing income support to all landholding farmer families across the country.',
   'All landholding farmer families with cultivable land, subject to exclusion criteria (institutional landholders, income-tax payers, constitutional post holders, etc.).',
   'Rs. 6,000 per year paid in three equal instalments of Rs. 2,000 directly into bank accounts via DBT.',
   '1. Register at the PM-KISAN portal or nearest CSC. 2. Provide Aadhaar, bank account and land records. 3. Verification by state/UT. 4. Receive instalments via DBT.',
   'Agriculture', 'PM-KISAN Official Portal'),
  ('Pradhan Mantri Awas Yojana (PMAY)', 'pmay',
   'A flagship housing scheme aiming to provide affordable pucca houses to eligible urban and rural households.',
   'Economically Weaker Section (EWS), Low Income Group (LIG), and Middle Income Group (MIG) households without a pucca house in their name.',
   'Credit-linked subsidy on home loans, financial assistance for house construction, and pucca houses with basic amenities.',
   '1. Apply online on the PMAY portal or via CSC. 2. Submit Aadhaar and income documents. 3. Verification and beneficiary selection. 4. Subsidy/assistance credited.',
   'Housing', 'Pradhan Mantri Awas Yojana'),
  ('Ayushman Bharat (PM-JAY)', 'ayushman-bharat',
   'The world''s largest health assurance scheme providing health cover to poor and vulnerable families.',
   'Families identified through SECC database / eligible categories (rural and urban deprivation criteria).',
   'Health cover of Rs. 5 lakh per family per year for secondary and tertiary care hospitalisation at empanelled hospitals.',
   '1. Check eligibility on the PM-JAY portal or call 14555. 2. Visit an empanelled hospital or Ayushman Mitra. 3. Verify identity. 4. Avail cashless treatment.',
   'Health', 'Ayushman Bharat (PM-JAY)'),
  ('Pradhan Mantri MUDRA Yojana', 'mudra-loan',
   'Provides collateral-free institutional finance to non-corporate, non-farm small/micro enterprises.',
   'Any Indian citizen with a viable business plan for a non-farm income-generating activity (manufacturing, trading, services).',
   'Loans up to Rs. 10 lakh under Shishu (up to 50k), Kishore (50k-5L) and Tarun (5L-10L) categories, without collateral.',
   '1. Approach any bank, NBFC or MFI. 2. Submit business plan, identity and address proof. 3. Loan appraisal and sanction. 4. Disbursement.',
   'Finance', 'MUDRA Loan Portal'),
  ('Startup India', 'startup-india',
   'A flagship initiative to build a strong ecosystem for nurturing innovation and startups in India.',
   'An entity incorporated as a Private Limited Company, LLP or Partnership, up to 10 years old, with turnover under Rs. 100 crore, working on innovation/improvement.',
   'Tax exemptions, easier compliance, IPR fast-tracking, funding support, and recognition as a DPIIT-recognised startup.',
   '1. Incorporate your business. 2. Register on the Startup India portal. 3. Apply for DPIIT recognition. 4. Avail benefits.',
   'Business', 'Startup India'),
  ('Skill India Mission', 'skill-india',
   'A national initiative to train youth in industry-relevant skills to enhance employability.',
   'Indian citizens, primarily youth seeking skill training; specific eligibility varies by training programme.',
   'Free/subsidised skill training, certification, and improved employment opportunities through PMKVY and other schemes.',
   '1. Find a training centre via the Skill India portal. 2. Enrol in a relevant course. 3. Complete training and assessment. 4. Receive certification.',
   'Skilling', 'Skill India / NSDC')
) AS v(title, slug, description, eligibility, benefits, application_process, category, source_name)
LEFT JOIN public.official_sources s ON s.title = v.source_name;

-- ============ SEED: glossary ============
INSERT INTO public.glossary (term, definition, category) VALUES
  ('FIR', 'First Information Report — a written document prepared by police when they receive information about the commission of a cognizable offence. It sets the criminal justice process in motion.', 'Criminal Law'),
  ('Affidavit', 'A written statement of facts sworn or affirmed before an authorised officer (such as a notary or magistrate), used as evidence in legal and administrative matters.', 'Legal Procedure'),
  ('Bail', 'The temporary release of an accused person awaiting trial, sometimes on conditions such as a security deposit, ensuring their appearance in court.', 'Criminal Law'),
  ('Mutation', 'The process of updating land or property records in the revenue department to reflect a change of ownership after sale, inheritance or transfer.', 'Property Law'),
  ('Encumbrance', 'A claim, charge or liability on a property (such as a mortgage or lien) that may affect its transfer or use. An Encumbrance Certificate shows such charges.', 'Property Law'),
  ('Power of Attorney', 'A legal document authorising one person (the agent) to act on behalf of another (the principal) in financial, legal or property matters.', 'Legal Procedure'),
  ('Lease', 'A contract by which one party conveys property or land to another for a specified period in return for rent or consideration.', 'Property Law'),
  ('RTI', 'Right to Information — a citizen''s legal right under the RTI Act, 2005 to request information from public authorities to promote transparency and accountability.', 'Citizen Rights');