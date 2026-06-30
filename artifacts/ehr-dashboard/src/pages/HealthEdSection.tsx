import { useState, useMemo } from "react";
import {
  ChevronLeft, X, Search, CheckCircle2, ClipboardCheck,
  Star, BookOpen, Eye, ChevronDown, ChevronUp, Plus,
} from "lucide-react";

// ─── Document Database ────────────────────────────────────────────────────────

export type HealthEdCategory = "Handout" | "Patient Education" | "Non-Pharma Guidance";

export interface HealthEdDoc {
  id:       string;
  title:    string;
  brief:    string;
  category: HealthEdCategory;
  content:  string;
}

export const HEALTH_ED_DOCS: HealthEdDoc[] = [
  // ── Handouts ──
  {
    id: "h-bp", title: "Understanding Your Blood Pressure",
    brief: "What your blood pressure numbers mean and how to keep them healthy",
    category: "Handout",
    content: `UNDERSTANDING YOUR BLOOD PRESSURE

Your blood pressure reading has two numbers:

• SYSTOLIC (top number): The pressure when your heart beats and pumps blood.
• DIASTOLIC (bottom number): The pressure when your heart rests between beats.

WHAT DO THE NUMBERS MEAN?
─────────────────────────
Normal:          Less than 120/80 mmHg
Elevated:        120–129 / less than 80 mmHg
High Stage 1:    130–139 / 80–89 mmHg
High Stage 2:    140+ / 90+ mmHg
Crisis:          Higher than 180/120 mmHg — seek emergency care immediately

TIPS TO KEEP YOUR BLOOD PRESSURE HEALTHY
─────────────────────────────────────────
• Reduce salt intake — aim for less than 5g per day
• Exercise regularly — 30 minutes of moderate activity on most days
• Maintain a healthy weight
• Limit alcohol consumption
• Do not smoke
• Manage stress through relaxation techniques
• Take your medications as prescribed — do not stop without consulting your doctor

WHEN TO SEEK HELP
─────────────────
Contact your doctor if your readings are consistently above 140/90 mmHg, or immediately if you experience severe headache, blurred vision, chest pain, or difficulty breathing.`,
  },
  {
    id: "h-inhaler", title: "How to Use Your Inhaler Correctly",
    brief: "Step-by-step guide for metered dose inhalers (MDI) and spacers",
    category: "Handout",
    content: `HOW TO USE YOUR INHALER CORRECTLY

Using your inhaler properly ensures you get the full dose of medicine into your lungs.

BEFORE YOU BEGIN
────────────────
• Remove the cap and shake the inhaler well (5–10 times)
• If using for the first time, or if not used for more than 2 weeks, prime it by spraying 2 puffs into the air

STEPS FOR USING YOUR INHALER
─────────────────────────────
1. Breathe out fully and gently
2. Place the mouthpiece between your lips — seal tightly
3. Start breathing in slowly and deeply through your mouth
4. At the same time, press down firmly on the canister once
5. Continue breathing in slowly for 3–5 seconds
6. Hold your breath for 10 seconds (or as long as comfortable)
7. Breathe out slowly
8. Wait 30–60 seconds before taking a second puff if prescribed

USING WITH A SPACER (RECOMMENDED)
──────────────────────────────────
• Attach the spacer to the inhaler
• Press the inhaler once to release one puff into the spacer
• Breathe in slowly and deeply from the spacer
• Hold your breath for 10 seconds, then breathe out
• Do not press the inhaler more than once per breath

CARE AND MAINTENANCE
────────────────────
• Clean the mouthpiece once a week with warm water and let it dry completely
• Check the dose counter — replace when it reaches 0
• Store at room temperature away from extreme heat or cold`,
  },
  {
    id: "h-sugar", title: "Managing Your Blood Sugar at Home",
    brief: "Daily monitoring tips, target ranges, and what to do when levels are off",
    category: "Handout",
    content: `MANAGING YOUR BLOOD SUGAR AT HOME

Regular blood sugar monitoring helps you and your doctor manage your diabetes effectively.

TARGET BLOOD SUGAR RANGES
──────────────────────────
Before meals (fasting):    4.0 – 7.0 mmol/L (72 – 126 mg/dL)
2 hours after meals:       Less than 10.0 mmol/L (less than 180 mg/dL)
Bedtime:                   6.0 – 8.0 mmol/L (108 – 144 mg/dL)

HOW TO CHECK YOUR BLOOD SUGAR
──────────────────────────────
1. Wash and dry your hands
2. Insert a test strip into your glucometer
3. Prick the side of your fingertip with the lancet
4. Apply a small drop of blood to the strip
5. Read and record your result

SIGNS OF LOW BLOOD SUGAR (HYPOGLYCAEMIA)
─────────────────────────────────────────
Shakiness, sweating, dizziness, confusion, hunger
ACTION: Eat 15g of fast-acting sugar (3 glucose tablets, 150ml fruit juice or regular soda). Re-check in 15 minutes.

SIGNS OF HIGH BLOOD SUGAR (HYPERGLYCAEMIA)
───────────────────────────────────────────
Increased thirst, frequent urination, blurry vision, fatigue
ACTION: Drink water, take your medications as prescribed, and contact your doctor if levels stay above 14 mmol/L.

RECORD KEEPING
──────────────
Keep a logbook with date, time, reading, meals, and any symptoms. Bring this to every clinic visit.`,
  },
  {
    id: "h-wound", title: "Wound Care at Home",
    brief: "How to clean and dress your wound safely to prevent infection",
    category: "Handout",
    content: `WOUND CARE AT HOME

Proper wound care helps prevent infection and speeds up healing.

SUPPLIES YOU WILL NEED
───────────────────────
• Clean water or saline solution
• Antiseptic solution (as prescribed)
• Sterile gauze pads and dressing
• Medical tape
• Disposable gloves

STEPS FOR DRESSING YOUR WOUND
──────────────────────────────
1. Wash your hands thoroughly with soap and water for at least 20 seconds
2. Put on disposable gloves
3. Gently remove the old dressing — if it sticks, moisten with saline before removing
4. Clean the wound gently with clean water or saline from the centre outward
5. Pat dry with a clean, sterile gauze pad
6. Apply any prescribed ointment or antiseptic
7. Cover with a fresh sterile dressing and secure with tape
8. Dispose of used materials safely

HOW OFTEN TO CHANGE THE DRESSING
─────────────────────────────────
As directed by your doctor — typically once or twice daily, or whenever the dressing becomes wet or soiled.

WARNING SIGNS OF INFECTION — SEEK MEDICAL HELP IMMEDIATELY
────────────────────────────────────────────────────────────
• Increasing redness, warmth, or swelling around the wound
• Wound producing yellow/green discharge or has an unusual smell
• Wound is not healing or is getting larger
• Fever above 38°C (100.4°F)
• Red streaks spreading from the wound`,
  },
  {
    id: "h-prescription", title: "Reading Your Prescription",
    brief: "How to understand and safely follow your medicine prescription",
    category: "Handout",
    content: `READING YOUR PRESCRIPTION

Your prescription contains important information. Understanding it helps you take your medicines safely.

COMMON ABBREVIATIONS
──────────────────────
OD (Once daily):        Take once every day
BID (Twice daily):      Take two times per day
TID (Three times daily):Take three times per day
QID (Four times daily): Take four times per day
PRN (As needed):        Take only when needed
AC (Before meals):      Take before eating
PC (After meals):       Take after eating
HS (At bedtime):        Take at night before sleep

WHAT YOUR PRESCRIPTION SHOWS
──────────────────────────────
• Medicine name (generic or brand name)
• Strength (e.g., 500 mg)
• How much to take (e.g., 1 tablet)
• How often (e.g., twice daily)
• For how long (e.g., 5 days)

IMPORTANT REMINDERS
────────────────────
• Take your full course of antibiotics even if you feel better
• Never share your medication with others
• Store medicines as directed (away from heat, light, or moisture)
• If you miss a dose, take it as soon as you remember — unless it's almost time for your next dose. Never double up.
• Always tell your doctor about all medicines and supplements you are taking`,
  },
  {
    id: "h-er-visit", title: "When to Visit the Emergency Room",
    brief: "Warning signs that require immediate emergency medical care",
    category: "Handout",
    content: `WHEN TO VISIT THE EMERGENCY ROOM

Some symptoms require immediate medical attention. Do not wait — go to the emergency room or call emergency services (999/112/911) if you experience any of the following:

CHEST AND HEART
───────────────
• Chest pain, pressure, or tightness
• Pain spreading to your arm, jaw, neck, or back
• Irregular or very rapid heartbeat with dizziness or fainting
• Shortness of breath at rest

BRAIN AND NERVOUS SYSTEM
─────────────────────────
• Sudden severe headache (worst of your life)
• Sudden confusion, slurred speech, or difficulty understanding
• Sudden weakness or numbness on one side of the body
• Sudden loss of vision in one or both eyes
• Seizures

BREATHING
──────────
• Severe difficulty breathing or choking
• Breathing rapidly with lips or fingernails turning blue

STOMACH AND ABDOMINAL
──────────────────────
• Sudden, severe abdominal pain
• Vomiting blood or blood in stool
• Signs of serious dehydration (no urination for 8+ hours, severe dizziness)

INJURY
──────
• Deep cuts that won't stop bleeding after 10 minutes of pressure
• Suspected broken bone
• Head injury with loss of consciousness, confusion, or vomiting
• Severe burns

ALLERGIC REACTION
──────────────────
• Swelling of lips, tongue, or throat
• Difficulty breathing or swallowing after eating or taking a medicine — THIS IS AN EMERGENCY`,
  },
  {
    id: "h-safe-meds", title: "Safe Medication Storage",
    brief: "How to store medicines correctly to keep them safe and effective",
    category: "Handout",
    content: `SAFE MEDICATION STORAGE

Storing medicines correctly keeps them safe, effective, and out of reach of children.

GENERAL STORAGE RULES
──────────────────────
• Keep all medicines in their original containers with labels intact
• Store in a cool, dry place (15–25°C) unless stated otherwise
• Keep away from direct sunlight and moisture
• Do NOT store in the bathroom — steam and humidity can damage medicines
• Keep out of reach of children and pets — use a locked cabinet if possible

SPECIAL STORAGE REQUIREMENTS
──────────────────────────────
• Refrigerate if the label says so (e.g., insulin, certain eye drops, liquid antibiotics)
• Do NOT freeze unless specifically instructed
• Inhalers and suppositories should not be exposed to extreme heat

CHECKING YOUR MEDICINES
─────────────────────────
• Check expiry dates regularly and dispose of expired medicines
• Look for changes in colour, texture, or smell — do not use if changed
• Check for cloudiness or particles in liquid medicines

SAFE DISPOSAL
──────────────
• Do NOT flush medicines down the toilet unless directed
• Do NOT throw in household rubbish
• Return unused or expired medicines to your nearest pharmacy for proper disposal

TRAVELLING WITH MEDICINES
──────────────────────────
• Carry medicines in your hand luggage when flying
• Keep in original labelled containers
• Carry a copy of your prescription for travel`,
  },
  {
    id: "h-ecg", title: "Understanding Your ECG Report",
    brief: "A simple explanation of what an ECG measures and what the results mean",
    category: "Handout",
    content: `UNDERSTANDING YOUR ECG REPORT

An ECG (Electrocardiogram) records the electrical activity of your heart. It is a painless, non-invasive test.

WHAT DOES AN ECG MEASURE?
──────────────────────────
• Your heart rate (how fast your heart beats)
• Your heart rhythm (whether it is regular or irregular)
• The timing and strength of electrical signals as they travel through your heart

THE WAVES ON YOUR ECG
──────────────────────
• P Wave: The upper chambers (atria) contract
• QRS Complex: The lower chambers (ventricles) contract and pump blood out
• T Wave: The ventricles recover and prepare for the next beat

NORMAL ECG FINDINGS
────────────────────
• Regular heart rate: 60–100 beats per minute
• Regular rhythm with equal spacing between beats
• Normal wave shapes and sizes

COMMON FINDINGS THAT MAY NEED FOLLOW-UP
─────────────────────────────────────────
• Bradycardia: Heart rate below 60 bpm
• Tachycardia: Heart rate above 100 bpm
• Atrial Fibrillation: Irregular rhythm — common, manageable with treatment
• ST changes: May suggest heart strain or a past heart event

IMPORTANT
──────────
An ECG is just one part of your assessment. Abnormal ECG findings alone do not always mean something is seriously wrong. Your doctor will explain your results in the context of your symptoms and medical history.`,
  },

  // ── Patient Education ──
  {
    id: "pe-diabetes", title: "Living with Diabetes: A Complete Guide",
    brief: "Comprehensive guide covering diet, medications, foot care, and regular checkups",
    category: "Patient Education",
    content: `LIVING WITH DIABETES: A COMPLETE GUIDE

Diabetes is a lifelong condition, but with the right knowledge and habits, you can live a healthy and full life.

UNDERSTANDING YOUR DIABETES
────────────────────────────
• Type 1 Diabetes: Your body does not produce insulin. You need insulin injections or a pump.
• Type 2 Diabetes: Your body does not use insulin effectively. Managed with lifestyle changes, tablets, and sometimes insulin.

YOUR DAILY ROUTINE
──────────────────
DIET
• Choose whole grains, vegetables, legumes, lean proteins, and healthy fats
• Limit refined sugars, white bread, white rice, sugary drinks, and fried foods
• Eat regular meals at consistent times — avoid skipping meals
• Monitor portion sizes

PHYSICAL ACTIVITY
• Aim for 150 minutes of moderate exercise per week (brisk walking, swimming, cycling)
• Check your blood sugar before and after exercise
• Always carry a fast-acting sugar source when exercising

MEDICATIONS
• Take as prescribed — never adjust doses without consulting your doctor
• If you take insulin, follow the injection technique and rotation sites

MONITORING
• Check blood sugar as directed by your doctor
• Keep a logbook of readings
• Know your HbA1c target (usually less than 7%)

FOOT CARE — VERY IMPORTANT FOR DIABETICS
──────────────────────────────────────────
• Inspect your feet daily for cuts, blisters, redness, or swelling
• Wash and dry feet thoroughly, especially between toes
• Wear well-fitting shoes — never walk barefoot outdoors
• See a podiatrist regularly

ROUTINE CHECKUPS
─────────────────
• HbA1c test: Every 3–6 months
• Blood pressure: Every visit
• Kidney function and urine test: Annually
• Eye examination (retinal screen): Annually
• Foot examination: Annually`,
  },
  {
    id: "pe-asthma", title: "Asthma Care at Home",
    brief: "Instructions for managing asthma symptoms, inhaler use, and trigger avoidance",
    category: "Patient Education",
    content: `ASTHMA CARE AT HOME

Asthma causes the airways to become inflamed, narrow, and swollen. With proper management, most people with asthma lead normal, active lives.

UNDERSTANDING YOUR MEDICATIONS
────────────────────────────────
RELIEVER (Blue inhaler — Salbutamol/Ventolin):
• Use when you have symptoms: coughing, wheezing, chest tightness, shortness of breath
• Works within minutes — provides immediate relief
• Should NOT be needed more than 3 times per week (excluding exercise). If you need it more, see your doctor.

PREVENTER (Usually brown, purple, or red inhaler):
• Take every day as prescribed — even when you feel well
• Reduces inflammation over time — effects build up over weeks
• Do NOT use as a quick-relief inhaler

ASTHMA ACTION PLAN
──────────────────
GREEN ZONE (Feeling well):
• Take preventers as prescribed
• Continue normal activities

YELLOW ZONE (Getting worse):
• Use reliever inhaler
• Review and adjust activities
• Contact your doctor if not improving within 24 hours

RED ZONE (Medical emergency):
• Severe breathlessness — can't speak in full sentences
• Reliever not helping after 10 puffs
• CALL EMERGENCY SERVICES IMMEDIATELY

AVOIDING TRIGGERS
──────────────────
• Dust mites: Wash bedding weekly in hot water, use allergen-proof covers
• Pet dander: Keep pets out of the bedroom
• Smoke: Avoid smoking and second-hand smoke — this is critical
• Pollen: Check pollen forecasts, keep windows closed during high pollen days
• Cold air: Cover your mouth and nose in cold weather
• Exercise: Use reliever inhaler 15 minutes before exercise if prescribed`,
  },
  {
    id: "pe-heart-failure", title: "Managing Heart Failure",
    brief: "Daily monitoring, fluid and salt control, medications, and warning signs",
    category: "Patient Education",
    content: `MANAGING HEART FAILURE

Heart failure means your heart is not pumping as efficiently as it should. With the right management, many people live well with this condition.

DAILY MONITORING — DO THESE EVERY MORNING
───────────────────────────────────────────
• Weigh yourself at the same time, after going to the toilet, before breakfast
• Record your weight in a diary
• ALERT: Contact your doctor if you gain more than 2 kg in 2 days or 3 kg in a week

FLUID AND SALT CONTROL
────────────────────────
• Limit fluid intake as directed (usually 1.5–2 litres per day)
• Reduce salt: avoid adding salt to food, limit processed and canned foods
• Read food labels — choose items with less than 120mg sodium per 100g

YOUR MEDICATIONS
─────────────────
Take ALL prescribed medications every day — even when feeling well:
• ACE inhibitors / ARBs: Protect the heart, reduce blood pressure
• Beta-blockers: Slow heart rate, reduce workload on heart
• Diuretics (water tablets): Reduce fluid buildup — they may cause more frequent urination

YOUR ACTIVITY LEVEL
────────────────────
• Stay as active as your symptoms allow — rest does not improve heart failure
• Walk daily — start gently and build up gradually
• Rest if you become breathless or very tired

WHEN TO CALL YOUR DOCTOR
──────────────────────────
• Weight gain of 2+ kg in 2 days
• Increasing swelling in legs, ankles, or feet
• Increased breathlessness at rest or when lying flat
• New or worsening cough

GO TO EMERGENCY IMMEDIATELY IF
────────────────────────────────
• Sudden severe difficulty breathing
• Chest pain
• Confusion or extreme fatigue`,
  },
  {
    id: "pe-cholesterol", title: "Understanding Your Cholesterol",
    brief: "What the numbers mean and lifestyle changes to improve your lipid profile",
    category: "Patient Education",
    content: `UNDERSTANDING YOUR CHOLESTEROL

Cholesterol is a fatty substance in your blood. While your body needs some cholesterol, too much can increase your risk of heart disease and stroke.

YOUR CHOLESTEROL NUMBERS
─────────────────────────
Total Cholesterol:        Less than 5.0 mmol/L
LDL ("Bad" cholesterol):  Less than 3.0 mmol/L (less than 1.8 mmol/L if high risk)
HDL ("Good" cholesterol): Greater than 1.0 mmol/L (men) / Greater than 1.2 mmol/L (women)
Triglycerides:            Less than 1.7 mmol/L

UNDERSTANDING LDL AND HDL
──────────────────────────
• LDL (Low-Density Lipoprotein): Deposits cholesterol in artery walls — keep this LOW
• HDL (High-Density Lipoprotein): Carries cholesterol away from arteries — keep this HIGH

DIET CHANGES THAT HELP
───────────────────────
REDUCE:
• Saturated fats: Full-fat dairy, fatty meat, coconut oil, palm oil, pastries
• Trans fats: Processed snacks, margarine, fast food
• Dietary cholesterol: Organ meats, egg yolks (limit)

INCREASE:
• Soluble fibre: Oats, barley, beans, lentils, apples, oranges
• Healthy fats: Avocado, olive oil, nuts, seeds, oily fish
• Plant sterols: Found in fortified foods, help block cholesterol absorption

LIFESTYLE CHANGES
──────────────────
• Exercise: 150 minutes of moderate activity per week raises HDL
• Stop smoking: Smoking lowers HDL and damages blood vessels
• Limit alcohol: No more than 1–2 standard drinks per day
• Lose weight: Even 5–10% weight loss can significantly improve cholesterol levels`,
  },
  {
    id: "pe-stroke", title: "Stroke Prevention and Recovery",
    brief: "Risk factors, FAST warning signs, prevention steps, and rehabilitation",
    category: "Patient Education",
    content: `STROKE PREVENTION AND RECOVERY

A stroke occurs when blood supply to part of the brain is cut off. Strokes are medical emergencies — fast action saves lives and reduces disability.

RECOGNISE A STROKE: FAST
─────────────────────────
F — FACE:    Does one side of the face droop? Ask them to smile.
A — ARMS:    Can they raise both arms? Does one arm drift downward?
S — SPEECH:  Is their speech slurred or strange?
T — TIME:    Call emergency services IMMEDIATELY. Time is brain.

STROKE RISK FACTORS YOU CAN CONTROL
──────────────────────────────────────
• High blood pressure — the single most important risk factor. Monitor and treat.
• Smoking — doubles the risk of stroke. Quit completely.
• Diabetes — control blood sugar rigorously
• Atrial fibrillation — irregular heartbeat requires anticoagulation medication
• High cholesterol — treat with diet, exercise, and statins if prescribed
• Obesity — lose weight through healthy diet and regular exercise
• Alcohol excess — limit to recommended safe levels

STROKE RECOVERY
────────────────
Recovery depends on which part of the brain was affected and how quickly treatment was given.

REHABILITATION IS KEY:
• Physiotherapy: Rebuilds muscle strength and coordination
• Speech therapy: Helps with communication and swallowing
• Occupational therapy: Helps with daily tasks and independence

DURING RECOVERY:
• Follow your rehabilitation programme consistently
• Take all prescribed medications — especially anticoagulants or antiplatelets
• Attend all follow-up appointments
• Join a stroke support group for motivation and advice
• Allow rest — the brain needs time to heal`,
  },
  {
    id: "pe-copd", title: "COPD Self-Management Guide",
    brief: "Breathing techniques, energy conservation, trigger avoidance, and medication management",
    category: "Patient Education",
    content: `COPD SELF-MANAGEMENT GUIDE

COPD (Chronic Obstructive Pulmonary Disease) is a progressive lung disease that makes breathing difficult. There is no cure, but with good management, you can control symptoms and maintain quality of life.

BREATHING TECHNIQUES
─────────────────────
PURSED LIP BREATHING:
1. Breathe in slowly through the nose for 2 seconds
2. Purse your lips as if about to whistle
3. Breathe out slowly through pursed lips for 4 seconds
• Use during activities or when feeling breathless

DIAPHRAGMATIC (BELLY) BREATHING:
1. Sit comfortably, relax your shoulders
2. Place one hand on your chest, one on your belly
3. Breathe in through the nose — belly should rise, chest should stay still
4. Breathe out slowly through pursed lips

ENERGY CONSERVATION
────────────────────
• Pace yourself — do not rush
• Plan activities during your best time of day (usually morning)
• Sit rather than stand when possible (e.g., sitting to cook or shower)
• Use energy-saving devices (electric can openers, shower chair)
• Take rest breaks before becoming exhausted

PREVENTING FLARE-UPS
──────────────────────
• NEVER SMOKE — smoking is the primary cause and makes COPD worse rapidly
• Avoid secondhand smoke, dust, fumes, and air pollution
• Get an annual flu vaccine and pneumonia vaccine as recommended
• Wash hands frequently to prevent respiratory infections
• Recognise early signs of a flare-up: increased breathlessness, more mucus, colour change in mucus, fever

MEDICATIONS
────────────
• Bronchodilators (inhalers): Open the airways — use as prescribed (short or long-acting)
• Corticosteroid inhalers: Reduce inflammation — take every day as prescribed
• Oral steroids/antibiotics: May be prescribed during flare-ups — complete the full course`,
  },
  {
    id: "pe-kidney", title: "Kidney Disease: Diet and Lifestyle",
    brief: "Dietary restrictions, fluid intake, and lifestyle habits to protect kidney function",
    category: "Patient Education",
    content: `KIDNEY DISEASE: DIET AND LIFESTYLE

When the kidneys are not working well, waste products and fluids can build up in the body. Diet and lifestyle changes can help protect remaining kidney function and control symptoms.

DIETARY GUIDELINES
──────────────────
LIMIT OR RESTRICT:
• Sodium (salt): Causes fluid retention and raises blood pressure — avoid adding salt, limit processed foods
• Potassium: If levels are high — avoid bananas, oranges, potatoes, tomatoes, nuts, chocolate
• Phosphorus: If levels are high — limit dairy products, nuts, seeds, dark-coloured soft drinks, processed foods
• Protein: If advised — reduce red meat, poultry, eggs (follow your dietitian's guidance)

IMPORTANT:
• Do NOT take potassium or phosphorus supplements unless prescribed
• Many "healthy" foods can be harmful in kidney disease — always follow your dietitian's specific advice

FLUID INTAKE
─────────────
• Fluid restriction may be advised if you have fluid retention or swelling
• Your doctor or dietitian will give you a specific daily fluid target
• Remember: all liquids count (soups, ice cream, jelly)

LIFESTYLE HABITS
─────────────────
• Control blood pressure: High blood pressure damages kidneys further
• Control blood sugar: Diabetes is a leading cause of kidney disease
• Avoid NSAIDs (ibuprofen, diclofenac): These medications reduce blood flow to the kidneys
• Do not smoke: Smoking accelerates kidney damage
• Exercise: Gentle regular exercise helps control blood pressure and weight
• Regular monitoring: Attend all blood tests and clinic visits to track kidney function (creatinine, eGFR, urine tests)`,
  },
  {
    id: "pe-thyroid", title: "Understanding Thyroid Disorders",
    brief: "Symptoms of hypothyroidism and hyperthyroidism, treatment, and monitoring",
    category: "Patient Education",
    content: `UNDERSTANDING THYROID DISORDERS

The thyroid gland produces hormones that control your metabolism. When it produces too much or too little, it affects almost every system in your body.

HYPOTHYROIDISM (Underactive Thyroid)
──────────────────────────────────────
SYMPTOMS:
• Fatigue and sluggishness
• Weight gain despite not eating more
• Feeling cold, especially hands and feet
• Dry skin and brittle nails
• Constipation
• Depression or low mood
• Brain fog and poor memory
• Slow heart rate

TREATMENT: Levothyroxine (synthetic thyroid hormone) taken once daily on an empty stomach, 30–60 minutes before breakfast.

HYPERTHYROIDISM (Overactive Thyroid)
──────────────────────────────────────
SYMPTOMS:
• Unexplained weight loss
• Rapid or irregular heartbeat
• Nervousness, anxiety, irritability
• Trembling hands
• Increased sweating
• Difficulty sleeping
• Frequent bowel movements
• Enlarged thyroid (goitre) — visible swelling in the neck

TREATMENT: Anti-thyroid medications, radioactive iodine therapy, or surgery (depending on cause and severity).

MONITORING YOUR THYROID CONDITION
───────────────────────────────────
• Blood tests (TSH, Free T4) are required regularly — typically every 3–6 months when stable
• Never stop thyroid medications without consulting your doctor
• Many medications and supplements can interfere with thyroid medication — always inform your doctor of everything you take
• Calcium tablets and iron supplements should be taken at least 4 hours apart from levothyroxine`,
  },
  {
    id: "pe-osteoporosis", title: "Osteoporosis and Bone Health",
    brief: "Prevention, calcium and vitamin D, exercise, and fall prevention strategies",
    category: "Patient Education",
    content: `OSTEOPOROSIS AND BONE HEALTH

Osteoporosis means your bones have become weak and brittle, making them more likely to fracture. It is often called a "silent disease" because there are no symptoms until a fracture occurs.

WHO IS AT RISK?
────────────────
• Women after menopause
• Men over 70
• People who have used long-term corticosteroids
• Those with low body weight
• People with family history of osteoporosis
• Those with low calcium or vitamin D levels
• Heavy smokers and excessive alcohol drinkers

CALCIUM AND VITAMIN D — ESSENTIAL FOR BONE HEALTH
────────────────────────────────────────────────────
Calcium requirements: 1000–1200 mg per day
Good sources: Dairy products, fortified plant milks, leafy greens (kale, broccoli), sardines with bones

Vitamin D: Required for calcium absorption
Sources: Sunlight exposure (10–15 minutes daily), oily fish, fortified foods
Supplement: Your doctor may prescribe supplements if your levels are low

EXERCISE FOR BONE HEALTH
─────────────────────────
• Weight-bearing exercise (walking, dancing, low-impact aerobics): Stimulates new bone formation
• Resistance/strength training: Strengthens muscles and bones
• Balance exercises (tai chi, yoga): Reduce fall risk

FALL PREVENTION — CRUCIAL IF YOU HAVE OSTEOPOROSIS
─────────────────────────────────────────────────────
• Remove trip hazards at home: loose rugs, cables, clutter
• Install grab rails in the bathroom and stairways
• Use non-slip mats in the shower
• Ensure good lighting throughout your home
• Wear supportive, well-fitting footwear
• Have your vision and hearing checked regularly
• Review all medications with your doctor for those that may cause dizziness`,
  },

  // ── Non-Pharma Guidance ──
  {
    id: "np-cardiac-exercise", title: "Exercise Guidelines for Cardiac Patients",
    brief: "Safe exercise types, intensity, warning signs to stop, and how to progress",
    category: "Non-Pharma Guidance",
    content: `EXERCISE GUIDELINES FOR CARDIAC PATIENTS

Regular physical activity is one of the most important things you can do for your heart health. However, it is important to exercise safely.

GENERAL PRINCIPLES
──────────────────
• Always warm up for 5–10 minutes before exercise (gentle walking, light stretching)
• Cool down for 5–10 minutes after exercise
• Exercise should make you breathe harder but you should still be able to hold a short conversation
• Start with low intensity and gradually increase over weeks

RECOMMENDED EXERCISE TYPES
────────────────────────────
• Walking: Start with 10–15 minutes and build to 30–45 minutes daily
• Cycling (stationary or outdoor on flat terrain): Excellent for heart health with low joint strain
• Swimming or water aerobics: Gentle on joints, excellent cardiovascular workout
• Light resistance training: 2–3 times per week with light weights after doctor clearance

HOW HARD TO EXERCISE (BORG SCALE)
────────────────────────────────────
Aim for perceived exertion of 11–14 out of 20 (between "light" and "somewhat hard").
You should be able to speak in short sentences but not sing.

STOP EXERCISING AND REST IF YOU EXPERIENCE:
────────────────────────────────────────────
• Chest pain, pressure, or tightness
• Severe shortness of breath
• Dizziness or lightheadedness
• Palpitations or irregular heartbeat
• Unusual fatigue that doesn't improve with rest

SEEK MEDICAL HELP IMMEDIATELY if symptoms are severe or persist after resting.

EXERCISE AFTER A HEART EVENT
──────────────────────────────
If you have had a heart attack, stent, or bypass surgery:
• Join a cardiac rehabilitation programme — it is the gold standard for safe recovery
• Do not start vigorous exercise without medical clearance
• Follow your rehabilitation team's specific programme`,
  },
  {
    id: "np-anti-inflammatory-diet", title: "Anti-Inflammatory Diet Plan",
    brief: "Foods to include and avoid to reduce chronic inflammation in the body",
    category: "Non-Pharma Guidance",
    content: `ANTI-INFLAMMATORY DIET PLAN

Chronic inflammation contributes to many diseases including heart disease, diabetes, arthritis, and certain cancers. The food you eat can either promote or reduce inflammation.

FOODS TO EAT MORE OF (ANTI-INFLAMMATORY)
──────────────────────────────────────────
FRUITS AND VEGETABLES:
• Berries (blueberries, strawberries, raspberries)
• Leafy greens (spinach, kale, arugula)
• Broccoli, cauliflower, brussels sprouts
• Tomatoes, avocado, cherries, oranges

HEALTHY FATS:
• Extra virgin olive oil — 1–2 tablespoons daily
• Avocados and avocado oil
• Nuts (walnuts, almonds, pecans) — one small handful daily

OMEGA-3 RICH FISH:
• Salmon, sardines, mackerel, herring, tuna
• Aim for 2–3 servings per week

WHOLE GRAINS:
• Oats, brown rice, quinoa, wholegrain bread and pasta

SPICES WITH ANTI-INFLAMMATORY PROPERTIES:
• Turmeric (with black pepper to enhance absorption)
• Ginger, cinnamon, garlic

FOODS TO LIMIT OR AVOID (PRO-INFLAMMATORY)
────────────────────────────────────────────
• Sugar and high-fructose corn syrup: Sugary drinks, sweets, cakes, biscuits
• Refined carbohydrates: White bread, white rice, pastries
• Fried foods: French fries, fried chicken
• Processed meats: Sausages, hot dogs, deli meats
• Margarine, shortening, and lard
• Excessive alcohol
• Vegetable oils high in omega-6: Sunflower, soybean, corn oil (in large amounts)

PRACTICAL TIPS
──────────────
• Follow a Mediterranean-style diet as a framework
• Cook at home more — this gives you control over ingredients
• Replace butter with olive oil
• Snack on nuts and fruits instead of processed snacks
• Drink green tea instead of sugary beverages`,
  },
  {
    id: "np-stress", title: "Stress Management Techniques",
    brief: "Practical evidence-based techniques to reduce stress and improve mental wellbeing",
    category: "Non-Pharma Guidance",
    content: `STRESS MANAGEMENT TECHNIQUES

Chronic stress affects physical and mental health. It can raise blood pressure, weaken the immune system, disrupt sleep, and worsen many medical conditions.

BREATHING TECHNIQUES
─────────────────────
4-7-8 BREATHING:
1. Breathe in through the nose for 4 counts
2. Hold your breath for 7 counts
3. Breathe out through the mouth for 8 counts
4. Repeat 4 times
• Do this twice daily or when feeling stressed

BOX BREATHING:
1. Inhale for 4 counts
2. Hold for 4 counts
3. Exhale for 4 counts
4. Hold for 4 counts
• Used by athletes and military for calm under pressure

MINDFULNESS AND MEDITATION
────────────────────────────
• Mindfulness: Focus on what you are doing right now — what you see, hear, and feel — without judgment
• Even 5–10 minutes of mindfulness meditation daily can reduce stress over time
• Try guided meditation apps (Headspace, Calm, Insight Timer — many are free)

PHYSICAL APPROACHES
────────────────────
• Exercise: One of the most powerful stress relievers — releases endorphins and improves mood
• Yoga and tai chi: Combine movement, breathing, and mindfulness
• Spend time in nature: Walking in green spaces reduces cortisol levels
• Adequate sleep: Aim for 7–9 hours per night

LIFESTYLE HABITS
─────────────────
• Limit caffeine and alcohol — both worsen anxiety and stress
• Social connection: Spend time with people you trust and enjoy
• Set realistic goals and learn to say no to non-essential demands
• Schedule regular breaks during the workday — even 5 minutes helps
• Keep a journal: Writing down worries can help externalise and process them

WHEN TO SEEK HELP
──────────────────
If stress is significantly affecting your daily life, relationships, or health, speak to your doctor or a mental health professional. Psychological therapies such as CBT (Cognitive Behavioural Therapy) are highly effective.`,
  },
  {
    id: "np-sleep", title: "Sleep Hygiene for Better Health",
    brief: "Practical habits to improve sleep quality and duration",
    category: "Non-Pharma Guidance",
    content: `SLEEP HYGIENE FOR BETTER HEALTH

Good quality sleep is essential for physical repair, cognitive function, immunity, mood, and metabolic health. Most adults need 7–9 hours per night.

SIGNS OF POOR SLEEP QUALITY
─────────────────────────────
• Waking feeling unrefreshed despite enough hours
• Difficulty concentrating during the day
• Irritability or low mood
• Relying heavily on caffeine to function
• Falling asleep unintentionally during the day

SLEEP HYGIENE PRINCIPLES
─────────────────────────
CONSISTENT SCHEDULE:
• Go to bed and wake at the same time every day — including weekends
• Regularity is the most powerful factor in sleep quality

YOUR SLEEP ENVIRONMENT:
• Keep your bedroom cool (16–19°C is ideal for most people)
• Make it as dark as possible — use blackout curtains or an eye mask
• Reduce noise — use earplugs or a white noise machine if needed
• Reserve your bed for sleep and intimacy only — not work or screens

BEFORE BED (WIND-DOWN ROUTINE):
• Start winding down 1 hour before sleep
• Avoid screens (phones, tablets, computers, TV) — blue light suppresses melatonin
• Try reading, a warm bath, gentle stretching, or meditation
• Avoid heavy meals within 2–3 hours of bedtime
• Avoid caffeine after 2 pm (coffee, tea, energy drinks, cola)
• Avoid alcohol — it disrupts sleep architecture even if it helps you fall asleep initially

DAYTIME HABITS:
• Get natural light exposure in the morning — helps reset your circadian rhythm
• Exercise regularly — but not within 2 hours of bedtime
• Limit naps to 20 minutes and before 3 pm

IF YOU CAN'T SLEEP:
• Do not lie in bed awake for more than 20 minutes — get up and do something quiet in dim light until sleepy`,
  },
  {
    id: "np-smoking", title: "Smoking Cessation Support",
    brief: "Why quitting matters, what to expect, and the tools and strategies available",
    category: "Non-Pharma Guidance",
    content: `SMOKING CESSATION SUPPORT

Quitting smoking is the single most important thing you can do to improve your health — at any age, at any stage.

BENEFITS OF QUITTING — IT STARTS IMMEDIATELY
─────────────────────────────────────────────
20 minutes:   Heart rate and blood pressure drop
12 hours:     Carbon monoxide level in blood returns to normal
24 hours:     Risk of heart attack begins to decrease
2 weeks:      Circulation improves, lung function increases
1 month:      Coughing and shortness of breath decrease
1 year:       Heart disease risk is half that of a smoker
5 years:      Stroke risk reduced to that of a non-smoker
10 years:     Lung cancer risk is half that of a smoker
15 years:     Heart disease risk is that of a non-smoker

WITHDRAWAL SYMPTOMS ARE NORMAL
────────────────────────────────
For the first 2–4 weeks you may experience:
• Cravings (usually last 3–5 minutes — they will pass)
• Irritability, anxiety, and difficulty concentrating
• Increased appetite
• Headaches, fatigue, and sleep disturbance
These are signs your body is recovering. They will improve.

STRATEGIES THAT WORK
──────────────────────
COMBINATION APPROACH (most effective):
• Nicotine Replacement Therapy (NRT): Patches, gum, lozenges, inhalers
• Prescription medications: Your doctor can prescribe Varenicline (Champix) or Bupropion
• Behavioural support: Counselling or support groups significantly increase success rates

PRACTICAL TIPS:
• Set a quit date and tell family and friends
• Remove all cigarettes, lighters, and ashtrays from your home
• Identify your triggers (stress, alcohol, after meals) and plan alternatives
• Drink water when craving hits — it helps
• Exercise — reduces cravings and stress
• Call a quit line or download a cessation app for daily support`,
  },
  {
    id: "np-weight", title: "Weight Management Strategies",
    brief: "Sustainable approaches to achieving and maintaining a healthy weight",
    category: "Non-Pharma Guidance",
    content: `WEIGHT MANAGEMENT STRATEGIES

Maintaining a healthy weight reduces the risk of diabetes, heart disease, joint problems, certain cancers, and improves energy and mood.

UNDERSTANDING ENERGY BALANCE
──────────────────────────────
Weight gain occurs when you consume more energy than you use.
Weight loss requires using more energy than you consume.

A deficit of approximately 500 calories per day leads to approximately 0.5 kg of weight loss per week — a safe and sustainable rate.

DIETARY APPROACHES
──────────────────
WHAT TO DO:
• Eat regular meals — do not skip breakfast
• Fill half your plate with vegetables
• Choose whole grains over refined (brown rice, wholemeal bread, oats)
• Lean proteins at each meal — keep you full longer (chicken, fish, legumes, eggs)
• Healthy fats in moderation: nuts, seeds, avocado, olive oil
• Drink water before meals — it can reduce calorie intake
• Eat mindfully — sit at a table, eat slowly, without screens

WHAT TO AVOID:
• Sugary drinks (including fruit juices and smoothies)
• Ultra-processed foods (crisps, biscuits, ready meals)
• Large portions — use smaller plates and bowls
• Emotional or boredom eating — identify triggers and plan alternatives

PHYSICAL ACTIVITY
──────────────────
• Aim for 150–300 minutes of moderate aerobic activity per week for weight management
• Add strength training 2–3 times per week — muscle burns more calories at rest
• Reduce sedentary time — get up and move for 5 minutes every hour
• Find activities you enjoy — you're more likely to stick with them

REALISTIC EXPECTATIONS
───────────────────────
• Aim for 5–10% body weight loss over 3–6 months as an initial target — this alone significantly improves health markers
• Weight management is lifelong — focus on sustainable habits, not quick fixes
• Sleep and stress management are critical — both affect hunger hormones`,
  },
  {
    id: "np-physio-knee", title: "Home Exercise Programme: Knee",
    brief: "Physiotherapy exercises to strengthen the knee and reduce pain",
    category: "Non-Pharma Guidance",
    content: `HOME EXERCISE PROGRAMME: KNEE

These exercises help strengthen the muscles around your knee, improve stability, and reduce pain. Perform them as directed by your physiotherapist or doctor.

GENERAL INSTRUCTIONS
─────────────────────
• Perform exercises on a firm but comfortable surface
• Move slowly and smoothly — do not rush
• Some mild discomfort is normal; SHARP pain means STOP
• Apply an ice pack for 15–20 minutes after exercises if swelling occurs
• Wear comfortable, supportive footwear

EXERCISE 1: STATIC QUADRICEPS CONTRACTIONS
────────────────────────────────────────────
Starting position: Lying flat on your back, leg straight
1. Tighten the muscles on top of your thigh — press the back of your knee gently toward the floor
2. Hold for 5 seconds
3. Relax
4. Repeat: 10–15 times, 2–3 sets, each leg

EXERCISE 2: STRAIGHT LEG RAISE
────────────────────────────────
1. Lie on your back, one knee bent (foot flat), other leg straight
2. Tighten the thigh of the straight leg
3. Raise the straight leg to the height of the bent knee
4. Hold 3 seconds, lower slowly
5. Repeat: 10–15 times, 2–3 sets, each leg

EXERCISE 3: SEATED KNEE EXTENSION
───────────────────────────────────
1. Sit in a chair, both feet on floor
2. Slowly straighten one knee until leg is fully extended
3. Hold 3 seconds, lower slowly
4. Repeat: 10–15 times, 2–3 sets, each leg

EXERCISE 4: MINI SQUATS (WALL SLIDES)
───────────────────────────────────────
1. Stand with your back against a wall, feet shoulder-width apart, 30 cm from the wall
2. Slowly slide down the wall until knees are at approximately 30°
3. Hold 5 seconds
4. Slide back up slowly
5. Repeat: 10–15 times, 2–3 sets

FREQUENCY: Perform twice daily or as directed. It may take 4–6 weeks of consistent exercise to notice significant improvement.`,
  },
  {
    id: "np-physio-back", title: "Home Exercise Programme: Lower Back",
    brief: "Physiotherapy exercises to relieve lower back pain and improve core strength",
    category: "Non-Pharma Guidance",
    content: `HOME EXERCISE PROGRAMME: LOWER BACK

These exercises help relieve lower back pain, improve flexibility, and strengthen the core muscles that support your spine.

IMPORTANT BEFORE YOU BEGIN
────────────────────────────
• These exercises are for non-specific lower back pain (no leg pain, no numbness, no weakness in legs)
• If you have leg pain, numbness, or tingling, consult your doctor before starting
• Stop any exercise that increases your leg pain significantly

EXERCISE 1: KNEE-TO-CHEST STRETCH
───────────────────────────────────
1. Lie on your back with knees bent, feet flat
2. Bring one knee gently toward your chest, holding behind the thigh
3. Hold 20–30 seconds, breathing normally
4. Repeat on other side
5. Perform 3 times each side, twice daily

EXERCISE 2: PELVIC TILT
─────────────────────────
1. Lie on your back, knees bent, feet flat on floor
2. Gently flatten your lower back against the floor by tightening your abdominal muscles
3. Hold 5 seconds, relax
4. Repeat: 10–15 times, twice daily

EXERCISE 3: BRIDGE
───────────────────
1. Lie on your back, knees bent, feet flat
2. Tighten your abdominals and buttocks
3. Lift your hips off the floor until hips are in line with knees and shoulders
4. Hold 5 seconds, lower slowly
5. Repeat: 10–15 times, 2 sets, twice daily

EXERCISE 4: CAT-COW STRETCH
─────────────────────────────
1. Start on hands and knees (table position), back flat
2. ARCH (Cat): Slowly round your back toward the ceiling, tucking chin to chest
3. SAG (Cow): Slowly let your back sag toward the floor, looking up gently
4. Move between positions smoothly — 10 repetitions

POSTURE TIPS FOR DAILY LIFE
────────────────────────────
• Sitting: Keep feet flat on floor, use a lumbar roll if needed, screen at eye level
• Standing: Weight evenly on both feet, avoid slouching
• Lifting: Bend at knees, not the back. Keep the object close to your body.`,
  },
  {
    id: "np-mindfulness", title: "Mindfulness for Chronic Pain",
    brief: "How mindfulness can change your relationship with pain and improve quality of life",
    category: "Non-Pharma Guidance",
    content: `MINDFULNESS FOR CHRONIC PAIN

Mindfulness does not eliminate pain, but it can change how you relate to it — reducing suffering, distress, and the impact pain has on your life.

UNDERSTANDING CHRONIC PAIN
────────────────────────────
Chronic pain is not just a physical sensation. It involves emotions, thoughts, and memories. When we resist, fear, or catastrophise pain, the nervous system amplifies it. Mindfulness interrupts this cycle.

CORE MINDFULNESS PRACTICES
────────────────────────────
BODY SCAN (10–20 minutes):
1. Lie comfortably. Close your eyes.
2. Begin at your feet. Notice any sensations — warmth, tension, numbness, tingling.
3. Slowly move your attention upward through your legs, abdomen, chest, arms, and head.
4. Observe sensations without judging them as good or bad.
5. When you reach an area of pain, breathe into it — allow it to be there without fighting it.

MINDFUL BREATHING (5–10 minutes):
1. Sit or lie comfortably.
2. Focus your attention on the sensation of breathing — the rise and fall of your chest or belly.
3. When thoughts arise (as they always do), gently return your focus to your breath.
4. Do not try to stop thoughts — just notice them and return.

MINDFUL MOVEMENT:
• Gentle yoga or tai chi done mindfully — paying attention to how your body feels in each movement
• Even a short mindful walk: noticing the ground underfoot, sounds, temperature, breathing

CHANGING YOUR RELATIONSHIP WITH PAIN
───────────────────────────────────────
• Observe pain with curiosity rather than fear: "Where exactly is it? Does it change? Is it constant?"
• Separate the physical sensation from the emotional reaction: "There is pain. I am struggling."
• Recognise that thoughts like "this will never get better" are thoughts, not facts.

GETTING STARTED
────────────────
• Start with just 5 minutes per day — consistency matters more than duration
• Use a guided app: Headspace, Calm, or Insight Timer (free options available)
• Consider a formal Mindfulness-Based Stress Reduction (MBSR) programme — ask your doctor for a referral`,
  },
  {
    id: "np-nutrition-diabetes", title: "Nutrition Guide for Diabetics",
    brief: "The plate method, glycaemic index, meal timing, and practical food choices",
    category: "Non-Pharma Guidance",
    content: `NUTRITION GUIDE FOR DIABETICS

Food is your most powerful tool for managing blood sugar. You do not need a special "diabetic diet" — just smart, balanced food choices.

THE PLATE METHOD — SIMPLE AND EFFECTIVE
─────────────────────────────────────────
Fill your plate as follows:
• HALF (½): Non-starchy vegetables — salad, broccoli, cauliflower, green beans, spinach, tomatoes, cucumber
• QUARTER (¼): Lean protein — chicken, fish, eggs, legumes, tofu, lean beef
• QUARTER (¼): Quality carbohydrates — brown rice, wholegrain bread, sweet potato, quinoa, lentils

UNDERSTANDING GLYCAEMIC INDEX (GI)
─────────────────────────────────────
GI measures how quickly a food raises blood sugar.

LOW GI (choose more often): Oats, barley, lentils, beans, most fruits, sweet potato, sourdough, basmati rice
HIGH GI (limit): White bread, white rice, cornflakes, sugary drinks, watermelon, white potato

CARBOHYDRATES AND BLOOD SUGAR
───────────────────────────────
• All carbohydrates raise blood sugar — it is the TYPE and AMOUNT that matters
• Spread carbohydrates evenly across meals — do not save them all for one meal
• Combine carbohydrates with protein, fat, or fibre — this slows glucose absorption

MEAL TIMING
────────────
• Eat regular meals at consistent times
• Do not skip meals — this can cause blood sugar swings
• If taking insulin or certain tablets, meal timing is critical — follow your doctor's advice

FOODS TO CHOOSE
────────────────
• Breakfast: Oats with nuts and berries, wholegrain toast with eggs, Greek yoghurt with fruit
• Lunch: Salad with chicken or legumes, wholegrain wrap, vegetable soup
• Dinner: Fish with vegetables and brown rice, stir-fried tofu with vegetables, lean meat with salad
• Snacks: Handful of nuts, apple with peanut butter, vegetable sticks with hummus

FOODS TO LIMIT
──────────────
• Sugary drinks: Juice, soda, energy drinks, sweetened tea and coffee
• Processed snacks: Crisps, biscuits, cakes, sweets
• White refined carbohydrates
• Fruit juice (even 100% — it spikes blood sugar quickly)`,
  },
];

// ─── Admin library loader ─────────────────────────────────────────────────────

const LIBRARY_KEY = "ehr-health-ed-library-v1";

export function getHealthEdDocs(): HealthEdDoc[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    if (raw) return JSON.parse(raw) as HealthEdDoc[];
  } catch { /**/ }
  return HEALTH_ED_DOCS;
}

// ─── Favourites (localStorage) ────────────────────────────────────────────────

const FAVS_KEY = "health_ed_fav_docIds";
function loadFavs(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? "[]")); } catch { return new Set(); }
}
function persistFavs(s: Set<string>) {
  localStorage.setItem(FAVS_KEY, JSON.stringify([...s]));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthEdSelection {
  docIds: string[];
}

export const EMPTY_HEALTH_ED: HealthEdSelection = { docIds: [] };

// ─── Category styles ──────────────────────────────────────────────────────────

const CAT_STYLE: Record<HealthEdCategory, { accent: string; bg: string; border: string; badge: string }> = {
  "Handout":              { accent: "#4982CF", bg: "bg-blue-50",   border: "border-blue-100",   badge: "bg-blue-100 text-blue-700"    },
  "Patient Education":    { accent: "#7c3aed", bg: "bg-violet-50", border: "border-violet-100", badge: "bg-violet-100 text-violet-700" },
  "Non-Pharma Guidance":  { accent: "#0d9488", bg: "bg-teal-50",   border: "border-teal-100",   badge: "bg-teal-100 text-teal-700"    },
};

function CatBadge({ cat }: { cat: HealthEdCategory }) {
  return (
    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex-shrink-0 ${CAT_STYLE[cat].badge}`}>
      {cat}
    </span>
  );
}

const CATEGORIES: HealthEdCategory[] = ["Handout", "Patient Education", "Non-Pharma Guidance"];

// ─── Preview Modal ────────────────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: HealthEdDoc; onClose: () => void }) {
  return (
    <div className="absolute inset-0 bg-white z-30 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Preview</p>
          <p className="text-sm font-black text-slate-800 truncate">{doc.title}</p>
        </div>
        <CatBadge cat={doc.category} />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        <pre className="whitespace-pre-wrap font-sans text-[11px] text-slate-700 leading-relaxed">{doc.content}</pre>
      </div>
    </div>
  );
}

// ─── Chips Panel ──────────────────────────────────────────────────────────────

export function HealthEdChipsPanel({ data, onOpen }: { data: HealthEdSelection; onOpen: () => void }) {
  const allDocs = getHealthEdDocs();
  const selected = allDocs.filter(d => data.docIds.includes(d.id));

  if (selected.length === 0) {
    return (
      <button onClick={onOpen}
        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl bg-violet-50/60 border-2 border-dashed border-violet-200 text-violet-500 font-bold text-xs hover:border-violet-400 hover:bg-violet-50 transition-all">
        <Plus className="h-4 w-4 flex-shrink-0" />
        Assign patient materials…
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {selected.map(d => (
        <div key={d.id} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl border border-violet-100 bg-violet-50/40">
          <BookOpen className="h-3.5 w-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-[11px] font-black text-violet-800">{d.title}</p>
              <CatBadge cat={d.category} />
            </div>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate italic">{d.brief}</p>
          </div>
        </div>
      ))}
      <button onClick={onOpen}
        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-violet-200 text-violet-500 text-xs font-bold hover:bg-violet-50 transition-colors">
        <Plus className="h-3.5 w-3.5" />
        Edit materials ({selected.length})
      </button>
    </div>
  );
}

// ─── Health Ed Drawer ─────────────────────────────────────────────────────────

interface HealthEdDrawerProps {
  savedData: HealthEdSelection;
  onSave:    (data: HealthEdSelection) => void;
  onClose:   () => void;
}

export function HealthEdDrawer({ savedData, onSave, onClose }: HealthEdDrawerProps) {
  const [selected,     setSelected]     = useState<Set<string>>(new Set(savedData.docIds));
  const [favs,         setFavs]         = useState<Set<string>>(loadFavs);
  const [query,        setQuery]        = useState("");
  const [previewDoc,   setPreviewDoc]   = useState<HealthEdDoc | null>(null);
  const [collapsed,    setCollapsed]    = useState<Set<HealthEdCategory>>(new Set());

  const q = query.toLowerCase().trim();
  const allDocs = useMemo(() => getHealthEdDocs(), []);

  const filteredDocs = useMemo(() =>
    q ? allDocs.filter(d => d.title.toLowerCase().includes(q) || d.brief.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) : allDocs,
    [q, allDocs]
  );

  function toggleFav(id: string) {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      persistFavs(next);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleCollapse(cat: HealthEdCategory) {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  function saveAndClose() {
    onSave({ docIds: [...selected] });
    onClose();
  }

  const isDirty = [...selected].sort().join(",") !== [...savedData.docIds].sort().join(",");

  const docsForCategory = (cat: HealthEdCategory): HealthEdDoc[] => {
    const list = filteredDocs.filter(d => d.category === cat);
    const favs_ = list.filter(d => favs.has(d.id));
    const rest  = list.filter(d => !favs.has(d.id));
    return [...favs_, ...rest];
  };

  return (
    <div className="absolute inset-y-0 right-0 w-[68%] bg-white shadow-2xl border-l border-slate-200 flex flex-col z-20">

      {/* Preview Modal (overlays everything) */}
      {previewDoc && <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        <button onClick={saveAndClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assessment &amp; Plan</p>
          <p className="text-sm font-black text-slate-800">Health Education</p>
        </div>
        <button onClick={saveAndClose}
          disabled={!isDirty}
          className="flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-xl text-white flex-shrink-0 hover:opacity-90 transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#7c3aed" }}>
          <ClipboardCheck className="h-3.5 w-3.5" />
          {savedData.docIds.length > 0 ? "Update" : "Mark Done"}
        </button>
      </div>

      {/* ── Search ── */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-violet-400/50 focus-within:ring-1 focus-within:ring-violet-400/20 transition-all">
          <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search documents…"
            className="flex-1 text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Document List by Category ── */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map(cat => {
          const docs = docsForCategory(cat);
          if (docs.length === 0) return null;
          const style = CAT_STYLE[cat];
          const isCollapsed = collapsed.has(cat);
          const selectedCount = docs.filter(d => selected.has(d.id)).length;

          return (
            <div key={cat} className="border-b border-slate-100 last:border-0">
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(cat)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: style.accent }}>{cat}</span>
                  {selectedCount > 0 && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                      {selectedCount} ✓
                    </span>
                  )}
                </div>
                {isCollapsed
                  ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  : <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                }
              </button>

              {/* Documents */}
              {!isCollapsed && (
                <div>
                  {docs.map(doc => {
                    const isFav   = favs.has(doc.id);
                    const isSel   = selected.has(doc.id);
                    return (
                      <div key={doc.id}
                        className={`flex items-start gap-2.5 px-4 py-2.5 border-t border-slate-50 transition-colors ${isSel ? style.bg : "hover:bg-slate-50/80"}`}>
                        {/* Star */}
                        <button onClick={() => toggleFav(doc.id)} className="pt-0.5 flex-shrink-0">
                          <Star className={`h-3 w-3 transition-colors ${isFav ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-slate-300"}`} />
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold leading-tight ${isSel ? "text-slate-800" : "text-slate-700"}`}>{doc.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{doc.brief}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                          <button onClick={() => setPreviewDoc(doc)}
                            className="flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg border border-slate-200 text-slate-400 hover:border-violet-200 hover:text-violet-500 hover:bg-violet-50 transition-colors">
                            <Eye className="h-3 w-3" />
                            Preview
                          </button>
                          <button onClick={() => toggleSelect(doc.id)}
                            className={`h-7 w-7 flex items-center justify-center rounded-lg border-2 transition-all ${
                              isSel
                                ? "bg-emerald-500 border-emerald-500 text-white"
                                : "border-slate-200 text-slate-300 hover:border-emerald-400 hover:text-emerald-400"
                            }`}>
                            {isSel
                              ? <CheckCircle2 className="h-3.5 w-3.5" />
                              : <Plus className="h-3.5 w-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredDocs.length === 0 && (
          <p className="px-4 py-8 text-xs text-slate-400 italic text-center">No documents found</p>
        )}
      </div>
    </div>
  );
}
