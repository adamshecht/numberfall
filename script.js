// DOM elements
const playArea = document.getElementById('play-area');
const nextNumberDisplay = document.getElementById('next-number');
const scoreDisplay = document.getElementById('score');
const endScreen = document.getElementById('end-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart');
const leaderboardList = document.getElementById('leaderboard');
const difficultyScreen = document.getElementById('difficulty-screen');
const difficultyButtons = document.getElementById('difficulty-buttons');

// Game state
let currentNumber = 1;      
let score = 0;
let spawnInterval = 1500;  
let fallSpeed = 1.5;       
let numbers = [];
let spawnTimerId = null;
let fallTimerId = null;
let gameRunning = false;
let chosenDifficulty = 'easy'; 

// Leaderboard
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
displayLeaderboard();

difficultyButtons.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    chosenDifficulty = e.target.dataset.difficulty;
    setDifficulty(chosenDifficulty);
    difficultyScreen.style.display = 'none';
    startGame();
  }
});

function setDifficulty(diff) {
  if (diff === 'easy') {
    spawnInterval = 1500;
    fallSpeed = 1.5;
  } else if (diff === 'medium') {
    spawnInterval = 1000;
    fallSpeed = 2.0;
  } else if (diff === 'hard') {
    spawnInterval = 700;
    fallSpeed = 2.5;
  }
}

function startGame() {
  currentNumber = 1;
  score = 0;
  numbers = [];
  gameRunning = true;
  endScreen.style.display = 'none';
  
  updateDisplays();

  spawnTimerId = setInterval(spawnNumber, spawnInterval);
  fallTimerId = setInterval(updateFall, 16);
}

function spawnNumber() {
  if (!gameRunning) return;

  // 40% chance the required number appears as a random spawn (not required instance)
  let num;
  if (Math.random() < 0.4) {
    num = currentNumber;
  } else {
    num = Math.floor(Math.random() * (currentNumber + 10)) + 1;
  }

  // Find a non-overlapping horizontal position for the new circle
  const xPos = findNonOverlappingX();

  const circle = document.createElement('div');
  circle.className = 'number-circle';
  circle.textContent = num;

  circle.style.left = xPos + 'px';
  circle.style.top = '-50px';

  playArea.appendChild(circle);
  
  // Random spawn, not the guaranteed required instance
  numbers.push({ element: circle, number: num, y: -50, isRequiredInstance: false });

  circle.addEventListener('pointerdown', () => {
    onNumberClick(num, circle);
  });
}

function findNonOverlappingX() {
  const areaWidth = playArea.clientWidth;
  const circleWidth = 50;
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const xPos = Math.floor(Math.random() * (areaWidth - circleWidth));
    if (noOverlap(xPos, circleWidth)) {
      return xPos;
    }
  }

  // If we fail after 20 attempts, just return a random position anyway
  return Math.floor(Math.random() * (areaWidth - circleWidth));
}

function noOverlap(xPos, circleWidth) {
  // Check if this xPos would overlap any existing circle at spawn time
  // Overlap if ranges intersect: [xPos, xPos+50] and [otherX, otherX+50]
  for (let i = 0; i < numbers.length; i++) {
    const otherX = parseInt(numbers[i].element.style.left);
    if ( !(xPos + circleWidth < otherX || xPos > otherX + circleWidth) ) {
      // Overlapping
      return false;
    }
  }
  return true;
}

function updateFall() {
  if (!gameRunning) return;

  for (let i = numbers.length - 1; i >= 0; i--) {
    const obj = numbers[i];
    obj.y += fallSpeed;
    obj.element.style.top = obj.y + 'px';

    if (obj.y > playArea.clientHeight) {
      // If the number that fell off is the required instance, game over
      if (obj.number === currentNumber && obj.isRequiredInstance) {
        gameOver();
        return;
      } else {
        // Otherwise remove it
        removeNumber(i);
      }
    }
  }
}

function onNumberClick(num, element) {
  if (!gameRunning) return;

  if (num === currentNumber) {
    // Correct click
    score++;
    currentNumber++;
    removeNumberByElement(element);
    updateDisplays();
    adjustDifficulty();

    // Spawn the new required instance for the next number
    spawnSpecificNumber(currentNumber);

  } else {
    // Wrong number clicked => Game Over
    gameOver();
  }
}

function removeNumber(index) {
  const obj = numbers[index];
  if (obj.element.parentNode) {
    playArea.removeChild(obj.element);
  }
  numbers.splice(index, 1);
}

function removeNumberByElement(element) {
  for (let i = 0; i < numbers.length; i++) {
    if (numbers[i].element === element) {
      removeNumber(i);
      return;
    }
  }
}

function spawnSpecificNumber(num) {
  const xPos = findNonOverlappingX();

  const circle = document.createElement('div');
  circle.className = 'number-circle';
  circle.textContent = num;

  circle.style.left = xPos + 'px';
  circle.style.top = '-50px';

  playArea.appendChild(circle);
  
  // This is the guaranteed required instance
  numbers.push({ element: circle, number: num, y: -50, isRequiredInstance: true });

  circle.addEventListener('pointerdown', () => {
    onNumberClick(num, circle);
  });
}

function updateDisplays() {
  nextNumberDisplay.textContent = currentNumber;
  scoreDisplay.textContent = score;
}

function adjustDifficulty() {
  // Every 5 correct numbers, increase difficulty
  if (score % 5 === 0) {
    fallSpeed += 0.5;

    clearInterval(spawnTimerId);
    spawnInterval = Math.max(500, spawnInterval - 200);
    spawnTimerId = setInterval(spawnNumber, spawnInterval);
  }
}

function gameOver() {
  gameRunning = false;
  clearInterval(spawnTimerId);
  clearInterval(fallTimerId);

  // Remove all circles
  numbers.forEach(obj => {
    if (obj.element.parentNode) {
      playArea.removeChild(obj.element);
    }
  });
  numbers = [];

  finalScoreDisplay.textContent = 'Your score: ' + score;
  endScreen.style.display = 'flex';

  if (score > 0) {
    updateLeaderboard(score);
  }
}

restartButton.addEventListener('click', () => {
  difficultyScreen.style.display = 'flex';
  endScreen.style.display = 'none';
});

// Leaderboard functions
function displayLeaderboard() {
  leaderboardList.innerHTML = '';
  leaderboard.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    leaderboardList.appendChild(li);
  });
}

function updateLeaderboard(newScore) {
  leaderboard.push(newScore);
  leaderboard.sort((a, b) => b - a);
  leaderboard = leaderboard.slice(0, 3);
  localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
  displayLeaderboard();
}
