// Core game state
const gameState = {
  avatarColor: null,
  selectedTraits: [],
  answers: {
    q1: null,
    q2: null,
    q3: null,
  },
  hasContradiction: false,
  playerResponse: null,
};

// Screen management
const screens = {
  intro: document.getElementById("screen-intro"),
  avatar: document.getElementById("screen-avatar"),
  questions: document.getElementById("screen-questions"),
  outcome: document.getElementById("screen-outcome"),
};

function showScreen(key) {
  Object.values(screens).forEach((section) => {
    if (!section) return;
    section.classList.remove("active");
  });
  const target = screens[key];
  if (target) target.classList.add("active");
}

// DOM references
const btnStart = document.getElementById("btn-start");
const btnToReflection = document.getElementById("btn-to-reflection");
const btnSeeAvatar = document.getElementById("btn-see-avatar");
const btnPlayAgain = document.getElementById("btn-play-again");

const avatarCircle = document.getElementById("avatar-circle");
const avatarCircleOutcome = document.getElementById("avatar-circle-outcome");
const colorButtons = document.querySelectorAll(".color-swatch");
const traitButtons = document.querySelectorAll(".trait-chip");
const selectedTraitsDisplay = document.getElementById("selected-traits-display");
const selectedTraitsOutcome = document.getElementById("selected-traits-outcome");

const avatarValidationMessage = document.getElementById(
  "avatar-validation-message",
);
const questionsValidationMessage = document.getElementById(
  "questions-validation-message",
);

const speechText = document.getElementById("speech-text");
const responseButtons = document.querySelectorAll(".response-button");
const finalMessage = document.getElementById("final-message");

// Avatar visuals
function updateAvatarCircleColor() {
  const color = gameState.avatarColor || "#0f172a";
  const bg = `
    radial-gradient(circle at 30% 10%, rgba(248, 250, 252, 0.9), transparent 60%),
    ${color}
  `;
  if (avatarCircle) avatarCircle.style.background = bg;
  if (avatarCircleOutcome) avatarCircleOutcome.style.background = bg;
}

function renderSelectedTraitsDisplays() {
  const renderInto = (container) => {
    if (!container) return;
    container.innerHTML = "";

    if (!gameState.selectedTraits.length) {
      container.classList.add("empty");
      const span = document.createElement("span");
      span.className = "placeholder";
      span.textContent = "No traits selected yet.";
      container.appendChild(span);
      return;
    }

    container.classList.remove("empty");
    gameState.selectedTraits.forEach((trait) => {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = trait;
      container.appendChild(badge);
    });
  };

  renderInto(selectedTraitsDisplay);
  renderInto(selectedTraitsOutcome);
}

// Color selection
colorButtons.forEach((btn) => {
  btn.style.background = btn.dataset.color || "#f97316";
  btn.addEventListener("click", () => {
    gameState.avatarColor = btn.dataset.color;
    colorButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    updateAvatarCircleColor();
  });
});

// Trait selection (max 3)
traitButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const trait = btn.dataset.trait;
    const idx = gameState.selectedTraits.indexOf(trait);

    if (idx > -1) {
      gameState.selectedTraits.splice(idx, 1);
      btn.classList.remove("selected");
    } else {
      if (gameState.selectedTraits.length >= 3) {
        avatarValidationMessage.textContent = "You can choose up to 3 traits.";
        avatarValidationMessage.style.color = "#fb7185";
        setTimeout(() => {
          avatarValidationMessage.textContent =
            "Pick at least one trait to continue.";
          avatarValidationMessage.style.color = "";
        }, 1600);
        return;
      }
      gameState.selectedTraits.push(trait);
      btn.classList.add("selected");
    }

    renderSelectedTraitsDisplays();
    btnToReflection.disabled = gameState.selectedTraits.length === 0;
  });
});

// Reflection questions
const questionBlocks = document.querySelectorAll(".question-block");

questionBlocks.forEach((block) => {
  const qId = block.dataset.questionId;
  const buttons = block.querySelectorAll(".scale-buttons button");

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      const value = Number(b.dataset.value);
      if (qId in gameState.answers) gameState.answers[qId] = value;
      buttons.forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
  });
});

function allQuestionsAnswered() {
  return (
    typeof gameState.answers.q1 === "number" &&
    typeof gameState.answers.q2 === "number" &&
    typeof gameState.answers.q3 === "number"
  );
}

// Contradiction detection
function computeContradiction() {
  const confidentFacingTraits = ["Confident", "Outgoing", "Funny"];
  const pickedConfidentFacing = gameState.selectedTraits.some((trait) =>
    confidentFacingTraits.includes(trait),
  );

  const { q2, q3 } = gameState.answers;

  const contradiction =
    pickedConfidentFacing &&
    ((typeof q2 === "number" && q2 >= 4) ||
      (typeof q3 === "number" && q3 >= 4));

  gameState.hasContradiction = contradiction;
}

// Speech + narrative text
function buildSpeechText() {
  if (!gameState.selectedTraits.length) {
    return "I’m a quiet avatar today. Even empty space says something.";
  }

  const traitList = gameState.selectedTraits.join(", ");

  if (gameState.hasContradiction) {
    return (
      `You dressed me in ${traitList}. From the outside I look steady, ` +
      `but under the surface I can feel the parts of you that worry and pull back. ` +
      `Both of those stories seem to be true at the same time.`
    );
  }

  return (
    `You chose ${traitList}. The way you step into the world and the way ` +
    `it feels inside are holding hands right now. It’s okay if that shifts later.`
  );
}

function buildFinalMessage() {
  const response = gameState.playerResponse;
  if (!response) return "";

  if (response === "seen") {
    if (gameState.hasContradiction) {
      return (
        "You’re protecting a version of you that feels safer to show. " +
        "Part of this experiment is noticing how much energy that mask asks for."
      );
    }
    return (
      "You’re aligned with this version of you. " +
      "Notice what makes that possible, and what helps you stay here without forcing it."
    );
  }

  if (response === "feel") {
    if (gameState.hasContradiction) {
      return (
        "You trusted your inner signal over the performance. " +
        "That honesty is a kind of boundary: a quiet “this is where I actually am.”"
      );
    }
    return (
      "You named that this is how it feels inside too. " +
      "It’s okay if that changes; alignment now doesn’t lock you into one version forever."
    );
  }

  if (response === "unsure") {
    return (
      "Not knowing is a real answer. " +
      "This space is here for hovering in between the mask and the mirror without rushing to decide."
    );
  }

  return "";
}

// Avatar outcome effects
function applyAvatarResponseEffect() {
  if (!avatarCircleOutcome) return;

  avatarCircleOutcome.classList.remove("glitch", "soften");
  if (!gameState.playerResponse) return;

  if (gameState.hasContradiction && gameState.playerResponse === "seen") {
    avatarCircleOutcome.classList.add("glitch");
  } else {
    avatarCircleOutcome.classList.add("soften");
  }
}

// Navigation + actions
if (btnStart) {
  btnStart.addEventListener("click", () => {
    showScreen("avatar");
  });
}

if (btnToReflection) {
  btnToReflection.addEventListener("click", () => {
    if (!gameState.selectedTraits.length) {
      avatarValidationMessage.style.color = "#fb7185";
      return;
    }
    avatarValidationMessage.style.color = "";
    showScreen("questions");
  });
}

if (btnSeeAvatar) {
  btnSeeAvatar.addEventListener("click", () => {
    if (!allQuestionsAnswered()) {
      questionsValidationMessage.style.color = "#fb7185";
      return;
    }
    questionsValidationMessage.style.color = "";
    computeContradiction();

    renderSelectedTraitsDisplays();
    updateAvatarCircleColor();
    speechText.textContent = buildSpeechText();
    finalMessage.textContent = "";
    responseButtons.forEach((btn) => btn.classList.remove("selected"));
    gameState.playerResponse = null;
    avatarCircleOutcome.classList.remove("glitch", "soften");

    showScreen("outcome");
  });
}

responseButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const response = btn.dataset.response;
    gameState.playerResponse = response;
    responseButtons.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    applyAvatarResponseEffect();
    finalMessage.textContent = buildFinalMessage();
  });
});

if (btnPlayAgain) {
  btnPlayAgain.addEventListener("click", () => {
    // reset core state
    gameState.avatarColor = null;
    gameState.selectedTraits = [];
    gameState.answers = { q1: null, q2: null, q3: null };
    gameState.hasContradiction = false;
    gameState.playerResponse = null;

    // reset UI
    colorButtons.forEach((b) => b.classList.remove("selected"));
    traitButtons.forEach((b) => b.classList.remove("selected"));
    questionBlocks.forEach((block) => {
      block
        .querySelectorAll(".scale-buttons button")
        .forEach((b) => b.classList.remove("selected"));
    });
    responseButtons.forEach((b) => b.classList.remove("selected"));

    btnToReflection.disabled = true;
    avatarValidationMessage.style.color = "";
    questionsValidationMessage.style.color = "";
    finalMessage.textContent = "";
    speechText.textContent = "";

    avatarCircleOutcome.classList.remove("glitch", "soften");
    updateAvatarCircleColor();
    renderSelectedTraitsDisplays();

    showScreen("intro");
  });
}

// Initial paint
updateAvatarCircleColor();
renderSelectedTraitsDisplays();


