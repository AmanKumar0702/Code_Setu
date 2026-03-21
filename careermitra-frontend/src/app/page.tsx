"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
type Screen = "home" | "discover" | "analyzing" | "career" | "practice" | "quiz" | "quiz-result";
type Q = { q: string; options: string[]; answer: number; explanation: string; xp: number };
type UserData = { totalXP: number; streak: number; lastPlayed: string; bestStreak: number; quizzesCompleted: number; correctAnswers: number; totalAnswers: number; };

// ── Rank System ────────────────────────────────────────────────────────────────
const RANKS = [
  { name: "Rookie",   min: 0,    max: 199,   color: "#888780", bg: "rgba(136,135,128,.15)", icon: "🌱" },
  { name: "Explorer", min: 200,  max: 499,   color: "#5DCAA5", bg: "rgba(93,202,165,.15)",  icon: "🔍" },
  { name: "Learner",  min: 500,  max: 999,   color: "#378ADD", bg: "rgba(55,138,221,.15)",  icon: "📚" },
  { name: "Skilled",  min: 1000, max: 1999,  color: "#7F77DD", bg: "rgba(127,119,221,.15)", icon: "⚡" },
  { name: "Expert",   min: 2000, max: 3999,  color: "#EF9F27", bg: "rgba(239,159,39,.15)",  icon: "🔥" },
  { name: "Master",   min: 4000, max: 7999,  color: "#D85A30", bg: "rgba(216,90,48,.15)",   icon: "💎" },
  { name: "Legend",   min: 8000, max: Infinity, color: "#fbbf24", bg: "rgba(251,191,36,.15)", icon: "👑" },
];
const getRank = (xp: number) => RANKS.find(r => xp >= r.min && xp <= r.max) ?? RANKS[0];
const getNextRank = (xp: number) => { const i = RANKS.findIndex(r => xp >= r.min && xp <= r.max); return RANKS[i + 1] ?? null; };
const getXPProgress = (xp: number) => { const r = getRank(xp); const next = getNextRank(xp); if (!next) return 100; return Math.round(((xp - r.min) / (next.min - r.min)) * 100); };

// ── Default User ───────────────────────────────────────────────────────────────
const DEFAULT_USER: UserData = { totalXP: 0, streak: 0, lastPlayed: "", bestStreak: 0, quizzesCompleted: 0, correctAnswers: 0, totalAnswers: 0 };

// ── Career Data ────────────────────────────────────────────────────────────────
const careers: Record<string, Record<string, Record<string, { title: string; desc: string; skills: string[]; salary: string; emoji: string; roadmap: string[] }>>> = {
  coding: {
    beginner:     { logical: { title: "Web Developer", desc: "Build websites and web apps from scratch", skills: ["HTML/CSS", "JavaScript", "React"], salary: "₹4–8 LPA", emoji: "🌐", roadmap: ["Learn HTML & CSS basics", "JavaScript fundamentals", "Build 3 projects", "Learn React", "Apply for internships"] }, creative: { title: "Frontend Developer", desc: "Craft beautiful, interactive user interfaces", skills: ["React", "Tailwind", "Figma"], salary: "₹5–10 LPA", emoji: "🎨", roadmap: ["Master HTML/CSS", "Learn JavaScript", "Pick up React", "Study design basics in Figma", "Build a portfolio"] }, analytical: { title: "QA Engineer", desc: "Ensure software quality through testing", skills: ["Testing", "Selenium", "Python"], salary: "₹4–7 LPA", emoji: "🔍", roadmap: ["Learn software testing basics", "Pick up Python", "Study Selenium", "Practice manual testing", "Get ISTQB certified"] }, people: { title: "Tech Support Engineer", desc: "Bridge tech and users with expertise", skills: ["Troubleshooting", "Communication", "Networking"], salary: "₹3–6 LPA", emoji: "🤝", roadmap: ["Learn networking basics", "Get CompTIA A+ cert", "Practice troubleshooting", "Learn ticketing systems", "Build customer service skills"] } },
    intermediate: { logical: { title: "Full Stack Developer", desc: "Own the entire product from DB to UI", skills: ["Node.js", "React", "PostgreSQL"], salary: "₹8–18 LPA", emoji: "💻", roadmap: ["Master React & Node.js", "Learn PostgreSQL", "Build full-stack projects", "Study system design", "Contribute to open source"] }, creative: { title: "UI Engineer", desc: "Design systems and component libraries", skills: ["React", "Storybook", "CSS"], salary: "₹8–16 LPA", emoji: "✨", roadmap: ["Deep dive into CSS", "Learn Storybook", "Build a design system", "Study accessibility", "Create component library"] }, analytical: { title: "Backend Engineer", desc: "Build scalable APIs and microservices", skills: ["Node.js", "Docker", "AWS"], salary: "₹8–20 LPA", emoji: "⚙️", roadmap: ["Master Node.js", "Learn Docker", "Study AWS basics", "Build REST APIs", "Learn system design"] }, people: { title: "Technical Lead", desc: "Lead engineering teams to ship products", skills: ["Architecture", "Leadership", "Code Review"], salary: "₹15–30 LPA", emoji: "👑", roadmap: ["Deepen technical expertise", "Practice mentoring", "Study software architecture", "Learn agile/scrum", "Lead a team project"] } },
    advanced:     { logical: { title: "AI/ML Engineer", desc: "Build intelligent systems and models", skills: ["Python", "TensorFlow", "LLMs"], salary: "₹20–50 LPA", emoji: "🤖", roadmap: ["Master Python & math", "Study ML fundamentals", "Learn TensorFlow/PyTorch", "Build ML projects", "Study LLMs and fine-tuning"] }, creative: { title: "Creative Technologist", desc: "Merge art and engineering innovatively", skills: ["WebGL", "Three.js", "AI"], salary: "₹15–35 LPA", emoji: "🚀", roadmap: ["Learn WebGL/Three.js", "Study generative AI", "Build creative projects", "Follow creative coding community", "Build a portfolio site"] }, analytical: { title: "Data Engineer", desc: "Design data pipelines and infrastructure", skills: ["Spark", "Kafka", "Python"], salary: "₹18–40 LPA", emoji: "📊", roadmap: ["Master Python", "Learn Apache Spark", "Study Kafka", "Build data pipelines", "Get cloud certifications"] }, people: { title: "Engineering Manager", desc: "Scale engineering teams and culture", skills: ["Strategy", "People Mgmt", "OKRs"], salary: "₹30–60 LPA", emoji: "🏗️", roadmap: ["Build engineering depth", "Take leadership training", "Study OKR frameworks", "Manage a small team", "Read management books"] } },
  },
  design: {
    beginner:     { logical: { title: "Graphic Designer", desc: "Create visual content for brands", skills: ["Photoshop", "Illustrator", "Canva"], salary: "₹3–6 LPA", emoji: "🖼️", roadmap: ["Learn Photoshop basics", "Study color theory", "Pick up Illustrator", "Build a portfolio", "Freelance on small projects"] }, creative: { title: "UI Designer", desc: "Design beautiful app interfaces", skills: ["Figma", "Adobe XD", "Prototyping"], salary: "₹4–8 LPA", emoji: "🎨", roadmap: ["Master Figma", "Study UI principles", "Practice prototyping", "Learn from dribbble", "Redesign 5 existing apps"] }, analytical: { title: "Brand Designer", desc: "Build consistent brand identities", skills: ["Branding", "Typography", "Strategy"], salary: "₹3–7 LPA", emoji: "💡", roadmap: ["Study branding fundamentals", "Learn typography", "Analyze brand case studies", "Create a brand identity project", "Build client relationships"] }, people: { title: "Social Media Designer", desc: "Create engaging digital content", skills: ["Canva", "Video Editing", "Trends"], salary: "₹3–5 LPA", emoji: "📱", roadmap: ["Master Canva", "Learn basic video editing", "Study platform-specific design", "Build social media presence", "Offer freelance services"] } },
    intermediate: { logical: { title: "UX Designer", desc: "Research and design user experiences", skills: ["Figma", "User Research", "Prototyping"], salary: "₹7–15 LPA", emoji: "🔮", roadmap: ["Learn user research methods", "Master Figma advanced features", "Study information architecture", "Build a UX case study", "Get Google UX Design cert"] }, creative: { title: "Motion Designer", desc: "Bring designs to life with animation", skills: ["After Effects", "Lottie", "Figma"], salary: "₹6–14 LPA", emoji: "🎬", roadmap: ["Learn After Effects", "Study animation principles", "Pick up Lottie", "Create motion portfolio", "Learn 3D basics"] }, analytical: { title: "Product Designer", desc: "Design data-driven digital products", skills: ["Design Systems", "A/B Testing", "Analytics"], salary: "₹10–20 LPA", emoji: "📐", roadmap: ["Master design systems", "Learn A/B testing", "Study analytics tools", "Work on product decisions", "Build full product case studies"] }, people: { title: "Design Lead", desc: "Lead design teams and strategy", skills: ["Leadership", "Design Ops", "Strategy"], salary: "₹15–28 LPA", emoji: "👁️", roadmap: ["Build design expertise", "Learn design ops", "Practice design critique", "Mentor junior designers", "Study design leadership"] } },
    advanced:     { logical: { title: "Design Systems Architect", desc: "Build scalable design infrastructure", skills: ["Tokens", "Component API", "Documentation"], salary: "₹20–40 LPA", emoji: "🏛️", roadmap: ["Build a full design system", "Study design tokens", "Learn component API design", "Write comprehensive docs", "Contribute to open source design systems"] }, creative: { title: "Creative Director", desc: "Define the visual voice of companies", skills: ["Vision", "Strategy", "Brand Leadership"], salary: "₹25–50 LPA", emoji: "🌟", roadmap: ["Build strong portfolio", "Lead creative projects", "Study brand strategy", "Build a network", "Present at design conferences"] }, analytical: { title: "Head of UX", desc: "Own user experience across products", skills: ["Research Ops", "Strategy", "Team Leadership"], salary: "₹25–50 LPA", emoji: "🎯", roadmap: ["Build deep UX expertise", "Learn research ops", "Develop business acumen", "Lead cross-functional projects", "Define UX metrics and OKRs"] }, people: { title: "VP of Design", desc: "Scale design culture across org", skills: ["Executive Leadership", "Culture", "Vision"], salary: "₹40–80 LPA", emoji: "👑", roadmap: ["Build executive presence", "Study business strategy", "Build design culture", "Hire and grow teams", "Define company-wide design vision"] } },
  },
  data: {
    beginner:     { logical: { title: "Data Analyst", desc: "Turn raw data into business insights", skills: ["Excel", "SQL", "Power BI"], salary: "₹4–8 LPA", emoji: "📊", roadmap: ["Master Excel", "Learn SQL basics", "Pick up Power BI", "Complete a data project", "Get Google Data Analytics cert"] }, creative: { title: "Data Viz Expert", desc: "Make data beautiful and understood", skills: ["Tableau", "D3.js", "Storytelling"], salary: "₹5–9 LPA", emoji: "📈", roadmap: ["Learn Tableau", "Study data storytelling", "Pick up D3.js basics", "Build a visualization portfolio", "Present data insights regularly"] }, analytical: { title: "Business Analyst", desc: "Bridge data and business decisions", skills: ["SQL", "Excel", "Reporting"], salary: "₹4–8 LPA", emoji: "💼", roadmap: ["Master SQL", "Study business analysis", "Learn requirement gathering", "Practice stakeholder communication", "Get CBAP certification"] }, people: { title: "Market Research Analyst", desc: "Understand consumer behavior through data", skills: ["Research", "Statistics", "Surveys"], salary: "₹3–7 LPA", emoji: "🔎", roadmap: ["Study research methods", "Learn statistics basics", "Master survey tools", "Analyze consumer data", "Present market insights"] } },
    intermediate: { logical: { title: "Data Scientist", desc: "Build predictive models from data", skills: ["Python", "ML", "Statistics"], salary: "₹10–20 LPA", emoji: "🧠", roadmap: ["Master Python for data", "Study statistics deeply", "Learn ML algorithms", "Build prediction models", "Kaggle competitions"] }, creative: { title: "AI Product Manager", desc: "Drive AI products with data intuition", skills: ["Strategy", "Python basics", "AI literacy"], salary: "₹12–25 LPA", emoji: "🤖", roadmap: ["Understand ML concepts", "Study product management", "Learn AI product frameworks", "Build AI product roadmaps", "Work with data teams"] }, analytical: { title: "ML Engineer", desc: "Deploy machine learning at scale", skills: ["Python", "MLOps", "AWS"], salary: "₹12–25 LPA", emoji: "⚡", roadmap: ["Master Python ML libraries", "Learn MLOps practices", "Study cloud platforms", "Deploy ML models", "Build ML pipelines"] }, people: { title: "Data Product Manager", desc: "Build data products users love", skills: ["Strategy", "SQL", "Stakeholder Mgmt"], salary: "₹15–28 LPA", emoji: "🎯", roadmap: ["Learn product management", "Study data fundamentals", "Develop stakeholder skills", "Define data product vision", "Work cross-functionally"] } },
    advanced:     { logical: { title: "AI Research Scientist", desc: "Push the boundaries of AI/ML research", skills: ["Deep Learning", "Research Papers", "Math"], salary: "₹30–80 LPA", emoji: "🔬", roadmap: ["Deep dive into mathematics", "Study research papers daily", "Master deep learning", "Publish your own research", "Join top AI labs"] }, creative: { title: "Generative AI Engineer", desc: "Build next-gen AI creative tools", skills: ["LLMs", "Diffusion Models", "Fine-tuning"], salary: "₹25–60 LPA", emoji: "🌌", roadmap: ["Study transformer architecture", "Learn prompt engineering", "Master fine-tuning", "Build GenAI applications", "Stay current with research"] }, analytical: { title: "Principal Data Scientist", desc: "Define data science strategy at scale", skills: ["Leadership", "ML Platform", "Strategy"], salary: "₹30–70 LPA", emoji: "🏆", roadmap: ["Build deep ML expertise", "Learn platform engineering", "Develop strategic thinking", "Lead data science teams", "Define data science roadmap"] }, people: { title: "Chief Data Officer", desc: "Own data strategy across the company", skills: ["Executive", "Strategy", "Data Governance"], salary: "₹50–100 LPA", emoji: "👑", roadmap: ["Build executive skills", "Study data governance", "Develop business strategy", "Lead data transformation", "Build data culture"] } },
  },
  finance: {
    beginner:     { logical: { title: "Financial Analyst", desc: "Analyze financial data and reports", skills: ["Excel", "Accounting", "GST"], salary: "₹4–8 LPA", emoji: "💹", roadmap: ["Learn accounting basics", "Master Excel financial modeling", "Understand GST & taxation", "Study financial statements", "Get CA Foundation / CFA Level 1"] }, creative: { title: "FinTech Analyst", desc: "Shape financial products for the future", skills: ["Product", "Finance basics", "UX"], salary: "₹5–9 LPA", emoji: "📱", roadmap: ["Learn finance fundamentals", "Study product management", "Understand digital payments", "Analyze fintech products", "Build product thinking"] }, analytical: { title: "Credit Analyst", desc: "Assess creditworthiness and risk", skills: ["Risk", "Excel", "Financial Modelling"], salary: "₹4–7 LPA", emoji: "🏦", roadmap: ["Study credit analysis", "Master financial modelling", "Learn risk frameworks", "Analyze balance sheets", "Get FRM Part 1"] }, people: { title: "Financial Advisor", desc: "Guide clients to financial freedom", skills: ["CFP", "Communication", "Empathy"], salary: "₹4–8 LPA", emoji: "🤝", roadmap: ["Get CFP certification", "Study personal finance", "Build communication skills", "Learn investment products", "Build a client base"] } },
    intermediate: { logical: { title: "Investment Analyst", desc: "Research stocks and investment opportunities", skills: ["Valuation", "Bloomberg", "DCF"], salary: "₹8–20 LPA", emoji: "📈", roadmap: ["Master DCF valuation", "Learn Bloomberg terminal", "Study equity research", "Build financial models", "Pass CFA Level 2"] }, creative: { title: "FinTech Entrepreneur", desc: "Build the next Razorpay or Zerodha", skills: ["Product", "Finance", "Tech"], salary: "Unlimited 🚀", emoji: "🦄", roadmap: ["Identify fintech pain points", "Build MVP product", "Understand RBI regulations", "Raise seed funding", "Scale distribution"] }, analytical: { title: "Risk Manager", desc: "Protect companies from financial risks", skills: ["Risk Models", "FRM", "Stress Testing"], salary: "₹10–22 LPA", emoji: "🛡️", roadmap: ["Complete FRM Part 1 & 2", "Study risk modelling", "Learn stress testing", "Understand Basel norms", "Join risk management team"] }, people: { title: "Wealth Manager", desc: "Manage HNI client portfolios", skills: ["CFA", "Relationship Mgmt", "Asset Allocation"], salary: "₹10–25 LPA", emoji: "💎", roadmap: ["Get CFA designation", "Study asset allocation", "Build HNI network", "Learn estate planning", "Master client communication"] } },
    advanced:     { logical: { title: "Investment Banker", desc: "Lead M&A deals and IPOs", skills: ["IB", "Modelling", "MBA"], salary: "₹25–80 LPA", emoji: "🏛️", roadmap: ["Get top MBA degree", "Study M&A and LBOs", "Build financial modelling skills", "Network aggressively", "Join bulge bracket bank"] }, creative: { title: "Hedge Fund Manager", desc: "Run quantitative trading strategies", skills: ["Quant", "Python", "Math"], salary: "₹40–200 LPA", emoji: "⚡", roadmap: ["Master quantitative finance", "Learn algorithmic trading", "Study advanced mathematics", "Build trading strategies", "Join a quant fund"] }, analytical: { title: "Chief Risk Officer", desc: "Own enterprise risk strategy", skills: ["Leadership", "FRM/CFA", "Enterprise Risk"], salary: "₹40–80 LPA", emoji: "🔐", roadmap: ["Complete FRM + CFA", "Build enterprise risk expertise", "Study regulatory frameworks", "Lead risk transformation", "Develop executive presence"] }, people: { title: "Chief Financial Officer", desc: "Drive financial strategy of companies", skills: ["CA/MBA", "Leadership", "Strategy"], salary: "₹50–150 LPA", emoji: "👑", roadmap: ["Get CA or MBA Finance", "Build FP&A expertise", "Develop strategic thinking", "Lead financial transformation", "Build board-level presence"] } },
  },
  arts: {
    beginner:     { logical: { title: "Content Writer", desc: "Write compelling content for brands", skills: ["Writing", "SEO", "Research"], salary: "₹3–6 LPA", emoji: "✍️", roadmap: ["Build writing habit daily", "Learn SEO fundamentals", "Study copywriting", "Start a blog", "Pitch to publications"] }, creative: { title: "Content Creator", desc: "Build an audience on social media", skills: ["Video", "Editing", "Niche Building"], salary: "₹3–∞ LPA", emoji: "🎥", roadmap: ["Pick a content niche", "Post consistently for 90 days", "Learn basic video editing", "Study analytics", "Build brand partnerships"] }, analytical: { title: "Copywriter", desc: "Write words that sell products", skills: ["Copywriting", "Psychology", "A/B Testing"], salary: "₹3–8 LPA", emoji: "💬", roadmap: ["Study copywriting frameworks", "Read 'Ogilvy on Advertising'", "Practice writing ads", "Build a copy portfolio", "Work with marketing teams"] }, people: { title: "Community Manager", desc: "Build and nurture online communities", skills: ["Community Building", "Discord", "Events"], salary: "₹3–7 LPA", emoji: "👥", roadmap: ["Study community management", "Learn Discord/Slack platforms", "Organize online events", "Build engagement strategies", "Grow a community from scratch"] } },
    intermediate: { logical: { title: "Screenwriter", desc: "Write scripts for films and web series", skills: ["Screenplay", "Story Structure", "Final Draft"], salary: "₹5–20 LPA", emoji: "🎬", roadmap: ["Study three-act structure", "Learn screenplay format", "Write your first feature", "Join screenwriting groups", "Pitch to production houses"] }, creative: { title: "Filmmaker / Director", desc: "Tell powerful stories through film", skills: ["Direction", "Cinematography", "Storytelling"], salary: "₹6–∞ LPA", emoji: "🎞️", roadmap: ["Make short films consistently", "Study cinematography", "Learn film editing", "Submit to film festivals", "Build industry network"] }, analytical: { title: "Brand Strategist", desc: "Build brand narratives that resonate", skills: ["Brand Strategy", "Storytelling", "Market Research"], salary: "₹8–18 LPA", emoji: "🌟", roadmap: ["Study brand strategy frameworks", "Analyze successful brands", "Build brand strategy projects", "Learn consumer psychology", "Work at a branding agency"] }, people: { title: "Podcast Host", desc: "Build an audience through conversations", skills: ["Podcasting", "Audio Editing", "Interviewing"], salary: "₹4–∞ LPA", emoji: "🎙️", roadmap: ["Pick a podcast niche", "Launch and post 10 episodes", "Learn audio editing", "Book good guests", "Monetize through sponsorships"] } },
    advanced:     { logical: { title: "Creative Director", desc: "Define creative vision of studios/brands", skills: ["Creative Vision", "Team Leadership", "Brand Strategy"], salary: "₹20–60 LPA", emoji: "👁️", roadmap: ["Build exceptional portfolio", "Lead creative teams", "Study business strategy", "Present at creative conferences", "Define brand visual language"] }, creative: { title: "Award-winning Artist", desc: "Create timeless art that moves people", skills: ["Mastery", "Unique Voice", "Exhibition"], salary: "Limitless ✨", emoji: "🏆", roadmap: ["Develop unique artistic voice", "Create prolifically", "Submit to galleries and festivals", "Build collector relationships", "Teach and mentor others"] }, analytical: { title: "Chief Marketing Officer", desc: "Own brand and marketing at scale", skills: ["Brand Strategy", "Growth", "Leadership"], salary: "₹40–100 LPA", emoji: "🚀", roadmap: ["Master all marketing channels", "Build data-driven marketing", "Develop P&L ownership", "Lead marketing teams", "Define brand vision at scale"] }, people: { title: "Media Entrepreneur", desc: "Build the next BYJU's or TVF", skills: ["Business", "Content Strategy", "Vision"], salary: "Unlimited 🦄", emoji: "🌍", roadmap: ["Identify content market gap", "Build content business", "Grow audience aggressively", "Monetize multiple streams", "Build production company"] } },
  },
  healthcare: {
    beginner:     { logical: { title: "Medical Lab Technician", desc: "Run diagnostic tests and analyses", skills: ["DMLT", "Lab Techniques", "Pathology"], salary: "₹2–5 LPA", emoji: "🔬", roadmap: ["Complete DMLT course", "Learn lab safety", "Practice diagnostic techniques", "Get registered", "Join a diagnostic lab"] }, creative: { title: "Health Content Creator", desc: "Educate people about health online", skills: ["Medical Knowledge", "Video", "Social Media"], salary: "₹3–8 LPA", emoji: "💊", roadmap: ["Build medical knowledge base", "Start health content on Instagram", "Simplify complex health topics", "Build audience trust", "Partner with health brands"] }, analytical: { title: "Hospital Administrator", desc: "Manage hospital operations efficiently", skills: ["Healthcare Management", "Operations", "Finance"], salary: "₹3–7 LPA", emoji: "🏥", roadmap: ["Study healthcare management", "Learn hospital operations", "Understand medical billing", "Intern at hospital", "Get MHA degree"] }, people: { title: "Nurse / Healthcare Worker", desc: "Directly care for patients", skills: ["BSc Nursing", "Clinical Skills", "Empathy"], salary: "₹3–7 LPA", emoji: "❤️", roadmap: ["Complete BSc Nursing", "Intern in clinical settings", "Build patient care skills", "Get registered with NCI", "Specialize in a department"] } },
    intermediate: { logical: { title: "Doctor (MBBS)", desc: "Diagnose and treat patients", skills: ["Clinical Skills", "Diagnosis", "Patient Care"], salary: "₹8–25 LPA", emoji: "👨‍⚕️", roadmap: ["Complete MBBS", "Crack NEET PG", "Choose specialty", "Complete residency", "Build clinical practice"] }, creative: { title: "HealthTech Entrepreneur", desc: "Build the next Practo or 1mg", skills: ["Tech + Medicine", "Product", "Startup"], salary: "Unlimited 🚀", emoji: "🦄", roadmap: ["Identify healthcare pain points", "Learn product management", "Build health tech MVP", "Understand healthcare regulations", "Scale digital health platform"] }, analytical: { title: "Epidemiologist", desc: "Study and control disease outbreaks", skills: ["MPH", "Biostatistics", "Research"], salary: "₹8–20 LPA", emoji: "🌡️", roadmap: ["Get MPH degree", "Master biostatistics", "Study epidemiology methods", "Work in public health", "Publish epidemiological research"] }, people: { title: "Psychiatrist / Counselor", desc: "Support mental health of patients", skills: ["MD Psychiatry", "Counseling", "Empathy"], salary: "₹10–30 LPA", emoji: "🧠", roadmap: ["Complete MBBS + MD Psychiatry", "Study counseling techniques", "Build therapeutic relationships", "Develop mental health programs", "Work in hospitals or private practice"] } },
    advanced:     { logical: { title: "Specialist Surgeon", desc: "Perform complex surgical procedures", skills: ["MCh/MS", "Surgical Skills", "Specialty"], salary: "₹25–100 LPA", emoji: "⚕️", roadmap: ["Complete MS/MCh", "Master surgical techniques", "Publish research papers", "Build referral network", "Join top surgical institute"] }, creative: { title: "Medical Researcher", desc: "Discover cures and new treatments", skills: ["PhD", "Research Methodology", "Grant Writing"], salary: "₹15–40 LPA", emoji: "🔭", roadmap: ["Complete MD or PhD", "Join research lab", "Write and publish papers", "Apply for research grants", "Present at international conferences"] }, analytical: { title: "Chief Medical Officer", desc: "Lead medical strategy in organizations", skills: ["MD + MBA", "Leadership", "Healthcare Policy"], salary: "₹40–100 LPA", emoji: "👑", roadmap: ["Complete MD + MBA", "Build clinical leadership skills", "Study healthcare policy", "Lead hospital departments", "Shape medical strategy at scale"] }, people: { title: "Global Health Leader", desc: "Shape health policy at national scale", skills: ["MPH", "WHO", "Policy Development"], salary: "₹30–80 LPA", emoji: "🌍", roadmap: ["Get MPH or DrPH", "Work with WHO/UNICEF", "Study global health policy", "Build international network", "Lead health policy reform"] } },
  },
  business: {
    beginner:     { logical: { title: "Business Analyst", desc: "Analyze business processes and data", skills: ["Excel", "SQL", "Communication"], salary: "₹4–8 LPA", emoji: "📋", roadmap: ["Master Excel and SQL", "Study business analysis", "Learn requirement gathering", "Get ECBA certification", "Work on process improvement"] }, creative: { title: "Marketing Executive", desc: "Drive brand awareness and campaigns", skills: ["Digital Marketing", "Social Media", "Content"], salary: "₹3–7 LPA", emoji: "📣", roadmap: ["Learn digital marketing", "Get Google Ads certified", "Study content strategy", "Run marketing campaigns", "Build analytics skills"] }, analytical: { title: "Operations Analyst", desc: "Optimize business operations", skills: ["Process Improvement", "Excel", "Lean Six Sigma"], salary: "₹4–8 LPA", emoji: "⚙️", roadmap: ["Study operations management", "Learn Lean Six Sigma", "Master process mapping", "Get Green Belt certification", "Join operations team"] }, people: { title: "HR Executive", desc: "Hire and grow talent in companies", skills: ["Recruitment", "HRMS", "People Skills"], salary: "₹3–6 LPA", emoji: "🤝", roadmap: ["Study HR management", "Learn recruitment tools", "Understand labour laws", "Get SHRM certification", "Join HR team"] } },
    intermediate: { logical: { title: "Product Manager", desc: "Build products millions of people use", skills: ["Product Strategy", "Data Analysis", "Roadmapping"], salary: "₹10–25 LPA", emoji: "🎯", roadmap: ["Study product management", "Learn user research", "Build product roadmaps", "Work on PRDs", "Get APM or PM role"] }, creative: { title: "Growth Hacker", desc: "Scale startups with creative strategies", skills: ["Growth Loops", "A/B Testing", "Analytics"], salary: "₹8–20 LPA", emoji: "🚀", roadmap: ["Study growth frameworks", "Learn A/B testing", "Master analytics tools", "Run growth experiments", "Build referral programs"] }, analytical: { title: "Strategy Consultant", desc: "Solve complex business problems", skills: ["Frameworks", "Excel Modelling", "Presentations"], salary: "₹12–30 LPA", emoji: "♟️", roadmap: ["Study consulting frameworks", "Master case interviews", "Build Excel modelling skills", "Get MBA from top school", "Join top consulting firm"] }, people: { title: "Sales Manager", desc: "Lead teams to close big deals", skills: ["Sales Strategy", "CRM", "Team Leadership"], salary: "₹10–25 LPA", emoji: "💼", roadmap: ["Build sales expertise", "Learn CRM tools", "Study negotiation", "Lead a sales team", "Develop enterprise sales skills"] } },
    advanced:     { logical: { title: "Startup Founder / CEO", desc: "Build companies that change the world", skills: ["Vision", "Leadership", "Fundraising"], salary: "Unlimited 🦄", emoji: "🏆", roadmap: ["Identify a real problem", "Build MVP fast", "Get first paying customers", "Raise funding", "Scale aggressively"] }, creative: { title: "Chief Marketing Officer", desc: "Own brand strategy at scale", skills: ["Brand Building", "Growth", "Executive Leadership"], salary: "₹40–100 LPA", emoji: "🌟", roadmap: ["Build deep marketing expertise", "Lead brand transformation", "Develop P&L ownership", "Build marketing org", "Define category leadership"] }, analytical: { title: "Management Consultant (MBB)", desc: "Advise Fortune 500 companies", skills: ["Problem Solving", "MBA", "Executive Communication"], salary: "₹30–80 LPA", emoji: "♟️", roadmap: ["Get top MBA", "Join McKinsey/BCG/Bain", "Master consulting frameworks", "Build industry expertise", "Move to industry leadership"] }, people: { title: "Chief People Officer", desc: "Build culture at the highest level", skills: ["Culture Building", "OKRs", "Executive Presence"], salary: "₹40–80 LPA", emoji: "👑", roadmap: ["Build deep HR expertise", "Study organizational design", "Lead culture transformation", "Develop executive presence", "Shape company values at scale"] } },
  },
};

// ── Quiz Bank ──────────────────────────────────────────────────────────────────
const quizBank: Record<string, Record<string, Q[]>> = {
  coding: {
    beginner: [
      { q: "What does HTML stand for?", options: ["Hyper Text Markup Language","High Tech Modern Language","Hyperlink and Text Markup Language","Home Tool Markup Language"], answer: 0, explanation: "HTML = Hyper Text Markup Language. It's the skeleton of every webpage you've ever visited.", xp: 10 },
      { q: "Which CSS property changes text color?", options: ["font-color","text-color","color","background-color"], answer: 2, explanation: "The 'color' property in CSS sets text color. 'background-color' sets the background, not the text!", xp: 10 },
      { q: "Which is a valid JavaScript variable declaration?", options: ["variable x = 5","int x = 5","let x = 5","define x = 5"], answer: 2, explanation: "'let', 'const', and 'var' are the three ways to declare variables in JavaScript. No other keywords work!", xp: 10 },
      { q: "What does the <a> tag do in HTML?", options: ["Adds an image","Creates a hyperlink","Makes text bold","Creates a list"], answer: 1, explanation: "The <a> (anchor) tag creates clickable hyperlinks. Use href='url' to set the destination.", xp: 15 },
      { q: "Which symbol is used for single-line comments in JavaScript?", options: ["<!-- -->","##","//","**"], answer: 2, explanation: "// is a single-line comment in JavaScript. /* */ is for multi-line. HTML uses <!-- --> for comments.", xp: 10 },
      { q: "What does CSS stand for?", options: ["Computer Style Sheets","Creative Style Syntax","Cascading Style Sheets","Colorful Styling System"], answer: 2, explanation: "CSS = Cascading Style Sheets. The 'cascading' part means styles can inherit and override each other.", xp: 10 },
      { q: "Which HTML tag creates the largest heading?", options: ["<h6>","<heading>","<h1>","<title>"], answer: 2, explanation: "<h1> is the largest heading. HTML has six levels: <h1> to <h6>. Search engines give h1 the most importance.", xp: 10 },
    ],
    intermediate: [
      { q: "What is a REST API?", options: ["A database type","A set of rules for building web services","A JavaScript framework","A CSS preprocessor"], answer: 1, explanation: "REST (Representational State Transfer) is an architectural style for web services using standard HTTP methods like GET, POST, PUT, DELETE.", xp: 20 },
      { q: "What does 'async/await' do in JavaScript?", options: ["Runs code faster","Handles asynchronous operations cleanly","Creates animations","Defines class methods"], answer: 1, explanation: "async/await makes Promise-based async code look synchronous — it's syntactic sugar that avoids callback hell.", xp: 20 },
      { q: "Which HTTP method is used to CREATE a resource?", options: ["GET","DELETE","PUT","POST"], answer: 3, explanation: "POST creates. GET reads. PUT updates (replaces). PATCH partially updates. DELETE removes. This is REST convention.", xp: 20 },
      { q: "What is the purpose of 'useEffect' in React?", options: ["Define component style","Handle side effects like API calls","Manage routing","Create reusable components"], answer: 1, explanation: "useEffect runs side effects after render — perfect for API calls, subscriptions, timers, and DOM manipulation.", xp: 25 },
      { q: "What does SQL stand for?", options: ["System Query Language","Structured Query Language","Simple Query Logic","Sequential Query Language"], answer: 1, explanation: "SQL = Structured Query Language. It's used to manage and query relational databases like PostgreSQL and MySQL.", xp: 20 },
      { q: "What is 'closure' in JavaScript?", options: ["A way to close the browser","A function accessing its outer scope after it returns","An error handling mechanism","A type of loop"], answer: 1, explanation: "A closure is when a function remembers variables from its outer (enclosing) scope, even after that outer function has returned.", xp: 30 },
      { q: "What is the 'virtual DOM' in React?", options: ["A fake browser","A lightweight copy of the real DOM used for efficient updates","An HTML template","A testing environment"], answer: 1, explanation: "React's virtual DOM is a JavaScript representation of the real DOM. React diffs it to update only what changed — making updates faster.", xp: 25 },
    ],
    advanced: [
      { q: "What is a Docker container?", options: ["A type of database","A lightweight isolated runtime environment","A cloud storage service","A CSS framework"], answer: 1, explanation: "Docker containers package apps with all dependencies into isolated environments — 'works on my machine' solved forever.", xp: 30 },
      { q: "What does 'O(n log n)' represent?", options: ["Constant time","Linear time","Linearithmic time complexity","Quadratic time"], answer: 2, explanation: "O(n log n) is linearithmic — typical of efficient sorting algorithms like merge sort and heap sort. Much faster than O(n²).", xp: 35 },
      { q: "What is a microservices architecture?", options: ["A single deployable unit","Breaking an app into small independent services","A mobile development pattern","A CSS methodology"], answer: 1, explanation: "Microservices split apps into small, independently deployable services. Netflix, Amazon, and Uber all use microservices at scale.", xp: 30 },
      { q: "What is a JWT token used for?", options: ["Styling web pages","Encrypting databases","Authenticating and exchanging information securely","Compressing images"], answer: 2, explanation: "JWT (JSON Web Token) is a signed token with header.payload.signature. Used for stateless authentication — the server doesn't need to store session data.", xp: 30 },
      { q: "In ML, what is 'overfitting'?", options: ["Model too simple","Model memorizes training data but fails on new data","Model trains too slowly","Model uses too little data"], answer: 1, explanation: "Overfitting: model learns training data so well it can't generalize. Fix it with more data, dropout, regularization, or simpler models.", xp: 35 },
      { q: "What is 'event loop' in Node.js?", options: ["A for loop that repeats","A mechanism handling async operations in single-threaded JS","A type of HTTP request","An error handling pattern"], answer: 1, explanation: "Node.js is single-threaded but non-blocking. The event loop processes callbacks from the queue, allowing async operations without blocking.", xp: 40 },
      { q: "What does CAP theorem state?", options: ["Code, API, and Performance can't all be perfect","In distributed systems, you can't have Consistency, Availability AND Partition tolerance simultaneously","CSS, APIs, and PHP are the web stack","Computers Always Perform differently"], answer: 1, explanation: "CAP theorem: distributed systems can only guarantee 2 of 3 — Consistency, Availability, Partition Tolerance. Choose your trade-offs wisely.", xp: 40 },
    ],
  },
  design: {
    beginner: [
      { q: "What does UX stand for?", options: ["Universal Experience","User Experience","Unique Execution","User Extension"], answer: 1, explanation: "UX = User Experience. It encompasses everything about how a user interacts with and feels about a product.", xp: 10 },
      { q: "Which tool is the industry standard for UI design in 2024?", options: ["Photoshop","Excel","Figma","PowerPoint"], answer: 2, explanation: "Figma dominates UI/UX design — collaborative, browser-based, and free to start. Most design teams use it.", xp: 10 },
      { q: "What is a wireframe?", options: ["A finished design","A basic layout sketch of a UI","A color palette","A font collection"], answer: 1, explanation: "Wireframes are low-fidelity skeletal blueprints. No colors, no fonts — just structure and layout to test ideas fast.", xp: 10 },
      { q: "What does 'white space' mean in design?", options: ["White background only","Empty space between elements","Light color palette","A blank canvas"], answer: 1, explanation: "White space (negative space) is the breathing room between elements. It reduces cognitive load and makes designs feel premium.", xp: 10 },
      { q: "What is the purpose of a 'prototype' in design?", options: ["Final product","Interactive simulation to test user flows","A design specification","A color system"], answer: 1, explanation: "Prototypes simulate the real product to test interactions and user flows — before spending time on actual development.", xp: 15 },
      { q: "What are the primary colors in traditional color theory?", options: ["Red, Green, Blue","Red, Yellow, Blue","Cyan, Magenta, Yellow","Orange, Green, Purple"], answer: 1, explanation: "Traditional primaries: Red, Yellow, Blue. Digital (RGB) uses Red, Green, Blue. Printing uses CMYK: Cyan, Magenta, Yellow, Black.", xp: 10 },
      { q: "What does 'sans-serif' mean in typography?", options: ["With decorative strokes at letter ends","Without decorative strokes at letter ends","Bold font style","Italicized font"], answer: 1, explanation: "'Sans' is French for 'without'. Sans-serif fonts (like Helvetica, Inter) have no decorative serifs — clean and modern.", xp: 10 },
    ],
    intermediate: [
      { q: "What is a design system?", options: ["A project management tool","A collection of reusable components and guidelines","A color theory framework","A prototyping technique"], answer: 1, explanation: "A design system is a single source of truth — reusable components, tokens, guidelines that keep products consistent at scale.", xp: 20 },
      { q: "What is 'kerning' in typography?", options: ["Font weight","Space between individual character pairs","Line height","Font size"], answer: 1, explanation: "Kerning adjusts space between specific character pairs (like AV, To) for optical balance. Tracking adjusts spacing across a whole word.", xp: 20 },
      { q: "What does 'responsive design' mean?", options: ["Fast loading design","Design that adapts to different screen sizes","Interactive animations","Minimal design style"], answer: 1, explanation: "Responsive design uses flexible grids, fluid images, and media queries so layouts adapt to any screen size seamlessly.", xp: 20 },
      { q: "What is a 'user persona'?", options: ["A brand mascot","A fictional research-based representation of your target user","An avatar in a game","A user profile photo"], answer: 1, explanation: "Personas are fictional characters built from real user research — demographics, goals, frustrations. They keep teams focused on real people.", xp: 25 },
      { q: "What is 'information architecture' (IA)?", options: ["Building architecture","Organizing and structuring content for usability","Software architecture","A design pattern"], answer: 1, explanation: "IA is the art of organizing information so users can find what they need. Sitemaps, navigation, and labeling are all IA.", xp: 25 },
      { q: "What is A/B testing in design?", options: ["Testing two color palettes","Showing two design variants to users and measuring which performs better","Testing on two devices","Alpha and Beta testing phases"], answer: 1, explanation: "A/B testing shows variant A to some users and variant B to others — data shows which design achieves your goals better.", xp: 20 },
      { q: "What is 'accessibility' in design (a11y)?", options: ["Making apps available offline","Designing for users with disabilities","Fast loading design","Mobile-first design"], answer: 1, explanation: "Accessibility ensures products work for everyone including users with visual, hearing, motor, or cognitive disabilities — WCAG guidelines define standards.", xp: 25 },
    ],
    advanced: [
      { q: "What is 'design debt'?", options: ["Unpaid design tool subscriptions","Accumulated inconsistencies from quick design shortcuts","A design team budget issue","Technical bugs in UI"], answer: 1, explanation: "Design debt accumulates when shortcuts bypass proper process — inconsistencies pile up, slowing future work. Like technical debt, it must be paid down.", xp: 30 },
      { q: "What is a 'design token'?", options: ["A UI component","Named variables storing design decisions like colors and spacing","A payment element in UI","An icon set"], answer: 1, explanation: "Design tokens are named variables (--color-primary: #534AB7) that store design decisions. They enable theming and consistency across platforms.", xp: 35 },
      { q: "What is 'cognitive load' in UX?", options: ["User's physical effort","Mental effort required to use an interface","Page loading time","Number of features in a product"], answer: 1, explanation: "Cognitive load is the mental processing power users spend understanding your interface. Great UX minimizes unnecessary cognitive load.", xp: 30 },
      { q: "What is Gestalt's 'proximity' principle?", options: ["Similar elements look related","Elements close together are perceived as a group","Symmetrical layouts are preferred","Simpler shapes are remembered better"], answer: 1, explanation: "Proximity: elements near each other are perceived as related. This is why you group form labels with inputs, and related nav items together.", xp: 30 },
      { q: "What is 'atomic design' methodology?", options: ["Minimal design style","Building UIs from atoms → molecules → organisms → templates → pages","Nuclear-themed UI patterns","Mobile-first design approach"], answer: 1, explanation: "Brad Frost's atomic design: Atoms (button) → Molecules (search bar) → Organisms (header) → Templates → Pages. Enables scalable design systems.", xp: 35 },
      { q: "What is 'progressive disclosure' in UX?", options: ["Gradually loading images","Showing only necessary information initially, revealing more as needed","A loading animation pattern","A typography technique"], answer: 1, explanation: "Progressive disclosure reduces overwhelm by showing only what's needed now, revealing complexity when users need it. Tooltips, accordions, and steppers all use this.", xp: 35 },
      { q: "What is the 'Fitts's Law' in UX?", options: ["Screen size determines usability","Time to acquire a target depends on distance and size","Users read left-to-right","Color determines action"], answer: 1, explanation: "Fitts's Law: the larger and closer a target is, the faster it can be clicked. This is why mobile buttons should be large, and why Mac's menu bar is at the screen edge.", xp: 40 },
    ],
  },
  data: {
    beginner: [
      { q: "What does SQL SELECT do?", options: ["Deletes records","Retrieves data from a database","Updates records","Creates a table"], answer: 1, explanation: "SELECT retrieves data. The full CRUD in SQL: SELECT (Read), INSERT (Create), UPDATE, DELETE. Remember — SELECT never modifies data.", xp: 10 },
      { q: "What Excel formula calculates average?", options: ["=SUM()","=COUNT()","=AVERAGE()","=MEAN()"], answer: 2, explanation: "=AVERAGE() calculates mean. =SUM() adds, =COUNT() counts numbers, =COUNTA() counts non-empty cells. There's no =MEAN() in Excel.", xp: 10 },
      { q: "What does a bar chart best show?", options: ["Trends over time","Comparisons between categories","Part-to-whole relationships","Correlations between two variables"], answer: 1, explanation: "Bar charts compare values across categories. Line charts show trends. Pie charts show proportions. Scatter plots show correlation.", xp: 10 },
      { q: "What is 'data cleaning'?", options: ["Deleting all data","Fixing errors and inconsistencies in data","Backing up data","Encrypting data"], answer: 1, explanation: "Data cleaning removes/fixes incorrect, duplicate, missing, or improperly formatted data. It's typically 60-80% of a data analyst's work!", xp: 10 },
      { q: "What does KPI stand for?", options: ["Key Product Indicator","Key Performance Indicator","Knowledge Processing Index","Key Process Integration"], answer: 1, explanation: "KPI = Key Performance Indicator. A measurable value showing how effectively you're achieving objectives. Good KPIs are specific, measurable, and time-bound.", xp: 10 },
      { q: "What is a 'pivot table' in Excel?", options: ["A table that rotates","A tool to summarize and analyze large data sets","A chart type","A database table"], answer: 1, explanation: "Pivot tables let you summarize thousands of rows into a clean summary — grouping, counting, summing data by categories with just drag and drop.", xp: 15 },
      { q: "What does 'dashboard' mean in data analytics?", options: ["A car dashboard","A visual display of key metrics and data in one place","A database interface","A data export tool"], answer: 1, explanation: "A dashboard aggregates key metrics into one visual interface — like Google Analytics, Power BI, or Tableau dashboards — for quick insight.", xp: 10 },
    ],
    intermediate: [
      { q: "What is a JOIN in SQL?", options: ["Adds a new column","Combines rows from two or more tables based on a related column","Deletes duplicate rows","Groups rows by value"], answer: 1, explanation: "JOIN combines tables. INNER JOIN returns matching rows. LEFT JOIN returns all left rows. RIGHT JOIN all right rows. FULL JOIN all rows from both.", xp: 20 },
      { q: "What is 'supervised learning' in ML?", options: ["Learning from unlabeled data","Training on labeled data where each input has a known correct output","Learning without any data","Learning from the internet"], answer: 1, explanation: "Supervised learning uses labeled training data. Unsupervised learns patterns without labels. Reinforcement learns from rewards and penalties.", xp: 20 },
      { q: "What is a 'null value' in a database?", options: ["Zero","Empty string","Missing or unknown value","False boolean"], answer: 2, explanation: "NULL means the value is unknown or inapplicable — not zero, not empty string. NULL ≠ NULL in SQL, which is why you use IS NULL, not = NULL.", xp: 20 },
      { q: "What does 'correlation' mean in statistics?", options: ["Causation between variables","Statistical relationship strength between two variables","The average of a dataset","The spread of data"], answer: 1, explanation: "Correlation measures relationship strength (-1 to +1). +1 = perfect positive, -1 = perfect negative, 0 = no linear relationship. Correlation ≠ causation!", xp: 25 },
      { q: "What is 'data normalization'?", options: ["Deleting outliers","Scaling numeric data to a standard range","Visualizing data","Backing up data"], answer: 1, explanation: "Normalization scales features to a common range (0-1 or -1 to 1) so no single feature dominates models just because of its scale.", xp: 20 },
      { q: "What is a 'P-value' in statistics?", options: ["Percentage of correct predictions","Probability of getting results at least as extreme as observed, assuming null hypothesis is true","The correlation coefficient","Sample size required"], answer: 1, explanation: "P-value < 0.05 means results are statistically significant (unlikely due to chance). It's one of the most misunderstood concepts in statistics!", xp: 30 },
      { q: "What is 'feature selection' in ML?", options: ["Selecting which algorithm to use","Choosing the most relevant input variables to improve model performance","Selecting training data size","Picking model parameters"], answer: 1, explanation: "Feature selection removes irrelevant or redundant variables — reducing overfitting, improving accuracy, and making models faster to train.", xp: 25 },
    ],
    advanced: [
      { q: "What is a 'neural network'?", options: ["A database structure","A computing system with interconnected nodes inspired by the brain","A network protocol","A cloud service type"], answer: 1, explanation: "Neural networks have input layers, hidden layers, and output layers. Each connection has a weight. Training adjusts weights to minimize prediction error.", xp: 30 },
      { q: "What is 'gradient descent'?", options: ["A visualization technique","An iterative optimization algorithm to minimize loss functions","A data cleaning step","A database query method"], answer: 1, explanation: "Gradient descent moves in the direction of steepest descent on the loss surface. Learning rate controls step size. Variants: SGD, Adam, RMSprop.", xp: 35 },
      { q: "What is a 'confusion matrix'?", options: ["A complex SQL query","A table showing TP, FP, TN, FN to evaluate classifier performance","A data visualization type","A neural network layer type"], answer: 1, explanation: "Confusion matrix shows: True Positives, False Positives, True Negatives, False Negatives. Precision = TP/(TP+FP). Recall = TP/(TP+FN).", xp: 30 },
      { q: "What is 'feature engineering'?", options: ["Building ML infrastructure","Creating new meaningful input features from raw data to improve models","Testing model performance","Deploying models to production"], answer: 1, explanation: "Feature engineering transforms raw data into model-useful inputs — extracting day-of-week from dates, log-transforming skewed features, creating interaction terms.", xp: 35 },
      { q: "What does 'ETL' stand for in data engineering?", options: ["Execute, Transform, Load","Extract, Transform, Load","Evaluate, Test, Launch","Export, Transfer, Link"], answer: 1, explanation: "ETL: Extract from sources, Transform (clean, aggregate, format), Load into warehouse. Modern ELT loads first then transforms — better for cloud warehouses.", xp: 30 },
      { q: "What is 'attention mechanism' in transformers?", options: ["Keeping user attention on UI","Allowing models to weigh importance of different input parts when producing output","A training optimization technique","A data augmentation method"], answer: 1, explanation: "Attention allows the model to focus on relevant parts of input when generating each output. 'Attention is All You Need' (2017) paper revolutionized NLP.", xp: 40 },
      { q: "What is 'data lakehouse' architecture?", options: ["A database stored in a lake region","Combining data lake flexibility with data warehouse structure and ACID transactions","A water-based cooling system for servers","A real-time streaming architecture"], answer: 1, explanation: "Lakehouse (Databricks concept) stores raw data cheaply like a lake but adds schema enforcement and ACID transactions like a warehouse. Best of both worlds.", xp: 40 },
    ],
  },
  finance: {
    beginner: [
      { q: "What is a 'balance sheet'?", options: ["A profit/loss statement","A snapshot of assets, liabilities and equity at a point in time","A cash flow report","An annual budget plan"], answer: 1, explanation: "Balance sheet: Assets = Liabilities + Equity. It shows what a company OWNS (assets), OWES (liabilities), and the owner's stake (equity).", xp: 10 },
      { q: "What does SIP stand for in investing?", options: ["Systematic Investment Plan","Stock Investment Portfolio","Simple Interest Plan","Secured Investment Product"], answer: 0, explanation: "SIP = Systematic Investment Plan. Invest a fixed amount regularly (monthly) in mutual funds — reduces timing risk through rupee-cost averaging.", xp: 10 },
      { q: "What is 'interest rate'?", options: ["Tax on income","The cost of borrowing money, expressed as a percentage","Profit from stocks","Currency exchange rate"], answer: 1, explanation: "Interest rate is what you pay to borrow money or earn on savings. RBI's repo rate influences all other interest rates in India.", xp: 10 },
      { q: "What is the Sensex?", options: ["A US stock index","BSE's benchmark stock index tracking 30 large Indian companies","A financial news channel","A type of mutual fund"], answer: 1, explanation: "Sensex (Sensitive Index) tracks 30 large, well-established companies on the Bombay Stock Exchange. Nifty 50 tracks 50 companies on NSE.", xp: 10 },
      { q: "What does 'liquidity' mean in finance?", options: ["Amount of profit","How easily an asset can be converted to cash without losing value","Total assets of a company","A stock market index"], answer: 1, explanation: "Liquidity measures how quickly you can convert an asset to cash. Cash is most liquid. Real estate is illiquid. Stocks are somewhere in between.", xp: 10 },
      { q: "What is 'inflation'?", options: ["Stock market growth","General increase in prices over time reducing purchasing power","Corporate tax rate","Bank interest rate"], answer: 1, explanation: "Inflation erodes purchasing power — ₹100 today buys less than ₹100 five years ago. RBI targets 4% inflation (±2%). India's CPI tracks this.", xp: 10 },
      { q: "What is a 'mutual fund'?", options: ["A loan between friends","A pooled investment vehicle managed by professionals","A government bond","A bank fixed deposit"], answer: 1, explanation: "Mutual funds pool money from many investors and invest in diversified assets. SEBI regulates them. Expense ratio is the annual management fee.", xp: 10 },
    ],
    intermediate: [
      { q: "What is 'compound interest'?", options: ["Interest on principal only","Interest calculated on principal PLUS previously accumulated interest","A type of bank loan","A fixed deposit scheme"], answer: 1, explanation: "Compound interest: your interest earns interest! ₹1L at 12% compound annual = ₹3.1L in 10 years. Simple interest would give only ₹2.2L.", xp: 20 },
      { q: "What is a P/E ratio?", options: ["Profit to Expense ratio","Price-to-Earnings ratio comparing share price to earnings per share","Principal to Equity ratio","Product to Earnings ratio"], answer: 1, explanation: "P/E = Share Price ÷ EPS. High P/E = expensive stock or high growth expectations. Low P/E = cheap or low growth. Compare within same sector.", xp: 25 },
      { q: "What is 'short selling'?", options: ["Selling small quantities of stock","Borrowing a stock, selling it, then buying it back lower to profit from price decline","Selling stocks quickly on same day","A long-term investment strategy"], answer: 1, explanation: "Short selling profits from falling prices. Borrow stock → sell high → buy back low → return stock → keep difference. High risk if price rises!", xp: 25 },
      { q: "What does SEBI regulate?", options: ["Banking sector in India","Securities and capital markets in India","Insurance companies","Foreign exchange markets"], answer: 1, explanation: "SEBI (Securities and Exchange Board of India) is India's capital markets regulator — protecting investors and regulating exchanges, brokers, and mutual funds.", xp: 20 },
      { q: "What is 'diversification' in investing?", options: ["Investing all money in one stock","Spreading investments across different assets to reduce risk","Day trading strategy","Investing only in index funds"], answer: 1, explanation: "Diversification spreads risk — 'don't put all eggs in one basket'. Combine equities, debt, gold, and real estate. Correlation matters: uncorrelated assets diversify best.", xp: 20 },
      { q: "What is 'working capital'?", options: ["Capital invested in office equipment","Current Assets minus Current Liabilities — measures short-term liquidity","Total company assets","Annual revenue"], answer: 1, explanation: "Working capital = Current Assets - Current Liabilities. Positive = can cover short-term obligations. Negative = liquidity crisis risk. Critical for business health.", xp: 25 },
      { q: "What is 'EBITDA'?", options: ["A type of tax","Earnings Before Interest, Taxes, Depreciation, and Amortization","A financial ratio","An accounting standard"], answer: 1, explanation: "EBITDA measures operational profitability before financing decisions and accounting conventions. Used to compare companies regardless of debt structure or depreciation methods.", xp: 25 },
    ],
    advanced: [
      { q: "What is 'DCF valuation'?", options: ["Debt to Cash Flow analysis","Discounted Cash Flow — valuing a company by discounting future cash flows to present value","Daily Cash Flow reporting","Diversified Capital Fund"], answer: 1, explanation: "DCF: estimate future free cash flows → discount at WACC → sum to get intrinsic value. Most theoretically sound valuation method, but highly sensitive to assumptions.", xp: 30 },
      { q: "What is 'beta' in portfolio management?", options: ["A type of bond","Measure of a stock's volatility relative to the market — market beta = 1","A portfolio diversification metric","Expected return of a portfolio"], answer: 1, explanation: "Beta > 1 = more volatile than market. Beta < 1 = less volatile. Beta = 0 = uncorrelated (like gold). Negative beta = inverse correlation (like some put options).", xp: 35 },
      { q: "What is the 'Black-Scholes model'?", options: ["A credit rating model","Mathematical model for pricing European options using volatility, time, and price","A portfolio optimization method","A tax calculation formula"], answer: 1, explanation: "Black-Scholes (1973) revolutionized finance. Inputs: stock price, strike price, time, risk-free rate, volatility (sigma). Solved the 'fair price of an option' problem.", xp: 35 },
      { q: "What is 'quantitative easing' (QE)?", options: ["Reducing government spending","Central bank buying securities to inject money into economy and lower long-term rates","Raising the repo rate","Increasing tax collection"], answer: 1, explanation: "QE: central bank creates money to buy government bonds and other securities — lowering rates, injecting liquidity. Used by Fed, ECB post-2008 and during COVID.", xp: 35 },
      { q: "What is 'CAPM'?", options: ["Capital Asset Pricing Model — relating expected return to systematic risk","Cash Asset Portfolio Management","Credit Approval Process Model","Capital Appreciation Price Method"], answer: 0, explanation: "CAPM: Expected Return = Risk-free rate + Beta × (Market return - Risk-free rate). Tells you if a stock's expected return justifies its systematic risk.", xp: 35 },
      { q: "What is 'duration' in bond investing?", options: ["How long a bond has been held","Sensitivity of bond price to interest rate changes","Time to bond maturity","Annual coupon payment frequency"], answer: 1, explanation: "Duration measures bond price sensitivity to rate changes. Duration of 5 means a 1% rate rise drops price ~5%. Higher duration = more interest rate risk.", xp: 40 },
      { q: "What is 'gamma' in options trading?", options: ["Risk-free rate","Rate of change of delta — how fast delta changes as underlying price moves","Options premium","Implied volatility measure"], answer: 1, explanation: "Gamma measures how fast delta changes. High gamma = delta changes quickly as price moves. Important for options market makers managing delta-hedged positions.", xp: 40 },
    ],
  },
  arts: {
    beginner: [
      { q: "What does 'SEO' mean for content creators?", options: ["Social Engagement Online","Search Engine Optimization — making content rank higher on Google","Social Extension Opportunity","Site Engagement Output"], answer: 1, explanation: "SEO helps content get discovered organically. For creators: keyword research, compelling titles, backlinks, and content quality are key SEO factors.", xp: 10 },
      { q: "What is the 'hook' in content creation?", options: ["The conclusion of content","The opening moments designed to immediately grab attention","The main topic of the video","The thumbnail image"], answer: 1, explanation: "The hook is your first 3-5 seconds (video) or first sentence (article). 70% of viewers decide to stay or leave in the first 30 seconds.", xp: 10 },
      { q: "What does 'CTR' stand for in digital media?", options: ["Content To Reader ratio","Click Through Rate — percentage of people who click after seeing content","Creative Text Ratio","Channel Traffic Report"], answer: 1, explanation: "CTR = Clicks ÷ Impressions × 100. A YouTube CTR of 4-10% is considered good. Higher CTR = more people click your thumbnail/headline.", xp: 10 },
      { q: "What is a 'storyboard'?", options: ["A social media pinboard","A sequential series of sketches planning a film/video scene by scene","A script formatting document","A content publishing calendar"], answer: 1, explanation: "Storyboards are visual scripts — stick figures are fine! They plan camera angles, pacing, and action before shooting. Used in film, animation, and ads.", xp: 10 },
      { q: "What does 'engagement rate' measure on social media?", options: ["Number of followers","How actively your audience interacts with content relative to reach","Total view count","Account follower growth rate"], answer: 1, explanation: "Engagement Rate = (Likes + Comments + Shares + Saves) ÷ Reach × 100. More meaningful than follower count — a 1000-follower account can outperform a 100k one.", xp: 10 },
      { q: "What is 'niche' in content creation?", options: ["A small shelf or wall recess","A specific focused topic area you create content about","A video format","A social media platform"], answer: 1, explanation: "Your niche is your specialized content area. 'Finance for Gen Z Indians' beats 'finance'. Smaller niches build deeper, more loyal audiences.", xp: 10 },
      { q: "What is 'UGC' in marketing?", options: ["Universal Graphics Content","User-Generated Content — content created by customers/fans, not the brand","Unique Growth Conversion","Uniform Grid Composition"], answer: 1, explanation: "UGC is organic content created by your audience — reviews, unboxings, testimonials. It's highly trusted: 92% trust UGC more than brand advertising.", xp: 10 },
    ],
    intermediate: [
      { q: "What is a 'three-act structure'?", options: ["Three camera angles","Fundamental storytelling: Setup → Confrontation → Resolution","Three chapters of a book","Three social media posts per day"], answer: 1, explanation: "Three-act: Act 1 sets up characters and conflict. Act 2 escalates the conflict. Act 3 resolves it. Used in almost every film, series, and long-form piece.", xp: 20 },
      { q: "What does 'colour grading' mean in filmmaking?", options: ["Choosing brand colors","Adjusting colors in post-production to create mood and visual consistency","Printing color photos","Rating films by their color palette"], answer: 1, explanation: "Color grading transforms raw footage's look and feel. Orange-teal is a popular Hollywood grade. Desaturated = gritty. Warm tones = nostalgia/comfort.", xp: 20 },
      { q: "What is a 'content calendar'?", options: ["A reminder notification app","A strategic schedule planning what content to publish, on which platform, when","A content analytics subscription","A social media management tool"], answer: 1, explanation: "Content calendars prevent reactive posting. Plan 4 weeks ahead, batch-create content, align with campaigns and trends. Consistency beats inspiration.", xp: 20 },
      { q: "What is 'brand voice'?", options: ["A brand's spokesperson","The consistent personality and tone used in all brand communications","Audio branding and jingles","A social media account type"], answer: 1, explanation: "Brand voice is your brand's personality in words. Casual vs formal, witty vs serious, bold vs conservative. Consistency builds recognition and trust.", xp: 20 },
      { q: "What is the 'rule of thirds' in visual composition?", options: ["Using three cameras simultaneously","Dividing the frame into a 3×3 grid, placing subjects at intersection points","Three lighting setups","Three editing passes for color"], answer: 1, explanation: "Rule of thirds: imagine a 3×3 grid on your frame. Place subjects at intersections, horizons on horizontal lines. More dynamic than centered composition.", xp: 20 },
      { q: "What is 'monetization' for content creators?", options: ["Making money from investments","Converting content and audience attention into revenue streams","Platform algorithm changes","Content licensing agreements"], answer: 1, explanation: "Creator monetization: ad revenue, sponsorships, merchandise, courses, memberships (Patreon), affiliate marketing, brand deals, and licensing. Diversify revenue streams.", xp: 25 },
      { q: "What is 'B-roll' in video production?", options: ["A backup recording","Supplementary footage that illustrates and supports the main narrative (A-roll)","A second camera angle","Background music track"], answer: 1, explanation: "B-roll covers cuts, adds visual variety, and illustrates what's being said. A-roll is the primary footage (interview). B-roll is what you see when someone talks.", xp: 25 },
    ],
    advanced: [
      { q: "What is 'transmedia storytelling'?", options: ["Translating content to other languages","A single narrative told across multiple media platforms, each adding unique content","A film editing technique","A copywriting framework"], answer: 1, explanation: "Transmedia: the story world extends across platforms. Marvel does this masterfully — films, comics, Disney+, games each add unique story elements that enrich the whole.", xp: 30 },
      { q: "What is 'parasocial relationship' in the creator economy?", options: ["A paid collaboration between two creators","A one-sided emotional bond where audiences feel personally connected to creators","A monetization partnership","A creator community type"], answer: 1, explanation: "Parasocial relationships are why fans feel they 'know' creators personally. Creators who understand this build loyal communities — the foundation of creator economy success.", xp: 30 },
      { q: "What is 'native advertising'?", options: ["Local advertising for small businesses","Paid content designed to match the look and feel of the platform's organic content","Print advertising in newspapers","Outdoor billboard advertising"], answer: 1, explanation: "Native ads blend with editorial content — sponsored articles, promoted posts. They get 52% more views than display ads because they're not perceived as intrusive.", xp: 30 },
      { q: "What is a 'non-linear narrative'?", options: ["A story without any conflict","A story told out of chronological order using flashbacks or parallel timelines","A documentary filmmaking style","A short-form content format"], answer: 1, explanation: "Non-linear narratives subvert timeline — Pulp Fiction, Arrival, Westworld. When done well, reordering creates suspense, dramatic irony, and deeper emotional impact.", xp: 30 },
      { q: "What is 'IP' (Intellectual Property) in entertainment?", options: ["Internet Protocol for streaming","Creative works (characters, stories, formats) owned by creators and companies","An independent production company","An integrated production workflow"], answer: 1, explanation: "IP is the creative asset — Harry Potter, MCU, KBC format. Strong IP can be licensed, sequeled, merchandise, theme-parked. Building owned IP > being a hired gun.", xp: 35 },
      { q: "What is 'dark social' in content distribution?", options: ["Content on underground platforms","Private sharing through messaging apps and email that's invisible to analytics","Dark mode social media","Night-time posting strategy"], answer: 1, explanation: "Dark social: content shared via WhatsApp, DMs, email — invisible to UTM tracking. Estimated 80%+ of all social sharing is dark. Direct traffic in analytics often includes dark social.", xp: 35 },
      { q: "What is the 'attention economy'?", options: ["Economic study of consumer behavior","The competition for human attention as the scarce resource in the digital age","A type of advertising model","Social media economics"], answer: 1, explanation: "Attention economy: in a world of infinite content, human attention is the scarce resource. Every app, creator, and platform competes for your finite daily attention.", xp: 40 },
    ],
  },
  healthcare: {
    beginner: [
      { q: "What does BMI stand for?", options: ["Body Mass Indicator","Body Mass Index = weight(kg) ÷ height²(m)","Basic Medical Information","Bone Mineral Index"], answer: 1, explanation: "BMI = Weight(kg) ÷ Height²(m). Under 18.5 = underweight, 18.5-24.9 = normal, 25-29.9 = overweight, 30+ = obese. A screening tool, not a diagnosis.", xp: 10 },
      { q: "What does a stethoscope listen to?", options: ["Blood pressure measurements","Heart, lung, and bowel sounds","Body temperature","Blood oxygen saturation"], answer: 1, explanation: "Stethoscopes amplify internal body sounds. Cardiologists listen to heart valves. Pulmonologists check lung sounds. GI doctors listen to bowel sounds.", xp: 10 },
      { q: "What is normal human body temperature?", options: ["35°C","37°C (98.6°F)","39°C","40°C"], answer: 1, explanation: "Normal is ~37°C (98.6°F). Fever: >38°C. Hypothermia: <35°C. Dangerously high: >40°C (heat stroke). Rectal temps are 0.5°C higher than oral.", xp: 10 },
      { q: "What does OPD stand for in hospitals?", options: ["Outpatient Department","Operation and Procedures Division","Overnight Patient Desk","Observation Physiotherapy Department"], answer: 0, explanation: "OPD = Outpatient Department. Patients are seen, diagnosed, and treated without overnight admission. IPD (Inpatient Department) is for admitted patients.", xp: 10 },
      { q: "What is a vaccine?", options: ["A painkiller medication","A substance that stimulates immune system to build protection against a disease","A broad-spectrum antibiotic","A vitamin supplement"], answer: 1, explanation: "Vaccines train your immune system with antigens (weakened/dead pathogens or mRNA) so it can respond faster if you encounter the real pathogen. Herd immunity protects the unvaccinated.", xp: 10 },
      { q: "What does 'pulse rate' measure?", options: ["Blood pressure","Number of heart beats per minute","Blood sugar level","Breathing rate"], answer: 1, explanation: "Pulse rate = heart rate (60-100 bpm normal for adults). Athletes may have resting heart rates of 40-60 bpm. >100 = tachycardia. <60 = bradycardia.", xp: 10 },
      { q: "What is 'hypertension'?", options: ["Low blood sugar","Chronically high blood pressure (≥130/80 mmHg)","High body temperature","Extreme fatigue"], answer: 1, explanation: "Hypertension = high BP (≥130/80). Normal: 120/80. The 'silent killer' — often no symptoms. Major risk factor for heart attack, stroke, and kidney disease.", xp: 10 },
    ],
    intermediate: [
      { q: "What does an ECG (EKG) measure?", options: ["Brain electrical activity","Electrical activity of the heart","Blood sugar levels","Lung capacity and function"], answer: 1, explanation: "ECG records heart's electrical activity over time. P wave = atrial depolarization, QRS = ventricular depolarization, T wave = ventricular repolarization. Identifies arrhythmias, MIs.", xp: 20 },
      { q: "What is 'herd immunity'?", options: ["Immunity specific to livestock diseases","When enough people are immune to significantly slow or stop disease spread in a population","Group therapy treatment","Antibiotic resistance mechanism"], answer: 1, explanation: "Herd immunity threshold varies by disease. Measles needs ~95% immunity. COVID ~70-85%. Protects vulnerable people who can't be vaccinated.", xp: 20 },
      { q: "What does 'systolic' blood pressure represent?", options: ["Pressure when the heart is at rest between beats","Pressure in arteries when the heart contracts and pumps blood","The average of two blood pressure readings","Minimum recorded blood pressure"], answer: 1, explanation: "Systolic (top number): pressure during heart contraction. Diastolic (bottom): pressure at rest. Normal: 120/80. High systolic is a stronger predictor of cardiovascular events.", xp: 20 },
      { q: "What is the 'placebo effect'?", options: ["An unexpected drug side effect","Real measurable improvement from an inactive treatment due to patient expectation and belief","A standard drug interaction","The effect of a generic medicine"], answer: 1, explanation: "Placebo effects are measurable and real — involving actual neurological changes. Pain, nausea, depression all show placebo responses. This is why RCTs require placebo controls.", xp: 25 },
      { q: "What is 'triage' in emergency medicine?", options: ["A type of surgical procedure","Prioritizing patients by urgency and severity to allocate limited resources effectively","A diagnostic imaging test","A standard treatment protocol"], answer: 1, explanation: "Triage (French for 'sort'): immediate (life-threatening), delayed (can wait), minimal (minor), expectant (unlikely to survive). Critical in disasters and busy ERs.", xp: 25 },
      { q: "What is 'antibiotic resistance'?", options: ["Allergy to antibiotics","When bacteria evolve mechanisms to survive antibiotics, making infections harder to treat","Antibiotics becoming stronger over time","A vitamin deficiency"], answer: 1, explanation: "Antibiotic resistance is a global health crisis. Overprescription and incomplete courses let resistant bacteria survive and proliferate. WHO calls it one of the biggest health threats.", xp: 25 },
      { q: "What is 'informed consent' in medical ethics?", options: ["A hospital billing form","Patient's voluntary agreement after being fully informed about a procedure's risks and benefits","Insurance pre-authorization","Medical power of attorney"], answer: 1, explanation: "Informed consent: patient must understand the diagnosis, proposed treatment, alternatives, risks and benefits, and be competent to consent freely. A cornerstone of medical ethics.", xp: 25 },
    ],
    advanced: [
      { q: "What is 'CRISPR-Cas9' used for?", options: ["Cancer imaging technique","Precise gene editing by cutting and modifying DNA sequences at specific locations","A drug delivery system","Surgical robotic technique"], answer: 1, explanation: "CRISPR-Cas9: guide RNA directs Cas9 protein to cut DNA at specific sequences. Enables gene knockout, correction, or insertion. Revolutionizing genetic disease treatment.", xp: 30 },
      { q: "What is an RCT (Randomized Controlled Trial)?", options: ["Randomly selecting patients for observation","Gold-standard study randomly assigning participants to treatment or control groups to eliminate bias","An unplanned clinical experiment","Remote medical testing protocol"], answer: 1, explanation: "RCTs are the highest-quality evidence. Random assignment eliminates confounding variables. Double-blind (neither patient nor doctor knows who gets treatment) reduces bias further.", xp: 35 },
      { q: "What is 'pharmacokinetics'?", options: ["The process of discovering new drugs","How the body absorbs, distributes, metabolizes, and excretes (ADME) drugs over time","Drug pricing strategy in pharma","Hospital pharmacy management"], answer: 1, explanation: "PK describes the drug's journey in the body. Pharmacodynamics (PD) is what the drug does to the body. PK/PD modeling guides dosing regimens.", xp: 30 },
      { q: "What is 'sepsis'?", options: ["A localized skin infection","Life-threatening organ dysfunction from dysregulated host response to infection","A common digestive disorder","A respiratory virus type"], answer: 1, explanation: "Sepsis: infection triggers massive immune response damaging own organs. SOFA score diagnoses it. Golden hour: early antibiotics and fluids dramatically reduce mortality.", xp: 35 },
      { q: "What is 'precision medicine'?", options: ["Using highly accurate surgical instruments","Tailoring medical treatment to individual patient characteristics including genetics, lifestyle, and environment","Precisely measuring drug doses","Minimally invasive surgical techniques"], answer: 1, explanation: "Precision medicine (personalized medicine) moves beyond one-size-fits-all. Genomics, proteomics, and microbiome data enable treatments designed for your specific biology.", xp: 30 },
      { q: "What is the 'blood-brain barrier' (BBB)?", options: ["A mental health barrier","Selective semipermeable membrane protecting the brain from pathogens and toxins in the bloodstream","A neurosurgical procedure","A type of brain bleed"], answer: 1, explanation: "BBB is formed by tight junctions between endothelial cells in brain capillaries. Protects the brain but makes CNS drug delivery extremely challenging. Crossing the BBB is a major pharmaceutical challenge.", xp: 35 },
      { q: "What is 'CRISPR base editing'?", options: ["Standard CRISPR gene cutting","A more precise CRISPR technique that changes single DNA letters without cutting the double helix","A gene silencing method","RNA editing technology"], answer: 1, explanation: "Base editing converts one DNA base to another (e.g., C→T) without double-strand breaks. Safer than traditional CRISPR. Prime editing is even more precise — like a 'search and replace' for DNA.", xp: 40 },
    ],
  },
  business: {
    beginner: [
      { q: "What is 'revenue'?", options: ["Profit after all expenses are paid","Total income generated from sales before any costs are deducted","Money borrowed from investors","Funding raised from venture capital"], answer: 1, explanation: "Revenue is topline income (all sales). Profit is revenue minus expenses. A company can have high revenue and still lose money (like many startups).", xp: 10 },
      { q: "What does B2B mean?", options: ["Back to Business","Business to Business — selling products/services to other businesses","Brand to Brand marketing","Budget to Business planning"], answer: 1, explanation: "B2B: businesses sell to businesses (Salesforce, AWS, Zoho). B2C: businesses sell to consumers (Zomato, Amazon). B2B2C: like Razorpay enabling businesses to sell to consumers.", xp: 10 },
      { q: "What is a 'startup'?", options: ["Any new small business","A young company designed to grow rapidly with a scalable, often tech-enabled business model","A government-funded project","A franchise business"], answer: 0, explanation: "Startups aim for rapid, scalable growth. Key difference from SMBs: startups want to become large companies quickly, often using technology and external funding.", xp: 10 },
      { q: "What does 'market share' mean?", options: ["Owning shares in a stock market","Percentage of total market sales captured by one company or product","A product's listed price","Marketing budget allocation"], answer: 1, explanation: "Market share = Company Revenue ÷ Total Market Revenue. Zomato and Swiggy fight for food delivery market share. Gaining share often means taking it from competitors.", xp: 10 },
      { q: "What is a 'target audience'?", options: ["All possible customers in the world","The specific group of people most likely to buy your product based on demographics, behavior, and needs","Your social media followers","Current paying customers"], answer: 1, explanation: "Target audience is who you design and market for. 'Everyone' is not a target audience. Nailing your ICP (Ideal Customer Profile) makes marketing 10x more effective.", xp: 10 },
      { q: "What is 'gross margin'?", options: ["Total revenue","Revenue minus cost of goods sold (COGS), expressed as a percentage","Revenue minus all expenses","Net profit percentage"], answer: 1, explanation: "Gross Margin = (Revenue - COGS) ÷ Revenue. Software companies have 70-90% gross margins. Grocery retail has 2-5%. High gross margins fund growth and R&D.", xp: 15 },
      { q: "What is a 'business model'?", options: ["A small-scale business prototype","How a company creates, delivers, and captures value — its plan to make money","A financial projection","A marketing strategy"], answer: 1, explanation: "Business model = value creation + delivery + monetization. SaaS charges subscriptions. Marketplaces take commission. Freemium converts free users to paid. Your model determines your economics.", xp: 10 },
    ],
    intermediate: [
      { q: "What is 'CAC' in business?", options: ["Company Annual Cost","Customer Acquisition Cost — total cost to acquire one new customer","Capital Asset Cost","Conversion Activity Count"], answer: 1, explanation: "CAC = Total Sales + Marketing Spend ÷ New Customers Acquired. Golden rule: LTV should be 3x CAC. High CAC destroys unit economics even with good revenue.", xp: 20 },
      { q: "What is a 'pivot' in startup terms?", options: ["Company permanently shutting down","Fundamentally changing the business model, product, or target market based on validated learning","A marketing campaign shift","Hiring new executive leadership"], answer: 1, explanation: "Famous pivots: YouTube (dating site) → video. Instagram (check-in app Burbn) → photo sharing. Slack (game company Glitch) → messaging. Pivot early, pivot fast.", xp: 25 },
      { q: "What does 'LTV' mean in business?", options: ["Long Term Vision statement","Customer Lifetime Value — total revenue expected from one customer over their entire relationship","Low Transaction Volume warning","Latest Technology Version release"], answer: 1, explanation: "LTV = Average Purchase Value × Purchase Frequency × Customer Lifespan. Increasing retention dramatically increases LTV. A 5% increase in retention can boost profits 25-95%.", xp: 20 },
      { q: "What is 'product-market fit' (PMF)?", options: ["Product design process completion","When a product satisfies a strong market demand — users love it, use it, and refer others","A product pricing strategy","A completed market research report"], answer: 1, explanation: "PMF signal: users are disappointed if you shut down (Sean Ellis test: >40% would be 'very disappointed'). Before PMF: do whatever it takes. After PMF: scale aggressively.", xp: 25 },
      { q: "What is a 'go-to-market' (GTM) strategy?", options: ["An export strategy for global expansion","A plan specifying how you'll reach your target customers and achieve competitive advantage at launch","A physical office location plan","An investor pitch presentation"], answer: 1, explanation: "GTM covers: target segment, value proposition, channels, pricing, and sales motion. A great product with a poor GTM fails. Many startups skip GTM — and fail.", xp: 20 },
      { q: "What is 'burn rate' in startups?", options: ["Server processing speed","Rate at which a startup spends its cash reserves monthly","Revenue growth rate","Customer churn rate"], answer: 1, explanation: "Burn rate = monthly cash spent. Runway = Cash in bank ÷ Monthly burn. Default benchmark: 18-24 months runway. High burn + low runway = existential crisis.", xp: 25 },
      { q: "What are 'OKRs'?", options: ["Ownership, Knowledge, Resources management system","Objectives and Key Results — a goal-setting framework aligning teams around measurable outcomes","Operational KPI Review systems","Organizational Knowledge Reporting"], answer: 1, explanation: "OKRs: Objective (inspiring goal) + Key Results (measurable outcomes). Used by Google, Intel, Spotify. Objectives should be ambitious (70% achievement = good), KRs must be measurable.", xp: 25 },
    ],
    advanced: [
      { q: "What is 'unit economics'?", options: ["Economics of small local businesses","Revenue and costs on a per-unit basis — does each unit generate profit?","A branch of microeconomic theory","Production cost analysis"], answer: 1, explanation: "Unit economics: LTV > CAC, positive gross margins, payback period < 12-18 months. Many startups grow fast with terrible unit economics — eventually the math catches up.", xp: 30 },
      { q: "What is a 'term sheet'?", options: ["A detailed legal contract","A non-binding document outlining key terms and conditions of a proposed investment or acquisition","A summary of employment terms","A product specification document"], answer: 1, explanation: "Term sheets are negotiating documents. Key terms: valuation, investment amount, equity dilution, liquidation preference, anti-dilution, board seats, vesting. Get a lawyer!", xp: 30 },
      { q: "What does 'runway' mean for a startup?", options: ["A physical office hallway","How many months a company can operate at current burn rate before running out of cash","Product launch timeline","Market expansion roadmap"], answer: 1, explanation: "Runway = Cash ÷ Monthly Burn. 18+ months is safe. <6 months = crisis mode. Extend runway: cut burn, raise funding, or accelerate revenue. Runway = time to find product-market fit.", xp: 30 },
      { q: "What is 'Porter's Five Forces'?", options: ["Five essential marketing channels","Michael Porter's framework analyzing five competitive forces shaping industry profitability","Five core business functions","Five leadership management styles"], answer: 1, explanation: "Porter's Five Forces: 1) Rivalry among competitors 2) Threat of new entrants 3) Bargaining power of buyers 4) Bargaining power of suppliers 5) Threat of substitutes. Determines industry attractiveness.", xp: 35 },
      { q: "What is a competitive 'moat'?", options: ["A company's physical headquarters","A durable competitive advantage protecting a business from competition over the long term","A financial cash reserve","An aggressive marketing strategy"], answer: 1, explanation: "Moats: network effects (Facebook), switching costs (Salesforce), cost advantages (Amazon), intangibles (brand/patents), efficient scale. Warren Buffett coined the term. Wide moats = sustainable profits.", xp: 35 },
      { q: "What is 'blitzscaling'?", options: ["Fast server deployment","Prioritizing speed over efficiency in pursuit of massive scale, accepting short-term losses","Aggressive cold outreach sales","A viral marketing technique"], answer: 1, explanation: "Blitzscaling (Reid Hoffman): grow fast enough to dominate before competitors can respond, even if burning cash. Uber, Airbnb, Grab used this. Only works with large markets and network effects.", xp: 40 },
      { q: "What is 'zero-sum vs positive-sum' in business strategy?", options: ["Accounting methods","Zero-sum: one party's gain is another's loss. Positive-sum: value is created so all parties can win","Debt vs equity financing","Fixed vs variable costs"], answer: 1, explanation: "Most business is positive-sum: platforms create value for buyers and sellers both. Zero-sum thinking leads to bad strategy. Building ecosystems (Apple, Google) creates more value than taking it.", xp: 40 },
    ],
  },
};

// ── Career Steps ───────────────────────────────────────────────────────────────
const steps = [
  { id: "interest", label: "What lights you up?", subtitle: "Pick your passion area", options: [
    { value: "coding", label: "Coding & Tech", icon: "💻" }, { value: "design", label: "Design & UX", icon: "🎨" },
    { value: "data", label: "Data & AI", icon: "📊" }, { value: "finance", label: "Finance", icon: "💰" },
    { value: "arts", label: "Arts & Media", icon: "🎬" }, { value: "healthcare", label: "Healthcare", icon: "🏥" },
    { value: "business", label: "Business", icon: "💼" },
  ]},
  { id: "level", label: "Where are you today?", subtitle: "Be honest — this helps us calibrate", options: [
    { value: "beginner", label: "Beginner", icon: "🌱" }, { value: "intermediate", label: "Intermediate", icon: "⚡" }, { value: "advanced", label: "Advanced", icon: "🔥" },
  ]},
  { id: "style", label: "How do you work best?", subtitle: "Your natural thinking style", options: [
    { value: "logical", label: "Logical thinking", icon: "🧩" }, { value: "creative", label: "Creative work", icon: "✨" },
    { value: "analytical", label: "Deep analysis", icon: "🔍" }, { value: "people", label: "Working with people", icon: "🤝" },
  ]},
];

// ── Utility ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "careermitra_v2";
const loadUser = (): UserData => { try { const d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : DEFAULT_USER; } catch { return DEFAULT_USER; } };
const saveUser = (d: UserData) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} };
const todayStr = () => new Date().toISOString().split("T")[0];
const updateStreak = (u: UserData): UserData => {
  const today = todayStr(); const last = u.lastPlayed;
  if (last === today) return u;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split("T")[0];
  const newStreak = last === yStr ? u.streak + 1 : 1;
  return { ...u, streak: newStreak, lastPlayed: today, bestStreak: Math.max(newStreak, u.bestStreak) };
};

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CareerMitra() {
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const [screen, setScreen] = useState<Screen>("home");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [career, setCareer] = useState<null | { title: string; desc: string; skills: string[]; salary: string; emoji: string; roadmap: string[] }>(null);

  // Quiz state
  const [quizMode, setQuizMode] = useState<"career" | "practice">("career");
  const [practiceSubject, setPracticeSubject] = useState("coding");
  const [practiceLevel, setPracticeLevel] = useState("beginner");
  const [qIndex, setQIndex] = useState(0);
  const [shuffledQs, setShuffledQs] = useState<Q[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizXP, setQuizXP] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [missed, setMissed] = useState<{ q: string; yours: string; correct: string; explanation: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [xpGained, setXpGained] = useState(0);
  const [levelUp, setLevelUp] = useState(false);
  const [questionXP, setQuestionXP] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { const u = loadUser(); setUser(u); }, []);

  useEffect(() => {
    if (!timerActive) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setTimerActive(false); handleTimeUp(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  const handleTimeUp = useCallback(() => {
    setConfirmed(true); setCombo(0); setFeedback("wrong");
    setMissed(m => [...m, { q: shuffledQs[qIndex]?.q ?? "", yours: "Time's up!", correct: shuffledQs[qIndex]?.options[shuffledQs[qIndex]?.answer] ?? "", explanation: shuffledQs[qIndex]?.explanation ?? "" }]);
    setTimeout(() => setFeedback(null), 600);
  }, [shuffledQs, qIndex]);

  const getQs = (subject: string, level: string): Q[] => {
    const pool = quizBank[subject]?.[level] ?? quizBank.coding.beginner;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, 5);
  };

  const startQuiz = (mode: "career" | "practice", subject?: string, level?: string) => {
    const sub = subject ?? answers.interest ?? "coding";
    const lev = level ?? answers.level ?? "beginner";
    const qs = getQs(sub, lev);
    setQuizMode(mode); setShuffledQs(qs); setQIndex(0); setSelected(null);
    setConfirmed(false); setQuizScore(0); setQuizXP(0); setCombo(0); setMaxCombo(0);
    setMissed([]); setFeedback(null); setTimeLeft(30); setTimerActive(true);
    setScreen("quiz");
  };

  const confirmAnswer = () => {
    if (selected === null || confirmed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    const q = shuffledQs[qIndex];
    const isCorrect = selected === q.answer;
    setConfirmed(true);

    if (isCorrect) {
      const newCombo = combo + 1;
      const mult = newCombo >= 3 ? 2 : newCombo >= 2 ? 1.5 : 1;
      const earned = Math.round(q.xp * mult * (timeLeft > 20 ? 1.2 : timeLeft > 10 ? 1 : 0.8));
      setCombo(newCombo); setMaxCombo(c => Math.max(c, newCombo));
      setQuizScore(s => s + 1); setQuizXP(x => x + earned); setQuestionXP(earned);
      setFeedback("correct");
    } else {
      setCombo(0); setFeedback("wrong"); setQuestionXP(0);
      setMissed(m => [...m, { q: q.q, yours: q.options[selected], correct: q.options[q.answer], explanation: q.explanation }]);
    }
    setTimeout(() => setFeedback(null), 700);
  };

  const nextQ = () => {
    if (qIndex + 1 >= shuffledQs.length) {
      // Quiz done — update user
      const oldRank = getRank(user.totalXP);
      const updated = updateStreak({ ...user, totalXP: user.totalXP + quizXP, quizzesCompleted: user.quizzesCompleted + 1, correctAnswers: user.correctAnswers + quizScore, totalAnswers: user.totalAnswers + shuffledQs.length });
      const newRank = getRank(updated.totalXP);
      saveUser(updated); setUser(updated);
      setLevelUp(oldRank.name !== newRank.name);
      setXpGained(quizXP);
      setScreen("quiz-result");
    } else {
      setQIndex(i => i + 1); setSelected(null); setConfirmed(false);
      setTimeLeft(30); setTimerActive(true); setQuestionXP(0);
    }
  };

  const selectCareerAnswer = (key: string, value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);
    if (step < steps.length - 1) { setTimeout(() => setStep(step + 1), 280); }
    else {
      setScreen("analyzing");
      setTimeout(() => {
        const { interest, level, style } = updated;
        const result = careers[interest]?.[level]?.[style] ?? { title: "Pathfinder", desc: "Your unique mix spans multiple fields — explore and forge your own path.", skills: ["Curiosity", "Adaptability", "Learning"], salary: "Limitless", emoji: "🌟", roadmap: ["Explore different fields", "Find what excites you", "Build foundational skills", "Talk to professionals", "Take action"] };
        setCareer(result); setScreen("career");
      }, 2200);
    }
  };

  const resetAll = () => { setStep(0); setAnswers({}); setCareer(null); setScreen("home"); };

  const rank = getRank(user.totalXP);
  const nextRank = getNextRank(user.totalXP);
  const xpPct = getXPProgress(user.totalXP);
  const accuracy = user.totalAnswers > 0 ? Math.round((user.correctAnswers / user.totalAnswers) * 100) : 0;
  const q = shuffledQs[qIndex];
  const timerPct = (timeLeft / 30) * 100;
  const timerColor = timeLeft > 15 ? "#22c55e" : timeLeft > 7 ? "#fbbf24" : "#f87171";
  const comboMult = combo >= 3 ? "2×" : combo >= 2 ? "1.5×" : null;

  const qResult = shuffledQs.length > 0 ? Math.round((quizScore / shuffledQs.length) * 100) : 0;
  const verdict = qResult >= 80 ? { msg: "Skill verified! You've got it.", sub: "Your knowledge matches your claimed level perfectly.", color: "#22c55e", icon: "🏆" }
    : qResult >= 60 ? { msg: "Almost there — keep pushing!", sub: "A bit more practice and you'll nail it completely.", color: "#fbbf24", icon: "💪" }
    : { msg: "Let's build those foundations.", sub: "Study the explanations below — they'll get you there fast.", color: "#f87171", icon: "📚" };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:#0c0c12;min-height:100%;}
        .cm{min-height:100vh;background:#0c0c12;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:1.5rem 1rem 3rem;position:relative;}
        .cm::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 60% 40% at 15% 15%,rgba(251,191,36,.05) 0%,transparent 55%),radial-gradient(ellipse 50% 50% at 85% 85%,rgba(127,119,221,.07) 0%,transparent 55%);pointer-events:none;z-index:0;}
        .grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:56px 56px;pointer-events:none;z-index:0;}
        .card{background:rgba(255,255,255,.028);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:2rem;width:100%;max-width:600px;position:relative;z-index:1;margin-top:1rem;}
        .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:.9rem;color:#fbbf24;letter-spacing:.1em;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin-bottom:1.5rem;}
        .ldot{width:7px;height:7px;background:#fbbf24;border-radius:50%;animation:lpulse 2s infinite;}
        @keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        /* Home dashboard */
        .rank-badge{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:30px;font-size:.8rem;font-weight:600;margin-bottom:1.5rem;}
        .xp-bar-wrap{height:6px;background:rgba(255,255,255,.08);border-radius:3px;margin-bottom:.4rem;overflow:hidden;}
        .xp-bar-fill{height:100%;border-radius:3px;transition:width .8s cubic-bezier(.22,1,.36,1);}
        .stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:1.5rem;}
        .stat{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:1rem;text-align:center;}
        .stat-val{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;color:#fff;line-height:1;}
        .stat-lbl{font-size:.72rem;color:rgba(255,255,255,.4);margin-top:4px;text-transform:uppercase;letter-spacing:.06em;}
        .home-btn{width:100%;padding:.875rem;border-radius:14px;border:none;cursor:pointer;font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;letter-spacing:.04em;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:8px;}
        .btn-primary{background:#fbbf24;color:#0c0c12;margin-bottom:10px;}
        .btn-primary:hover{background:#f59e0b;transform:translateY(-1px);}
        .btn-secondary{background:rgba(255,255,255,.05);color:rgba(255,255,255,.75);border:1px solid rgba(255,255,255,.1);}
        .btn-secondary:hover{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.2);}
        /* Progress bar steps */
        .prog{display:flex;gap:6px;margin-bottom:1.75rem;}
        .pb{height:3px;flex:1;border-radius:2px;background:rgba(255,255,255,.07);transition:all .4s;}
        .pb.a{background:#fbbf24;} .pb.d{background:rgba(251,191,36,.35);}
        .step-sub{font-size:.8rem;color:rgba(255,255,255,.35);margin-bottom:.5rem;}
        .question{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:700;color:#fff;margin-bottom:1.25rem;line-height:1.25;}
        .opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;}
        .opt{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:.9rem .75rem;cursor:pointer;text-align:center;transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:6px;color:rgba(255,255,255,.65);font-size:.82rem;font-weight:500;user-select:none;}
        .opt:hover{border-color:rgba(251,191,36,.45);background:rgba(251,191,36,.06);color:#fff;transform:translateY(-2px);}
        .opt.sel{border-color:#fbbf24;background:rgba(251,191,36,.1);color:#fbbf24;}
        .oi{font-size:1.4rem;}
        /* Career result */
        .slide{animation:su .45s cubic-bezier(.22,1,.36,1);}
        @keyframes su{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .pop{animation:pop .4s cubic-bezier(.175,.885,.32,1.275) .15s both;}
        @keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
        .micro{font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#fbbf24;margin-bottom:.4rem;}
        .ctitle{font-family:'Syne',sans-serif;font-size:1.8rem;font-weight:800;color:#fff;margin-bottom:.6rem;line-height:1.1;}
        .cdesc{color:rgba(255,255,255,.5);font-size:.9rem;line-height:1.6;margin-bottom:1.1rem;}
        .tags{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:1.1rem;}
        .tag{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:20px;padding:3px 11px;font-size:.78rem;color:rgba(255,255,255,.65);}
        .salary-row{display:flex;align-items:center;justify-content:space-between;background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.18);border-radius:12px;padding:.8rem 1.1rem;margin-bottom:1.1rem;}
        .slbl{font-size:.75rem;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.07em;}
        .sval{font-family:'Syne',sans-serif;font-size:1.05rem;font-weight:700;color:#fbbf24;}
        .roadmap{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:1rem 1.1rem;margin-bottom:1.1rem;}
        .roadmap-title{font-size:.72rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.3);margin-bottom:.75rem;}
        .roadmap-item{display:flex;align-items:flex-start;gap:10px;margin-bottom:.6rem;}
        .roadmap-num{width:20px;height:20px;border-radius:50%;background:#fbbf24;color:#0c0c12;font-size:.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .roadmap-text{font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.4;}
        .divider{height:1px;background:rgba(255,255,255,.06);margin:1rem 0;}
        .cta-box{background:rgba(251,191,36,.06);border:1px solid rgba(251,191,36,.18);border-radius:16px;padding:1.1rem;margin-top:1rem;}
        .cta-title{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:#fbbf24;margin-bottom:4px;}
        .cta-desc{font-size:.8rem;color:rgba(255,255,255,.4);line-height:1.5;margin-bottom:10px;}
        /* Analyzing */
        .spin{width:44px;height:44px;border:3px solid rgba(251,191,36,.12);border-top-color:#fbbf24;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 1.25rem;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .analyzing-text{font-family:'Syne',sans-serif;font-size:1rem;color:rgba(255,255,255,.5);text-align:center;animation:ft 1s ease-in-out infinite alternate;}
        @keyframes ft{from{opacity:.35}to{opacity:.9}}
        /* Quiz */
        .quiz-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;gap:10px;}
        .timer-ring{position:relative;width:48px;height:48px;flex-shrink:0;}
        .timer-svg{width:48px;height:48px;transform:rotate(-90deg);}
        .timer-track{fill:none;stroke:rgba(255,255,255,.08);stroke-width:4;}
        .timer-fill{fill:none;stroke-width:4;stroke-linecap:round;transition:stroke-dashoffset .9s linear,stroke .3s;}
        .timer-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:.85rem;font-weight:700;}
        .combo-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:.78rem;font-weight:700;background:rgba(251,191,36,.12);border:1px solid rgba(251,191,36,.25);color:#fbbf24;transition:all .2s;}
        .combo-badge.hot{background:rgba(239,159,39,.2);border-color:rgba(239,159,39,.4);color:#EF9F27;animation:combopop .3s ease-out;}
        @keyframes combopop{0%{transform:scale(1.4)}100%{transform:scale(1)}}
        .qbar-w{flex:1;height:5px;background:rgba(255,255,255,.07);border-radius:3px;overflow:hidden;}
        .qbar-f{height:100%;background:#fbbf24;border-radius:3px;transition:width .4s;}
        .q-text{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700;color:#fff;margin-bottom:1.1rem;line-height:1.3;}
        .qopt{width:100%;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:12px;padding:.8rem .9rem;cursor:pointer;color:rgba(255,255,255,.7);font-size:.88rem;margin-bottom:8px;transition:all .18s;display:flex;align-items:center;gap:10px;}
        .qopt:hover:not(.locked){border-color:rgba(251,191,36,.4);background:rgba(251,191,36,.05);color:#fff;}
        .qopt.chosen{border-color:#fbbf24;background:rgba(251,191,36,.09);color:#fbbf24;}
        .qopt.correct{border-color:#22c55e;background:rgba(34,197,94,.09);color:#22c55e;}
        .qopt.wrong{border-color:#f87171;background:rgba(248,113,113,.09);color:#f87171;}
        .qopt.locked{cursor:default;}
        .qopt.other{opacity:.4;}
        .alph{width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.07);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;flex-shrink:0;transition:all .18s;}
        .exp{background:rgba(127,119,221,.08);border:1px solid rgba(127,119,221,.18);border-radius:12px;padding:.875rem;margin-top:10px;font-size:.83rem;color:rgba(255,255,255,.6);line-height:1.6;}
        .xp-pop{font-family:'Syne',sans-serif;font-size:.9rem;font-weight:700;color:#fbbf24;text-align:center;animation:xppop .4s ease-out;display:inline-block;}
        @keyframes xppop{0%{transform:translateY(0);opacity:1}100%{transform:translateY(-12px);opacity:0}}
        .feedback-flash{position:fixed;inset:0;pointer-events:none;z-index:100;opacity:0;transition:opacity .1s;}
        .feedback-flash.correct{background:rgba(34,197,94,.08);opacity:1;}
        .feedback-flash.wrong{background:rgba(248,113,113,.08);opacity:1;}
        .confirm-btn{width:100%;padding:.8rem;border-radius:12px;border:none;cursor:pointer;font-family:'Syne',sans-serif;font-size:.88rem;font-weight:700;letter-spacing:.04em;transition:all .18s;margin-top:12px;}
        .confirm-btn.active{background:#fbbf24;color:#0c0c12;}
        .confirm-btn.active:hover{background:#f59e0b;}
        .confirm-btn.disabled{background:rgba(255,255,255,.07);color:rgba(255,255,255,.3);cursor:not-allowed;}
        /* Quiz result */
        .score-ring{width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 1.25rem;border:4px solid;animation:pop .4s cubic-bezier(.175,.885,.32,1.275) both;}
        .score-big{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;line-height:1;}
        .score-sm{font-size:.65rem;opacity:.65;margin-top:2px;}
        .xp-earned{background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.18);border-radius:12px;padding:.75rem 1rem;margin-bottom:1rem;text-align:center;}
        .xp-earned-val{font-family:'Syne',sans-serif;font-size:1.4rem;font-weight:800;color:#fbbf24;}
        .xp-earned-lbl{font-size:.75rem;color:rgba(255,255,255,.4);margin-top:2px;}
        .levelup-banner{background:linear-gradient(135deg,rgba(251,191,36,.15),rgba(127,119,221,.15));border:1px solid rgba(251,191,36,.3);border-radius:14px;padding:1rem;margin-bottom:1rem;text-align:center;animation:su .4s ease-out;}
        .levelup-title{font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:800;color:#fbbf24;}
        .miss-item{background:rgba(248,113,113,.05);border:1px solid rgba(248,113,113,.12);border-radius:10px;padding:.8rem;margin-bottom:8px;}
        .miss-q{font-size:.83rem;color:rgba(255,255,255,.7);margin-bottom:5px;font-weight:500;}
        .miss-row{font-size:.77rem;margin-bottom:2px;}
        .miss-exp{font-size:.75rem;color:rgba(255,255,255,.38);margin-top:4px;line-height:1.5;}
        /* Practice */
        .practice-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:1rem;}
        .p-opt{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:.75rem .5rem;cursor:pointer;text-align:center;font-size:.8rem;color:rgba(255,255,255,.6);transition:all .18s;display:flex;flex-direction:column;align-items:center;gap:4px;}
        .p-opt:hover{border-color:rgba(127,119,221,.4);background:rgba(127,119,221,.06);color:#fff;}
        .p-opt.sel{border-color:#7F77DD;background:rgba(127,119,221,.1);color:#AFA9EC;}
        .level-row{display:flex;gap:8px;margin-bottom:1.25rem;}
        .l-opt{flex:1;padding:.65rem;border:1px solid rgba(255,255,255,.08);border-radius:10px;cursor:pointer;text-align:center;font-size:.8rem;color:rgba(255,255,255,.55);transition:all .18s;background:rgba(255,255,255,.03);}
        .l-opt:hover{border-color:rgba(251,191,36,.3);color:#fff;}
        .l-opt.sel{border-color:#fbbf24;background:rgba(251,191,36,.08);color:#fbbf24;font-weight:600;}
        .ghost-btn{width:100%;padding:.75rem;border-radius:12px;border:1px solid rgba(255,255,255,.09);background:transparent;color:rgba(255,255,255,.4);font-family:'Syne',sans-serif;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .18s;margin-top:8px;}
        .ghost-btn:hover{color:#fff;border-color:rgba(255,255,255,.25);}
        .hint{font-size:.75rem;color:rgba(255,255,255,.22);text-align:center;margin-top:1rem;}
      `}</style>

      {/* Flash feedback overlay */}
      <div className={`feedback-flash ${feedback ?? ""}`} />

      <div className="cm">
        <div className="grid" />

        {/* ── HOME DASHBOARD ── */}
        {screen === "home" && (
          <div className="card slide">
            <div className="logo"><div className="ldot" />CareerMitra</div>

            {/* Rank badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
              <div className="rank-badge" style={{ background: rank.bg, color: rank.color }}>{rank.icon} {rank.name}</div>
              {user.streak > 0 && <div style={{ fontSize: ".85rem", color: "#f87171" }}>🔥 {user.streak} day streak</div>}
            </div>

            {/* XP progress */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.4)" }}>{user.totalXP.toLocaleString()} XP</span>
                {nextRank && <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.3)" }}>→ {nextRank.name} at {nextRank.min} XP</span>}
              </div>
              <div className="xp-bar-wrap">
                <div className="xp-bar-fill" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg, ${rank.color}90, ${rank.color})` }} />
              </div>
            </div>

            {/* Stats */}
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-val">{user.streak > 0 ? `🔥 ${user.streak}` : "—"}</div>
                <div className="stat-lbl">Day Streak</div>
              </div>
              <div className="stat">
                <div className="stat-val">{user.quizzesCompleted}</div>
                <div className="stat-lbl">Quizzes Done</div>
              </div>
              <div className="stat">
                <div className="stat-val">{accuracy > 0 ? `${accuracy}%` : "—"}</div>
                <div className="stat-lbl">Accuracy</div>
              </div>
              <div className="stat">
                <div className="stat-val">{user.bestStreak > 0 ? `🏅 ${user.bestStreak}` : "—"}</div>
                <div className="stat-lbl">Best Streak</div>
              </div>
            </div>

            <button className="home-btn btn-primary" onClick={() => { setStep(0); setAnswers({}); setScreen("discover"); }}>
              <span>🧭</span> Find my career path
            </button>
            <button className="home-btn btn-secondary" onClick={() => setScreen("practice")}>
              <span>⚡</span> Practice mode
            </button>
            <p className="hint">Come back daily to maintain your streak and level up</p>
          </div>
        )}

        {/* ── DISCOVER CAREER ── */}
        {screen === "discover" && (
          <div className="card">
            <div className="logo"><div className="ldot" />CareerMitra</div>
            <div className="prog">{steps.map((_, i) => <div key={i} className={`pb ${i < step ? "d" : i === step ? "a" : ""}`} />)}</div>
            <p className="step-sub">{steps[step].subtitle}</p>
            <h2 className="question">{steps[step].label}</h2>
            <div className="opts">
              {steps[step].options.map(o => (
                <button key={o.value} className={`opt ${answers[steps[step].id] === o.value ? "sel" : ""}`} onClick={() => selectCareerAnswer(steps[step].id, o.value)}>
                  <span className="oi">{o.icon}</span>{o.label}
                </button>
              ))}
            </div>
            <p className="hint">Step {step + 1} of {steps.length} · Click to select and auto-advance</p>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {screen === "analyzing" && (
          <div className="card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div className="spin" />
            <p className="analyzing-text">Mapping your ideal career path...</p>
          </div>
        )}

        {/* ── CAREER RESULT ── */}
        {screen === "career" && career && (
          <div className="card slide">
            <div className="logo"><div className="ldot" />CareerMitra</div>
            <div style={{ fontSize: "3rem", marginBottom: ".75rem", display: "block" }} className="pop">{career.emoji}</div>
            <p className="micro">Your matched career path</p>
            <h2 className="ctitle">{career.title}</h2>
            <p className="cdesc">{career.desc}</p>
            <p style={{ fontSize: ".72rem", color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>Key skills</p>
            <div className="tags">{career.skills.map(s => <span key={s} className="tag">{s}</span>)}</div>
            <div className="salary-row"><span className="slbl">Expected salary</span><span className="sval">{career.salary}</span></div>
            <div className="roadmap">
              <p className="roadmap-title">Your 5-step roadmap</p>
              {career.roadmap.map((r, i) => (
                <div key={i} className="roadmap-item">
                  <div className="roadmap-num">{i + 1}</div>
                  <p className="roadmap-text">{r}</p>
                </div>
              ))}
            </div>
            <div className="cta-box">
              <p className="cta-title">Now prove your {answers.level} skills 🎯</p>
              <p className="cta-desc">You said you're {answers.level} in {answers.interest}. Take a 5-question gamified test and verify your level honestly.</p>
              <button className="home-btn btn-primary" style={{ margin: 0 }} onClick={() => startQuiz("career")}>Start skill test →</button>
            </div>
            <div className="divider" />
            <button className="ghost-btn" onClick={resetAll}>← Back to home</button>
          </div>
        )}

        {/* ── PRACTICE MODE ── */}
        {screen === "practice" && (
          <div className="card slide">
            <div className="logo"><div className="ldot" />Practice mode</div>
            <p className="step-sub" style={{ marginBottom: ".5rem" }}>Choose a topic</p>
            <div className="practice-grid">
              {[{v:"coding",l:"Coding",i:"💻"},{v:"design",l:"Design",i:"🎨"},{v:"data",l:"Data & AI",i:"📊"},{v:"finance",l:"Finance",i:"💰"},{v:"arts",l:"Arts",i:"🎬"},{v:"healthcare",l:"Health",i:"🏥"},{v:"business",l:"Business",i:"💼"}].map(o => (
                <button key={o.v} className={`p-opt ${practiceSubject === o.v ? "sel" : ""}`} onClick={() => setPracticeSubject(o.v)}>
                  <span style={{ fontSize: "1.3rem" }}>{o.i}</span>{o.l}
                </button>
              ))}
            </div>
            <p className="step-sub" style={{ marginBottom: ".5rem" }}>Choose difficulty</p>
            <div className="level-row">
              {[{v:"beginner",l:"🌱 Beginner"},{v:"intermediate",l:"⚡ Intermediate"},{v:"advanced",l:"🔥 Advanced"}].map(o => (
                <button key={o.v} className={`l-opt ${practiceLevel === o.v ? "sel" : ""}`} onClick={() => setPracticeLevel(o.v)}>{o.l}</button>
              ))}
            </div>
            <button className="home-btn btn-primary" onClick={() => startQuiz("practice", practiceSubject, practiceLevel)}>
              Start practice →
            </button>
            <button className="ghost-btn" onClick={() => setScreen("home")}>← Back to home</button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {screen === "quiz" && q && (
          <div className="card">
            <div className="quiz-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <div className="qbar-w"><div className="qbar-f" style={{ width: `${((qIndex + (confirmed ? 1 : 0)) / shuffledQs.length) * 100}%` }} /></div>
                <span style={{ fontSize: ".78rem", color: "rgba(255,255,255,.35)", minWidth: "36px" }}>{qIndex + 1}/{shuffledQs.length}</span>
              </div>
              <div className={`combo-badge ${combo >= 2 ? "hot" : ""}`}>
                🔥 {combo} {comboMult ? `× ${comboMult}` : "combo"}
              </div>
              <div className="timer-ring">
                <svg className="timer-svg" viewBox="0 0 48 48">
                  <circle className="timer-track" cx="24" cy="24" r="20" />
                  <circle className="timer-fill" cx="24" cy="24" r="20"
                    stroke={timerColor}
                    strokeDasharray={`${2 * Math.PI * 20}`}
                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - timerPct / 100)}`}
                  />
                </svg>
                <div className="timer-num" style={{ color: timerColor }}>{timeLeft}</div>
              </div>
            </div>

            {confirmed && questionXP > 0 && (
              <div style={{ textAlign: "center", marginBottom: "4px" }}>
                <span className="xp-pop">+{questionXP} XP{comboMult ? ` (${comboMult} combo!)` : ""}</span>
              </div>
            )}

            <p className="q-text">{q.q}</p>

            <div>
              {q.options.map((opt, i) => {
                let cls = "qopt";
                if (confirmed) {
                  cls += " locked";
                  if (i === q.answer) cls += " correct";
                  else if (i === selected) cls += " wrong";
                  else cls += " other";
                } else if (i === selected) cls += " chosen";
                return (
                  <button key={i} className={cls} onClick={() => !confirmed && setSelected(i)}>
                    <span className="alph">{["A","B","C","D"][i]}</span>{opt}
                  </button>
                );
              })}
            </div>

            {confirmed && <div className="exp">💡 {q.explanation}</div>}

            {!confirmed
              ? <button className={`confirm-btn ${selected !== null ? "active" : "disabled"}`} onClick={confirmAnswer} disabled={selected === null}>
                  {selected === null ? "Pick an answer first" : "Confirm answer →"}
                </button>
              : <button className="confirm-btn active" onClick={nextQ}>
                  {qIndex + 1 >= shuffledQs.length ? "See my results →" : "Next question →"}
                </button>
            }
          </div>
        )}

        {/* ── QUIZ RESULT ── */}
        {screen === "quiz-result" && (
          <div className="card slide">
            <div className="logo"><div className="ldot" />CareerMitra</div>

            {levelUp && (
              <div className="levelup-banner">
                <div style={{ fontSize: "2rem", marginBottom: "4px" }}>🎉</div>
                <p className="levelup-title">Rank Up! You're now {getRank(user.totalXP).icon} {getRank(user.totalXP).name}</p>
                <p style={{ fontSize: ".8rem", color: "rgba(255,255,255,.45)", marginTop: "4px" }}>Keep going — next rank awaits!</p>
              </div>
            )}

            <div className="score-ring" style={{ borderColor: verdict.color, color: verdict.color }}>
              <span className="score-big">{quizScore}/{shuffledQs.length}</span>
              <span className="score-sm">{qResult}%</span>
            </div>

            <div className="xp-earned">
              <div className="xp-earned-val">+{xpGained} XP earned</div>
              <div className="xp-earned-lbl">Total: {user.totalXP.toLocaleString()} XP · {getRank(user.totalXP).icon} {getRank(user.totalXP).name}</div>
            </div>

            {/* Combo + streak stats */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "10px", padding: ".75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fbbf24", fontFamily: "Syne" }}>🔥 {maxCombo}</div>
                <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.35)", marginTop: "3px" }}>Best combo</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "10px", padding: ".75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#22c55e", fontFamily: "Syne" }}>{user.streak}🔥</div>
                <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.35)", marginTop: "3px" }}>Day streak</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,.04)", borderRadius: "10px", padding: ".75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: verdict.color, fontFamily: "Syne" }}>{verdict.icon}</div>
                <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,.35)", marginTop: "3px" }}>Result</div>
              </div>
            </div>

            <p className="micro" style={{ textAlign: "center", color: verdict.color }}>{verdict.msg}</p>
            <p style={{ fontSize: ".85rem", color: "rgba(255,255,255,.45)", textAlign: "center", marginBottom: "1rem", lineHeight: 1.5 }}>{verdict.sub}</p>

            {missed.length > 0 && (
              <>
                <p style={{ fontSize: ".72rem", color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: "8px" }}>Learn from your mistakes</p>
                {missed.map((w, i) => (
                  <div key={i} className="miss-item">
                    <p className="miss-q">{w.q}</p>
                    <p className="miss-row" style={{ color: "#f87171" }}>✗ {w.yours}</p>
                    <p className="miss-row" style={{ color: "#22c55e" }}>✓ {w.correct}</p>
                    <p className="miss-exp">{w.explanation}</p>
                  </div>
                ))}
              </>
            )}

            <div className="divider" />            <button className="home-btn btn-primary" onClick={() => startQuiz(quizMode, practiceSubject, practiceLevel)}>
              🔄 Retake for more XP
            </button>
            <button className="ghost-btn" onClick={() => setScreen("practice")}>Try different topic</button>
            {quizMode === "career" && <button className="ghost-btn" onClick={() => setScreen("career")}>← Back to career path</button>}
            <button className="ghost-btn" onClick={resetAll}>🏠 Home dashboard</button>
          </div>
        )}
      </div>
    </>
  );
}
