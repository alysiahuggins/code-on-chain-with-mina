


import { YKProof } from './contracts/YKProof.js';
import {
  isReady,
  shutdown,
  Mina,
  PrivateKey,
  PublicKey,
  Field,
  fetchAccount,
  CircuitString,
  MerkleTree,
  MerkleWitness,
  UInt32,
  Ledger,
  Bool
} from 'o1js';

import fs from 'fs';
import { loopUntilAccountExists, zkAppNeedsInitialization, makeAndSendTransaction } from './utils.js';
import {Account, Answer} from './contracts/Classes.js';
import {questions as questions} from "./curriculumOld/curriculum.js"
import {answers as answers} from "./curriculumOld/curriculum.js"
import question from "./question.js";

  
class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
const claimAccountTree = new MerkleTree(8);
class AnswerMerkleWitness extends MerkleWitness(8) {}
const answerTree = new MerkleTree(8);

// this map serves as our off-chain in-memory storage
let Accounts: Map<string, Account> = new Map<string, Account>();
let usernames: Array<string> = new Array<string>();

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

function createAnswerMerkleTree(){
    let committment: Field = Field(0);
  
    let Answers: Map<number, Answer> = new Map<number, Answer>();
    for(let i in answers){
        let thisAnswer = new Answer(UInt32.from(answers[i].answer));
        Answers.set(parseInt(i), thisAnswer);
        answerTree.setLeaf(BigInt(i), thisAnswer.hash());
        console.log(i, thisAnswer);
    }
  
    // now that we got our accounts set up, we need the commitment to deploy our contract!
    committment = answerTree.getRoot();
    return committment;
  }

export const deploy = async (
    deployerPrivateKey: PrivateKey,
    zkAppPrivateKey: PrivateKey,
    zkAppPublicKey: PublicKey,
    zkapp: YKProof,
    verificationKey: { data: string; hash: string | Field }
  ) => {
  let transactionFee = 100_000_000;

    console.log(
      'using deployer private key with public key',
      deployerPrivateKey.toPublicKey().toBase58()
    );
    console.log(
      'using zkApp private key with public key',
      zkAppPrivateKey.toPublicKey().toBase58()
    );
  
    // ----------------------------------------------------
  
    let zkAppResponse = await fetchAccount({ publicKey: zkAppPublicKey });
    let isDeployed = zkAppResponse.error == null;
    // TODO add check that verification key is correct once this is available in SnarkyJS
    let zkappVerificationKey = zkAppResponse.account!.zkapp!.verificationKey!.toString()
    isDeployed = isDeployed && (zkappVerificationKey==verificationKey.data);
    console.log(zkappVerificationKey)
    console.log()
    console.log(verificationKey.data)

    // ----------------------------------------------------
  
    if (isDeployed) {
      console.log(
        'zkApp for public key',
        zkAppPublicKey.toBase58(),
        'found deployed'
      );
    } 
    // else {
    //   console.log('Deploying zkapp for public key', zkAppPublicKey.toBase58());
    //   let transaction = await Mina.transaction(
    //     { feePayerKey: deployerPrivateKey, fee: transactionFee },
    //     () => {
    //       AccountUpdate.fundNewAccount(deployerPrivateKey);
    //       zkapp.deploy({ zkappKey: zkAppPrivateKey, verificationKey });
    //     }
    //   );
  
    //   console.log('Sending the deploy transaction...');
    //   const res = await transaction.send();
    //   const hash = await res.hash(); // This will change in a future version of SnarkyJS
    //   if (hash == null) {
    //     console.log('error sending transaction (see above)');
    //   } else {
    //     console.log(
    //       'See deploy transaction at',
    //       'https://berkeley.minaexplorer.com/transaction/' + hash
    //     );
    //   }
    // }
  
    // ----------------------------------------------------
  
    return isDeployed;
  };
  

(async function main() {
  await isReady;
  console.log('SnarkyJS loaded');
  // ----------------------------------------------------

  // ----------------------------------------------------
  const Berkeley = Mina.Network(
    'https://proxy.berkeley.minaexplorer.com/graphql'
  );
  Mina.setActiveInstance(Berkeley);
  let transactionFee = 100_000_000;
  // ----------------------------------------------------...


  const deployAlias = process.argv[2];
  const deployerKeysFileContents = fs.readFileSync(
    'keys/' + deployAlias + '.json',
    'utf8'
  );
  const deployerPrivateKeyBase58 = JSON.parse(
    deployerKeysFileContents
  ).privateKey;
  const deployerPrivateKey = PrivateKey.fromBase58(deployerPrivateKeyBase58);
  const zkAppPrivateKey = deployerPrivateKey;
  // ----------------------------------------------------

  console.log('Compiling smart contract...');
  let { verificationKey } = await YKProof.compile();
  console.log(`zk app verification key ${verificationKey.hash}`);
 
  const zkAppPublicKey = zkAppPrivateKey.toPublicKey();
  let zkapp = new YKProof(zkAppPublicKey);
let tokenId = zkapp.token.id;


   // ----------------------------------------------------
   let zkAppResponse = await fetchAccount({ publicKey: zkAppPublicKey });
   let isDeployed = zkAppResponse.error == null;
   // TODO add check that verification key is correct once this is available in SnarkyJS

   //   Besides the CLI, you can also create accounts programmatically. This is useful if you need
   //   more custom account creation - say deploying a zkApp to a different key than the deployer
   //   key, programmatically parameterizing a zkApp before initializing it, or creating Smart
   //   Contracts programmatically for users as part of an application.
   await deploy(deployerPrivateKey, zkAppPrivateKey, zkAppPublicKey, zkapp, verificationKey)
   // ----------------------------------------------------
 
  // ----------------------------------------------------
  let zkAppAccount = await loopUntilAccountExists({
    account: zkAppPrivateKey.toPublicKey(),
    eachTimeNotExist: () => console.log('waiting for zkApp account to be deployed...'),
    isZkAppAccount: true
  });
  // ----------------------------------------------------...
   
 
  try{
    
    console.log('getting Token balance')
    // console.log(
    //   `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
    //   Mina.getBalance(zkAppPublicKey, tokenId).value.toBigInt()
    // );
  }catch(e){
    console.log(`Error getting token balance from ${zkAppPublicKey.toBase58()}`);
    console.log(e);
        // console.log("deploy the userAccount ");
        // console.log('deploy userAccount');
        // let tx = await Mina.transaction({ feePayerKey: deployerPrivateKey, fee: transactionFee },() => {
        // AccountUpdate.fundNewAccount(deployerPrivateKey);
        // zkapp.tokenDeploy(deployerPrivateKey, YKProof._verificationKey!);
        // zkapp.sign(deployerPrivateKey);
        // });
        // console.log('deploy UserAcocunt (proof)');
        // await tx.prove(); 
        // let res = await tx.send();
        // let hash = await res.hash(); // This will change in a future version of SnarkyJS
        // if (hash == null) {
        // console.log('error sending transaction (see above)');
        // } else {
        // console.log(
        //     'See transaction at',
        //     'https://berkeley.minaexplorer.com/transaction/' + hash
        // );
        // }
    }
        
//   }
  shutdown();
  // ----------------------------------------------------

  const needsInitialization = await zkAppNeedsInitialization({ zkAppAccount });


    if (needsInitialization) {
    console.log('initializing smart contract');

    console.log(zkapp.commitment.get().toString());
    await makeAndSendTransaction({
        feePayerPrivateKey: deployerPrivateKey,
        zkAppPublicKey: zkAppPublicKey,
        signZkApp: () => zkapp.sign(deployerPrivateKey),
        mutateZkApp: () => zkapp.init(),
        transactionFee: transactionFee,
        getState: () => zkapp.commitment.get(),
        statesEqual: (num1, num2) => num1.equals(num2).toBoolean()
    });
    console.log('updated state!', zkapp.commitment.get().toString());
    }
    let num = (await zkapp.commitment.get())!;
    console.log('current value of num is', num.toString());

 

  // ----------------------------------------------------
  createClaimAccountMerkleTree("alysia", "minarocks");
  createAnswerMerkleTree();

  // ----------------------------------------------------
 // answer a question

  // ----------------------------------------------------
 // answer a question
    var response = parseInt((await question(questions[1].question)).trim());
         let w = answerTree.getWitness(BigInt(1));
         let witness = new AnswerMerkleWitness(w);

         let txn = await Mina.transaction({ feePayerKey: deployerPrivateKey, fee: transactionFee },
            () => {
            zkapp.validateQuestionResponse(Field(response), witness);
            zkapp.sign(deployerPrivateKey);
    
          });
    
          // fill in the proof - this can take a while...
        console.log('Creating an execution proof...');
        let time0 = Date.now();
        await txn.prove();
        let time1 = Date.now();
        console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
      
        console.log('Sending the transaction...');
        let res// = await txn.send();
        let hash// = await res.hash(); // This will change in a future version of SnarkyJS
        // if (hash == null) {
        //   console.log('error sending transaction (see above)');
        // } else {
        //   console.log(
        //     'See transaction at',
        //     'https://berkeley.minaexplorer.com/transaction/' + hash
        //   );
        // }
         // ----------------------------------------------------
 // minting token
          console.log('Waiting for result, but correct if it did not fail here');
    
          try{
            console.log(`Getting Your Token Reward ${zkAppPublicKey.toBase58()}`);
            console.log('mint token to UserAccount');
            let tx = await Mina.transaction(deployerPrivateKey, () => {
              zkapp.mint(zkAppPublicKey);
              zkapp.sign(deployerPrivateKey);
        
            });
            console.log('Creating an execution proof...');
            let time0 = Date.now();
            await tx.prove();
            let time1 = Date.now();
            console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
            console.log('Sending the transaction...');
            res = await txn.send();
            hash = await res.hash(); // This will change in a future version of SnarkyJS
            if (hash == null) {
            console.log('error sending transaction (see above)');
            } else {
            console.log(
                'See transaction at',
                'https://berkeley.minaexplorer.com/transaction/' + hash
            );
            }

            console.log('getting Token balance')
            // console.log(
            //   `Winner's balance for tokenId: ${Ledger.fieldToBase58(tokenId)}`,
            //   Mina.getBalance(zkAppPublicKey, tokenId).value.toBigInt()
            // );
          }catch(e){
            console.log(`Error sending token to ${zkAppPublicKey.toBase58()}`);
            console.log(e);
            // if("Could not find account for public key" in e){
            //     console.log("deploy the userAccount and retry the minting");
            //     console.log('deploy userAccount');
            //     let tx = await Mina.transaction(deployerPrivateKey, () => {
            //     AccountUpdate.fundNewAccount(deployerPrivateKey);
            //     zkapp.tokenDeploy(deployerPrivateKey, YKProof._verificationKey!);
            //     zkapp.sign(deployerPrivateKey);
            //     });
            //     console.log('deploy UserAcocunt (proof)');
            //     await tx.prove(); 
            //     let res = await txn.send();
            //     let hash = await res.hash(); // This will change in a future version of SnarkyJS
            //     if (hash == null) {
            //     console.log('error sending transaction (see above)');
            //     } else {
            //     console.log(
            //         'See transaction at',
            //         'https://berkeley.minaexplorer.com/transaction/' + hash
            //     );
            //     }
            // }
                
          }
 // ----------------------------------------------------
 // create an account in zkapp
 let account1 = new Account(CircuitString.fromString("alysia"), CircuitString.fromString("minarocks"), Bool(false));
 claimAccountTree.setLeaf(BigInt(0), account1.hash())
//  let account2 = new Account(CircuitString.fromString("zk"), CircuitString.fromString("app"), Field(false));
//  claimAccountTree.setLeaf(BigInt(1
//     ), account2.hash())

    let numUsers = usernames.length;
    let username = "zk";
    let password = "app";
     w = claimAccountTree.getWitness(BigInt(numUsers));
     witness = new ClaimAccountMerkleWitness(w);
    let account = new Account(CircuitString.fromString(username),CircuitString.fromString(password), Bool(false));

    //   await makeAndSendTransaction({
    //         feePayerPrivateKey: deployerPrivateKey,
    //         zkAppPublicKey: zkAppPublicKey,
    //         signZkApp: () => zkapp.sign(deployerPrivateKey),
    //         mutateZkApp: () => zkapp.createAccount(account, witness),
    //         transactionFee: transactionFee,
    //         getState: () => zkapp.commitment.get(),
    //         statesEqual: (num1, num2) => num1.equals(num2).toBoolean()
    //       });
    //       console.log('updated state!', zkapp.commitment.get().toString());

    // //     let txn = await Mina.transaction(claimAccountFeePayer, () => {
    // //       claimAccountApp.createAccount(account, witness);
    // //       // claimAccountApp.sign(claimAccountKey);

    // //   });
    // //   console.log(`Proving blockchain transaction\n`)
    // //   if (doProofs) {
    // //         await txn.prove();
    // //       }
    // //   console.log(`Sending blockchain transaction\n`)
    // //   await txn.send();
    //   console.log('Account Created');

    //   //update local storage
    //   claimAccountTree.setLeaf(BigInt(numUsers), account.hash());
    //   zkapp.commitment.get().assertEquals(claimAccountTree.getRoot());
    //   usernames[usernames.length] = username;

      // ----------------------------------------------------...
      // search for the newly created account
        username="alysia"
        password="minarocks"
       account = new Account(CircuitString.fromString(username), CircuitString.fromString(password), Bool(false));
       let usernameIndex = 0;
    //    let usernameIndex = usernames.findIndex((obj) => {
    //     return obj === username;
    //   })!;
      console.log(usernameIndex);
        w = claimAccountTree.getWitness(BigInt(usernameIndex));

    //    w = claimAccountTree.getWitness(BigInt(0));
       witness = new ClaimAccountMerkleWitness(w);
       
       txn = await Mina.transaction({ feePayerKey: deployerPrivateKey, fee: transactionFee },
        () => {
        zkapp.validateAccountPassword(account, witness);
        zkapp.sign(deployerPrivateKey);

      });

      // fill in the proof - this can take a while...
    console.log('Creating an execution proof...');
     time0 = Date.now();
    await txn.prove();
     time1 = Date.now();
    console.log('creating proof took', (time1 - time0) / 1e3, 'seconds');
  
    console.log('Sending the transaction...');
     res = await txn.send();
     hash = await res.hash(); // This will change in a future version of SnarkyJS
    if (hash == null) {
      console.log('error sending transaction (see above)');
    } else {
      console.log(
        'See transaction at',
        'https://berkeley.minaexm.plorer.com/transaction/' + hash
      );
    }
    
      console.log('Found');
      

//   await makeAndSendTransaction({
//     feePayerPrivateKey: deployerPrivateKey,
//     zkAppPublicKey: zkAppPublicKey,
//     signZkApp: () => zkapp.sign(deployerPrivateKey),
//     mutateZkApp: () => zkapp.validateAccountPassword(account, witness),
//     transactionFee: transactionFee,
//     getState: () => zkapp.commitment.get(),
//     statesEqual: (num1, num2) => num1.equals(num2).toBoolean()
//   });
//   console.log('updated state!', zkapp.commitment.get().toString());
  // ----------------------------------------------------...

  console.log('Shutting down');
  await shutdown();
})();

