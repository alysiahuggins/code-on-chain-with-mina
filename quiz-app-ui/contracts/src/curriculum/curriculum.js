import  {default as questions}  from "./questions.json" assert { type: "json" };
import  {default as questions10}  from "./questions10.json" assert { type: "json" };

import  {default as questionsRadio}  from "./questionsRadio.json" assert { type: "json" };

// import  {default as answers}  from "./answers.json" assert { type: "json" };
// import  {default as answers10}  from "./answers10.json" assert { type: "json" };


export { questions, answers, questions10, answers10, questionsRadio};


let answers = [
    {
      "answer": 4
    },
    {
      "answer": 1
    }
  ];

  let answers10 = [
    {
      "answer": 4
    },
    {
      "answer": 1
    },
    {
      "answer": 2
    },
    {
      "answer": 2
    },
    {
      "answer": 3
    },
    {
      "answer": 3
    },
    {
      "answer": 1
    },
    {
      "answer": 4
    },
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
      "question": "\nZero Knowledge (ZK) Proofs are way of proving the validity of a statement ...\n1.  without revealing any information apart from the fact that the statement is true.\n2. by revealing all information.\n3. by revealing some of the information.\n4. by assuming all is true until information is provided that says otherwise.\n"
    }
]

  let questions10 = [
    {
      "question": "\nWhat is Mina?\n1. A layer 2 blockchain that scales Ethereum.\n2. A layer 1 blockchain that's EVM-compatible.\n3. A layer 1 blockchain that's based on ZK proofs and scales Ethereum.\n4. A layer 1 blockchain that’s based on ZK proofs and has a blockchain of a fixed size of 22KB.\n"
    },
    {
      "question": "\nZero Knowledge (ZK) Proofs are way of proving the validity of a statement ...\n1.  without revealing any information apart from the fact that the statement is true.\n2. by revealing all information.\n3. by revealing some of the information.\n4. by assuming all is true until information is provided that says otherwise.\n"
    },
    {
      "question": "\nWhat consensus model does Mina use?\n1. Proof of Work\n2. Proof of Stake\n3. Zero Knowledge Proof\n4. ZK Snarks\n"
    },
    {
        "question": "\nWhat are ZKApps on Mina?\n1. Smart Contracts Powered by Ethereum\n2. Smart Contracts that use Zero Knowledge Proofs (ZK Snarks)\n3. Smart Contracts that use Zero Knowledge Proofs (ZK Sparks)\n4. Smart Contracts that write themselves\n"
    },
    {
        "question": "\nWhat programming language is used to write ZKApps?\n1. Solidity\n2. Rust\n3. Typescript\n4. Python\n"
    },
    {
        "question": "\nWhen does a Mina Address act as a zkApp account?\n1. When it is named as a ZK App\n2. When you send transactinos to it\n3. When it contains a verification key\n4. When it is owned by a zk App Developer\n"
    },
    {
        "question": "\nWhat does a zkApp consist of?\n1. A smart contract and a UI\n2. A smart contract\n3. A UI\n4. A phone\n"
    },
    {
        "question": "\nHow is a smart contract deployed?\n1. Using the Remix IDE\n2. Uploading to AWS\n3. Uploading to Google Cloud\n4. Sending a transaction with the verification key to an address on the Mina Blockchain\n"
    },
    {
        "question": "\nIs there a limit to onchain state on Mina?\n1. Yes - 1 field\n2. No\n3. Yes - 2 fields\n4. Yes - 8 fields\n"
    },
    {
        "question": "\nHow do you store more data onchain?\n1. Store the root of a Merkle Tree\n2. Store the leaves of a Merkle Tree\n3. You can't\n4. Create another smart contracts and store that smart contract address as a state variable\n"
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