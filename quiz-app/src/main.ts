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
class MerkleWitness extends Experimental.MerkleWitness(8) {}

// we need the initiate tree root in order to tell the contract about our off-chain storage
// let initialCommitment: Field = Field(0);

// class QAItem extends CircuitValue {
//     @prop question: CircuitString;
//     @prop answer: UInt32;
  
//     constructor(question: CircuitString, answer: UInt32) {
//       super(question, answer);
//       this.question = question;
//       this.answer = answer;
//     }
  
//     hash(): Field {
//       return Poseidon.hash(this.toFields());
//     }
//   }

//   class Answer extends CircuitValue {
//     @prop answer: UInt32;
  
//     constructor(answer: UInt32) {
//       super(answer);
//       this.answer = answer;
//     }
  
//     hash(): Field {
//       return Poseidon.hash(this.toFields());
//     }
//   }

(async function main (){
    // await isReady;
    console.log('SnarkyJS is ready');
    const Local = Mina.LocalBlockchain();
    Mina.setActiveInstance(Local);
    const deployerAccount = Local.testAccounts[0].privateKey;

    // --------------
    // Creating the tree of questions and answers
    // this map serves as our off-chain in-memory storage
    // const Tree = new Experimental.MerkleTree(8);
    // let QAs: Map<number, QAItem> = new Map<number, QAItem>();
    // for(let i in introQuestions){
    //     let thisQA = new QAItem(CircuitString.fromString(introQuestions[i].question), UInt32.fromNumber(introQuestions[i].answer));
    //     QAs.set(parseInt(i), thisQA);
    //     Tree.setLeaf(BigInt(i), thisQA.hash());
    // }

    // const answerTree = new Experimental.MerkleTree(8);
    // let Answers: Map<number, Answer> = new Map<number, Answer>();
    // for(let i in introQuestions){
    //     let thisAnswer = new Answer(UInt32.fromNumber(introQuestions[i].answer));
    //     Answers.set(parseInt(i), thisAnswer);
    //     answerTree.setLeaf(BigInt(i), thisAnswer.hash());
    // }

    // // now that we got our accounts set up, we need the commitment to deploy our contract!
    // initialCommitment = answerTree.getRoot();

  // ----------------------------------------------------
  // Create a public/private key pair. The public key is our address and where we will deploy to
  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();
  // Create an instance of our Square smart contract and deploy it to zkAppAddress
  const contract = new Quiz(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey});
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
        var response = parseInt((await question(introQuestions[i].question)).trim());
        
        try{
            let txn = await Mina.transaction(deployerAccount, () => {
                contract.validateQuestionResponse(Field(response), Field(parseInt(i)));
                contract.sign(zkAppPrivateKey);
            });
            await txn.send().wait();
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

  

//   const txn1 = await Mina.transaction(deployerAccount, () => {
//     contract.updateHighestScore(Field(score));
//     contract.sign(zkAppPrivateKey);
//   });
//   await txn1.send().wait();
//   const currentHighScore = contract.highestScore.get();
//   console.log('state after txn1:', currentHighScore.toString());


  //answer question
//   let qaItem = Accounts.get(0)!;
//   let w = Tree.getWitness(index);
//   let witness = new MerkleWitness(w);

//   const txn1 = await Mina.transaction(deployerAccount, () => {
//       contract.validateQuestionResponse(Field(3), );
//       contract.sign(zkAppPrivateKey);
//     });


//   let w = answerTree.getWitness(BigInt(0));
//   let witness = new MerkleWitness(w);
//   console.log(witness.calculateRoot(Poseidon.hash([Field(1)])).assertEquals(initialCommitment));
    const txn2 = await Mina.transaction(deployerAccount, () => {
        contract.validateQuestionResponse(Field(3), Field(0));
        contract.sign(zkAppPrivateKey);
    });
  await txn2.send().wait();
  console.log('Shutting down')

    await shutdown();


})();

async function answerQuestion() {

    // let qaItem = Accounts.get(0)!;
    // let w = Tree.getWitness(index);
    // let witness = new MerkleWitness(w);

    // const txn1 = await Mina.transaction(deployerAccount, () => {
    //     contract.validateQuestionResponse(Field(3));
    //     contract.sign(zkAppPrivateKey);
    //   });
    // let account = Accounts.get(name)!;
    // let w = Tree.getWitness(index);
    // let witness = new MerkleWitness(w);
  
    // let tx = await Mina.transaction(feePayer, () => {
    //   leaderboardZkApp.guessPreimage(Field(guess), account, witness);
    //   if (!doProofs) leaderboardZkApp.sign(zkappKey);
    // });
    // if (doProofs) {
    //   await tx.prove();
    // }
    // await tx.send();
  
    // if the transaction was successful, we can update our off-chain storage as well
    // account.points = account.points.add(1);
    // Tree.setLeaf(index, account.hash());
    // leaderboardZkApp.commitment.get().assertEquals(Tree.getRoot());
}