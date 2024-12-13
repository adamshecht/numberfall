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
  // Easy now starts at previously hard speed, then scale up
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

  // 40% chance the required number appears as a random spawn
  // but this one will not be the "required instance"
  let num;
  if (Math.random() < 0.4) {
    num = currentNumber;
  } else {
    // Spawn a random number (distractor)
    num = Math.floor(Math.random() * (currentNumber + 10)) + 1;
  }

  const circle = document.createElement('div');
  circle.className = 'number-circle';
  circle.textContent = num;

  const areaWidth = playArea.clientWidth;
  const xPos = Math.floor(Math.random() * (areaWidth - 50));
  circle.style.left = xPos + 'px';
  circle.style.top = '-50px';

  playArea.appendChild(circle);
  
  // This is a random spawn, not the guaranteed required instance
  numbers.push({ element: circle, number: num, y: -50, isRequiredInstance: false });

  circle.addEventListener('pointerdown', () => {
    onNumberClick(num, circle);
  });
}

function updateFall() {
  if (!gameRunning) return;

  for (let i = numbers.length - 1; i >= 0; i--) {
    const obj = numbers[i];
    obj.y += fallSpeed;
    obj.element.style.top = obj.y + 'px';

    if (obj.y > playArea.clientHeight) {
      // Only end game if this was the required instance and matches the current required number
      if (obj.number === currentNumber && obj.isRequiredInstance) {
        gameOver();
        return;
      } else {
        // Otherwise just remove it (distractor or old instance)
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

    // Now spawn a new required instance for the next number
    spawnSpecificNumber(currentNumber);

  } else {
    // Wrong number feedback
    element.style.background = 'red';
    setTimeout(() => {
      if (element.parentNode) {
        element.style.background = '#3498db';
      }
    }, 200);
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
  const circle = document.createElement('div');
  circle.className = 'number-circle';
  circle.textContent = num;

  const areaWidth = playArea.clientWidth;
  const xPos = Math.floor(Math.random() * (areaWidth - 50));
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
