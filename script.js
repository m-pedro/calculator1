const resultDisplay = document.querySelector('#result');
const expressionDisplay = document.querySelector('#expression');
const keypad = document.querySelector('.keypad');

let displayValue = '0';
let firstOperand = null;
let pendingOperator = null;
let waitingForOperand = false;
let completedCalculation = false;

const operatorSymbols = {
  '/': '÷',
  '*': '×',
  '-': '−',
  '+': '+',
};

function formatValue(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Error';
  if (Math.abs(number) >= 1e12 || (number !== 0 && Math.abs(number) < 1e-9)) {
    return number.toExponential(5);
  }

  const [integer, fraction] = String(value).split('.');
  const groupedInteger = Number(integer).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return fraction === undefined ? groupedInteger : `${groupedInteger}.${fraction}`;
}

function render() {
  resultDisplay.textContent = formatValue(displayValue);
  resultDisplay.classList.toggle('is-long', resultDisplay.textContent.length > 10);
  expressionDisplay.textContent = pendingOperator && firstOperand !== null
    ? `${formatValue(String(firstOperand))} ${operatorSymbols[pendingOperator]}`
    : '';
}

function inputDigit(digit) {
  if (waitingForOperand || completedCalculation) {
    displayValue = digit;
    waitingForOperand = false;
    completedCalculation = false;
  } else if (displayValue.replace(/[-.]/g, '').length < 12) {
    displayValue = displayValue === '0' ? digit : displayValue + digit;
  }
  render();
}

function inputDecimal() {
  if (waitingForOperand || completedCalculation) {
    displayValue = '0.';
    waitingForOperand = false;
    completedCalculation = false;
  } else if (!displayValue.includes('.')) {
    displayValue += '.';
  }
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case '+': return left + right;
    case '-': return left - right;
    case '*': return left * right;
    case '/': return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function cleanNumber(value) {
  return Number.isFinite(value) ? String(Number(value.toPrecision(12))) : 'Error';
}

function chooseOperator(nextOperator) {
  const inputValue = Number(displayValue);

  if (pendingOperator && !waitingForOperand) {
    const result = calculate(firstOperand, inputValue, pendingOperator);
    displayValue = cleanNumber(result);
    firstOperand = result;
  } else {
    firstOperand = inputValue;
  }

  pendingOperator = nextOperator;
  waitingForOperand = true;
  completedCalculation = false;
  render();
}

function evaluate() {
  if (!pendingOperator || firstOperand === null || waitingForOperand) return;

  const secondOperand = Number(displayValue);
  const expression = `${formatValue(String(firstOperand))} ${operatorSymbols[pendingOperator]} ${formatValue(displayValue)} =`;
  displayValue = cleanNumber(calculate(firstOperand, secondOperand, pendingOperator));
  firstOperand = null;
  pendingOperator = null;
  waitingForOperand = true;
  completedCalculation = true;
  render();
  expressionDisplay.textContent = expression;
}

function clear() {
  displayValue = '0';
  firstOperand = null;
  pendingOperator = null;
  waitingForOperand = false;
  completedCalculation = false;
  render();
}

function toggleSign() {
  if (displayValue !== '0' && displayValue !== 'Error') {
    displayValue = displayValue.startsWith('-') ? displayValue.slice(1) : `-${displayValue}`;
  }
  render();
}

function applyPercent() {
  if (displayValue !== 'Error') displayValue = cleanNumber(Number(displayValue) / 100);
  render();
}

function backspace() {
  if (waitingForOperand || completedCalculation) return;
  displayValue = displayValue.length > 1 ? displayValue.slice(0, -1) : '0';
  if (displayValue === '-') displayValue = '0';
  render();
}

function handleAction(action) {
  if (action === 'clear') clear();
  if (action === 'decimal') inputDecimal();
  if (action === 'equals') evaluate();
  if (action === 'sign') toggleSign();
  if (action === 'percent') applyPercent();
}

keypad.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.digit !== undefined) inputDigit(button.dataset.digit);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) handleAction(button.dataset.action);
});

document.addEventListener('keydown', (event) => {
  if (/^[0-9]$/.test(event.key)) inputDigit(event.key);
  else if (event.key === '.') inputDecimal();
  else if (['+', '-', '*', '/'].includes(event.key)) chooseOperator(event.key);
  else if (event.key === 'Enter' || event.key === '=') evaluate();
  else if (event.key === 'Backspace') backspace();
  else if (event.key === 'Escape') clear();
  else if (event.key === '%') applyPercent();
  else return;

  event.preventDefault();
});

render();