/*
Description: 

This example describes how developers can use Merkle Trees as a basic off-chain storage tool.

zkApps on Mina can only store a small amount of data on-chain, but many use cases require your application to at least reference big amounts of data.
Merkle Trees give developers the power of storing large amounts of data off-chain, but proving its integrity to the on-chain smart contract!


! Unfamiliar with Merkle Trees? No problem! Check out https://blog.ethereum.org/2015/11/15/merkling-in-ethereum/
*/

import {
  SmartContract,
  isReady,
  Poseidon,
  Field,
  Permissions,
  DeployArgs,
  State,
  state,
  CircuitValue,
  PublicKey,
  UInt64,
  prop,
  Mina,
  method,
  UInt32,
  PrivateKey,
  AccountUpdate,
  MerkleTree,
  MerkleWitness,
} from 'snarkyjs';
import { Quiz } from './Quiz.js';
import question from "./question.js";
import {questions as questions} from "./curriculum/curriculum.js"

import {answers as answers} from "./curriculum/curriculum.js"


await isReady;

const doProofs = true;

class MyMerkleWitness extends MerkleWitness(8) {}

class Account extends CircuitValue {
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

  addPoints(n: number): Account {
    return new Account(this.publicKey, this.points.add(n));
  }
}
// we need the initiate tree root in order to tell the contract about our off-chain storage
let initialCommitment: Field = Field(0);
let initialBalance = 10_000_000_000;

/*
  We want to write a smart contract that serves as a leaderboard,
  but only has the commitment of the off-chain storage stored in an on-chain variable.
  The accounts of all participants will be stored off-chain!
  If a participant can guess the preimage of a hash, they will be granted one point :)
*/

class Leaderboard extends SmartContract {
  // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
  @state(Field) commitment = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
    this.balance.addInPlace(UInt64.from(initialBalance));
    this.commitment.set(initialCommitment);
  }

  @method
  guessPreimage(guess: Field, account: Account, path: MyMerkleWitness) {
    // this is our hash! its the hash of the preimage "22", but keep it a secret!
    let target = Field(
      '17057234437185175411792943285768571642343179330449434169483610110583519635705'
    );
    // if our guess preimage hashes to our target, we won a point!
    Poseidon.hash([guess]).assertEquals(target);

    // we fetch the on-chain commitment
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the account is within the committed Merkle Tree
    path.calculateRoot(account.hash()).assertEquals(commitment);

    // we update the account and grant one point!
    let newAccount = account.addPoints(1);

    // we calculate the new Merkle Root, based on the account changes
    let newCommitment = path.calculateRoot(newAccount.hash());

    this.commitment.set(newCommitment);
  }
}

class Answer extends CircuitValue {
  @prop answer: UInt32;

  constructor(answer: UInt32) {
    super(answer);
    this.answer = answer;
  }

  hash(): Field {
    return Poseidon.hash(this.toFields());
  }
}

const answerTree = new MerkleTree(8);
let Answers: Map<number, Answer> = new Map<number, Answer>();
function createMerkleTree(){
  let committment: Field = Field(0);

  let Answers: Map<number, Answer> = new Map<number, Answer>();
  for(let i in answers){
      let thisAnswer = new Answer(UInt32.from(answers[i].answer));
      Answers.set(parseInt(i), thisAnswer);
      answerTree.setLeaf(BigInt(i), thisAnswer.hash());
  }

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  committment = answerTree.getRoot();
  return committment;
}

export class Quiz2 extends SmartContract {
  @state(Field) highestScore = State<Field>();
  @state(Field) totalQuestions = State<Field>();
  // a commitment is a cryptographic primitive that allows us to commit to data, with the ability to "reveal" it later
  @state(Field) commitment = State<Field>();

  deploy(args: DeployArgs) {
  super.deploy(args);
  this.setPermissions({
    ...Permissions.default(),
    editState: Permissions.proofOrSignature(),
  });
  this.totalQuestions.set(Field(5));
  this.balance.addInPlace(UInt64.from(initialBalance));

  this.commitment.set(initialCommitment);
  }

  // @method init(zkappKey: PrivateKey) {
  //   super.init(zkappKey);
  //   this.highestScore.set(Field(0));
  //   this.totalQuestions.set(Field(5));
  // }

  @method validateQuestionResponse(response: Field, answerIndex: Field, path: MyMerkleWitness){
    //check if response hashes to the correctAnswer hash
    // Poseidon.hash([response]).assertEquals(correctAnswer);
    // let w = answerTree.getWitness(answerIndex.toBigInt()); //QUESTION: should this be here or back in main.ts?
    // let witness = new MyMerkleWitness(path);
    // we fetch the on-chain commitment
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    console.log(path.calculateRoot(Poseidon.hash(response.toFields())));
    console.log(commitment);
    path.calculateRoot(Poseidon.hash(response.toFields())).assertEquals(commitment);

  }

}


(async function main (){
type Names = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';

let Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);

let feePayer = Local.testAccounts[0].privateKey;

// the zkapp account
let zkappKey = PrivateKey.random();
let zkappAddress = zkappKey.toPublicKey();

// // this map serves as our off-chain in-memory storage
// let Accounts: Map<string, Account> = new Map<Names, Account>();

// let bob = new Account(Local.testAccounts[0].publicKey, UInt32.from(0));
// let alice = new Account(Local.testAccounts[1].publicKey, UInt32.from(0));
// let charlie = new Account(Local.testAccounts[2].publicKey, UInt32.from(0));
// let olivia = new Account(Local.testAccounts[3].publicKey, UInt32.from(0));

// Accounts.set('Bob', bob);
// Accounts.set('Alice', alice);
// Accounts.set('Charlie', charlie);
// Accounts.set('Olivia', olivia);

// // we now need "wrap" the Merkle tree around our off-chain storage
// // we initialize a new Merkle Tree with height 8
// const Tree = new MerkleTree(8);

// Tree.setLeaf(BigInt(0), bob.hash());
// Tree.setLeaf(BigInt(1), alice.hash());
// Tree.setLeaf(BigInt(2), charlie.hash());
// Tree.setLeaf(BigInt(3), olivia.hash());

// // now that we got our accounts set up, we need the commitment to deploy our contract!
// initialCommitment = Tree.getRoot();
initialCommitment = createMerkleTree();


let leaderboardZkApp = new Quiz2(zkappAddress);
console.log('Deploying leaderboard..');
try{
  if (doProofs) {
    await Quiz2.compile();
  }
  
  
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer, { initialBalance });
    leaderboardZkApp.deploy({ zkappKey });
  });
  await tx.send();
  const highestScore = leaderboardZkApp.highestScore.get();
  console.log('state after init:', highestScore.toString());
}catch(e){
  console.log(e);
}


 // ----------------------------------------------------
 var retry = true;
 var retryCount = 0;
 let pass = false;
 while (retry){
   for(let i in questions){
       var response = parseInt((await question(questions[i].question)).trim());
       let w = answerTree.getWitness(BigInt(i));
       let witness = new MyMerkleWitness(w);
       try{
           let txn = await Mina.transaction(feePayer, () => {
               leaderboardZkApp.validateQuestionResponse(Field(response), Field(parseInt(i)), witness);
                leaderboardZkApp.sign(zkappKey);

           });
           console.log(`Proving blockchain transaction for question ${i}\n`)
           if (doProofs) {
                await txn.prove();
              }
              console.log(`Sending blockchain transaction for question ${i}\n`)
           await txn.send();
           console.log('Correct');
           pass = true;
           retry = false;
       }
       catch(e){
           console.log("You encountered the following error"+e);
           pass = false;
           console.log("Incorrect. Ending Quiz");
           break;
       }

       // if(parseInt(response.trim()) == introQuestions[i].answer) {
       //     console.log("Correct!");
       //     pass = true;
       //     retry = false;
       // }else{
       //     pass = false;
       //     console.log("Incorrect. Ending Quiz");
       //     break;
       // }
   }
   if(!pass){
       var retryResponse = await question(`Do you want to retry? y/n\n`)
       retryResponse = retryResponse.toLowerCase().trim();
       if(retryResponse=='n' || retryResponse=="no") {
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



// console.log('Initial points: ' + Accounts.get('Bob')?.points);

// console.log('Making guess..');
// await makeGuess('Bob', BigInt(0), 22);

// console.log('Final points: ' + Accounts.get('Bob')?.points);

// async function makeGuess(name: Names, index: bigint, guess: number) {
//   let account = Accounts.get(name)!;
//   let w = Tree.getWitness(index);
//   let witness = new MyMerkleWitness(w);

//   let tx = await Mina.transaction(feePayer, () => {
//     leaderboardZkApp.guessPreimage(Field(guess), account, witness);
//     if (!doProofs) leaderboardZkApp.sign(zkappKey);
//   });
//   if (doProofs) {
//     await tx.prove();
//   }
//   await tx.send();

//   // if the transaction was successful, we can update our off-chain storage as well
//   account.points = account.points.add(1);
//   Tree.setLeaf(index, account.hash());
//   leaderboardZkApp.commitment.get().assertEquals(Tree.getRoot());
// }
})();