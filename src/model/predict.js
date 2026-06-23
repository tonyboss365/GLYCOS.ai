export const MODEL = {
  intercept: -0.7749,
  coefficients: {
    pregnancies:     0.4152,
    glucose:         1.1253,
    bloodPressure:  -0.2575,
    skinThickness:   0.0096,
    insulin:        -0.1383,
    bmi:             0.7068,
    diabetesPedigree: 0.3782,
    age:             0.1752
  },
  // Training set mean and std for normalization
  means: {
    pregnancies: 3.845, glucose: 120.89, bloodPressure: 69.11,
    skinThickness: 20.54, insulin: 79.80, bmi: 31.99,
    diabetesPedigree: 0.4719, age: 33.24
  },
  stds: {
    pregnancies: 3.370, glucose: 31.97, bloodPressure: 19.36,
    skinThickness: 15.95, insulin: 115.24, bmi: 7.88,
    diabetesPedigree: 0.3313, age: 11.76
  }
};

// Mutable runtime model instance
export let currentModel = {
  intercept: MODEL.intercept,
  coefficients: { ...MODEL.coefficients },
  means: { ...MODEL.means },
  stds: { ...MODEL.stds }
};

export function updateModel(customModel) {
  currentModel.intercept = customModel.intercept;
  currentModel.coefficients = { ...customModel.coefficients };
  currentModel.means = { ...customModel.means };
  currentModel.stds = { ...customModel.stds };
}

export function resetModel() {
  currentModel.intercept = MODEL.intercept;
  currentModel.coefficients = { ...MODEL.coefficients };
  currentModel.means = { ...MODEL.means };
  currentModel.stds = { ...MODEL.stds };
}

export function predict(inputs) {
  let z = currentModel.intercept;
  for (const [key, value] of Object.entries(inputs)) {
    const normalized = (value - currentModel.means[key]) / currentModel.stds[key];
    z += currentModel.coefficients[key] * normalized;
  }
  const probability = 1 / (1 + Math.exp(-z));
  return Math.round(probability * 100);
}

export function getContributions(inputs) {
  const contributions = {};
  for (const [key, value] of Object.entries(inputs)) {
    const normalized = (value - currentModel.means[key]) / currentModel.stds[key];
    contributions[key] = currentModel.coefficients[key] * normalized;
  }
  return contributions;
}
