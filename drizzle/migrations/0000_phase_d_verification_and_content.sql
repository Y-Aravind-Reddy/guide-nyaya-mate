DO $$ BEGIN
  CREATE TYPE public.content_verification_status AS ENUM ('verified','under_review','draft');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.government_services ADD COLUMN IF NOT EXISTS verification_status public.content_verification_status NOT NULL DEFAULT 'under_review';
ALTER TABLE public.legal_topics ADD COLUMN IF NOT EXISTS verification_status public.content_verification_status NOT NULL DEFAULT 'under_review';
ALTER TABLE public.faqs ADD COLUMN IF NOT EXISTS verification_status public.content_verification_status NOT NULL DEFAULT 'under_review';
ALTER TABLE public.glossary ADD COLUMN IF NOT EXISTS verification_status public.content_verification_status NOT NULL DEFAULT 'under_review';

-- Content tied to a verified official source is marked Verified; the rest stays Under Review.
UPDATE public.government_services s SET verification_status='verified'
  WHERE s.source_id IN (SELECT id FROM public.official_sources WHERE status='verified');
UPDATE public.faqs s SET verification_status='verified'
  WHERE s.source_id IN (SELECT id FROM public.official_sources WHERE status='verified');
UPDATE public.glossary s SET verification_status='verified'
  WHERE s.source_id IN (SELECT id FROM public.official_sources WHERE status='verified');
UPDATE public.legal_topics s SET verification_status='verified'
  WHERE s.source_id IN (SELECT id FROM public.official_sources WHERE status='verified')
    AND jsonb_array_length(coalesce(s.important_sections,'[]'::jsonb)) > 0;

-- Strengthen weak topics
UPDATE public.legal_topics SET
  overview = 'Tenants in India are protected by State Rent Control Acts and, in states that have adopted it, the Model Tenancy Act 2021. A written rent agreement should record rent, deposit, duration, maintenance duties and the notice period. Agreements longer than 11 months must be registered under Section 17 of the Registration Act 1908. A landlord cannot cut water or electricity, change locks, or remove belongings to force a tenant out; eviction requires valid legal grounds and, if disputed, an order from the Rent Authority, Rent Court or civil court.',
  procedure = '1. Keep a signed, preferably registered, rent agreement and rent receipts. 2. Pay rent by bank transfer for a record. 3. For disputes, send a written notice to the landlord. 4. If unresolved, approach the Rent Authority / Rent Controller of your district (or civil court). 5. For illegal lock-outs or utility cuts, file a police complaint and seek an urgent order. 6. At the end of tenancy, return keys against a written handover and claim the deposit refund.',
  key_rights = '["Right to a written rent agreement","Right to receipts for rent paid","Right to peaceful possession without harassment","Protection from eviction without legal grounds and due process","Right to essential services (water, electricity)","Right to refund of security deposit minus lawful deductions","Right to prior notice (generally 24 hours) before landlord inspection"]'::jsonb,
  important_sections = '["Model Tenancy Act, 2021 — Sections 11 (deposit cap), 20 (no withholding essential supply), 21 (eviction grounds)","State Rent Control Acts","Registration Act 1908, Section 17 — leases over one year","Transfer of Property Act 1882, Section 106 — notice to quit","Indian Stamp Act — stamp duty on rent agreements"]'::jsonb,
  faq = '[{"q":"Can a landlord evict without notice?","a":"No. Eviction needs valid legal grounds (such as non-payment or misuse) and, if contested, an order from the Rent Authority or court."},{"q":"How much security deposit is allowed?","a":"Under the Model Tenancy Act it is capped at 2 months rent for residential premises; state laws may differ."},{"q":"Can the landlord cut electricity or water?","a":"No. Withholding essential supplies to pressure a tenant is prohibited; you can complain to the Rent Authority and police."},{"q":"Should an 11-month agreement be registered?","a":"Registration is compulsory for leases over 11 months/one year; shorter agreements are usually notarised on stamp paper."},{"q":"How quickly must the deposit be refunded?","a":"Under the Model Tenancy Act, at the time of taking back possession after lawful deductions; keep a written handover record."}]'::jsonb,
  related = '["Property Rights","Consumer Rights","Police Complaints"]'::jsonb,
  last_updated = now()
WHERE slug='tenant-rights';

UPDATE public.legal_topics SET
  overview = 'Employees in India have rights to timely wages, minimum wages, safe working conditions, social security (PF, ESI, gratuity), leave, maternity benefit and protection from sexual harassment. These rights come from labour laws now consolidated into four Labour Codes (Wages, Industrial Relations, Social Security, and Occupational Safety), alongside the POSH Act 2013. Termination generally requires notice or pay in lieu, and retrenchment in many establishments requires compensation.',
  procedure = '1. Keep your appointment letter, salary slips and bank statements. 2. Raise the issue in writing with HR. 3. For unpaid wages or illegal termination, file a complaint with the Labour Commissioner / Labour Department of your state (many accept online). 4. For PF issues use the EPFiGMS grievance portal; for ESI use the ESIC grievance system. 5. For sexual harassment, complain to the Internal Committee (or Local Committee / SHe-Box). 6. Unresolved disputes go to conciliation and then the Labour Court / Industrial Tribunal.',
  key_rights = '["Right to timely payment of wages","Right to at least the notified minimum wage","Right to PF, ESI and gratuity where applicable","Right to paid leave and weekly rest","Maternity benefit of 26 weeks for eligible women","Protection from sexual harassment at the workplace","Notice or pay in lieu of notice before termination","Equal remuneration for equal work"]'::jsonb,
  important_sections = '["Code on Wages, 2019 — timely payment and minimum wages","Industrial Relations Code, 2020 — termination, retrenchment, disputes","Code on Social Security, 2020 — PF, ESI, gratuity, maternity benefit","Occupational Safety, Health and Working Conditions Code, 2020","Sexual Harassment of Women at Workplace (POSH) Act, 2013","Payment of Gratuity Act, 1972 — 5 years continuous service"]'::jsonb,
  faq = '[{"q":"My employer has not paid salary. What can I do?","a":"Send a written demand, then complain to your state Labour Commissioner; wages must be paid within the time set by the Code on Wages."},{"q":"When am I eligible for gratuity?","a":"Generally after 5 years of continuous service, at 15 days wages per completed year."},{"q":"Can I be fired without notice?","a":"Usually notice or pay in lieu is required as per your contract and labour law; misconduct cases need a fair inquiry."},{"q":"How do I complain about PF not being deposited?","a":"File a grievance on the EPFO EPFiGMS portal with your UAN."},{"q":"Where do I report workplace sexual harassment?","a":"To your employer Internal Committee within 3 months, or the Local Committee / SHe-Box portal."}]'::jsonb,
  related = '["Labour Rights","Women Rights"]'::jsonb,
  last_updated = now()
WHERE slug='employment-rights';

UPDATE public.legal_topics SET
  key_rights = key_rights || '["Right to register on e-Shram for unorganised workers","Right to a safe workplace and free health check-ups where mandated","Right to form and join trade unions"]'::jsonb,
  important_sections = important_sections || '["Code on Social Security, 2020 — unorganised and gig workers","Trade Unions provisions — Industrial Relations Code, 2020","Bonded Labour System (Abolition) Act, 1976","Child and Adolescent Labour (Prohibition and Regulation) Act, 1986"]'::jsonb,
  faq = faq || '[{"q":"What is e-Shram?","a":"A national database and labour card for unorganised workers aged 16–59 that links them to social security schemes."},{"q":"Who handles minimum wage complaints?","a":"The state Labour Department / Labour Inspector-cum-Facilitator for your area."},{"q":"Is bonded labour illegal?","a":"Yes, it is abolished; report to the District Magistrate or police."}]'::jsonb,
  last_updated = now()
WHERE slug='labour-rights';

UPDATE public.legal_topics SET
  key_rights = key_rights || '["Zero liability if you report third-party fraud within 3 working days (RBI 2017 circular)","Bank must credit disputed amount (shadow reversal) within 10 working days of reporting","Right to escalate to the RBI Integrated Ombudsman after 30 days"]'::jsonb,
  important_sections = important_sections || '["RBI Circular on Customer Liability in Unauthorised Electronic Banking Transactions, 2017","Reserve Bank — Integrated Ombudsman Scheme, 2021","Information Technology Act 2000, Sections 66C and 66D","Bharatiya Nyaya Sanhita 2023 — cheating provisions"]'::jsonb,
  faq = faq || '[{"q":"What should I do immediately after a fraudulent transaction?","a":"Block the card/UPI, inform your bank in writing at once, and call 1930 or report on cybercrime.gov.in."},{"q":"Will I get my money back?","a":"If reported within 3 working days and you were not negligent, RBI rules give zero liability; delays increase your liability."},{"q":"Bank did not resolve my complaint. Next step?","a":"After 30 days (or a rejection), file with the RBI Integrated Ombudsman at cms.rbi.org.in."}]'::jsonb,
  last_updated = now()
WHERE slug='banking-fraud';

-- New FAQs for weak areas
INSERT INTO public.faqs (category, question, answer, jurisdiction, source_id, verification_status) VALUES
('Tenant Rights','Is a rent agreement mandatory?','It is strongly advised; under the Model Tenancy Act a written agreement is required and must be intimated to the Rent Authority. Registration is compulsory for leases over 11 months.','India',NULL,'under_review'),
('Tenant Rights','Can my landlord increase rent anytime?','Rent can be revised only as per the agreement or with notice permitted by the applicable state law.','India',NULL,'under_review'),
('Tenant Rights','Where do I file a tenancy dispute?','With the Rent Controller / Rent Authority of your district, or the civil court where no such authority exists.','India',NULL,'under_review'),
('Tenant Rights','Can a landlord enter my home without permission?','Generally the landlord must give prior notice (24 hours under the Model Tenancy Act) before visiting.','India',NULL,'under_review'),
('Employment Rights','What is the maternity leave entitlement?','26 weeks of paid maternity leave for eligible women employees (12 weeks from the third child onwards).','India',NULL,'under_review'),
('Employment Rights','Can my employer hold back my experience letter or salary after resignation?','Final dues must be settled as per law; you can complain to the Labour Commissioner for withheld wages.','India',NULL,'under_review'),
('Employment Rights','What is the time limit to file a POSH complaint?','Within 3 months of the incident, extendable by 3 more months by the committee for valid reasons.','India',NULL,'under_review'),
('Labour Rights','How do I get an e-Shram card?','Register free on eshram.gov.in or at a Common Service Centre using Aadhaar, a mobile number and bank details.','India','ee80ce1f-7207-42e3-936d-bdfb4c42c43e','verified'),
('Labour Rights','How do I check my PF balance?','Use the EPFO member passbook portal or UMANG app with your UAN, or give a missed call to 9966044425.','India','75ede8d9-8d4f-441a-8fd2-451e5dd443a1','verified'),
('Labour Rights','What are the working hour limits?','Normally up to 8 hours a day and 48 hours a week, with overtime paid at twice the ordinary rate.','India',NULL,'under_review'),
('Banking Fraud','What is the cyber fraud helpline number?','Dial 1930 or report at cybercrime.gov.in as soon as possible to help freeze the money trail.','India','6535b026-ecd4-433d-9d0f-de979380d529','verified'),
('Banking Fraud','How do I complain to the RBI Ombudsman?','File online at cms.rbi.org.in after complaining to your bank and waiting 30 days or receiving an unsatisfactory reply.','India','c7d731b2-ddb1-4591-8710-f48a76af4017','verified'),
('Banking Fraud','Will a bank ever ask for my OTP or PIN?','No. Banks never ask for OTP, PIN, CVV or passwords; never share them on calls, SMS or links.','India','c7d731b2-ddb1-4591-8710-f48a76af4017','verified'),
('Banking Fraud','What is my liability if I report fraud after 4–7 days?','Under RBI rules, limited liability applies (capped by account type); after 7 days it depends on the bank board-approved policy.','India','c7d731b2-ddb1-4591-8710-f48a76af4017','verified');