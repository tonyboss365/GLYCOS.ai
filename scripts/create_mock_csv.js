import fs from 'fs';
import path from 'path';

const generateMockDataset = () => {
  const headers = 'pregnancies,glucose,bloodPressure,skinThickness,insulin,bmi,diabetesPedigree,age,outcome\n';
  let rows = [];

  for (let i = 0; i < 1000; i++) {
    // 35% probability of positive outcome
    const outcome = Math.random() < 0.35 ? 1 : 0;

    let pregnancies, glucose, bloodPressure, skinThickness, insulin, bmi, diabetesPedigree, age;

    if (outcome === 1) {
      // High-risk ranges
      pregnancies = Math.floor(2 + Math.random() * 8);
      glucose = Math.floor(130 + Math.random() * 65);
      bloodPressure = Math.floor(70 + Math.random() * 25);
      skinThickness = Math.floor(25 + Math.random() * 25);
      insulin = Math.floor(120 + Math.random() * 200);
      bmi = parseFloat((30.0 + Math.random() * 15).toFixed(1));
      diabetesPedigree = parseFloat((0.35 + Math.random() * 1.2).toFixed(3));
      age = Math.floor(33 + Math.random() * 32);
    } else {
      // Healthy ranges
      pregnancies = Math.floor(Math.random() * 5);
      glucose = Math.floor(80 + Math.random() * 45);
      bloodPressure = Math.floor(60 + Math.random() * 20);
      skinThickness = Math.floor(10 + Math.random() * 22);
      insulin = Math.floor(30 + Math.random() * 95);
      bmi = parseFloat((18.5 + Math.random() * 11.4).toFixed(1));
      diabetesPedigree = parseFloat((0.08 + Math.random() * 0.42).toFixed(3));
      age = Math.floor(21 + Math.random() * 14);
    }

    rows.push(`${pregnancies},${glucose},${bloodPressure},${skinThickness},${insulin},${bmi},${diabetesPedigree},${age},${outcome}`);
  }

  const csvContent = headers + rows.join('\n');
  const targetPath = path.resolve('mocks/mock_training_dataset.csv');

  // Ensure mocks dir exists
  if (!fs.existsSync('mocks')) {
    fs.mkdirSync('mocks');
  }

  fs.writeFileSync(targetPath, csvContent, 'utf-8');
  console.log(`Successfully generated 1000 records inside: ${targetPath}`);
};

generateMockDataset();
