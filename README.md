# Code On Chain with Mina
Built as part of the Zk App Builders Program. 


## CodeOnChain
Learn mina blockchain development by building tiny apps that teach you key concepts. 
The user has to answer quizzes which are verified by a smart contract. 
At the end of each module, the users are expected to deploy a smart contract that demonstrates the concepts that they have learnt. 
CodeOnChain's mina smart contract tests their smart contract by interacting with methods to see if the desired outcome is achieved and if possible, also verifies key lines of code. 

### How to Run
- Make sure you have npm installed and run the following commands within the project folder. 
`npm install`
`npm run build && node build/src/main.js`
### Steps to Building this App
- Create curriculum
- Define Modules
- Implement Modules

### Proposed Modules
- Mina Theory
- ZK Theory
- zkApp Theory
- Mina vs Ethereum 
- zkApp Deployment & State Management
- zkApp Example Apps

### Ideas About Implementaiton 
- Think of it like a Mina Developer Roadmap. During each stage, you learn, answer quizzes and the boss stage is sending your smart contract to be verified by the Mina app. A high score is recorded, the more you retry each stage, the lower your score. 

- There are many courses online that teach you about various blockchains but how do we know that people are actually learning. Quizzes are a great way to test someones knowledge. The app should be created in such as way where any course can be added, with questions and answers so that users can prove that they completed the course. this also makes it easy to add content to the course so that it's not locked to the platform. The purpose of Mina here could be to verify identity but more importantly, to verify knowledge. 
- - I want there to be a gamification aspect as well which I'm not sure is overkill. I'm thinking as simple as a crowssword puzzle or more animated with a flappy birds or matching bubbles implementation. The crossword puzzle can eventually be interactive which would be interesting with private inputs. 


### TODO
- Offchain questions and answers
- Offchain questions and answers stored on chain with merkle trees
- Offchain leaderboard stored on chain with merkle trees
- Retrieve questions & answers from IPFS for merkle tree
- Valiate user response with a zkProof (thus a blockchain transaction)
- Validate user responses with recursive zkProofs (One blockchain transaction per module)
- Implement Modules (entry to learning then quiz section)
- Reward user with token at the end of each module
- Validate smart contract code with a test suite in the client
- Learn how to communicate with another deployed smart contract from within my Quiz Smart Contract

### Questions for Mina Team
- The user can only progress if they get all questions correct in each module. Should the quiz responses be stored as state variables and verified by smart contracts?
Or is it ok to be stored offchain and verified on the client? 
- How do I call a method from another smart contract
- Where do I store the answers to the questions so that they stay private?
- can I create a token with SnarkyJS?


### A

