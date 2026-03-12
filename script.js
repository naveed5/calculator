const form = document.getElementById("bonus-form");
const resultBox = document.getElementById("result");
const USD_TO_PKR = 281;

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

function asPkr(value) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(value);
}

function calculatePkAnnualTax(totalAnnualIncomePkr) {
  if (totalAnnualIncomePkr <= 600000) {
    return 0;
  }

  if (totalAnnualIncomePkr <= 1200000) {
    return 0.025 * (totalAnnualIncomePkr - 600000);
  }

  if (totalAnnualIncomePkr <= 2200000) {
    return 6000 + 0.11 * (totalAnnualIncomePkr - 1200000);
  }

  if (totalAnnualIncomePkr <= 3200000) {
    return 116000 + 0.23 * (totalAnnualIncomePkr - 2200000);
  }

  if (totalAnnualIncomePkr <= 4100000) {
    return 346000 + 0.3 * (totalAnnualIncomePkr - 3200000);
  }

  let annualTax = 616000 + 0.35 * (totalAnnualIncomePkr - 4100000);

  if (totalAnnualIncomePkr > 10000000) {
    annualTax += annualTax * 0.1;
  }

  return annualTax;
}

function getPkTaxSlabInfo(totalAnnualIncomePkr) {
  if (totalAnnualIncomePkr <= 600000) {
    return { label: "Up to PKR 600,000", rate: 0 };
  }

  if (totalAnnualIncomePkr <= 1200000) {
    return { label: "PKR 600,001 - 1,200,000", rate: 0.025 };
  }

  if (totalAnnualIncomePkr <= 2200000) {
    return { label: "PKR 1,200,001 - 2,200,000", rate: 0.11 };
  }

  if (totalAnnualIncomePkr <= 3200000) {
    return { label: "PKR 2,200,001 - 3,200,000", rate: 0.23 };
  }

  if (totalAnnualIncomePkr <= 4100000) {
    return { label: "PKR 3,200,001 - 4,100,000", rate: 0.3 };
  }

  if (totalAnnualIncomePkr <= 10000000) {
    return { label: "Above PKR 4,100,000", rate: 0.35 };
  }

  return { label: "Above PKR 10,000,000 (with surcharge)", rate: 0.385 };
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
  const employeeCountry = String(formData.get("employeeCountry"));

  if (!Number.isFinite(careerLevel) || !Number.isFinite(annualSalary) || !rating || !employeeCountry) {
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
  if (!Number.isFinite(individualPerformanceScore)) {
    setResult("<p>Please select a valid performance rating.</p>", "error");
    return;
  }

  const companyPerformanceScore = 0.6; // Fixed company score at 60%.

  const targetBonus = annualSalary * config.targetPct;
  const bonusBeforeTaxUsd =
    targetBonus * config.individualWeight * individualPerformanceScore +
    targetBonus * config.companyWeight * companyPerformanceScore;

  const bonusBeforeTaxPkr = bonusBeforeTaxUsd * USD_TO_PKR;
  const annualSalaryPkr = annualSalary * USD_TO_PKR;
  const totalAnnualIncomeUsd = annualSalary + bonusBeforeTaxUsd;
  const totalAnnualIncomePkr = totalAnnualIncomeUsd * USD_TO_PKR;

  if (employeeCountry !== "PK") {
    setResult(
      `<p><strong>Bonus (before tax): ${asMoney(bonusBeforeTaxUsd)}</strong></p>
       <p>Bracket: ${config.bracket} | Target Bonus: ${Math.round(config.targetPct * 100)}% | Company Score: 60%</p>
       <p class="tax-disclaimer">Tax disclaimer: Tax will be deducted as per local laws for your country. No PK tax/conversion is applied.</p>`,
      "ok"
    );
    return;
  }

  const annualTaxOnSalaryPkr = calculatePkAnnualTax(annualSalaryPkr);
  const annualTaxOnTotalIncomePkr = calculatePkAnnualTax(totalAnnualIncomePkr);
  const slabBeforeBonus = getPkTaxSlabInfo(annualSalaryPkr);
  const slabAfterBonus = getPkTaxSlabInfo(totalAnnualIncomePkr);
  const slabChangedDueToBonus = slabBeforeBonus.label !== slabAfterBonus.label;
  const annualTaxPkr = Math.max(0, annualTaxOnTotalIncomePkr - annualTaxOnSalaryPkr);
  const annualTaxUsd = annualTaxPkr / USD_TO_PKR;
  const effectiveTaxRate = bonusBeforeTaxPkr > 0 ? annualTaxPkr / bonusBeforeTaxPkr : 0;
  const bonusAfterTaxPkr = Math.max(0, bonusBeforeTaxPkr - annualTaxPkr);
  const bonusAfterTaxUsd = bonusAfterTaxPkr / USD_TO_PKR;
  const effectiveTaxPercent = (effectiveTaxRate * 100).toFixed(2);
  const taxShare = Math.min(100, Math.max(0, effectiveTaxRate * 100));
  const netShare = Math.max(0, 100 - taxShare);

  setResult(
    `<div class="result-rich">
       <section class="result-summary" aria-label="Bonus summary">
         <article class="summary-item primary">
           <h3>Actual Bonus Entitlement (Before Tax)</h3>
           <p class="amount">${asMoney(bonusBeforeTaxUsd)}</p>
         </article>
         <article class="summary-item secondary">
           <h3>Net Effect of Bonus in Annual Income (After Tax)</h3>
           <p class="amount">${asMoney(bonusAfterTaxUsd)}</p>
         </article>
         <article class="summary-item impact">
           <h3>Net Tax Impact</h3>
           <p class="amount">${asMoney(annualTaxUsd)} <span>(${effectiveTaxPercent}%)</span></p>
         </article>
       </section>

       <section class="bonus-bar-wrap" aria-label="Bonus breakdown bar">
         <div class="bonus-bar">
           <div class="bonus-bar-net" style="width: ${netShare.toFixed(2)}%"></div>
           <div class="bonus-bar-tax" style="width: ${taxShare.toFixed(2)}%"></div>
         </div>
         <p class="bonus-bar-caption">Net received: ${netShare.toFixed(2)}% | Tax deducted: ${taxShare.toFixed(2)}%</p>
       </section>

       <section class="tax-impact" aria-label="Tax impact details">
         <h3>Tax Impact</h3>
         <p><span>Annual tax before bonus (PKR)</span><strong>${asPkr(annualTaxOnSalaryPkr)}</strong></p>
         <p><span>Annual tax after bonus (PKR)</span><strong>${asPkr(annualTaxOnTotalIncomePkr)}</strong></p>
         <p><span>Tax on bonus</span><strong>${asMoney(annualTaxUsd)} | ${asPkr(annualTaxPkr)}</strong></p>
         <p><span>Effective tax rate on bonus</span><strong>${effectiveTaxPercent}%</strong></p>
       </section>

       <p class="${slabChangedDueToBonus ? "tax-disclaimer" : "meta-line"}">Tax slab change due to bonus: ${slabChangedDueToBonus ? `Yes (${slabBeforeBonus.label} -> ${slabAfterBonus.label})` : `No (${slabAfterBonus.label})`}</p>
       <p class="tax-disclaimer"><strong>Disclaimer:</strong> This is an estimated tax calculation intended to show the net effect of the bonus on annual income. Actual tax liability may vary based on additional factors, including OPD balance payouts and whether tax on bonuses is deducted at payout or distributed across the remaining months of the fiscal year.</p>
       <p class="meta-line">Bracket: ${config.bracket} | Target Bonus: ${Math.round(config.targetPct * 100)}% | Company Score: 60% | Country: Pakistan</p>
     </div>`,
    "ok"
  );
});
