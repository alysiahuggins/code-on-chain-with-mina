import { Quiz } from './Quiz.js';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt32,
  Experimental,
  CircuitValue,
  CircuitString,
  prop,
  Poseidon,
  PublicKey,
} from 'snarkyjs';
import question from "./question.js";
import {short as introQuestions} from "./curriculum/curriculum.js"
await isReady;
// we need the initiate tree root in order to tell the contract about our off-chain storage
let initialCommitment: Field = Field(0);

class QAItem extends CircuitValue {
    @prop question: CircuitString;
    @prop answer: UInt32;
  
    constructor(question: CircuitString, answer: UInt32) {
      super(question, answer);
      this.question = question;
      this.answer = answer;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  }

  class Account2 extends CircuitValue {
    @prop publicKey: PublicKey;
    @prop points: UInt32;
  
    constructor(publicKey: PublicKey, points: UInt32) {
      super(publicKey, points);
      this.publicKey = publicKey;
      this.points = points;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  
    addPoints(n: number): Account2 {
      return new Account2(this.publicKey, this.points.add(n));
    }
  }

(async function main (){
    // await isReady;
    console.log('SnarkyJS is ready');
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const deployerAccount = Local.testAccounts[0].privateKey;

    // --------------
    // Creating the tree of questions and answers
    // this map serves as our off-chain in-memory storage
    const Tree = new Experimental.MerkleTree(8);
    let QAs: Map<number, QAItem> = new Map<number, QAItem>();
    for(let i in introQuestions){
        let bob = new Account2(Local.testAccounts[0].publicKey, UInt32.from(0));

        let thisQA = new QAItem(CircuitString.fromString(introQuestions[i].question), UInt32.fromNumber(introQuestions[i].answer));
        QAs.set(parseInt(i), thisQA);
        Tree.setLeaf(BigInt(i), thisQA.hash());
    }

    // now that we got our accounts set up, we need the commitment to deploy our contract!
    initialCommitment = Tree.getRoot();

  // ----------------------------------------------------
  // Create a public/private key pair. The public key is our address and where we will deploy to
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  // Create an instance of our Square smart contract and deploy it to zkAppAddress
  const contract = new Quiz(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey });
    contract.init();
    contract.sign(zkAppPrivateKey);
  });

  
  await deployTxn.send().wait();
  // Get the initial state of our zkApp account after deployment
  const highestScore = contract.highestScore.get();

  console.log('state after init:', highestScore.toString());
  // ----------------------------------------------------
  var retry = true;
  var retryCount = 0;
  let pass = false;
  while (retry){
    for(let i in introQuestions){
        var response = await question(introQuestions[i].question);
        if(parseInt(response.trim()) == introQuestions[i].answer) {
            console.log("Correct!");
            pass = true;
            retry = false;
        }else{
            pass = false;
            console.log("Incorrect. Ending Quiz");
            break;
        }
    }
    if(!pass){
        var response = await question(`Do you want to retry? y/n\n`)
        response = response.toLowerCase().trim();
        if(response=='n' || response=="no") {
            retry = false
            console.log("Thanks for playing. Keep learning and try again!")
        }
        retry = true;
        retryCount++;
    }
  }

  var score = 0;
  if(retryCount == 0) score = 10;
  else if(retryCount == 1) score = 5;
  else if(retryCount == 2) score = 2;
  else if(retryCount == 3) score = 1;
  else if(retryCount >= 4) score = 0;

  

  const txn1 = await Mina.transaction(deployerAccount, () => {
    contract.updateHighestScore(Field(score));
    contract.sign(zkAppPrivateKey);
  });
  await txn1.send().wait();
  const currentHighScore = contract.highestScore.get();
  console.log('state after txn1:', currentHighScore.toString());

  console.log('Shutting down')



    await shutdown();


})();