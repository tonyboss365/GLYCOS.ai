import React, { useState, useEffect } from 'react';
import { FileText, Cpu, Check, AlertCircle, Play, RotateCcw, Copy, Upload } from 'lucide-react';
import { PIMA_DATASET } from '../model/dataset';
import { updateModel, resetModel, currentModel, MODEL } from '../model/predict';
import { audio } from '../model/audio';

const SAMPLE_REPORT = `GLYCOS PATIENT CLINICAL DATA RECORD
==================================
Institution: Stanford Metabolic Center
Date: 2026-06-23
Ref ID: SMC-99120

METABOLIC LAB TEST FINDINGS:
- Pregnancies: 3
- Plasma Glucose Concentration (2hr): 158 mg/dL
- Diastolic Blood Pressure: 74 mmHg
- Triceps Skin Fold Thickness: 32 mm
- 2-Hour Serum Insulin: 185 uU/mL
- Body Mass Index (BMI): 33.4
- Diabetes Pedigree Function: 0.68
- Patient Age: 42 Years old

DIAGNOSTIC ADVISORY:
Patient presents elevated postprandial glucose levels and a high BMI. Recommend monitoring and lifestyle consultation.`;

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;
  
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  const keyMap = {
    pregnancies: headers.indexOf('pregnancies'),
    glucose: headers.indexOf('glucose'),
    bloodPressure: headers.indexOf('bloodpressure') !== -1 ? headers.indexOf('bloodpressure') : headers.indexOf('blood_pressure'),
    skinThickness: headers.indexOf('skinthickness') !== -1 ? headers.indexOf('skinthickness') : headers.indexOf('skin_thickness'),
    insulin: headers.indexOf('insulin'),
    bmi: headers.indexOf('bmi'),
    diabetesPedigree: headers.indexOf('diabetespedigree') !== -1 ? headers.indexOf('diabetespedigree') : headers.indexOf('diabetes_pedigree'),
    age: headers.indexOf('age'),
    outcome: headers.indexOf('outcome') !== -1 ? headers.indexOf('outcome') : headers.indexOf('label') !== -1 ? headers.indexOf('label') : headers.indexOf('class')
  };

  if (keyMap.glucose === -1 || keyMap.bmi === -1 || keyMap.age === -1 || keyMap.outcome === -1) {
    return null;
  }

  const dataset = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < headers.length) continue;

    const row = [];
    const keys = ['pregnancies', 'glucose', 'bloodPressure', 'skinThickness', 'insulin', 'bmi', 'diabetesPedigree', 'age'];
    
    let isValidRow = true;
    for (let j = 0; j < keys.length; j++) {
      const idx = keyMap[keys[j]];
      const val = idx !== -1 ? parseFloat(cols[idx]) : 0;
      if (isNaN(val)) {
        isValidRow = false;
        break;
      }
      row.push(val);
    }
    
    const labelVal = parseInt(cols[keyMap.outcome]);
    if (isNaN(labelVal)) isValidRow = false;
    
    if (isValidRow) {
      row.push(labelVal);
      dataset.push(row);
    }
  }

  return dataset.length > 0 ? dataset : null;
};

export const DataIntegrationSuite = ({ onApplyInputs }) => {
  const [activeTab, setActiveTab] = useState('parser'); // 'parser' or 'trainer'
  const [reportText, setReportText] = useState('');
  const [parsedLog, setParsedLog] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingConsole, setTrainingConsole] = useState([]);
  const [isCustomModelApplied, setIsCustomModelApplied] = useState(false);
  const [trainedParams, setTrainedParams] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [customDataset, setCustomDataset] = useState(null);
  const [customDatasetName, setCustomDatasetName] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileImport(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileImport(e.target.files[0]);
    }
  };

  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const loadXlsx = () => {
    return new Promise((resolve, reject) => {
      if (window.XLSX) {
        resolve(window.XLSX);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      script.onload = () => resolve(window.XLSX);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const fetchParsedBiomarkersFromAi = async (text) => {
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
              content: 'You are an expert clinical data parsing assistant. Extract the following 8 patient biomarkers from the clinical text and return them as a valid JSON object. Required biomarkers to extract (and their keys in the JSON response):\n1. pregnancies (integer count)\n2. glucose (plasma glucose concentration, integer, mg/dL)\n3. bloodPressure (diastolic blood pressure, integer, mmHg)\n4. skinThickness (triceps skin fold thickness, integer, mm)\n5. insulin (2-hour serum insulin, integer, uU/mL or mu U/mL)\n6. bmi (body mass index, float)\n7. diabetesPedigree (diabetes pedigree score, float)\n8. age (patient age, integer, years)\n\nRules:\n- If a biomarker is missing or not mentioned, do NOT guess. Set its value to null.\n- Provide ONLY the JSON object. Do not include markdown formatting or backticks.' 
            },
            { 
              role: 'user', 
              content: `Extract biomarkers from this clinical text:\n---\n${text}\n---` 
            }
          ],
          model: 'gpt-4o-mini',
          temperature: 0.0,
          seed: 42,
          max_tokens: 300
        })
      });

      if (!response.ok) return null;
      const data = await response.json();
      const content = data.choices[0].message.content.trim();
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("AI biomarker parsing failed:", e);
      return null;
    }
  };

  const runRegexFallback = (text) => {
    const regexes = {
      pregnancies: /(?:pregnancies|pregnancy\s*count):\s*(\d+)/i,
      glucose: /(?:glucose|plasma\s*glucose|concentration):\s*(\d+)/i,
      bloodPressure: /(?:blood\s*pressure|diastolic):\s*(\d+)/i,
      skinThickness: /(?:skin\s*thickness|fold):\s*(\d+)/i,
      insulin: /(?:insulin|serum\s*insulin):\s*(\d+)/i,
      bmi: /(?:bmi|body\s*mass\s*index):\s*(\d+\.?\d*)/i,
      diabetesPedigree: /(?:pedigree|pedigree\s*function):\s*(\d+\.?\d*)/i,
      age: /(?:age|years\s*old):\s*(\d+)/i,
    };

    const log = [];
    const validResults = {};

    for (const [key, regex] of Object.entries(regexes)) {
      const match = text.match(regex);
      if (match) {
        const val = parseFloat(match[1]);
        validResults[key] = val;
        log.push({ type: 'success', label: key, value: val });
      } else {
        log.push({ type: 'warning', label: key, message: `Could not parse ${key}.` });
      }
    }

    setParsedLog(prev => [...prev, ...log]);
    if (Object.keys(validResults).length > 0) {
      onApplyInputs(validResults);
    }
  };

  const handleFileImport = async (file) => {
    setParsedLog([{ type: 'warning', label: 'Processing', message: 'Extracting file content...' }]);
    let text = '';
    const fileType = file.name.split('.').pop().toLowerCase();

    try {
      if (fileType === 'pdf') {
        const pdfjsLib = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        text = fullText;
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const XLSX = await loadXlsx();
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetText = XLSX.utils.sheet_to_txt(worksheet);
          fullText += `Sheet: ${sheetName}\n${sheetText}\n`;
        });
        text = fullText;
      } else {
        // Fallback to text reading
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (err) => reject(err);
          reader.readAsText(file);
        });
      }

      setReportText(text);
      setParsedLog([
        { type: 'success', label: 'File Ingested', value: file.name },
        { type: 'warning', label: 'Parsing', message: 'AI parsing clinical text...' }
      ]);

      const parsedData = await fetchParsedBiomarkersFromAi(text);
      if (parsedData) {
        const log = [
          { type: 'success', label: 'File Ingested', value: file.name }
        ];
        const validResults = {};

        const expectedKeys = [
          'pregnancies', 'glucose', 'bloodPressure', 
          'skinThickness', 'insulin', 'bmi', 
          'diabetesPedigree', 'age'
        ];

        expectedKeys.forEach(key => {
          if (parsedData[key] !== undefined && parsedData[key] !== null) {
            const val = parseFloat(parsedData[key]);
            if (!isNaN(val)) {
              validResults[key] = val;
              log.push({ type: 'success', label: key, value: val });
            } else {
              log.push({ type: 'warning', label: key, message: `Could not parse ${key}.` });
            }
          } else {
            log.push({ type: 'warning', label: key, message: `Could not parse ${key}.` });
          }
        });

        setParsedLog(log);

        if (Object.keys(validResults).length > 0) {
          onApplyInputs(validResults);
          audio.playFanfare();
        }
      } else {
        setParsedLog([
          { type: 'success', label: 'File Ingested', value: file.name },
          { type: 'error', message: 'AI parsing failed. Using regex extraction fallback.' }
        ]);
        runRegexFallback(text);
      }
    } catch (error) {
      console.error("File ingestion failed:", error);
      setParsedLog([{ type: 'error', message: `Failed to ingest file: ${error.message}` }]);
    }
  };

  const loadSampleReport = () => {
    audio.playClick();
    setReportText(SAMPLE_REPORT);
    setParsedLog([]);
  };

  const handleParse = async () => {
    audio.playClick();
    if (!reportText.trim()) {
      setParsedLog([{ type: 'error', message: 'Report text is empty. Please enter or load a report.' }]);
      return;
    }

    setParsedLog([{ type: 'warning', label: 'Parsing', message: 'AI parsing clinical text...' }]);

    const parsedData = await fetchParsedBiomarkersFromAi(reportText);
    if (parsedData) {
      const log = [];
      const validResults = {};

      const expectedKeys = [
        'pregnancies', 'glucose', 'bloodPressure', 
        'skinThickness', 'insulin', 'bmi', 
        'diabetesPedigree', 'age'
      ];

      expectedKeys.forEach(key => {
        if (parsedData[key] !== undefined && parsedData[key] !== null) {
          const val = parseFloat(parsedData[key]);
          if (!isNaN(val)) {
            validResults[key] = val;
            log.push({ type: 'success', label: key, value: val });
          } else {
            log.push({ type: 'warning', label: key, message: `Could not parse ${key}.` });
          }
        } else {
          log.push({ type: 'warning', label: key, message: `Could not parse ${key}.` });
        }
      });

      setParsedLog(log);

      if (Object.keys(validResults).length > 0) {
        onApplyInputs(validResults);
        audio.playFanfare();
      }
    } else {
      setParsedLog([{ type: 'error', message: 'AI parsing failed. Running regex extraction...' }]);
      runRegexFallback(reportText);
    }
  };

  const handleDatasetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    audio.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const dataset = parseCSV(text);
      if (dataset) {
        setCustomDataset(dataset);
        setCustomDatasetName(file.name);
        setTrainingConsole([`[ML DECK] Successfully loaded custom dataset "${file.name}" with ${dataset.length} valid clinical samples.`]);
      } else {
        setTrainingConsole([`[ML DECK] Error parsing CSV dataset. Ensure headers for pregnancies, glucose, bloodPressure, skinThickness, insulin, bmi, diabetesPedigree, age, and outcome/label exist.`]);
      }
    };
    reader.readAsText(file);
  };

  const handleClearCustomDataset = () => {
    audio.playClick();
    setCustomDataset(null);
    setCustomDatasetName('');
    setTrainingConsole([]);
  };

  // Browser Logistic Regression Gradient Descent Solver
  const runGradientDescent = () => {
    audio.playClick();
    setIsTraining(true);
    setTrainingConsole([]);
    
    let consoleLines = [];
    const logToConsole = (msg) => {
      consoleLines.push(msg);
      setTrainingConsole([...consoleLines]);
    };

    const datasetToUse = customDataset || PIMA_DATASET;
    const data = datasetToUse.map(row => ({
      inputs: row.slice(0, 8),
      label: row[8]
    }));

    const numFeatures = 8;
    const N = data.length;

    // Dynamic means & stds calculation
    const means = Array(numFeatures).fill(0);
    for (let i = 0; i < N; i++) {
      for (let f = 0; f < numFeatures; f++) {
        means[f] += data[i].inputs[f];
      }
    }
    for (let f = 0; f < numFeatures; f++) {
      means[f] /= N;
    }

    const stds = Array(numFeatures).fill(0);
    for (let i = 0; i < N; i++) {
      for (let f = 0; f < numFeatures; f++) {
        stds[f] += Math.pow(data[i].inputs[f] - means[f], 2);
      }
    }
    for (let f = 0; f < numFeatures; f++) {
      stds[f] = Math.sqrt(stds[f] / N) || 1.0;
    }

    const scaledData = data.map(item => ({
      inputs: item.inputs.map((val, f) => (val - means[f]) / stds[f]),
      label: item.label
    }));

    let weights = Array(numFeatures).fill(0);
    let intercept = 0;
    const lr = 0.25;
    const epochs = 120;

    logToConsole(`[ML DECK] Initializing gradient descent solver...`);
    logToConsole(`[ML DECK] Cohort source: ${customDataset ? 'Custom Dataset' : 'Standard PIMA Indians Dataset'}`);
    logToConsole(`[ML DECK] Loaded ${N} clinical samples.`);
    logToConsole(`[ML DECK] Computing dynamic standard deviations and means...`);

    let epoch = 0;
    const epochStep = 20;

    const interval = setInterval(() => {
      if (epoch < epochs) {
        let loss = 0;
        for (let step = 0; step < epochStep; step++) {
          let dw = Array(numFeatures).fill(0);
          let di = 0;
          loss = 0;
          for (let i = 0; i < N; i++) {
            const x = scaledData[i].inputs;
            const y = scaledData[i].label;
            let z = intercept;
            for (let f = 0; f < numFeatures; f++) z += weights[f] * x[f];
            const p = 1 / (1 + Math.exp(-z));
            const err = p - y;
            loss += -y * Math.log(Math.max(p, 1e-15)) - (1 - y) * Math.log(Math.max(1 - p, 1e-15));
            for (let f = 0; f < numFeatures; f++) dw[f] += err * x[f];
            di += err;
          }
          loss /= N;
          for (let f = 0; f < numFeatures; f++) weights[f] -= (lr * dw[f]) / N;
          intercept -= (lr * di) / N;
          epoch++;
        }

        // Calculate current training accuracy
        let correct = 0;
        for (let i = 0; i < N; i++) {
          const x = scaledData[i].inputs;
          const y = scaledData[i].label;
          let z = intercept;
          for (let f = 0; f < numFeatures; f++) z += weights[f] * x[f];
          const p = 1 / (1 + Math.exp(-z));
          const predictedLabel = p >= 0.5 ? 1 : 0;
          if (predictedLabel === y) correct++;
        }
        const acc = ((correct / N) * 100).toFixed(1);
        logToConsole(`[ML DECK] Epoch ${epoch}/${epochs} | Loss: ${loss.toFixed(4)} | Train Acc: ${acc}%`);
      } else {
        // Apply newly trained weights
        const customParams = {
          intercept: parseFloat(intercept.toFixed(4)),
          coefficients: {
            pregnancies: parseFloat(weights[0].toFixed(4)),
            glucose: parseFloat(weights[1].toFixed(4)),
            bloodPressure: parseFloat(weights[2].toFixed(4)),
            skinThickness: parseFloat(weights[3].toFixed(4)),
            insulin: parseFloat(weights[4].toFixed(4)),
            bmi: parseFloat(weights[5].toFixed(4)),
            diabetesPedigree: parseFloat(weights[6].toFixed(4)),
            age: parseFloat(weights[7].toFixed(4))
          },
          means: {
            pregnancies: parseFloat(means[0].toFixed(4)), 
            glucose: parseFloat(means[1].toFixed(4)), 
            bloodPressure: parseFloat(means[2].toFixed(4)),
            skinThickness: parseFloat(means[3].toFixed(4)), 
            insulin: parseFloat(means[4].toFixed(4)), 
            bmi: parseFloat(means[5].toFixed(4)),
            diabetesPedigree: parseFloat(means[6].toFixed(4)), 
            age: parseFloat(means[7].toFixed(4))
          },
          stds: {
            pregnancies: parseFloat(stds[0].toFixed(4)), 
            glucose: parseFloat(stds[1].toFixed(4)), 
            bloodPressure: parseFloat(stds[2].toFixed(4)),
            skinThickness: parseFloat(stds[3].toFixed(4)), 
            insulin: parseFloat(stds[4].toFixed(4)), 
            bmi: parseFloat(stds[5].toFixed(4)),
            diabetesPedigree: parseFloat(stds[6].toFixed(4)), 
            age: parseFloat(stds[7].toFixed(4))
          }
        };

        // Compute final training accuracy
        let correct = 0;
        for (let i = 0; i < N; i++) {
          const x = scaledData[i].inputs;
          const y = scaledData[i].label;
          let z = intercept;
          for (let f = 0; f < numFeatures; f++) z += weights[f] * x[f];
          const p = 1 / (1 + Math.exp(-z));
          const predictedLabel = p >= 0.5 ? 1 : 0;
          if (predictedLabel === y) correct++;
        }
        const finalAcc = ((correct / N) * 100).toFixed(1);

        setTrainedParams(customParams);
        updateModel(customParams);
        setIsCustomModelApplied(true);
        logToConsole(`[ML DECK] Training complete. Solver accuracy: ${finalAcc}%. Custom parameters applied.`);
        audio.playFanfare();
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 200);
  };

  const handleResetModel = () => {
    audio.playClick();
    resetModel();
    setIsCustomModelApplied(false);
    setTrainedParams(null);
    setTrainingConsole([]);
  };

  return (
    <div className="w-full rounded-none border border-[var(--border-soft)] bg-[var(--surface-1)] shadow-sm p-6 flex flex-col gap-6 text-left relative overflow-hidden">
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border-soft)] pb-4">
        <div>
          <h4 className="font-syne font-bold text-base text-[var(--text-1)] flex items-center gap-2">
            <Cpu size={16} className="text-[var(--cyan-accent)] animate-pulse" /> Data Integration Suite
          </h4>
          <p className="text-[11px] font-mono text-[var(--text-3)] uppercase tracking-wider">
            Advanced clinical file utilities and in-browser model calibration dashboard.
          </p>
        </div>

        <div className="flex gap-2 p-1 rounded-none bg-transparent border border-[var(--border-soft)] self-start md:self-auto">
          <button
            onClick={() => { audio.playClick(); setActiveTab('parser'); }}
            className={`px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider transition-all duration-200 ${activeTab === 'parser' ? 'bg-[var(--text-1)] text-[var(--void)] font-semibold' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'}`}
          >
            Report Parser
          </button>
          <button
            onClick={() => { audio.playClick(); setActiveTab('trainer'); }}
            className={`px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider transition-all duration-200 ${activeTab === 'trainer' ? 'bg-[var(--text-1)] text-[var(--void)] font-semibold' : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface-2)]'}`}
          >
            ML Trainer (Beta)
          </button>
        </div>
      </div>

      {activeTab === 'parser' ? (
        /* TAB 1: CLINICAL REPORT PARSER */
        <div className="flex flex-col gap-4">
          {/* Drag & Drop File Uploader Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border border-dashed p-6 flex flex-col items-center justify-center gap-2 transition-all duration-300 relative group cursor-pointer ${
              isDragging 
                ? 'border-[var(--cyan-accent)] bg-[var(--surface-3)] scale-[0.99]' 
                : 'border-[var(--border-soft)] hover:border-[var(--cyan-accent)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {/* Faux hidden file input for browse click */}
            <input
              type="file"
              accept=".txt,.csv,.log,.json,.pdf,.xlsx,.xls"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-20"
            />
            <Upload className="text-[var(--cyan-accent)] w-6 h-6 animate-pulse group-hover:scale-110 transition-transform duration-300" />
            <span className="font-mono text-[10px] text-[var(--text-2)] uppercase tracking-wider text-center">
              Drag & Drop Report or <span className="underline text-[var(--cyan-accent)] font-semibold">Browse Files</span>
            </span>
            <span className="font-mono text-[8px] text-[var(--text-4)] uppercase tracking-wider text-center">
              Supports .txt, .csv, .log, .pdf, .xlsx, .xls files
            </span>
          </div>

          <div className="flex justify-between items-center">
            <label className="font-mono text-[10px] text-[var(--text-2)] font-semibold uppercase tracking-wider">
              Or Paste Hospital Report / Lab Results
            </label>
            <button
              onClick={loadSampleReport}
              className="text-[10px] font-mono text-[var(--cyan-accent)] hover:underline flex items-center gap-1"
            >
              <Copy size={10} /> Load Sample Lab Report
            </button>
          </div>

          <textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder="Paste clinical record summaries containing patient blood pressure, glucose levels, age, and metabolic parameters..."
            className="w-full h-36 bg-transparent border border-[var(--border-soft)] rounded-none p-4 text-xs font-mono text-[var(--text-1)] outline-none focus:border-[var(--cyan-accent)] transition-colors duration-200 resize-none"
          />

          <button
            onClick={handleParse}
            className="w-full py-3 rounded-none border border-[var(--cyan-accent)] bg-transparent hover:bg-[var(--cyan-accent)] hover:text-[var(--void)] transition-all duration-200 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--cyan-accent)]"
          >
            <FileText size={14} /> Extract & Autofill Biomarkers
          </button>

          {parsedLog.length > 0 && (
            <div className="p-4 rounded-none bg-[var(--surface-2)] border border-[var(--border-soft)] flex flex-col gap-2">
              <span className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-wider">Parser Extraction Logs:</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {parsedLog.map((log, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    {log.type === 'success' ? (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--risk-low)]">
                        <Check size={10} /> {log.label}: {log.value}
                      </span>
                    ) : log.type === 'warning' ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-3)]">
                        <AlertCircle size={10} /> {log.label}: N/A
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-red-500">
                        {log.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: IN-BROWSER MODEL CALIBRATOR */
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <span className="font-mono text-[10px] text-[var(--text-2)] font-semibold uppercase tracking-wider block">
                Local Logistic Regression Trainer (Beta)
              </span>
              <p className="text-[11px] text-[var(--text-3)] mt-0.5 leading-normal">
                Fits a logistic regression classifier on either the standard PIMA dataset or your own custom CSV patient cohort in real-time inside your browser using gradient descent.
              </p>
            </div>
          </div>

          {/* Custom Dataset Upload Box */}
          <div className="flex flex-col gap-2 p-4 border border-dashed border-[var(--border-soft)] rounded-none bg-[var(--surface-2)]">
            <span className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-wider block">Custom Training Dataset:</span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => document.getElementById('dataset-upload-input').click()}
                className="px-3 py-1.5 rounded-none border border-[var(--text-2)] bg-transparent hover:bg-[var(--text-2)] hover:text-[var(--void)] text-[10px] font-mono uppercase tracking-wider transition-colors duration-200"
              >
                Choose CSV Dataset
              </button>
              <input
                id="dataset-upload-input"
                type="file"
                accept=".csv"
                onChange={handleDatasetUpload}
                className="hidden"
              />
              <span className="text-[11px] font-mono text-[var(--text-2)]">
                {customDataset ? `Loaded: ${customDatasetName} (${customDataset.length} rows)` : 'No custom dataset loaded (Default: PIMA Indians)'}
              </span>
              {customDataset && (
                <button
                  type="button"
                  onClick={handleClearCustomDataset}
                  className="text-[10px] font-mono text-red-500 uppercase hover:underline ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[9px] text-[var(--text-4)] leading-relaxed mt-1">
              * CSV columns must match biomarker headers (pregnancies, glucose, bloodPressure, skinThickness, insulin, bmi, diabetesPedigree, age) and include an outcome column (outcome, label, or class).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={runGradientDescent}
              disabled={isTraining}
              className="flex-1 py-3 rounded-none border border-[var(--cyan-accent)] bg-transparent hover:bg-[var(--cyan-accent)] hover:text-[var(--void)] disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--cyan-accent)]"
            >
              <Play size={12} className={isTraining ? 'animate-spin' : ''} />
              {isTraining ? 'Training Model...' : customDataset ? 'Train on Custom Dataset' : 'Train on Pima dataset'}
            </button>

            {isCustomModelApplied && (
              <button
                onClick={handleResetModel}
                className="px-4 py-3 rounded-none border border-[var(--border-soft)] bg-transparent hover:bg-[var(--text-1)] hover:text-[var(--void)] transition-all duration-200 flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--text-2)] hover:text-black"
              >
                <RotateCcw size={12} /> Reset Model
              </button>
            )}
          </div>

          {trainingConsole.length > 0 && (
            <div className="p-4 rounded-none bg-[var(--surface-2)] border border-[var(--border-soft)] font-mono text-[10px] text-[var(--text-2)] flex flex-col gap-1.5 min-h-[120px] max-h-[200px] overflow-y-auto">
              {trainingConsole.map((line, idx) => (
                <div key={idx} className={line.includes('complete') ? 'text-[var(--cyan-accent)] font-semibold' : ''}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {trainedParams && (
            <div className="p-4 rounded-none bg-[var(--surface-2)] border border-[var(--border-soft)] flex flex-col gap-3">
              <span className="font-mono text-[10px] text-[var(--text-3)] uppercase tracking-wider">Trained Coefficients Comparison:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(trainedParams.coefficients).map(([feature, val]) => {
                  const defaultVal = MODEL.coefficients[feature];
                  return (
                    <div key={feature} className="flex flex-col gap-0.5 border-l border-[var(--border-soft)] pl-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--text-3)]">{feature}</span>
                      <span className="font-mono text-xs text-[var(--risk-low)] font-semibold">{val}</span>
                      <span className="font-mono text-[9px] text-[var(--text-4)]">Default: {defaultVal}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataIntegrationSuite;
