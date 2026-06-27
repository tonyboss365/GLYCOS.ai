import React, { useState, useEffect } from 'react';
import { 
  Droplet, 
  Scale, 
  Hourglass, 
  Activity, 
  Syringe, 
  Ruler, 
  Users, 
  GitBranch, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

const METRIC_ICONS = {
  glucose: Droplet,
  bmi: Scale,
  age: Hourglass,
  bloodPressure: Activity,
  insulin: Syringe,
  skinThickness: Ruler,
  pregnancies: Users,
  diabetesPedigree: GitBranch,
};

const METRIC_NAMES = {
  glucose: 'Glucose',
  bmi: 'BMI',
  age: 'Age',
  bloodPressure: 'Blood Pressure',
  insulin: 'Insulin',
  skinThickness: 'Skin Thickness',
  pregnancies: 'Pregnancies',
  diabetesPedigree: 'Pedigree Score',
};

// High-quality local rules-based engine fallback
const generateLocalInsights = (inputs) => {
  const insights = [];

  if (inputs.glucose > 140) {
    insights.push({
      key: 'glucose',
      severity: 'high',
      note: `Glucose levels above 140 mg/dL (${inputs.glucose} mg/dL) indicate impaired glucose tolerance, a critical marker of insulin deficiency.`,
    });
  }

  if (inputs.bmi >= 30) {
    insights.push({
      key: 'bmi',
      severity: 'high',
      note: `A BMI of ${inputs.bmi} falls into the obese range, significantly exacerbating peripheral tissue insulin resistance.`,
    }       );
  } else if (inputs.bmi >= 25) {
    insights.push({
      key: 'bmi',
      severity: 'medium',
      note: `Your BMI of ${inputs.bmi} indicates you are overweight, which is a known risk factor for elevated glycated hemoglobin.`,
    });
  }

  if (inputs.age >= 45) {
    insights.push({
      key: 'age',
      severity: 'medium',
      note: `At age ${inputs.age}, risk increases as metabolic activity and pancreatic beta-cell efficiency naturally decline.`,
    });
  }

  if (inputs.diabetesPedigree > 0.8) {
    insights.push({
      key: 'diabetesPedigree',
      severity: 'high',
      note: `Your genetic pedigree score of ${inputs.diabetesPedigree} indicates a high familial predisposition to Type 2 diabetes.`,
    });
  } else if (inputs.diabetesPedigree > 0.5) {
    insights.push({
      key: 'diabetesPedigree',
      severity: 'medium',
      note: `A pedigree score of ${inputs.diabetesPedigree} suggests moderate hereditary risk based on family history reports.`,
    });
  }

  if (inputs.bloodPressure > 80) {
    insights.push({
      key: 'bloodPressure',
      severity: 'medium',
      note: `Diastolic blood pressure of ${inputs.bloodPressure} mmHg indicates hypertension, which increases cardiovascular risks.`,
    });
  }

  if (inputs.pregnancies > 5) {
    insights.push({
      key: 'pregnancies',
      severity: 'medium',
      note: `Having ${inputs.pregnancies} pregnancies is associated with higher gestational glucose exposure, impacting long-term risk.`,
    });
  }

  if (inputs.insulin > 166) {
    insights.push({
      key: 'insulin',
      severity: 'medium',
      note: `Elevated serum insulin of ${inputs.insulin} μU/mL suggests early-stage insulin resistance, indicating the pancreas is working harder.`,
    });
  }

  if (inputs.skinThickness > 40) {
    insights.push({
      key: 'skinThickness',
      severity: 'medium',
      note: `A skin fold thickness of ${inputs.skinThickness} mm suggests higher subcutaneous fat stores, correlating with metabolic stress.`,
    });
  }

  // Ensure we return 2 to 4 items, sorted by high severity first
  insights.sort((a, b) => (b.severity === 'high' ? 1 : 0) - (a.severity === 'high' ? 1 : 0));
  
  // If zero insights triggered (perfect biomarkers), return supportive baseline insights
  if (insights.length === 0) {
    insights.push({
      key: 'glucose',
      severity: 'medium',
      note: 'Your biomarkers are currently within excellent clinical limits. Maintain regular screening to monitor your baseline.',
    });
    insights.push({
      key: 'bmi',
      severity: 'medium',
      note: 'Normal range body mass index is key to preserving pancreatic insulin sensitivity over time.',
    });
  }

  return insights.slice(0, 4);
};

export const InsightCard = ({ inputs, risk, aiInsights }) => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    if (aiInsights && aiInsights.length > 0) {
      setInsights(aiInsights);
      setIsAI(true);
      return;
    }

    const fetchAIInsights = async () => {
      setLoading(true);
      setIsAI(false);

      const localFallback = generateLocalInsights(inputs);

      try {
        const token = import.meta.env.VITE_AZURE_API_KEY || '';
        const prompt = `
          Analyze these 8 clinical biomarkers and the calculated diabetes risk percentage:
          - Pregnancies: ${inputs.pregnancies}
          - Glucose: ${inputs.glucose} mg/dL (Normal: 70–140)
          - Blood Pressure: ${inputs.bloodPressure} mmHg (Normal: 60–80)
          - Skin Thickness: ${inputs.skinThickness} mm (Normal: 10–50)
          - Insulin: ${inputs.insulin} μU/mL (Normal: 16–166)
          - BMI: ${inputs.bmi} (Normal: 18.5–24.9)
          - Pedigree Score: ${inputs.diabetesPedigree} (Normal: 0.078–2.42)
          - Age: ${inputs.age} years (Risk increases after 45)
          - Total Diabetes Risk Score: ${risk}%

          Provide exactly 2 to 4 highly personalized clinical insights based on which metrics are abnormal or have high impact.
          
          You MUST respond ONLY with a valid JSON array of objects. Do not include markdown formatting, backticks, or any explanation outside the JSON.
          Format:
          [
            {
              "key": "glucose", // Must match one of the 8 keys exactly
              "severity": "high", // "high" or "medium"
              "note": "A concise one-sentence clinical note explaining this specific biomarker's impact on diabetes risk."
            }
          ]
        `;

        const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'You are an endocrine clinical intelligence agent. You write concise JSON diagnostic outputs.' },
              { role: 'user', content: prompt }
            ],
            model: 'gpt-4o-mini',
            temperature: 0.4,
            max_tokens: 400
          })
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Sanitize response to extract JSON (in case model included markdown backticks)
        const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : content);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Validate keys are correct
          const validated = parsed.filter(item => METRIC_ICONS[item.key]);
          if (validated.length >= 2) {
            setInsights(validated.slice(0, 4));
            setIsAI(true);
          } else {
            setInsights(localFallback);
          }
        } else {
          setInsights(localFallback);
        }
      } catch (err) {
        console.warn('Insights API failed, falling back to local engine:', err);
        setInsights(localFallback);
      } finally {
        setLoading(false);
      }
    };

    fetchAIInsights();
  }, [inputs, risk]);

  return (
    <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-4 bg-[var(--surface-1)] shadow-sm">
      <div className="flex justify-between items-center">
        <h3 className="font-syne font-bold text-sm uppercase tracking-wider text-[var(--text-1)]">
          Personalized Insights
        </h3>
        
        {loading ? (
          <span className="flex items-center gap-1.5 text-xs text-[var(--text-3)] font-mono animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan-accent)] animate-ping" />
            Analyzing...
          </span>
        ) : isAI ? (
          <span className="flex items-center gap-1 text-[10px] text-[var(--cyan-accent)] bg-[var(--surface-2)] border border-[var(--cyan-accent)]/25 px-2.5 py-0.5 rounded-none font-mono tracking-wider">
            <Sparkles size={10} />
            AI GENERATED
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] text-[var(--text-3)] bg-[var(--surface-2)] border border-[var(--border-soft)] px-2.5 py-0.5 rounded-none font-mono tracking-wider">
            LOCAL ENGINE
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 min-h-[80px]">
        {loading && insights.length === 0 ? (
          // Pre-rendered loading skeletons
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full h-16 rounded-none bg-[var(--surface-2)] border border-[var(--border-soft)] animate-pulse" />
          ))
        ) : (
          insights.map((item, idx) => {
            const Icon = METRIC_ICONS[item.key] || AlertCircle;
            const borderColor = item.severity === 'high' ? 'border-l-[var(--risk-high)]' : 'border-l-[var(--cyan-accent)]';
            
            return (
              <div
                key={`${item.key}-${idx}`}
                className={`py-4 px-3 rounded-none bg-transparent border-b border-[var(--border-soft)] border-l-2 ${borderColor} flex gap-3 items-start transition-all duration-300 hover:bg-[var(--surface-2)]`}
              >
                <div className="p-1.5 rounded-none bg-[var(--surface-2)] text-[var(--text-1)] mt-0.5">
                  <Icon size={14} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-syne font-bold text-xs uppercase tracking-wider text-[var(--text-1)]">
                    {METRIC_NAMES[item.key] || item.key}
                  </span>
                  <span className="font-inter font-normal text-[11px] leading-relaxed text-[var(--text-2)]">
                    {item.note}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InsightCard;
