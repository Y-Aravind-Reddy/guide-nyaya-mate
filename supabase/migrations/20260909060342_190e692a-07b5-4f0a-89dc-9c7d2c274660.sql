
ALTER TABLE public.legal_topics
  ADD COLUMN IF NOT EXISTS key_rights jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS important_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_updated timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.laws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  short_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  enacted_year integer,
  category text,
  official_url text,
  source_id uuid REFERENCES public.official_sources(id) ON DELETE SET NULL,
  related_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.law_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_id uuid NOT NULL REFERENCES public.laws(id) ON DELETE CASCADE,
  section_number text NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  topic_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS law_sections_law_id_idx ON public.law_sections(law_id);

GRANT SELECT ON public.laws TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.laws TO authenticated;
GRANT ALL ON public.laws TO service_role;
GRANT SELECT ON public.law_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.law_sections TO authenticated;
GRANT ALL ON public.law_sections TO service_role;

ALTER TABLE public.laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.law_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Laws are publicly readable" ON public.laws;
CREATE POLICY "Laws are publicly readable" ON public.laws FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage laws" ON public.laws;
CREATE POLICY "Admins manage laws" ON public.laws FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Law sections are publicly readable" ON public.law_sections;
CREATE POLICY "Law sections are publicly readable" ON public.law_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage law sections" ON public.law_sections;
CREATE POLICY "Admins manage law sections" ON public.law_sections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.laws (slug, short_name, title, description, enacted_year, category, official_url, related_topics, sort_order) VALUES
('constitution-of-india','Constitution','The Constitution of India','The supreme law of India. It lays down the framework of government, guarantees Fundamental Rights to every citizen, and sets out the Directive Principles that guide the State.',1950,'Constitutional Law','https://www.indiacode.nic.in/handle/123456789/15240','["Women Rights","Employment Rights","RTI","Police Complaints"]',1),
('bharatiya-nyaya-sanhita','BNS','Bharatiya Nyaya Sanhita, 2023','India''s criminal code, which replaced the Indian Penal Code from 1 July 2024. It defines offences such as cheating, theft, criminal intimidation and offences against women and children, and the punishments for them.',2023,'Criminal Law','https://www.indiacode.nic.in/handle/123456789/20062','["Cyber Crime","Women Rights","Police Complaints","Property Rights"]',2),
('bharatiya-nagarik-suraksha-sanhita','BNSS','Bharatiya Nagarik Suraksha Sanhita, 2023','The criminal procedure law that replaced the CrPC. It covers how an FIR is registered, how arrests, investigation, bail and trials work, and the rights of a person in custody.',2023,'Criminal Procedure','https://www.indiacode.nic.in/handle/123456789/20063','["Police Complaints","Women Rights","Cyber Crime"]',3),
('bharatiya-sakshya-adhiniyam','BSA','Bharatiya Sakshya Adhiniyam, 2023','The law of evidence, which replaced the Indian Evidence Act. It sets out what can be proved in court and how, including the treatment of electronic and digital records.',2023,'Evidence Law','https://www.indiacode.nic.in/handle/123456789/20064','["Cyber Crime","Property Rights","Consumer Rights"]',4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.law_sections (law_id, section_number, title, summary, topic_tags, sort_order)
SELECT l.id, v.num, v.title, v.summary, v.tags::jsonb, v.ord
FROM public.laws l
JOIN (VALUES
 ('constitution-of-india','Article 14','Equality before law','The State cannot deny any person equality before the law or the equal protection of the laws within India.','["Women Rights","Employment Rights"]',1),
 ('constitution-of-india','Article 15','Prohibition of discrimination','Prohibits discrimination on grounds of religion, race, caste, sex or place of birth, and allows special provisions for women and children.','["Women Rights"]',2),
 ('constitution-of-india','Article 19','Freedom of speech and expression','Guarantees six freedoms including speech, assembly, movement and the right to practise any profession, subject to reasonable restrictions.','["Employment Rights"]',3),
 ('constitution-of-india','Article 21','Protection of life and personal liberty','No person shall be deprived of life or personal liberty except by a procedure established by law. Read to include privacy, dignity, shelter and a fair trial.','["Police Complaints","Tenant Rights"]',4),
 ('constitution-of-india','Article 22','Rights on arrest','A person arrested must be told the grounds of arrest, may consult a lawyer of choice, and must be produced before a magistrate within 24 hours.','["Police Complaints"]',5),
 ('constitution-of-india','Article 300A','Right to property','No person shall be deprived of their property except by authority of law.','["Property Rights"]',6),
 ('bharatiya-nyaya-sanhita','Section 63','Rape','Defines the offence of rape and the circumstances in which consent is not valid.','["Women Rights"]',1),
 ('bharatiya-nyaya-sanhita','Section 74','Assault to outrage modesty of a woman','Punishes assault or criminal force against a woman intending to outrage her modesty.','["Women Rights"]',2),
 ('bharatiya-nyaya-sanhita','Section 78','Stalking','Covers physical stalking as well as monitoring a woman''s use of the internet, email or other electronic communication.','["Women Rights","Cyber Crime"]',3),
 ('bharatiya-nyaya-sanhita','Section 303','Theft','Defines theft as dishonestly taking movable property out of a person''s possession without consent.','["Property Rights"]',4),
 ('bharatiya-nyaya-sanhita','Section 316','Criminal breach of trust','Applies when a person entrusted with property or money dishonestly misuses it.','["Consumer Rights","Property Rights"]',5),
 ('bharatiya-nyaya-sanhita','Section 318','Cheating','Covers deceiving a person to deliver property or money, including most online frauds.','["Cyber Crime","Consumer Rights"]',6),
 ('bharatiya-nyaya-sanhita','Section 319','Cheating by personation','Applies when someone pretends to be another person, including fake profiles and impersonation scams.','["Cyber Crime"]',7),
 ('bharatiya-nyaya-sanhita','Section 351','Criminal intimidation','Punishes threats of injury to a person, their reputation or property, including threats sent online.','["Cyber Crime","Tenant Rights"]',8),
 ('bharatiya-nagarik-suraksha-sanhita','Section 173','Information in cognizable cases (FIR)','Police must register an FIR for a cognizable offence, including a Zero FIR at any police station regardless of where the offence took place.','["Police Complaints"]',1),
 ('bharatiya-nagarik-suraksha-sanhita','Section 175','Police power to investigate','Sets out when police may investigate a cognizable case and when a magistrate can order an investigation.','["Police Complaints"]',2),
 ('bharatiya-nagarik-suraksha-sanhita','Section 179','Attendance of witnesses','Police may require a person to attend for questioning; women and certain persons can be examined only at their residence.','["Women Rights","Police Complaints"]',3),
 ('bharatiya-nagarik-suraksha-sanhita','Section 35','When police may arrest without warrant','Lists the situations allowing arrest without a warrant and the notice procedure for lesser offences.','["Police Complaints"]',4),
 ('bharatiya-nagarik-suraksha-sanhita','Section 173(4)','Complaint to a senior officer','If a police station refuses to register an FIR, the complaint can be sent in writing to the Superintendent of Police.','["Police Complaints"]',5),
 ('bharatiya-sakshya-adhiniyam','Section 2(1)(d)','Document includes electronic records','Emails, server logs, messages and files on a device are documents that can be produced as evidence.','["Cyber Crime"]',1),
 ('bharatiya-sakshya-adhiniyam','Section 61','Admissibility of electronic records','Electronic records cannot be denied admissibility only because they are electronic.','["Cyber Crime"]',2),
 ('bharatiya-sakshya-adhiniyam','Section 63','Proof of electronic records','Sets the conditions and the certificate needed for a copy of an electronic record to be accepted in court.','["Cyber Crime","Consumer Rights"]',3),
 ('bharatiya-sakshya-adhiniyam','Section 104','Burden of proof','The burden of proving a fact lies on the person who wants the court to believe it.','["Property Rights","Consumer Rights"]',4)
) AS v(law_slug, num, title, summary, tags, ord) ON v.law_slug = l.slug
WHERE NOT EXISTS (
  SELECT 1 FROM public.law_sections s WHERE s.law_id = l.id AND s.section_number = v.num
);
