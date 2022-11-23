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
  shutdown,
  Experimental,
  VerificationKey,
  Int64,
  Ledger,
  CircuitString
} from 'snarkyjs';
import { Quiz } from './Quiz.js';
import { QuizToken } from './QuizToken.js';
import { UserAccount } from './UserAccount.js';

import question from "./question.js";
import {questions as questions} from "./curriculum/curriculum.js"

import {answers as answers} from "./curriculum/curriculum.js"


await isReady;

const doProofs = true;

class MyMerkleWitness extends MerkleWitness(8) {}
class ClaimAccountMerkleWithness extends MerkleWitness(8) {}

// we need the initiate tree root in order to tell the contract about our off-chain storage
let initialCommitment: Field = Field(0);
let initialClaimTreeCommittment: Field = Field(0);


let initialBalance = 10_000_000_000;



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

// this map serves as our off-chain in-memory storage
class Account extends CircuitValue {
  @prop username: CircuitString;
  @prop password: Field;
  @prop claimed: Field;

  constructor(username: CircuitString, password: CircuitString, claimed: Field) {
    super(username, password, claimed);
    this.username = username;
    this.password = Poseidon.hash(password.toFields());
    this.claimed = claimed;
  }

  hash(): Field {
    return Poseidon.hash(this.toFields());
  }

  setClaimed(claimed: Field) {
    this.claimed = claimed;
  }
}

const answerTree = new MerkleTree(8);
const claimAccountTree = new MerkleTree(8);

let Answers: Map<number, Answer> = new Map<number, Answer>();
let Accounts: Map<string, Account> = new Map<string, Account>();
let usernames: Array<string> = new Array<string>();

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
  console.log('committment')
  console.log(committment);
  return committment;
}




function createClaimAccountMerkleTree(username: string, password: string){
  let committment: Field = Field(0);

  let account = new Account(CircuitString.fromString(username),CircuitString.fromString(password), Field(false));

  usernames[usernames.length] = username;
  Accounts.set(username, account);
  claimAccountTree.setLeaf(BigInt(0), account.hash());

  // now that we got our accounts set up, we need the commitment to deploy our contract!
  committment = claimAccountTree.getRoot();
  console.log('committment')
  console.log(committment);
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

  // @method setCommittment(committment: Field) {
  //   this.commitment.set(committment);
    
  // }

  // @method init(zkappKey: PrivateKey) {
  //   super.init(zkappKey);
  //   this.highestScore.set(Field(0));
  //   this.totalQuestions.set(Field(5));
  //   this.totalQuestions.set(Field(1));
  // }

  @method validateQuestionResponse(response: Field, answerIndex: Field, path: MyMerkleWitness){
    
    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    path.calculateRoot(Poseidon.hash(response.toFields())).assertEquals(commitment);

  }

}

export class ClaimAccountSC extends SmartContract {
  @state(Field) commitment = State<Field>();

  deploy(args: DeployArgs) {
    super.deploy(args);
    this.setPermissions({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
    });
    this.balance.addInPlace(UInt64.from(initialBalance));
    this.commitment.set(initialClaimTreeCommittment);
  }

  // @method setCommittment(committment: Field) {
  //   this.commitment.set(committment);
    
  // }

  // @method init(zkappKey: PrivateKey) {
  //   super.init(zkappKey);
  //   this.highestScore.set(Field(0));
  //   this.totalQuestions.set(Field(5));
  //   this.totalQuestions.set(Field(1));
  // }

  @method validateAccountPassword(account: Account, path: ClaimAccountMerkleWithness){

    let commitment = this.commitment.get();
    this.commitment.assertEquals(commitment);

    // we check that the response is the same as the hash of the answer at that path
    path.calculateRoot(Poseidon.hash(account.toFields())).assertEquals(commitment);

  }

}





(async function main (){

type Names = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';

let Local = Mina.LocalBlockchain();
Mina.setActiveInstance(Local);

let feePayer = Local.testAccounts[0].privateKey;
let tokenFeePayer = Local.testAccounts[1].privateKey;

// the zkapp account
let zkappKey = PrivateKey.random();

let tokenZkAppKey = PrivateKey.random();
let winnerKey = PrivateKey.random();
let tokenZkAppKeyAddress = tokenZkAppKey.toPublicKey();


let zkappAddress = zkappKey.toPublicKey();

let winnerKeyAddress = winnerKey.toPublicKey();
let tokenFeePayerAddress = zkappKey.toPublicKey();
console.log(`tokenFeePayerAddress ${tokenFeePayerAddress.toBase58()}`)

initialCommitment = createMerkleTree();


let quizApp = new Quiz2(zkappAddress);
let tokenZkApp = new QuizToken(tokenZkAppKeyAddress);
let claimAccountApp = new ClaimAccountSC(zkappAddress);
let tokenId = tokenZkApp.token.id;
try{
  initialClaimTreeCommittment = createClaimAccountMerkleTree('alysia', 'minarocks');

console.log('Compiling ClaimAccountApp..');


  if (doProofs) {
    await ClaimAccountSC.compile();
  }

  
console.log('Deploying ClaimAccountApp..');
  
  let mytx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer, { initialBalance });
    // quizApp.setCommittment(initialCommitment);

    claimAccountApp.deploy({ zkappKey });
  });
  // await tx.prove();

  await mytx.send();
  let username = 'alysia';
  let account = Accounts.get(username)!;
  let usernameIndex = usernames.findIndex((obj) => {
    return obj === username;
  })!;
  console.log(usernameIndex);
  let w = claimAccountTree.getWitness(BigInt(usernameIndex));
       let witness = new ClaimAccountMerkleWithness(w);
       
           let txn = await Mina.transaction(feePayer, () => {
               claimAccountApp.validateAccountPassword(account, witness);
               claimAccountApp.sign(zkappKey);

           });
           console.log(`Proving blockchain transaction\n`)
           if (doProofs) {
                await txn.prove();
              }
              console.log(`Sending blockchain transaction\n`)
           await txn.send();
           console.log('Found');
           
console.log('Compiling QuizApp..');

  if (doProofs) {
    await Quiz2.compile();
  }
  
console.log('Deploying QuizApp..');
  
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer, { initialBalance });
    // quizApp.setCommittment(initialCommitment);

    quizApp.deploy({ zkappKey });
  });
  // await tx.prove();

  await tx.send();
  const highestScore = quizApp.highestScore.get();
  console.log('state after init:', highestScore.toString());

  console.log('compile (TokenContract)');
  await QuizToken.compile();
  
  
  console.log('deploy tokenZkApp');
  tx = await Local.transaction(tokenFeePayer, () => {
    AccountUpdate.fundNewAccount(tokenFeePayer, { initialBalance });
    tokenZkApp.deploy({ zkappKey: tokenZkAppKey });
  });
  await tx.send();

  console.log('compile (UserAccount)');
  await UserAccount.compile();

  console.log('deploy userAccount');
   tx = await Local.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer);
    tokenZkApp.tokenDeploy(winnerKey, UserAccount._verificationKey!);
  });
  console.log('deploy UserAcocunt (proof)');
  await tx.prove();
  await tx.send();

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
               quizApp.validateQuestionResponse(Field(response), Field(parseInt(i)), witness);
                quizApp.sign(zkappKey);

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
          //  console.log("You encountered the following error"+e);
           pass = false;
           console.log("Incorrect. Ending Quiz");
           break;
       }

   }
   if(!pass){
       var retryResponse = await question(`Do you want to retry? y/n\n`)
       retryResponse = retryResponse.toLowerCase().trim();
       if(retryResponse=='n' || retryResponse=="no") {
           retry = false;
           console.log("Thanks for playing. Keep learning and try again!");
           break;
       }
       retry = true;
       retryCount++;
   }
 }

 if(pass){
  console.log("Congratulations, you won!!!");

  try{
    console.log(`Getting Your Token Reward ${winnerKeyAddress.toBase58()}`);
    console.log('mint token to UserAccount');
    let tx = await Local.transaction(feePayer, () => {
      tokenZkApp.mint(winnerKeyAddress);
      tokenZkApp.sign(tokenZkAppKey);

    });
    // await tx.prove();
    await tx.send();
    console.log('getting Token balance')
    console.log(
      `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
      Mina.getBalance(winnerKeyAddress, tokenId).value.toBigInt()
    );
  }catch(e){
    console.log(`Error sending token to ${winnerKeyAddress.toBase58()}`);
  }
  var rewardAddressResponse = await question(`Do you have a Mina address that we can send tokens to, if so, enter it here. Otherwise, type 'no'\n`)
  rewardAddressResponse = rewardAddressResponse.toLowerCase().trim();
  if(rewardAddressResponse=='no') {
    retry = false;
    console.log(`Thanks for playing`);
    console.log(`create custodial account for ${rewardAddressResponse}`);

  }else{
    
 }
 }

 var score = 0;
 if(retryCount == 0) score = 10;
 else if(retryCount == 1) score = 5;
 else if(retryCount == 2) score = 2;
 else if(retryCount == 3) score = 1;
 else if(retryCount >= 4) score = 0;

 shutdown();

})();