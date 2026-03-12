const form = document.getElementById("bonus-form");
const resultBox = document.getElementById("result");

const performanceScores = {
  exceptional: 1.3,
  successful: 1.0,
  average: 0.5,
  below_expectations: 0.0,
};

function getCareerLevelConfig(careerLevel) {
  if (careerLevel >= 10 && careerLevel <= 40) {
    return { bracket: "Entry Level", targetPct: 0.1, individualWeight: 0.85, companyWeight: 0.15 };
  }

  if (careerLevel >= 50 && careerLevel <= 70) {
    return { bracket: "Mid-Level", targetPct: 0.15, individualWeight: 0.75, companyWeight: 0.25 };
  }

  if (careerLevel >= 80 && careerLevel <= 90) {
    return { bracket: "Senior Level", targetPct: 0.2, individualWeight: 0.5, companyWeight: 0.5 };
  }

  if (careerLevel >= 100 && careerLevel <= 120) {
    return { bracket: "Top Level", targetPct: 0.25, individualWeight: 0.25, companyWeight: 0.75 };
  }

  if (careerLevel >= 121) {
    return { bracket: "SLT", unsupported: true };
  }

  return null;
}

function asMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function setResult(message, type) {
  resultBox.className = `result ${type}`.trim();
  resultBox.innerHTML = message;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const careerLevel = Number(formData.get("careerLevel"));
  const annualSalary = Number(formData.get("annualSalary"));
  const rating = String(formData.get("performanceRating"));

  if (!Number.isFinite(careerLevel) || !Number.isFinite(annualSalary) || !rating) {
    setResult("<p>Please provide valid inputs in all fields.</p>", "error");
    return;
  }

  if (annualSalary < 0) {
    setResult("<p>Annual salary cannot be negative.</p>", "error");
    return;
  }

  const config = getCareerLevelConfig(careerLevel);
  if (!config) {
    setResult(
      "<p>Career level is outside defined ranges. Use CL 10-40, 50-70, 80-90, 100-120, or 121+.</p>",
      "error"
    );
    return;
  }

  if (config.unsupported) {
    setResult(
      "<p>For CL 121+, target bonus is marked as <strong>as per agreement</strong> in policy. This tool cannot compute that bracket automatically.</p>",
      "warn"
    );
    return;
  }

  const individualPerformanceScore = performanceScores[rating];
  const companyPerformanceScore = 0.6; // Fixed company score at 60%.

  const targetBonus = annualSalary * config.targetPct;
  const finalBonus =
    targetBonus * config.individualWeight * individualPerformanceScore +
    targetBonus * config.companyWeight * companyPerformanceScore;

  setResult(
    `<p><strong>${asMoney(finalBonus)}</strong></p>
     <p>Bracket: ${config.bracket} | Target Bonus: ${Math.round(config.targetPct * 100)}% | Company Score: 60%</p>`,
    "ok"
  );
});
