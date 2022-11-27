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


### Implementation Steps
- Offchain questions and answers DONE
- Offchain questions and answers stored on chain with merkle trees DONE
- Reward user with token at the end of each module
- Claim1: Store Users Name and Password in a Merkle Tree so that they can claim their tokens
- Claim2: Allow Users to supply their own Mina Address to claim tokens
- Offchain leaderboard stored on chain with merkle trees
- Validate smart contract code with a test suite in the client
- Valiate user response with a zkProof (thus a blockchain transaction) DONE
- Add Tests


- Implement Modules (entry to learning then quiz section)
- Validate user responses with recursive zkProofs (One blockchain transaction per module)
- Retrieve questions & answers from IPFS for merkle tree
- Learn how to communicate with another deployed smart contract from within my Quiz Smart Contract

### TODO
- Offchain leaderboard stored on chain with merkle trees
- Retrieve questions & answers from IPFS for merkle tree
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


### Concepts

#### Token Claims
When the user completes the quiz and got all the questions correctly, QuizTokens are minted to an address that we control.
Users can claim these tokens to their address when they want, in the meanwhile, the user's username and password is stored in a merkletree.


### Errors and Workarounds
#### Stackoverflow
- When I tried to compile a Merkle Tree of size 1000


#### invalid fee excess
```
deploy tokenZkApp
Error: Invalid fee excess.
This means that balance changes in your transaction do not sum up to the amount of fees needed.
Here's the list of balance changes:

Account update #1) -101.00 MINA
Account update #2) 10.00 MINA

Total change: -91.00 MINA
```

what caused it: i used the same zkAppAddress in the deploy args for more than one smart contract
solution: use different zkAppAddress in deploy args for various smart contracts


#### Error: Transaction verification failed: Cannot update field 'incrementNonce' because permission for this field is 'Signature', but the required authorization was not provided or is invalid.
You are using a different address 

problem: signing a transaction with the key that did not do the deployment, instead sign with that key or just do tx.prove()



### Testnet Address
Berkeley3 B62qkFzjHYDXq5qnFL7Q3Z63H94vUVPprA6HVULkW8rGtowLDeRusEz