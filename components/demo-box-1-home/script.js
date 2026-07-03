(() => {
  const question = "What should I know before Monica’s renewal call?";

  const thoughts = [
    { text: "Thinking", hold: 1550 },
    { text: "Searching Monica across email, docs, calendar", hold: 1250 },
    { text: "Checking the DPA follow-up", hold: 1850 },
    { text: "Comparing proposal and contract", hold: 2150 },
    { text: "Reading the renewal invite", hold: 1200 },
    { text: "Resolving Daniel Kraus", hold: 1750 },
    { text: "Preparing the call brief", hold: 2200 }
  ];

  const timing = {
    typingTotal: 1250,
    submitPause: 420,
    finalPause: 620,
    textSwap: 320
  };

  const root = document.querySelector(".demo-home");
  const promptSection = document.querySelector(".prompt-section");
  const typedQuestion = document.querySelector(".typed-question");
  const thinkingText = document.querySelector(".thinking-copy");
  const briefSection = document.querySelector(".brief-section");

  if (!root || !promptSection || !typedQuestion || !thinkingText || !briefSection) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function showFinalBrief() {
    root.classList.remove("phase-typing", "phase-thinking");
    root.classList.add("phase-final");
    briefSection.removeAttribute("aria-hidden");
  }

  function setThought(text) {
    thinkingText.classList.add("is-changing");

    window.setTimeout(() => {
      thinkingText.textContent = text;
      thinkingText.classList.remove("is-changing");
    }, timing.textSwap);
  }

  function runThought(index = 0) {
    const thought = thoughts[index];
    setThought(thought.text);

    window.setTimeout(() => {
      if (index < thoughts.length - 1) {
        runThought(index + 1);
        return;
      }

      window.setTimeout(showFinalBrief, timing.finalPause);
    }, thought.hold);
  }

  function startThinking() {
    root.classList.remove("phase-typing");
    root.classList.add("phase-thinking");
    runThought(0);
  }

  function typeQuestion(position = 0) {
    typedQuestion.textContent = question.slice(0, position);

    if (position >= question.length) {
      promptSection.classList.add("is-submitted");
      window.setTimeout(startThinking, timing.submitPause);
      return;
    }

    const delay = timing.typingTotal / question.length;
    window.setTimeout(() => typeQuestion(position + 1), delay);
  }

  if (prefersReducedMotion) {
    typedQuestion.textContent = question;
    promptSection.classList.add("is-submitted");
    showFinalBrief();
    return;
  }

  typedQuestion.textContent = "";
  typeQuestion();
})();