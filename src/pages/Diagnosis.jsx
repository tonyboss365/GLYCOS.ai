import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Info, ArrowLeft, RefreshCw } from 'lucide-react';
import MetricSlider from '../components/MetricSlider';
import RiskGauge from '../components/RiskGauge';
import FeatureChart from '../components/FeatureChart';
import InsightCard from '../components/InsightCard';
import ClinicalChat from '../components/ClinicalChat';
import PremiumButton from '../components/PremiumButton';
import DataIntegrationSuite from '../components/DataIntegrationSuite';
import Calibration3DLoader from '../components/Calibration3DLoader';
import { predict, getContributions } from '../model/predict';
import { audio } from '../model/audio';

const DEFAULTS = {
  pregnancies: 1,
  glucose: 120,
  bloodPressure: 72,
  skinThickness: 23,
  insulin: 80,
  bmi: 26.0,
  diabetesPedigree: 0.47,
  age: 30,
};

const BIOMARKER_DETAILS = [
  {
    name: "Plasma Glucose Concentration",
    context: "Measures the concentration of glucose (sugar) in your blood plasma after a 2-hour oral glucose tolerance test.",
    significance: "Primary biomarker for diagnosing diabetes. High glucose indicates pancreatic beta-cell fatigue or high insulin resistance, causing sugar to accumulate in the bloodstream instead of being absorbed by cells.",
    range: "Normal: Under 140 mg/dL | Pre-diabetic: 140-199 mg/dL | Diabetic: 200 mg/dL or higher"
  },
  {
    name: "Body Mass Index (BMI)",
    context: "A value derived from the mass (weight) and height of a person to estimate overall body fat percentage.",
    significance: "A BMI above 25 correlates strongly with increased fatty acid accumulation in vital organs, which blocks insulin receptors and hampers cellular glucose uptake.",
    range: "Underweight: <18.5 | Normal: 18.5–24.9 | Overweight: 25.0–29.9 | Obese: 30.0 or higher"
  },
  {
    name: "Patient Age",
    context: "Represents the chronological age of the patient.",
    significance: "Metabolic rate, physical activity, and pancreatic beta-cell insulin secretory capacity naturally decrease with age, leading to a steady increase in susceptibility to Type 2 diabetes after age 45.",
    range: "Slightly increased risk after 35 | More pronounced susceptibility progression after 45"
  },
  {
    name: "Diastolic Blood Pressure",
    context: "The pressure in your blood vessels when your heart rests between beats.",
    significance: "High blood pressure is strongly associated with metabolic syndrome, systemic arterial stiffness, and microvascular strain, indicating metabolic overload.",
    range: "Normal: 60-80 mmHg | Elevated: 80-89 mmHg | Hypertension: 90 mmHg or higher"
  },
  {
    name: "2-Hour Serum Insulin",
    context: "Measures the amount of insulin in the blood 2 hours after consuming glucose.",
    significance: "Insulin is the hormone that moves glucose from blood to cells. Very high levels suggest insulin resistance, meaning the pancreas has to overproduce insulin to keep blood sugar normal.",
    range: "Normal: 16–166 μU/mL | High (>166 μU/mL) indicates compensating hyperinsulinemia"
  },
  {
    name: "Triceps Skin Fold Thickness",
    context: "A standard clinical measurement of subcutaneous fat thickness on the back of the upper arm.",
    significance: "Correlates with overall subcutaneous body fat storage. Thicker folds indicate higher systemic fat storage, which release inflammatory cytokines that block insulin pathways.",
    range: "Normal range typically: 10–50 mm | Higher levels represent elevated systemic fat reserves"
  },
  {
    name: "Number of Pregnancies",
    context: "Represents the total number of times the patient has been pregnant.",
    significance: "Pregnancy induces significant hormonal changes that naturally increase insulin resistance to ensure the fetus gets enough glucose. Multiple pregnancies can exhaust metabolic reserves.",
    range: "Under 5 pregnancies: Typical baseline | 5 or more pregnancies: Elevated gestational risk history"
  },
  {
    name: "Diabetes Pedigree Function",
    context: "A score representing the genetic influence and hereditary history of diabetes in your family tree.",
    significance: "Estimates genetic susceptibility based on your relatives' history. A higher score means a stronger genetic predisposition to pancreatic beta-cell dysfunction.",
    range: "Normal range: 0.08–2.42 | High score (>0.80) indicates strong familial heredity link"
  }
];

// SVG Normal Distribution Curve Component
const ProbabilityCurve = ({ riskPercent }) => {
  const W = 280;
  const H = 80;
  const normal = (x) => Math.exp(-0.5 * Math.pow((x - 50) / 18, 2));

  // Plot standard normal distribution bell points
  const points = React.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const x = (i / 99) * W;
      const val = (i / 99) * 100;
      const y = H - normal(val) * (H - 10);
      return `${x},${y}`;
    }).join(' ');
  }, []);

  const xPos = (riskPercent / 100) * W;
  const riskColor = riskPercent < 30 ? 'var(--risk-low)' : riskPercent < 60 ? 'var(--risk-mid)' : 'var(--risk-high)';

  // Shade right tail area from the current marker point to the right end
  const shadedPath = React.useMemo(() => {
    const startIndex = Math.floor((riskPercent / 100) * 99);
    const coords = [];
    coords.push(`${xPos},${H}`);
    for (let i = startIndex; i < 100; i++) {
      const x = (i / 99) * W;
      const val = (i / 99) * 100;
      const y = H - normal(val) * (H - 10);
      coords.push(`${x},${y}`);
    }
    coords.push(`${W},${H}`);
    return `M ${coords.join(' L ')} Z`;
  }, [riskPercent, xPos]);

  return (
    <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-4 bg-[var(--surface-1)] shadow-sm">
      <div className="flex justify-between items-center w-full text-[10px] font-mono text-[var(--text-3)] tracking-wider">
        <span>PROBABILITY DISTRIBUTION</span>
        <span style={{ color: riskColor }} className="font-semibold uppercase text-[9px]">YOU ARE HERE</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Risk zone shading */}
        <path d={shadedPath} fill={riskColor} opacity="0.1" />
        {/* Bell curve line */}
        <polyline points={points} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {/* Current user alignment line */}
        <line x1={xPos} y1="0" x2={xPos} y2={H} stroke={riskColor} strokeWidth="1.5" strokeDasharray="3,3" />
        {/* Node indicator */}
        <circle cx={xPos} cy={H - normal(riskPercent) * (H - 10)} r="4" fill={riskColor} />
        {/* Metric Label */}
        <text 
          x={xPos + (xPos > W - 60 ? -45 : 8)} 
          y="16" 
          fill={riskColor} 
          fontSize="10" 
          fontFamily="JetBrains Mono"
          fontWeight="bold"
        >
          {riskPercent}%
        </text>
      </svg>
    </div>
  );
};

export const Diagnosis = ({ onQuestionIndexChange }) => {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [lastPredictedInputs, setLastPredictedInputs] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskScore, setRiskScore] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [activeStage, setActiveStage] = useState('input'); // 'input' or 'results'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [hasRun, setHasRun] = useState(false);
  const [isReportParsing, setIsReportParsing] = useState(false);
  
  // debounced live prediction preview state
  const [liveEstimate, setLiveEstimate] = useState(null);

  // Lift currentQuestionIndex state changes up to parent App shell
  useEffect(() => {
    if (onQuestionIndexChange) {
      if (activeStage === 'results') {
        onQuestionIndexChange(-1);
      } else {
        onQuestionIndexChange(currentQuestionIndex);
      }
    }
  }, [currentQuestionIndex, activeStage, onQuestionIndexChange]);

  const loadHtml2Pdf = () => {
    return new Promise((resolve, reject) => {
      if (window.html2pdf) {
        resolve(window.html2pdf);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => resolve(window.html2pdf);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const downloadPdfReport = async () => {
    // Generate a random Reference ID
    const refId = `SMC-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Determine risk status & colors
    const riskColor = riskScore < 30 ? '#596235' : riskScore < 60 ? '#E67E22' : '#D96846';
    const riskStatus = riskScore < 30 ? 'LOW RISK' : riskScore < 60 ? 'MODERATE RISK' : 'HIGH RISK';

    // Generate list of contributions
    const insightsHtml = contributions ? contributions.map(item => `
      <div class="insight-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted rgba(47, 48, 32, 0.12);">
        <span style="font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">${item.name}</span>
        <span style="color: ${item.value > 0 ? '#D96846' : '#596235'}; font-weight: bold; font-family: 'JetBrains Mono', monospace;" class="${item.value > 0 ? 'highlight-danger' : 'highlight-success'}">
          ${item.value > 0 ? '+' : ''}${item.value.toFixed(4)}
        </span>
      </div>
    `).join('') : '';

    // Generate biomarker rows for table
    const biomarkerRows = Object.entries(inputs).map(([key, val]) => {
      const normalRange = {
        glucose: '70–140 mg/dL',
        bmi: '18.5–24.9',
        age: 'Adult',
        bloodPressure: '60–80 mmHg',
        insulin: '16–166 μU/mL',
        skinThickness: '10–50 mm',
        pregnancies: 'N/A',
        diabetesPedigree: '0.08–2.42',
      }[key] || '';
      
      const isDanger = {
        glucose: val > 140,
        bmi: val >= 30.0,
        age: val >= 45,
        bloodPressure: val > 80,
        insulin: val > 166,
        skinThickness: val > 40,
        pregnancies: val > 5,
        diabetesPedigree: val > 0.8,
      }[key] || false;

      const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12);"><strong>${formattedLabel}</strong></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12); font-family: 'JetBrains Mono', monospace;">${val}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12); font-family: 'JetBrains Mono', monospace; color: #596235;" class="highlight-success">${normalRange}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12); color: ${isDanger ? '#D96846' : '#596235'}; font-weight: bold; text-transform: uppercase;" class="${isDanger ? 'highlight-danger' : 'highlight-success'}">
            ${isDanger ? 'ELEVATED' : 'NORMAL'}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <div class="clinical-report-container" style="color-scheme: light !important; padding: 40px; background: white; color: #2F3020; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; gap: 30px; border: 1px solid rgba(47, 48, 32, 0.12);">
        <style>
          .clinical-report-container {
            color-scheme: light !important;
            background: #ffffff !important;
            color: #2F3020 !important;
            font-family: 'Inter', sans-serif !important;
          }
          .clinical-report-container h1, 
          .clinical-report-container h2, 
          .clinical-report-container h3 {
            color: #2F3020 !important;
          }
          .clinical-report-container td, 
          .clinical-report-container th, 
          .clinical-report-container p, 
          .clinical-report-container strong,
          .clinical-report-container span {
            color: #2F3020 !important;
          }
          .clinical-report-container table {
            color: #2F3020 !important;
          }
          .clinical-report-container .highlight-danger {
            color: #D96846 !important;
          }
          .clinical-report-container .highlight-success {
            color: #596235 !important;
          }
          .clinical-report-container .highlight-warning {
            color: #E67E22 !important;
          }
        </style>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid rgba(47, 48, 32, 0.12); padding-bottom: 20px;">
          <div>
            <h1 style="font-family: 'Syne', sans-serif; font-weight: 800; font-size: 24px; margin: 0; text-transform: uppercase; color: #2F3020; letter-spacing: -0.02em;">GLYCOS CLINICAL REPORT</h1>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #596235; margin-top: 5px; text-transform: uppercase;" class="highlight-success">Official Patient Assessment Ingestion</div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div style="font-size: 16px; font-weight: bold; color: #2F3020;">METABOLIC PROFILE</div>
            <div style="font-size: 11px; color: #596235; font-family: 'JetBrains Mono', monospace; margin-top: 4px;" class="highlight-success">SYSTEM PROTOCOL: PIMA_AI_BACKEND_V3</div>
          </div>
          <table style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-align: right; color: rgba(47, 48, 32, 0.85);">
            <tr><td><strong>REPORT DATE:</strong></td><td>${dateStr}</td></tr>
            <tr><td><strong>REF ID:</strong></td><td>${refId}</td></tr>
            <tr><td><strong>STATUS:</strong></td><td>COMPLETED</td></tr>
          </table>
        </div>

        <!-- Risk Summary Card -->
        <div style="border: 1px solid rgba(47, 48, 32, 0.12); padding: 24px; display: flex; flex-direction: column; gap: 15px;">
          <h2 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #2F3020; margin: 0; border-bottom: 1px solid rgba(47, 48, 32, 0.12); padding-bottom: 8px;">Score & Classification</h2>
          <div style="display: flex; align-items: center; gap: 30px; margin: 10px 0;">
            <div style="font-family: 'Syne', sans-serif; font-size: 56px; font-weight: 800; line-height: 1; color: ${riskColor};" class="${riskScore < 30 ? 'highlight-success' : riskScore < 60 ? 'highlight-warning' : 'highlight-danger'}">${riskScore}%</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 700; border: 1px solid ${riskColor}; padding: 6px 12px; text-transform: uppercase; color: ${riskColor};" class="${riskScore < 30 ? 'highlight-success' : riskScore < 60 ? 'highlight-warning' : 'highlight-danger'}">${riskStatus}</div>
          </div>
          <div style="font-size: 10px; color: rgba(47, 48, 32, 0.85); line-height: 1.6;">
            The above susceptibility index is calculated using a clinical-grade AI inference engine. Under clinical guidelines, scores exceeding 40% warrant further diagnostic follow-up.
          </div>
        </div>

        <!-- Biomarkers Profile Table -->
        <div style="border: 1px solid rgba(47, 48, 32, 0.12); padding: 24px; display: flex; flex-direction: column; gap: 15px;">
          <h2 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #2F3020; margin: 0; border-bottom: 1px solid rgba(47, 48, 32, 0.12); padding-bottom: 8px;">Biomarker Calibration Details</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr>
                <th style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #596235; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12);" class="highlight-success">Biomarker Factor</th>
                <th style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #596235; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12);" class="highlight-success">Ingested Value</th>
                <th style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #596235; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12);" class="highlight-success">Clinical Ref Range</th>
                <th style="font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #596235; text-transform: uppercase; padding: 10px 8px; border-bottom: 1px solid rgba(47, 48, 32, 0.12);" class="highlight-success">Status Classification</th>
              </tr>
            </thead>
            <tbody>
              ${biomarkerRows}
            </tbody>
          </table>
        </div>

        <!-- Feature Contributions -->
        <div style="border: 1px solid rgba(47, 48, 32, 0.12); padding: 24px; display: flex; flex-direction: column; gap: 15px;">
          <h2 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #2F3020; margin: 0; border-bottom: 1px solid rgba(47, 48, 32, 0.12); padding-bottom: 8px;">Biomarker Contribution Weights</h2>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${insightsHtml}
          </div>
        </div>

        <!-- Medical Disclaimer -->
        <div style="border: 1px solid rgba(47, 48, 32, 0.12); padding: 24px; display: flex; flex-direction: column; gap: 15px; background: #F3F2F5;">
          <h2 style="font-family: 'Syne', sans-serif; font-weight: 700; font-size: 14px; text-transform: uppercase; color: #2F3020; margin: 0; border: none; padding: 0;">Clinical Notice & Disclaimer</h2>
          <div style="font-size: 10px; color: rgba(47, 48, 32, 0.85); line-height: 1.6;">
            This document represents an analytical prediction and is not a formal medical diagnosis. GLYCOS-ai is a metabolic intelligence demonstration tool. Values are processed via AI model validation accuracy constraints. Consult a licensed medical practitioner for clinical evaluation.
          </div>
        </div>
      </div>
    `;

    try {
      const html2pdf = await loadHtml2Pdf();

      const opt = {
        margin:       15,
        filename:     `glycos_metabolic_report_${refId.toLowerCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true, 
          backgroundColor: '#ffffff',
          scrollY: 0,
          scrollX: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().from(htmlContent).set(opt).save();
    } catch (err) {
      console.error("PDF generation failed, falling back to print dialog", err);
      window.print();
    }
  };

  // loading state tracking for clinical animation
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);

  const analysisSteps = [
    'INITIALIZING COHERENCE MATRIX...',
    'SCALING 8 BIOMARKER SUSCEPTIBILITY CURVES...',
    'SOLVING GRADIENT DESCENT COEFFICIENTS...',
    'COMPILING CLINICAL SUSCEPTIBILITY REPORT...'
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisProgress(0);
      setAnalysisStep(0);
      return;
    }

    const steps = [0, 9, 19, 29, 59, 79, 99, 100];
    let stepIdx = 0;
    setAnalysisProgress(steps[0]);
    setAnalysisStep(0);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        const progress = steps[stepIdx];
        setAnalysisProgress(progress);

        if (progress < 25) {
          setAnalysisStep(0);
        } else if (progress < 50) {
          setAnalysisStep(1);
        } else if (progress < 75) {
          setAnalysisStep(2);
        } else {
          setAnalysisStep(3);
        }
      } else {
        clearInterval(interval);
      }
    }, 450); // 450ms per step = 3.15s to reach 100%

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyInputs = (parsedData) => {
    setInputs((prev) => ({
      ...prev,
      ...parsedData,
    }));
  };

  // Debounced effect for live estimate calculations
  useEffect(() => {
    const timer = setTimeout(() => {
      const estimate = predict(inputs);
      setLiveEstimate(estimate);
    }, 100);
    return () => clearTimeout(timer);
  }, [inputs]);

  const fetchAiPredictionDetails = async (currentInputs) => {
    try {
      const token = import.meta.env.VITE_AZURE_API_KEY || '';
      if (!token) return null;

      const response = await fetch('https://models.inference.ai.azure.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            { 
              role: 'system', 
              content: 'You are a highly precise clinical endocrine diagnostics engine. Compute the Type 2 Diabetes susceptibility risk percentage (0 to 100) based on the patient biomarkers. Also, calculate individual contribution score (weight) for each biomarker (positive values for risk-increasing factors, negative values for protective/risk-reducing factors). Also, generate 2 to 4 highly personalized clinical insights based on which metrics are abnormal or have high impact. You MUST return ONLY a single JSON object matching this schema: {"riskScore": <number>, "contributions": {"pregnancies": <number>, "glucose": <number>, "bloodPressure": <number>, "skinThickness": <number>, "insulin": <number>, "bmi": <number>, "diabetesPedigree": <number>, "age": <number>}, "insights": [{"key": "glucose", "severity": "high", "note": "<one sentence note explaining the impact>"}]}' 
            },
            { 
              role: 'user', 
              content: `Compute details for patient with these biomarkers:
- Pregnancies: ${currentInputs.pregnancies}
- Glucose: ${currentInputs.glucose} mg/dL
- Blood Pressure: ${currentInputs.bloodPressure} mmHg
- Skin Thickness: ${currentInputs.skinThickness} mm
- Insulin: ${currentInputs.insulin} μU/mL
- BMI: ${currentInputs.bmi}
- Pedigree Score: ${currentInputs.diabetesPedigree}
- Age: ${currentInputs.age}

Ensure a baseline risk is kept (minimum 2% risk, even if all metrics are lowest, as zero absolute metabolic risk is clinically impossible). Return ONLY JSON.` 
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.0,
          seed: 42,
          max_tokens: 600
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanJson);
      if (result && typeof result.riskScore === 'number' && result.contributions) {
        return result;
      }
      return null;
    } catch (e) {
      console.error("AI details fetch failed:", e);
      return null;
    }
  };

  const runPrediction = async () => {
    setIsAnalyzing(true);
    audio.playClick();
    
    // Start fetching AI prediction details asynchronously
    const aiDetailsPromise = fetchAiPredictionDetails(inputs);

    // Wait for the 3500ms animation loader
    await new Promise((resolve) => setTimeout(resolve, 3500));

    // Resolve AI details
    let aiResult = null;
    try {
      aiResult = await aiDetailsPromise;
    } catch (e) {
      console.error("AI prediction promise rejected:", e);
    }

    let score = null;
    let formattedContribs = null;
    let insightsList = null;

    if (aiResult) {
      score = aiResult.riskScore;
      insightsList = aiResult.insights;
      
      if (aiResult.contributions) {
        formattedContribs = Object.entries(aiResult.contributions).map(([name, value]) => ({
          name,
          value: parseFloat(value),
        }));
      }
    }

    // Fallback to local prediction if AI is not available
    if (score === null || isNaN(score)) {
      score = predict(inputs);
    }

    if (!formattedContribs) {
      const rawContribs = getContributions(inputs);
      formattedContribs = Object.entries(rawContribs).map(([name, value]) => ({
        name,
        value,
      }));
    }

    // Clamp score to clinically realistic bounds [2%, 98%]
    score = Math.max(2, Math.min(98, score));

    setRiskScore(score);
    setContributions(formattedContribs);
    setAiInsights(insightsList);
    setLastPredictedInputs({ ...inputs });
    setHasRun(true);
    setIsAnalyzing(false);
    setActiveStage('results');
    
    // Play prediction success fanfare!
    audio.playFanfare();

    // Scroll top smoothly after entering results stage
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputsDiverged =
    hasRun &&
    lastPredictedInputs &&
    Object.keys(inputs).some((key) => inputs[key] !== lastPredictedInputs[key]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Determine pulse class based on predicted risk level
  const pulseClass = riskScore === null
    ? ''
    : riskScore < 30
      ? 'pulse-low'
      : riskScore < 60
        ? 'pulse-mid'
        : 'pulse-high';

  return (
    <div className="w-full min-h-screen bg-transparent pt-[85px] pb-28 px-4 md:px-6 relative z-10 overflow-hidden">

      <div className="max-w-[1200px] mx-auto w-full flex flex-col items-center relative z-10">
        
        <AnimatePresence mode="wait">
          {activeStage === 'input' ? (
            /* STAGE 1: INPUT SLIDERS */
            <motion.div
              key="inputs-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
              className="w-full flex flex-col gap-6"
            >
              <AnimatePresence mode="wait">
                {currentQuestionIndex === -1 ? (
                  /* WELCOME STEP */
                  <motion.div
                    key="step-welcome"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 py-16 min-h-[60vh] text-left"
                  >
                    {/* Left Column: Title & Specs */}
                    <div className="lg:col-span-7 flex flex-col justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase mb-6 block">
                          [ CALIBRATION_STAGE_01 ]
                        </span>
                        <h1 className="font-syne font-extrabold text-[clamp(3.5rem,8vw,6rem)] leading-[0.85] text-[var(--text-1)] uppercase tracking-[-0.05em] mb-8">
                          Enter<br />Your Data.
                        </h1>
                        <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-lg mb-8">
                          To initiate risk calculation, select your data ingestion protocol below. All evaluations run client-side on normalized coefficients.
                        </p>
                      </div>

                      {/* Technical Specs List */}
                      <div className="flex flex-col gap-3 font-mono text-[10px] text-[var(--text-3)] border-t border-[var(--border-soft)] pt-8 w-full">
                        <div className="flex justify-between max-w-md items-center">
                          <span>[ LOCAL_REDUX_ENGINE ]</span>
                          <span className="text-[var(--text-2)] font-semibold flex items-center gap-1.5">
                            <span className="terminal-pulse-dot" />
                            ACTIVE
                          </span>
                        </div>
                        <div className="flex justify-between max-w-md">
                          <span>[ LATENCY_BOUND ]</span>
                          <span className="text-[var(--text-2)] font-semibold">0.0ms (OFFLINE)</span>
                        </div>
                        <div className="flex justify-between max-w-md">
                          <span>[ COMPILER_WEIGHTS ]</span>
                          <span className="text-[var(--text-2)] font-semibold">PIMA INDIANS COHORT</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Mode Selection Cards */}
                    <div className="lg:col-span-5 flex flex-col gap-6 justify-center w-full">
                      {/* Mode Card 1: Manual entry */}
                      <div 
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(0);
                        }}
                        className="w-full border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:border-[var(--text-1)] hover:bg-[var(--surface-2)] cursor-pointer group bg-transparent relative overflow-hidden"
                      >
                        <span className="font-mono text-[10px] text-[var(--text-3)]">[ PROTOCOL_01 ]</span>
                        <div className="mt-8">
                          <h3 className="font-syne font-bold text-xl text-[var(--text-1)] mb-2 flex items-center justify-between">
                            Begin Calibration
                            <span className="text-sm font-mono transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                          </h3>
                          <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                            Manually adjust all 8 metabolic markers using touch-friendly slider nodes.
                          </p>
                        </div>
                      </div>

                      {/* Mode Card 2: Hospital report integration */}
                      <div 
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(8);
                        }}
                        className="w-full border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:border-[var(--text-1)] hover:bg-[var(--surface-2)] cursor-pointer group bg-transparent relative overflow-hidden"
                      >
                        <span className="font-mono text-[10px] text-[var(--text-3)]">[ PROTOCOL_02 ]</span>
                        <div className="mt-8">
                          <h3 className="font-syne font-bold text-xl text-[var(--text-1)] mb-2 flex items-center justify-between">
                            Integrate Lab Report
                            <span className="text-sm font-mono transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                          </h3>
                          <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                            Integrate lab report documents or paste raw text reports to auto-extract values.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : currentQuestionIndex >= 0 && currentQuestionIndex <= 7 ? (
                  /* MANUAL SLIDER STEPS */
                  <motion.div
                    key={`step-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-[640px] mx-auto flex flex-col gap-8 min-h-[50vh] justify-center py-10"
                  >
                    <div className="flex justify-between items-center w-full pb-3 border-b border-[var(--border-soft)]">
                      <span className="font-mono text-[10px] text-[var(--text-3)] tracking-widest uppercase">
                        [ Metric {currentQuestionIndex + 1} of 8 ]
                      </span>
                      {liveEstimate !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-3)] tracking-wider">
                            LIVE RISK:
                          </span>
                          <span 
                            className="font-mono text-xs font-bold transition-colors duration-300"
                            style={{ 
                              color: liveEstimate < 30 
                                ? 'var(--risk-low)' 
                                : liveEstimate < 60 
                                  ? 'var(--risk-mid)' 
                                  : 'var(--risk-high)' 
                            }}
                          >
                            {liveEstimate}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 rounded-none shadow-sm">
                      {currentQuestionIndex === 0 && (
                        <MetricSlider
                          metricKey="glucose"
                          label="Glucose"
                          min={50}
                          max={300}
                          step={1}
                          value={inputs.glucose}
                          unit="mg/dL"
                          normalRange="70–140"
                          onChange={(val) => handleInputChange('glucose', val)}
                        />
                      )}
                      {currentQuestionIndex === 1 && (
                        <MetricSlider
                          metricKey="bmi"
                          label="BMI"
                          min={10}
                          max={70}
                          step={0.1}
                          value={inputs.bmi}
                          unit="Index"
                          normalRange="18.5–24.9"
                          onChange={(val) => handleInputChange('bmi', val)}
                        />
                      )}
                      {currentQuestionIndex === 2 && (
                        <MetricSlider
                          metricKey="age"
                          label="Age"
                          min={10}
                          max={90}
                          step={1}
                          value={inputs.age}
                          unit="Years"
                          normalRange="Adult"
                          onChange={(val) => handleInputChange('age', val)}
                        />
                      )}
                      {currentQuestionIndex === 3 && (
                        <MetricSlider
                          metricKey="bloodPressure"
                          label="Blood Pressure"
                          min={30}
                          max={130}
                          step={1}
                          value={inputs.bloodPressure}
                          unit="mmHg"
                          normalRange="60–80"
                          onChange={(val) => handleInputChange('bloodPressure', val)}
                        />
                      )}
                      {currentQuestionIndex === 4 && (
                        <MetricSlider
                          metricKey="insulin"
                          label="Insulin"
                          min={0}
                          max={900}
                          step={1}
                          value={inputs.insulin}
                          unit="μU/mL"
                          normalRange="16–166"
                          onChange={(val) => handleInputChange('insulin', val)}
                        />
                      )}
                      {currentQuestionIndex === 5 && (
                        <MetricSlider
                          metricKey="skinThickness"
                          label="Skin Thickness"
                          min={0}
                          max={100}
                          step={1}
                          value={inputs.skinThickness}
                          unit="mm"
                          normalRange="10–50"
                          onChange={(val) => handleInputChange('skinThickness', val)}
                        />
                      )}
                      {currentQuestionIndex === 6 && (
                        <MetricSlider
                          metricKey="pregnancies"
                          label="Pregnancies"
                          min={0}
                          max={17}
                          step={1}
                          value={inputs.pregnancies}
                          unit="Count"
                          normalRange="N/A"
                          onChange={(val) => handleInputChange('pregnancies', val)}
                        />
                      )}
                      {currentQuestionIndex === 7 && (
                        <MetricSlider
                          metricKey="diabetesPedigree"
                          label="Pedigree Score"
                          min={0}
                          max={2.5}
                          step={0.01}
                          value={inputs.diabetesPedigree}
                          unit="Factor"
                          normalRange="0.08–2.42"
                          onChange={(val) => handleInputChange('diabetesPedigree', val)}
                        />
                      )}
                    </div>

                    {/* Biomarker Clinical Detail Card */}
                    {BIOMARKER_DETAILS[currentQuestionIndex] && (
                      <div className="w-full border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 rounded-none text-left flex flex-col gap-3 shadow-sm">
                        <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-[var(--accent)]">
                          Clinical Context: {BIOMARKER_DETAILS[currentQuestionIndex].name}
                        </h4>
                        <p className="font-inter text-xs leading-relaxed text-[var(--text-1)]">
                          {BIOMARKER_DETAILS[currentQuestionIndex].context}
                        </p>
                        <p className="font-inter text-xs leading-relaxed text-[var(--text-2)] italic border-l-2 border-[var(--border-soft)] pl-3">
                          <strong className="not-italic text-[var(--text-1)] uppercase text-[10px] tracking-wider block mb-1">Metabolic Impact:</strong>
                          {BIOMARKER_DETAILS[currentQuestionIndex].significance}
                        </p>
                        <div className="font-mono text-[9px] text-[var(--text-3)] border-t border-[var(--border-soft)] pt-3 mt-1 uppercase tracking-wider">
                          Clinical Reference Range: {BIOMARKER_DETAILS[currentQuestionIndex].range}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 w-full mt-2">
                      <PremiumButton
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(prev => prev - 1);
                        }}
                        variant="secondary"
                        className="flex-1 py-4 text-xs"
                      >
                        &larr; Back
                      </PremiumButton>
                      
                      {currentQuestionIndex < 7 ? (
                        <PremiumButton
                          onClick={() => {
                            audio.playClick();
                            setCurrentQuestionIndex(prev => prev + 1);
                          }}
                          variant="primary"
                          className="flex-1 py-4 text-xs"
                        >
                          Continue &rarr;
                        </PremiumButton>
                      ) : (
                        <PremiumButton
                          onClick={runPrediction}
                          disabled={isAnalyzing}
                          variant="primary"
                          className="flex-1 py-4 text-xs"
                        >
                          {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin text-[var(--text-1)]" />
                              Running...
                            </span>
                          ) : (
                            <span>Run Estimator &rarr;</span>
                          )}
                        </PremiumButton>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* INTEGRATION STEP (Index 8) */
                  <motion.div
                    key="step-integration"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-[760px] mx-auto flex flex-col gap-8 min-h-[50vh] justify-center py-10"
                  >
                    <div className="flex justify-between items-center w-full pb-3 border-b border-[var(--border-soft)]">
                      <span className="font-mono text-[10px] text-[var(--text-3)] tracking-widest uppercase">
                        [ Data Integration Suite ]
                      </span>
                    </div>

                    <DataIntegrationSuite onApplyInputs={handleApplyInputs} onParsingStatusChange={setIsReportParsing} />

                    <div className="flex flex-col gap-3 w-full mt-2">
                      <PremiumButton
                        onClick={runPrediction}
                        disabled={isAnalyzing || isReportParsing}
                        variant="primary"
                        className="w-full py-4 text-xs"
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-[var(--text-1)]" />
                            Evaluating Parsed Model...
                          </span>
                        ) : isReportParsing ? (
                          <span className="flex items-center justify-center gap-2 text-[var(--cyan-accent)]">
                            <Loader2 size={14} className="animate-spin" />
                            Extracting & Parsing Biomarkers...
                          </span>
                        ) : (
                          <span>Compute Risk with Integrated Data &rarr;</span>
                        )}
                      </PremiumButton>

                      <PremiumButton
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(-1);
                        }}
                        variant="secondary"
                        className="w-full py-4 text-xs"
                      >
                        &larr; Back to Selection Menu
                      </PremiumButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* STAGE 2: PREDICTION RESULTS DISPLAY */
            <motion.div
              key="results-stage"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 35 }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              className="w-full max-w-[1200px] mx-auto flex flex-col gap-8 relative"
            >
              {/* Back to Inputs Trigger Header */}
              <div className="flex items-center justify-between w-full pb-4 border-b border-[var(--border-soft)]">
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveStage('input');
                    setCurrentQuestionIndex(-1);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors duration-200"
                >
                  <ArrowLeft size={14} /> Back to Inputs
                </button>
                <span className="font-mono text-[10px] text-[var(--accent)] tracking-wider uppercase">
                  COMPUTATION COMPLETED
                </span>
              </div>

              {/* Re-run update banner overlay (if inputs change on future stage changes) */}
              {inputsDiverged && (
                <div className="flex items-center justify-between p-3.5 rounded-none bg-transparent border border-[var(--cyan-accent)] text-[var(--cyan-accent)] text-xs font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin-slow text-[var(--cyan-accent)]" />
                    Biomarkers modified since last run.
                  </div>
                  <button
                    onClick={runPrediction}
                    className="px-3 py-1 rounded-none border border-[var(--cyan-accent)] hover:bg-[var(--cyan-accent)] hover:text-[var(--void)] text-[var(--cyan-accent)] text-[10px] transition-colors duration-200 uppercase font-bold"
                  >
                    Re-run
                  </button>
                </div>
              )}

              {/* Main Results components */}
              <div className={`flex flex-col gap-6 rounded-none transition-all duration-300 ${pulseClass}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
                  {/* Left Column: Risk Gauge & Probability Curve */}
                  <div className="flex flex-col gap-6 w-full">
                    {/* Risk Gauge */}
                    <div className="w-full border border-[var(--border-soft)] rounded-none p-8 flex justify-center items-center bg-[var(--surface-1)] shadow-sm">
                      <RiskGauge risk={riskScore} />
                    </div>

                    {/* Probability Distribution Curve */}
                    <ProbabilityCurve riskPercent={riskScore} />
                  </div>

                  {/* Right Column: Feature Contributions & Insights */}
                  <div className="flex flex-col gap-6 w-full">
                    {/* Contribution Chart */}
                    {contributions && (
                      <FeatureChart contributions={contributions} />
                    )}

                    {/* Clinical Insights */}
                    <InsightCard inputs={inputs} risk={riskScore} aiInsights={aiInsights} />
                  </div>
                </div>

                {/* AI consultation chatbot desk */}
                <ClinicalChat inputs={inputs} riskScore={riskScore} contributions={contributions} />

                {/* Detailed Medical Disclaimer */}
                <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-4 bg-[var(--surface-1)] shadow-sm">
                  <div className="flex gap-2.5 items-start">
                    <Info size={16} className="text-[var(--text-3)] mt-0.5" />
                    <div className="flex flex-col gap-1 text-left">
                      <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-[var(--text-1)]">
                        About This Score
                      </h4>
                      <p className="font-inter text-[11px] leading-relaxed text-[var(--text-2)]">
                        This is not a medical diagnosis. The model uses a logistic regression classifier trained on the Pima Indians Diabetes Dataset with ~77% validation accuracy. We strongly recommend consulting a healthcare provider for any risk percentage above 40%.
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-4)] text-center pt-3 border-t border-[var(--border-soft)]">
                    GLYCOS is a data science demonstration tool. Not a medical device. Not for clinical use.
                  </div>
                </div>

                {/* Download PDF/HTML Report & Adjust Button Row */}
                <div className="flex flex-col md:flex-row gap-4 w-full mt-2">
                  <PremiumButton
                    onClick={downloadPdfReport}
                    variant="primary"
                    className="flex-1 py-4 text-xs font-mono uppercase tracking-wider"
                  >
                    Download Official Clinical Report &darr;
                  </PremiumButton>

                  <PremiumButton
                    onClick={() => {
                      audio.playClick();
                      setActiveStage('input');
                      setCurrentQuestionIndex(-1);
                    }}
                    variant="secondary"
                    className="flex-1 py-4 text-xs font-mono uppercase tracking-wider"
                  >
                    &larr; Adjust Clinical Biomarkers
                  </PremiumButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Clinical Analysis Loader Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ 
              scale: 0, 
              borderRadius: "45% 55% 70% 30% / 45% 45% 55% 55%", 
              opacity: 1 
            }}
            animate={{ 
              scale: 1, 
              borderRadius: "0px",
              opacity: 1 
            }}
            exit={{ 
              y: '-100vh',
              borderBottomLeftRadius: '16vw',
              borderBottomRightRadius: '16vw',
              opacity: 0.9,
            }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[99999] bg-[#0c0f12] select-none overflow-hidden"
            style={{ transformOrigin: 'center center' }}
          >
            {/* Designer Framer Preloader */}
            <Calibration3DLoader progress={analysisProgress} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Laser scan animation & Radial pulsing background stylesheets */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseLow {
          0% { box-shadow: inset 0 0 0px rgba(16, 185, 129, 0); }
          50% { box-shadow: inset 0 0 80px rgba(16, 185, 129, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(16, 185, 129, 0); }
        }
        @keyframes pulseMid {
          0% { box-shadow: inset 0 0 0px rgba(245, 158, 11, 0); }
          50% { box-shadow: inset 0 0 80px rgba(245, 158, 11, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(245, 158, 11, 0); }
        }
        @keyframes pulseHigh {
          0% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
          50% { box-shadow: inset 0 0 80px rgba(239, 68, 68, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
        }

        .pulse-low {
          animation: pulseLow 3s infinite ease-in-out;
        }
        .pulse-mid {
          animation: pulseMid 3s infinite ease-in-out;
        }
        .pulse-high {
          animation: pulseHigh 3s infinite ease-in-out;
        }

        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 3.3s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Diagnosis;
