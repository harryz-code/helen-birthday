// Everything Helen sees lives here. Edit the wording freely.
// Hint images go in assets/. If an image is missing, the emoji + label are shown instead.

window.CASINO_CONFIG = {
  playerName: "Helen",
  age: 26,
  birthday: "10.16",
  spins: 3,

  // Entered by the host (you) to confirm a result.
  hostPin: "1016",

  finale: {
    title: "Bonus Round",
    subtitle: "The house always loses on your birthday.",
    message:
      "Happy 26th birthday, Helen! Every gift on this table was always yours. " +
      "Thank you for every game, every karaoke night, every Pokémon raid and every cup of tea. " +
      "I love you. — Harry",
  },

  games: [
    {
      id: "pogo",
      hint: {
        label: "Pokémon GO",
        emoji: "🔴",
        images: ["assets/pokemon-go-logo.png"],
      },
      title: "Trainer Battle",
      description: "A Pokémon GO trainer battle, Harry vs Helen. Pick your league and your best three.",
      winRule: "Win 2 out of 3 battles.",
      gift: {
        emoji: "🎮",
        image: "assets/pokemon-go-plus.png",
        title: "Pokémon GO Plus +",
        detail: "Catch Pokémon and spin stops without even opening the app.",
      },
    },
    {
      id: "shinies",
      hint: {
        label: "Shiny Eevee & Shiny Minccino",
        emoji: "✨",
        images: ["assets/shiny-eevee.png", "assets/shiny-minccino.png"],
      },
      title: "21 Questions",
      description: "Harry is thinking of a Pokémon. Ask yes/no questions to figure out which one.",
      winRule: "Name the Pokémon within 21 questions.",
      gift: {
        emoji: "🎁",
        title: "2 Pokémon of your choice",
        detail: "Any two Pokémon you want — traded to you, no questions asked.",
      },
    },
    {
      id: "bob",
      hint: {
        label: "Can we build it?",
        emoji: "👷",
        images: ["assets/bob-the-builder.png"],
      },
      title: "Jenga Showdown",
      description:
        "Jenga, best of 3. No Jenga? Speed build instead: tallest tower of cups or cards in 3 minutes, and it must stand for 10 seconds.",
      winRule: "Win 2 out of 3 rounds (or build the taller tower).",
      gift: {
        emoji: "🧱",
        image: "assets/pikachu-lego.png",
        title: "400-piece Pikachu Lego Set",
        detail: "Yes we can build it. Together.",
      },
    },
    {
      id: "nyc",
      hint: {
        label: "Welcome to New York",
        emoji: "🗽",
        images: ["assets/welcome-to-new-york.png"],
      },
      title: "1989 Name That Tune",
      description:
        "Harry plays 3-second intros of 8 songs from 1989. Then a karaoke victory lap: sing the chorus of your favorite.",
      winRule: "Name at least 5 of the 8 songs.",
      gift: {
        emoji: "💿",
        image: "assets/1989-vinyl.png",
        title: "Taylor Swift — 1989 on Vinyl",
        detail: "For the record player from our 4th anniversary.",
      },
    },
    {
      id: "ai",
      hint: {
        label: "Pick your AI",
        emoji: "🤖",
        images: ["assets/openai.svg", "assets/gemini.svg", "assets/claude.svg"],
      },
      title: "Vibe Coding Race",
      description:
        "Each of us picks an AI model (Helen picks first: ChatGPT, Gemini, Claude...) and ships a launch video for IA BUDDY in 60 minutes.",
      winRule: "A third AI model (or a friend) judges both videos blind. Best video wins.",
      gift: {
        emoji: "🎬",
        title: "Harry's Full AI Video Tutorial",
        detail: "Every tool, prompt and trick I use to make videos with AI.",
      },
    },
    {
      id: "timelaps",
      hint: {
        label: "Timelaps",
        emoji: "⏳",
        images: ["assets/timelaps-logo.png"],
      },
      title: "Spill the Tea",
      description:
        "Blind tea tasting: 4 cups (e.g. green, jasmine, oolong, milk tea). Earn the tea by tasting the tea.",
      winRule: "Name at least 3 of the 4 teas correctly.",
      gift: {
        emoji: "🍵",
        title: "The Timelaps Tea",
        detail: "A crazy story that recently happened at Timelaps. Grab a seat.",
      },
    },
  ],
};
