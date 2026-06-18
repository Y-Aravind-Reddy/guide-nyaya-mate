
-- ===== Helper: updated_at trigger =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ===== Roles =====
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  preferred_language text NOT NULL DEFAULT 'English',
  avatar_url text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== Government Services =====
CREATE TABLE public.government_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'FileText',
  eligibility text,
  fees text,
  processing_time text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.government_services TO anon, authenticated;
GRANT ALL ON public.government_services TO service_role;
ALTER TABLE public.government_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Government services are public" ON public.government_services
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.procedures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.government_services(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  title text NOT NULL,
  description text NOT NULL
);
GRANT SELECT ON public.procedures TO anon, authenticated;
GRANT ALL ON public.procedures TO service_role;
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Procedures are public" ON public.procedures
  FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.required_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.government_services(id) ON DELETE CASCADE,
  document_name text NOT NULL
);
GRANT SELECT ON public.required_documents TO anon, authenticated;
GRANT ALL ON public.required_documents TO service_role;
ALTER TABLE public.required_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Required documents are public" ON public.required_documents
  FOR SELECT TO anon, authenticated USING (true);

-- ===== Legal Topics =====
CREATE TABLE public.legal_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  category text NOT NULL,
  description text NOT NULL,
  overview text,
  procedure text,
  documents jsonb NOT NULL DEFAULT '[]',
  faq jsonb NOT NULL DEFAULT '[]',
  related jsonb NOT NULL DEFAULT '[]',
  icon text NOT NULL DEFAULT 'Scale',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_topics TO anon, authenticated;
GRANT ALL ON public.legal_topics TO service_role;
ALTER TABLE public.legal_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Legal topics are public" ON public.legal_topics
  FOR SELECT TO anon, authenticated USING (true);

-- ===== Saved items =====
CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.government_services(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_items TO authenticated;
GRANT ALL ON public.saved_items TO service_role;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own saved items" ON public.saved_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== Bookmarks =====
CREATE TABLE public.bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.legal_topics(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT ALL ON public.bookmarks TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own bookmarks" ON public.bookmarks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ===== Contact messages =====
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a contact message" ON public.contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ===== Seed: Government Services =====
INSERT INTO public.government_services (title, slug, description, category, icon, eligibility, fees, processing_time) VALUES
('Apply for a Passport', 'passport', 'Apply for a new Indian passport or renew an existing one through Passport Seva.', 'Identity', 'BookUser', 'Indian citizens of any age. Minors require parental consent.', '₹1,500 (36 pages) / ₹2,000 (60 pages)', '15–30 working days'),
('Aadhaar Enrolment & Update', 'aadhaar', 'Enrol for a new Aadhaar number or update your name, address, mobile or biometrics.', 'Identity', 'Fingerprint', 'All residents of India including infants.', 'Free for enrolment; ₹50 for updates', '7–14 working days'),
('PAN Card', 'pan-card', 'Apply for a Permanent Account Number for tax and financial transactions.', 'Finance', 'CreditCard', 'Individuals, companies and entities liable to pay tax.', '₹107 (Indian address)', '7–15 working days'),
('Driving Licence', 'driving-licence', 'Apply for a learner''s licence, permanent licence or renew your existing licence.', 'Transport', 'Car', 'Age 18+ for LMV; 16+ for gearless two-wheelers.', '₹200–₹1,000 depending on class', '7–30 working days'),
('Income Certificate', 'income-certificate', 'Obtain an official income certificate from your state revenue department.', 'Revenue', 'FileBadge', 'Indian residents needing income proof for schemes.', 'Free or nominal state fee', '7–15 working days'),
('Property Registration', 'property-registration', 'Register the sale or transfer of property at the sub-registrar office.', 'Property', 'Building2', 'Buyers and sellers of immovable property.', 'Stamp duty + 1% registration fee', '1–7 working days'),
('Voter ID (EPIC)', 'voter-id', 'Register as a voter and get your Electoral Photo Identity Card.', 'Identity', 'Vote', 'Indian citizens aged 18 and above.', 'Free', '15–30 working days'),
('Birth Certificate', 'birth-certificate', 'Register a birth and obtain an official birth certificate.', 'Civic', 'Baby', 'Parents or guardians of the newborn.', 'Free if within 21 days', '7–15 working days'),
('Ration Card', 'ration-card', 'Apply for a ration card to access subsidised food grains.', 'Welfare', 'ShoppingBasket', 'Indian households meeting state eligibility norms.', 'Free or nominal fee', '15–30 working days'),
('GST Registration', 'gst-registration', 'Register your business for Goods and Services Tax.', 'Finance', 'Receipt', 'Businesses crossing the turnover threshold.', 'Free', '3–7 working days'),
('Marriage Registration', 'marriage-registration', 'Register your marriage under the Hindu Marriage Act or Special Marriage Act.', 'Civic', 'HeartHandshake', 'Married couples residing in India.', 'State-specific nominal fee', '15–60 working days'),
('Caste Certificate', 'caste-certificate', 'Obtain an SC/ST/OBC caste certificate for reservations and schemes.', 'Revenue', 'ScrollText', 'Members of notified communities.', 'Free or nominal fee', '15–30 working days');

-- Procedures for Passport
WITH s AS (SELECT id FROM public.government_services WHERE slug = 'passport')
INSERT INTO public.procedures (service_id, step_number, title, description)
SELECT s.id, v.step, v.title, v.descr FROM s, (VALUES
  (1, 'Register on Passport Seva', 'Create an account on the Passport Seva Online Portal and verify your email.'),
  (2, 'Fill the application form', 'Complete the new/renewal passport application form online.'),
  (3, 'Pay the fee & book appointment', 'Pay online and schedule an appointment at your nearest Passport Seva Kendra.'),
  (4, 'Visit the Kendra', 'Carry original documents for verification and biometrics.'),
  (5, 'Police verification', 'Police verify your address; passport is then printed and dispatched.')
) AS v(step, title, descr);

WITH s AS (SELECT id FROM public.government_services WHERE slug = 'passport')
INSERT INTO public.required_documents (service_id, document_name)
SELECT s.id, d FROM s, (VALUES ('Proof of address (Aadhaar/Utility bill)'), ('Proof of date of birth'), ('Recent passport-size photographs'), ('Identity proof (PAN/Voter ID)')) AS t(d);

-- Procedures for Aadhaar
WITH s AS (SELECT id FROM public.government_services WHERE slug = 'aadhaar')
INSERT INTO public.procedures (service_id, step_number, title, description)
SELECT s.id, v.step, v.title, v.descr FROM s, (VALUES
  (1, 'Locate an enrolment centre', 'Find an Aadhaar Seva Kendra near you on the UIDAI website.'),
  (2, 'Fill the enrolment form', 'Provide your demographic details accurately.'),
  (3, 'Capture biometrics', 'Submit fingerprints, iris scan and photograph.'),
  (4, 'Collect acknowledgement', 'Receive an enrolment slip with your Enrolment ID.'),
  (5, 'Download e-Aadhaar', 'Once generated, download your Aadhaar from the UIDAI portal.')
) AS v(step, title, descr);

WITH s AS (SELECT id FROM public.government_services WHERE slug = 'aadhaar')
INSERT INTO public.required_documents (service_id, document_name)
SELECT s.id, d FROM s, (VALUES ('Proof of identity'), ('Proof of address'), ('Proof of date of birth')) AS t(d);

-- Generic procedures + docs for remaining services
WITH s AS (SELECT id, title FROM public.government_services WHERE slug NOT IN ('passport','aadhaar'))
INSERT INTO public.procedures (service_id, step_number, title, description)
SELECT s.id, v.step, v.title, v.descr FROM s, (VALUES
  (1, 'Check eligibility', 'Confirm you meet the eligibility criteria before applying.'),
  (2, 'Gather documents', 'Collect all required documents and self-attest copies.'),
  (3, 'Submit the application', 'Apply online on the official portal or at the designated office.'),
  (4, 'Pay applicable fees', 'Complete the payment and save the acknowledgement receipt.'),
  (5, 'Track & collect', 'Track your application status and collect the final document.')
) AS v(step, title, descr);

WITH s AS (SELECT id FROM public.government_services WHERE slug NOT IN ('passport','aadhaar'))
INSERT INTO public.required_documents (service_id, document_name)
SELECT s.id, d FROM s, (VALUES ('Identity proof (Aadhaar/PAN)'), ('Address proof'), ('Recent photographs'), ('Application form')) AS t(d);

-- ===== Seed: Legal Topics =====
INSERT INTO public.legal_topics (title, slug, category, description, overview, procedure, documents, faq, related, icon) VALUES
('Consumer Rights', 'consumer-rights', 'Consumer', 'Know your rights as a consumer and how to file complaints against unfair practices.', 'The Consumer Protection Act, 2019 protects buyers against defective goods, deficient services and unfair trade practices. You can seek replacement, refund or compensation.', 'File a complaint on the National Consumer Helpline or e-Daakhil portal, attach evidence, and attend hearings before the appropriate Consumer Commission.', '["Purchase invoice/bill","Warranty card","Photographs of defect","Written complaint to seller"]', '[{"q":"Is there a fee to file a consumer complaint?","a":"Complaints up to ₹5 lakh can be filed free of cost."},{"q":"How long do I have to file?","a":"Generally within 2 years from the date of the cause of action."}]', '["Cyber Crime","Property Rights"]', 'ShoppingBag'),
('Cyber Crime', 'cyber-crime', 'Cyber', 'Steps to report online fraud, harassment, and financial cyber crimes.', 'Cyber crimes include phishing, financial fraud, identity theft and online harassment. The National Cyber Crime Reporting Portal lets you report incidents 24x7.', 'Report immediately on cybercrime.gov.in or call 1930 for financial fraud, preserve evidence, and file an FIR if required.', '["Screenshots of the incident","Transaction details","Bank statements","Communication records"]', '[{"q":"What is the 1930 helpline?","a":"A national helpline for reporting financial cyber fraud to freeze fraudulent transactions quickly."},{"q":"Can I report anonymously?","a":"Yes, certain categories like child abuse content can be reported anonymously."}]', '["Consumer Rights","Police Complaint"]', 'ShieldAlert'),
('Property Rights', 'property-rights', 'Property', 'Understand ownership, inheritance, and dispute resolution for property.', 'Property rights cover ownership, transfer, inheritance and tenancy. Clear title, registered documents and mutation records are key to protecting your property.', 'Verify title documents, register transactions at the sub-registrar office, update mutation records, and approach civil court for disputes.', '["Sale deed","Property tax receipts","Encumbrance certificate","Mutation records"]', '[{"q":"Is registration of property mandatory?","a":"Yes, sale of immovable property above ₹100 must be registered."},{"q":"What is mutation?","a":"Updating the ownership record in municipal/revenue books after transfer."}]', '["Tenant Rights","Consumer Rights"]', 'Building'),
('Women Rights', 'women-rights', 'Social', 'Legal protections available to women including safety and workplace rights.', 'Indian law provides women protection against domestic violence, workplace harassment and dowry. Dedicated helplines and fast-track courts support enforcement.', 'Approach the police, Women''s Commission, or file under the relevant Act. The Sexual Harassment of Women at Workplace Act mandates an Internal Committee in organisations.', '["Identity proof","Evidence of incident","Medical reports (if any)","Witness details"]', '[{"q":"What is the women helpline number?","a":"Dial 181 for the Women Helpline available across India."},{"q":"Is workplace harassment covered?","a":"Yes, under the POSH Act, 2013."}]', '["Police Complaint","Cyber Crime"]', 'HeartHandshake'),
('Tenant Rights', 'tenant-rights', 'Property', 'Rights and duties of tenants and landlords under rent laws.', 'Tenancy is governed by state Rent Control Acts and the Model Tenancy Act. A written, registered rent agreement protects both tenant and landlord.', 'Sign a registered rent agreement, pay rent on time, and approach the Rent Authority/Tribunal for disputes over eviction or deposit.', '["Registered rent agreement","Rent receipts","Security deposit proof","Communication with landlord"]', '[{"q":"Can a landlord evict without notice?","a":"No, proper notice and legal grounds are required."},{"q":"How much security deposit is allowed?","a":"The Model Tenancy Act caps it at 2 months for residential premises."}]', '["Property Rights","Consumer Rights"]', 'KeyRound'),
('Employment Rights', 'employment-rights', 'Work', 'Your rights at work: wages, leave, termination, and provident fund.', 'Labour laws guarantee minimum wages, timely salary, paid leave, gratuity and provident fund. Wrongful termination can be challenged before labour authorities.', 'Raise the issue with HR, then approach the Labour Commissioner or file a case before the Labour Court/Tribunal.', '["Appointment letter","Salary slips","Employment contract","Termination letter (if any)"]', '[{"q":"What is the minimum wage?","a":"It varies by state and category of work; check your state notification."},{"q":"Am I entitled to gratuity?","a":"Yes, after 5 years of continuous service under the Gratuity Act."}]', '["Women Rights","Consumer Rights"]', 'Briefcase'),
('Police Complaint', 'police-complaint', 'Justice', 'How to lodge a police complaint and what to do if it is refused.', 'A police complaint can be filed in person or online. For cognizable offences the police must register an FIR. You can escalate to senior officers or the magistrate if refused.', 'Visit the police station or use your state police online portal, provide a written complaint, and obtain a copy with a diary number.', '["Written complaint","Identity proof","Supporting evidence","Witness details"]', '[{"q":"What if police refuse to register my complaint?","a":"Approach the Superintendent of Police or file before the Magistrate under Section 156(3)."},{"q":"Can I file online?","a":"Yes, most states offer online complaint registration."}]', '["FIR Basics","Cyber Crime"]', 'Siren'),
('FIR Basics', 'fir-basics', 'Justice', 'Understand what an FIR is and how to file one correctly.', 'A First Information Report (FIR) is the first step in a criminal case for a cognizable offence. It sets the criminal justice process in motion.', 'Provide the information to the officer in charge, ensure it is recorded accurately, sign it, and collect a free copy of the FIR.', '["Identity proof","Details of the incident","Any evidence available"]', '[{"q":"Is filing an FIR free?","a":"Yes, registering an FIR is completely free of cost."},{"q":"Can an FIR be filed for events in another city?","a":"Yes, via a Zero FIR which is later transferred to the relevant station."}]', '["Police Complaint","Women Rights"]', 'FileWarning');
