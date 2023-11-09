/*
* Uses the YKPRoof Contract which is a consolidation of all contracts needed
* I use this to test locally before I deploy to Berkeley
*/

import {
    isReady,
    Poseidon,
    Field,
    CircuitValue,
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
    Ledger,
    CircuitString,
    PublicKey,
    Bool
  } from 'o1js';
  import { QuizToken } from './contracts/QuizToken.js';
  import { QuizV2 } from './contracts/Quiz.js';
  import { ClaimAccountV2 } from './contracts/ClaimAccount.js';
  import { UserAccount } from './contracts/UserAccount.js';
  import {YKProof} from './contracts/YKProof.js';
  
  import question from "./question.js";
  import {questions10 as questions} from "./curriculumOld/curriculum.js"
  
  import {answers10 as answers} from "./curriculumOld/curriculum.js"
import { ButtonGroup } from 'react-bootstrap';
  
  
  await isReady;
  
  const doProofs = true;
  
  class MyMerkleWitness extends MerkleWitness(8) {}
  class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
  
  // we need the initiate tree root in order to tell the contract about our off-chain storage
  let initialCommitment: Field = Field(0);
  let initialClaimTreeCommittment: Field = Field(0);
  
  
  let initialBalance = 100_000_000_000;
  
  
  
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
  export class Account extends CircuitValue {
    @prop username: CircuitString;
    @prop password: Field;
    @prop claimed: Bool;
  
    constructor(username: CircuitString, password: CircuitString, claimed: Bool) {
      super(username, password, claimed);
      this.username = username;
      this.password = Poseidon.hash(password.toFields());
      this.claimed = claimed;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  
    setClaimed(claimed: Bool) {
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
        
        let root = answerTree.getRoot();
        let node = answerTree.getNode(1, BigInt(1));

    }
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    committment = answerTree.getRoot();
    return committment;
  }
  
  
  
  function createClaimAccountMerkleTree(username: string, password: string){
    let committment: Field = Field(0);
  
    let account = new Account(CircuitString.fromString(username),CircuitString.fromString(password), Bool(false));
  
    usernames[usernames.length] = username;
    Accounts.set(username, account);
    claimAccountTree.setLeaf(BigInt(0), account.hash());
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    committment = claimAccountTree.getRoot();
    
    return committment;
  }
  
  
  
  
  (async function main (){
  
  type Names = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';
  
  let Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  
  let feePayer = Local.testAccounts[0].privateKey;
  let tokenFeePayer = Local.testAccounts[1].privateKey;
  let claimAccountFeePayer = Local.testAccounts[2].privateKey;
  let ykProofFeePayer = Local.testAccounts[3].privateKey;

  
  
  // the zkapp account
  let zkappKey = PrivateKey.random();
  
  let tokenZkAppKey = PrivateKey.random();
  let winnerKey = PrivateKey.random();
  let claimAccountKey = PrivateKey.random();
  let ykProofAccountKey = PrivateKey.random();

  
  let userAccountKey = PrivateKey.random();
  let tokenZkAppKeyAddress = tokenZkAppKey.toPublicKey();
  
  
  let zkappAddress = zkappKey.toPublicKey();
  let winnerKeyAddress = winnerKey.toPublicKey();
  let claimAccountAddress = claimAccountKey.toPublicKey();
  let ykProofAccountAddress = ykProofAccountKey.toPublicKey();

  let userAccountAddress = userAccountKey.toPublicKey();
  
  initialCommitment = createMerkleTree();
  
  let ykProofApp= new YKProof(ykProofAccountAddress);
  
  let quizApp = new QuizV2(zkappAddress);
  let tokenZkApp = new QuizToken(tokenZkAppKeyAddress);
  let claimAccountApp = new ClaimAccountV2(claimAccountAddress);
//   let tokenId = tokenZkApp.token.id;
    let tokenId = ykProofApp.token.id;
  let userAccountApp = new YKProof(winnerKeyAddress, tokenId);
  
  try{
    initialClaimTreeCommittment = createClaimAccountMerkleTree('alysia', 'minarocks');

    console.log('Compiling ykProofApp..');
  
    if (doProofs) {
      let verificationKey = await YKProof.compile();
      console.log('verification key')
      console.log(verificationKey.verificationKey.hash);
    }
  
    
    console.log('Deploying ykProofApp..');
    
    let yktx = await Mina.transaction(ykProofFeePayer, () => {
      AccountUpdate.fundNewAccount(ykProofFeePayer, { initialBalance });
      ykProofApp.deploy({  zkappKey: ykProofAccountKey  });
    //   tokenZkApp.tokenDeploy(ykProofAccountKey, UserAccount._verificationKey!);

      // claimAccountApp.sign(claimAccountKey);
    });
    // await mytx.prove();
  
    await yktx.send();
  
    console.log('ykProofApp deployed');
    console.log('ykProofApp init');
  
    
    yktx = await Mina.transaction(ykProofFeePayer, () => {
        ykProofApp.init();
        ykProofApp.sign(ykProofAccountKey);
  
  });
  console.log(`Proving blockchain transaction\n`)
  if (doProofs) {
        await yktx.prove();
      }
  console.log(`Sending blockchain transaction\n`)
  await yktx.send();
  console.log('YKProof init');
    console.log(ykProofApp.commitment.get());
    console.log(ykProofApp.quizAnswerCommittment.get());


  
    console.log('deploy userAccount');
    let tx = await Local.transaction(feePayer, () => {
      AccountUpdate.fundNewAccount(feePayer);
      ykProofApp.tokenDeploy(winnerKey, YKProof._verificationKey!);
      ykProofApp.sign(ykProofAccountKey);
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
             let txn = await Mina.transaction(ykProofFeePayer, () => {
                 ykProofApp.validateQuestionResponse(Field(response),  witness);
                 ykProofApp.sign(ykProofAccountKey);
  
             });
             console.log(`Proving blockchain transaction for question ${i}`)
             if (doProofs) {
                  await txn.prove();
                }
                console.log(`Sending blockchain transaction for question ${i}`)
             await txn.send();
             console.log('Correct :)');
             pass = true;
             retry = false;
         }
         catch(e){
             console.log("You encountered the following error"+e);
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
      console.log(`Getting Your Token Reward ${ykProofAccountAddress.toBase58()}`);
      console.log('mint token to UserAccount');
      let tx = await Local.transaction(ykProofFeePayer, () => {
        ykProofApp.mint(winnerKeyAddress);
        ykProofApp.sign(ykProofAccountKey);
  
      });
      // await tx.prove();
      await tx.send();
      console.log('getting Token balance')
      // console.log(
      //   `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
      //   Mina.getBalance(winnerKeyAddress, tokenId).value.toBigInt()
      // );
    }catch(e){
      console.log(`Error sending token to ${ykProofAccountAddress.toBase58()}`);
      console.log(e);
    }
    var rewardAddressResponse = await question(`Do you have an account with us?\n`)
    rewardAddressResponse = rewardAddressResponse.toLowerCase().trim();
    if(rewardAddressResponse=='no') {
      var rewardAddressResponse = await question(`Would you like to create an account to claim your tokens later?\n`)
      if(rewardAddressResponse=='no') {
        console.log(`Thanks for playing`);
        shutdown();
      }else{
        var username = await question(`Please enter your username?\n`)
        var password = await question(`Please enter your password\n`);
  
        let numUsers = usernames.length;
        let w = claimAccountTree.getWitness(BigInt(numUsers));
        let witness = new ClaimAccountMerkleWitness(w);
        let account = new Account(CircuitString.fromString(username),CircuitString.fromString(password), Bool(false));
  
          let txn = await Mina.transaction(ykProofFeePayer, () => {
            ykProofApp.createAccount(account, witness);
            ykProofApp.sign(ykProofAccountKey);
  
        });
        console.log(`Proving blockchain transaction\n`)
        if (doProofs) {
              await txn.prove();
            }
        console.log(`Sending blockchain transaction\n`)
        await txn.send();
        console.log('Account Created');
  
        //update local storage
        claimAccountTree.setLeaf(BigInt(numUsers), account.hash());
        ykProofApp.commitment.get().assertEquals(claimAccountTree.getRoot());
        usernames[usernames.length] = username;
      }
      console.log(`create custodial account for ${rewardAddressResponse}`);

      var rewardAddressResponse = await question(`Would you like to claim your rewards now??\n`);
      if(rewardAddressResponse=='no') {
        console.log(`Thanks for playing`);
        shutdown();
      }else{
        var username = await question(`Please enter your username?\n`)
        var password = await question(`Please enter your password\n`);
        let account = new Account(CircuitString.fromString(username), CircuitString.fromString(password), Bool(false));
        let usernameIndex = usernames.findIndex((obj) => {
            return obj === username;
          })!;
        
        let w = claimAccountTree.getWitness(BigInt(usernameIndex));
        let witness = new ClaimAccountMerkleWitness(w);
          
  
        let txn = await Mina.transaction(ykProofFeePayer, () => {
          ykProofApp.validateAccountPassword(account, witness);
          ykProofApp.sign(ykProofAccountKey);
  
        });
        console.log(`Proving blockchain transaction\n`)
        if (doProofs) {
              await txn.prove();
        }
        console.log(`Sending blockchain transaction\n`)
        await txn.send();
        console.log('Found');
        
        console.log(`process claim - send tokens to the address that they specify`)
        try{
          let tx = await Local.transaction(feePayer, () => {
            let approveSendingCallback = Experimental.Callback.create(
              userAccountApp,
              'approveSend',
              []
            );
            // we call the token contract with the callback
            ykProofApp.sendTokens(winnerKeyAddress, winnerKeyAddress, approveSendingCallback);
            ykProofApp.sign(ykProofAccountKey);
  
          });
          console.log('approve send (proof)');
          await tx.prove();
          console.log('send (proof)');
          await tx.send();
          console.log('token sent getting Token balance')
      //     console.log(
      //     `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
      //     Mina.getBalance(winnerKeyAddress, tokenId).value.toBigInt()
      // );
        }catch(e){
          console.log(`Error sending token to ${winnerKeyAddress.toBase58()}`);
          console.log(e);
        }
  
        console.log(`TODO rebuild merkle tree with username data from a previous session`)
      }
  
    }else{
      var rewardAddressResponse = await question(`Would you like to claim your rewards now??\n`);
      if(rewardAddressResponse=='no') {
        console.log(`Thanks for playing`);
        shutdown();
      }else{
        var username = await question(`Please enter your username?\n`)
        var password = await question(`Please enter your password\n`);
        let account = new Account(CircuitString.fromString(username), CircuitString.fromString(password), Bool(false));
        let usernameIndex = usernames.findIndex((obj) => {
            return obj === username;
          })!;
        
        let w = claimAccountTree.getWitness(BigInt(usernameIndex));
        let witness = new ClaimAccountMerkleWitness(w);
          
  
        let txn = await Mina.transaction(ykProofFeePayer, () => {
          ykProofApp.validateAccountPassword(account, witness);
          ykProofApp.sign(ykProofAccountKey);
  
        });
        console.log(`Proving blockchain transaction\n`)
        if (doProofs) {
              await txn.prove();
        }
        console.log(`Sending blockchain transaction\n`)
        await txn.send();
        console.log('Found');
        
        console.log(`process claim - send tokens to the address that they specify`)
        try{
          let tx = await Local.transaction(feePayer, () => {
            let approveSendingCallback = Experimental.Callback.create(
              userAccountApp,
              'approveSend',
              []
            );
            // we call the token contract with the callback
            ykProofApp.sendTokens(winnerKeyAddress, winnerKeyAddress, approveSendingCallback);
            ykProofApp.sign(ykProofAccountKey);
  
          });
          console.log('approve send (proof)');
          await tx.prove();
          console.log('send (proof)');
          await tx.send();
          console.log('token sent getting Token balance')
          // console.log(
          // `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
          // Mina.getBalance(winnerKeyAddress, tokenId).value.toBigInt()
      // );
        }catch(e){
          console.log(`Error sending token to ${winnerKeyAddress.toBase58()}`);
          console.log(e);
        }
  
        console.log(`TODO rebuild merkle tree with username data from a previous session`)
  
  
      }
   }
  }
  
   shutdown();
  
   
  
  })();
  
  