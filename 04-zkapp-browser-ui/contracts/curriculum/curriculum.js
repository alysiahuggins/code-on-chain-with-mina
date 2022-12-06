// import  {default as questions}  from "./questions.json" assert { type: "json" };
// import  {default as questionsRadio}  from "./questionsRadio.json" assert { type: "json" };

// import  {default as answers}  from "./answers.json" assert { type: "json" };

export { questions, answers,  questionsRadio};


let answers = [
    {
      "answer": 4
    },
    {
      "answer": 1
    }
  ]

  let questions = [
    {
      "question": "\nWhat is Mina?\n1. A layer 2 blockchain that scales Ethereum.\n2. A layer 1 blockchain that's EVM-compatible.\n3. A layer 1 blockchain that's based on ZK proofs and scales Ethereum.\n4. A layer 1 blockchain that’s based on ZK proofs and has a blockchain of a fixed size of 22KB.\n"
    },
    {
      "question": "\nWhat are Zero Knowledge (ZK) Proofs?\n1. A way of proving the validity of a statement without revealing any information apart from the fact that the statement is true.\n2. A way of proving the validity of a statement by revealing all information.\n3. A way of proving the validity of a statement by revealing some of the information.\n4. A way of proving the validity by assuming all is true until information is provided that says otherwise.\n"
    }
  ]

  let questionsRadio = [
    {
      "question": "What is Mina?",
      "options":[
        "A layer 2 blockchain that scales Ethereum", 
        "A layer 1 blockchain that's EVM-compatible",
        "A layer 1 blockchain that's based on ZK proofs and scales Ethereum",
        "A layer 1 blockchain that’s based on ZK proofs and has a blockchain of a fixed size of 22KB."]
    },
    {
      "question": "What are Zero Knowledge (ZK) Proofs?",
      "options": [
        "1. A way of proving the validity of a statement without revealing any information apart from the fact that the statement is true.",
        "A way of proving the validity of a statement by revealing all information.",
        "A way of proving the validity of a statement by revealing some of the information.",
        "A way of proving the validity by assuming all is true until information is provided that says otherwise."]
    }
  ]

