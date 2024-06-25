let quizData = [];
let currentQuiz = 0;
let score = 0;
let attempts = [];
let timerInterval;

const quiz = document.getElementById("quiz");
const questionEl = document.getElementById("question");
const questionImageEl = document.getElementById("question-image");
const answerListEl = document.getElementById("answer-list");
const submitBtn = document.getElementById("submit");
const questionCountEl = document.getElementById("question-count");
const timerEl = document.getElementById("timer");

const module1Btn = document.getElementById("module1-btn");
const module2Btn = document.getElementById("module2-btn");
const module3Btn = document.getElementById("module3-btn");
const randomQuizBtn = document.getElementById("random-quiz-btn");

module1Btn.addEventListener("click", () => selectModule("module1"));
module2Btn.addEventListener("click", () => selectModule("module2"));
module3Btn.addEventListener("click", () => selectModule("module3"));
randomQuizBtn.addEventListener("click", startRandomQuiz);

submitBtn.addEventListener("click", submitAnswer);

function selectModule(module) {
  fetchQuestions(module);
}

function fetchQuestions(module) {
  fetch(`./questions/${module}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      quizData = data;
      currentQuiz = 0;
      score = 0;
      attempts = [];
      startTimer();
      loadQuiz();
    })
    .catch((error) => {
      alert("Failed to load questions");
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
}

function startRandomQuiz() {
  Promise.all([
    fetch("./questions/module1.json").then((response) => response.json()),
    fetch("./questions/module2.json").then((response) => response.json()),
    fetch("./questions/module3.json").then((response) => response.json()),
  ])
    .then((data) => {
      const [module1Questions, module2Questions, module3Questions] = data;
      const randomQuestions = [];

      randomQuestions.push(...getRandomQuestions(module1Questions, 10));
      randomQuestions.push(...getRandomQuestions(module2Questions, 10));
      randomQuestions.push(...getRandomQuestions(module3Questions, 10));

      shuffleArray(randomQuestions);

      quizData = randomQuestions.slice(0, 30);
      currentQuiz = 0;
      score = 0;
      attempts = [];
      startTimer();
      loadQuiz();
    })
    .catch((error) => {
      alert("Failed to load questions");
      console.error(
        "There has been a problem with your fetch operation:",
        error
      );
    });
}

function getRandomQuestions(array, num) {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function loadQuiz() {
  deselectAnswers();
  clearAnswerList();
  updateQuestionCount();
  enableSubmitButton();

  const currentQuizData = quizData[currentQuiz];
  console.log(`Loading question ${currentQuiz + 1}:`, currentQuizData);

  questionEl.innerText = currentQuizData.question;

  if (currentQuizData.image) {
    questionImageEl.src = currentQuizData.image;
    questionImageEl.style.display = "block";
  } else {
    questionImageEl.style.display = "none";
  }

  if (currentQuizData.code) {
    const codeContainer = document.createElement("div");
    codeContainer.id = "code-container";
    codeContainer.innerText = currentQuizData.code;
    questionEl.appendChild(codeContainer);
  }

  Object.keys(currentQuizData.answers).forEach((key) => {
    const li = document.createElement("li");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = key;
    input.name = "answer";
    input.classList.add("answer");

    const label = document.createElement("label");
    label.htmlFor = key;
    label.id = `${key}_text`;
    label.innerText = currentQuizData.answers[key];

    li.appendChild(input);
    li.appendChild(label);
    answerListEl.appendChild(li);
  });
}

function updateQuestionCount() {
  questionCountEl.innerText = `Question ${currentQuiz + 1}/${quizData.length}`;
}

function startTimer() {
  let time = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time++;
    timerEl.innerText = `Time: ${time}`;
  }, 1000);
}

function disableSubmitButton() {
  submitBtn.disabled = true;
}

function enableSubmitButton() {
  submitBtn.disabled = false;
}

function deselectAnswers() {
  const answerEls = document.querySelectorAll(".answer");
  answerEls.forEach((answerEl) => {
    answerEl.checked = false;
    answerEl.nextElementSibling.classList.remove("correct", "incorrect");
  });
}

function clearAnswerList() {
  answerListEl.innerHTML = "";
}

function getSelected() {
  const selectedAnswers = [];
  const answerEls = document.querySelectorAll(".answer");
  answerEls.forEach((answerEl) => {
    if (answerEl.checked) {
      selectedAnswers.push(answerEl.id);
    }
  });
  return selectedAnswers;
}

function submitAnswer() {
  disableSubmitButton();
  const selectedAnswers = getSelected();
  console.log("Selected Answers:", selectedAnswers);

  if (selectedAnswers.length > 0) {
    const currentQuizData = quizData[currentQuiz];
    console.log("Current Quiz Data:", currentQuizData);

    const correctAnswers = currentQuizData.correct;
    console.log("Correct Answers:", correctAnswers);

    if (!Array.isArray(correctAnswers)) {
      console.error("Correct answers are not an array:", correctAnswers);
      return;
    }

    let correct = true;

    const answerEls = document.querySelectorAll(".answer");
    answerEls.forEach((answerEl) => {
      if (correctAnswers.includes(answerEl.id)) {
        answerEl.nextElementSibling.classList.add("correct");
        if (!selectedAnswers.includes(answerEl.id)) {
          correct = false;
        }
      } else if (selectedAnswers.includes(answerEl.id)) {
        answerEl.nextElementSibling.classList.add("incorrect");
        correct = false;
      }
    });

    attempts.push({
      question: currentQuizData.question,
      selected: selectedAnswers,
      correct: correctAnswers,
      isCorrect: correct,
    });

    if (correct) {
      score++;
    }

    currentQuiz++;

    setTimeout(() => {
      if (currentQuiz < quizData.length) {
        loadQuiz();
      } else {
        showResults();
      }
    }, 1000);
  } else {
    enableSubmitButton();
  }
}

function showResults() {
  clearInterval(timerInterval);
  const resultsContainer = document.getElementById("results");
  const resultsList = document.getElementById("results-list");
  resultsList.innerHTML = attempts
    .map(
      (attempt, index) => `
    <li>
      <strong>Q${index + 1}: ${attempt.question}</strong><br>
      <span class="${attempt.isCorrect ? "correct" : "incorrect"}">
        Your answer: ${attempt.selected.join(", ")}<br>
        Correct answer: ${attempt.correct.join(", ")}
      </span>
    </li>
  `
    )
    .join("");

  const scoreDisplay = document.createElement("h3");
  scoreDisplay.innerText = `Your score: ${score}/${quizData.length}`;
  resultsContainer.insertBefore(scoreDisplay, resultsContainer.firstChild);

  quiz.style.display = "none";
  resultsContainer.style.display = "block";
}
